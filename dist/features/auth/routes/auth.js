import express from "express";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import User from "../models/User.js";
import { authenticateToken, requireAdmin } from "../middleware/auth.js";
import { isUserJwtPayload, } from "../../../types/common.js";
const router = express.Router();
// Rate limiter for authentication endpoints
// Disabled in development to prevent issues during testing
const authLimiter = process.env.NODE_ENV === "production"
    ? rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 20, // limit each IP to 20 requests per windowMs
        message: {
            success: false,
            message: "Too many authentication attempts from this IP, please try again later.",
            error: "RATE_LIMIT_EXCEEDED",
        },
        standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
        legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    })
    : (req, res, next) => next(); // No-op middleware in development
// Apply rate limiting to login endpoint
router.post("/", authLimiter, (async (req, res) => {
    try {
        const { userId, password } = req.body;
        if (!userId || !password) {
            res.status(400).json({
                success: false,
                message: "User ID and password are required",
            });
            return;
        }
        const user = await User.findOne({
            userId,
        }).select("+password"); // Include password field for authentication
        if (user) {
            if (user.isLocked()) {
                res.status(423).json({
                    success: false,
                    message: "Account is temporarily locked due to too many failed login attempts. Please try again later.",
                });
                return;
            }
            if (!user.isActive) {
                res.status(403).json({
                    success: false,
                    message: "Account is deactivated. Please contact administrator.",
                });
                return;
            }
            let validPassword;
            try {
                validPassword = await user.comparePassword(password);
            }
            catch {
                await user.incLoginAttempts();
                res.status(401).json({
                    success: false,
                    message: "Authentication failed",
                });
                return;
            }
            if (validPassword) {
                await user.resetLoginAttempts();
                await user.updateLastLogin();
                const token = jwt.sign({ userId: user.userId }, process.env.SECRET_KEY, {
                    expiresIn: "24h", // Extended to 24 hours for better user experience
                    algorithm: "HS256", // Explicitly specify the algorithm
                });
                const isProduction = process.env.NODE_ENV === "production";
                const cookieOptions = {
                    httpOnly: true, // ✅ Prevent XSS attacks
                    maxAge: 24 * 3600 * 1000, // 24 hours expiration to match JWT
                    path: "/",
                    secure: isProduction, // Only send over HTTPS in production
                    sameSite: (isProduction ? "none" : "lax"), // Cross-origin support in production
                };
                res.cookie("token", token, cookieOptions);
                res.status(200).json({
                    success: true,
                    message: "Authentication successful",
                    token: token, // Include token for desktop apps
                    user: {
                        userId: user.userId,
                        fName: user.fName,
                        lName: user.lName,
                        email: user.email,
                        avatarUrl: user.avatarUrl,
                        role: user.role,
                    },
                });
            }
            else {
                await user.incLoginAttempts();
                res.status(401).json({
                    success: false,
                    message: "Invalid credentials",
                });
                return;
            }
        }
        else {
            res.status(401).json({
                success: false,
                message: "Invalid credentials",
            });
            return;
        }
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: process.env.NODE_ENV === "development" ? errorMessage : undefined,
        });
    }
}));
router.post("/register", authenticateToken, requireAdmin, (async (req, res) => {
    try {
        const { userId, email, password, fName, lName, role = "user" } = req.body;
        if (!userId || !email || !password || !fName || !lName) {
            res.status(400).json({
                success: false,
                message: "User ID, email, password, first name, and last name are required",
            });
            return;
        }
        // Validate password strength
        if (password.length < 8) {
            res.status(400).json({
                success: false,
                message: "Password must be at least 8 characters long",
            });
            return;
        }
        // Validate role is valid
        const validRoles = ["admin", "manager", "user"];
        if (!validRoles.includes(role)) {
            res.status(400).json({
                success: false,
                message: "Invalid role. Must be one of: admin, manager, user",
            });
            return;
        }
        const existingUser = await User.findOne({
            $or: [{ userId }, { email }],
        });
        if (existingUser) {
            res.status(400).json({
                success: false,
                message: "User already exists with this User ID or email",
            });
            return;
        }
        const user = new User({
            userId,
            email,
            password,
            fName,
            lName,
            role,
        });
        await user.save();
        res.status(201).json({
            success: true,
            message: "User created successfully",
            user: {
                userId: user.userId,
                email: user.email,
                fName: user.fName,
                lName: user.lName,
                role: user.role,
            },
        });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: process.env.NODE_ENV === "development" ? errorMessage : undefined,
        });
    }
}));
router.get("/verify", (async (req, res) => {
    try {
        let token = req.cookies.token; // Try cookie first
        if (!token) {
            const authHeader = req.headers.authorization;
            if (authHeader && authHeader.startsWith("Bearer ")) {
                token = authHeader.substring(7);
            }
        }
        if (!token) {
            res.status(401).json({
                success: false,
                message: "No token provided",
            });
            return;
        }
        const decoded = jwt.verify(token, process.env.SECRET_KEY, {
            algorithms: ["HS256"], // Explicitly specify the algorithm
        });
        if (!isUserJwtPayload(decoded)) {
            res.status(401).json({
                success: false,
                message: "Invalid token format",
            });
            return;
        }
        const user = await User.findOne({
            userId: decoded.userId,
        });
        if (!user) {
            res.status(401).json({
                success: false,
                message: "User not found",
            });
            return;
        }
        res.status(200).json({
            success: true,
            message: "Token is valid",
            user: {
                userId: user.userId,
                fName: user.fName,
                lName: user.lName,
                email: user.email,
                avatarUrl: user.avatarUrl,
                name: `${user.fName} ${user.lName}`,
                role: user.role,
            },
        });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        res.status(401).json({
            success: false,
            message: "Invalid token",
            error: process.env.NODE_ENV === "development" ? errorMessage : undefined,
        });
    }
}));
router.post("/logout", (req, res) => {
    try {
        const isProduction = process.env.NODE_ENV === "production";
        const cookieOptions = {
            httpOnly: true,
            path: "/",
            secure: isProduction, // Only send over HTTPS in production
            sameSite: (isProduction ? "none" : "lax"),
        };
        res.clearCookie("token", cookieOptions);
        res.status(200).json({
            success: true,
            message: "Logout successful",
        });
    }
    catch {
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
});
export default router;
//# sourceMappingURL=auth.js.map