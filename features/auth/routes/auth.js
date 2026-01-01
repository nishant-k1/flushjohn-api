import express from "express";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import User from "../models/User/index.js";
import { authenticateToken, requireAdmin } from "../middleware/auth.js";

const router = express.Router();

// Rate limiter for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    success: false,
    message:
      "Too many authentication attempts from this IP, please try again later.",
    error: "RATE_LIMIT_EXCEEDED",
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Apply rate limiting to login endpoint
router.post("/", authLimiter, async (req, res) => {
  try {
    const { userId, password } = req.body;

    if (!userId || !password) {
      return res.status(400).json({
        success: false,
        message: "User ID and password are required",
      });
    }

    const user = await User.findOne({
      userId,
    }).select("+password"); // Include password field for authentication

    if (user) {
      if (user.isLocked()) {
        return res.status(423).json({
          success: false,
          message:
            "Account is temporarily locked due to too many failed login attempts. Please try again later.",
        });
      }

      if (!user.isActive) {
        return res.status(403).json({
          success: false,
          message: "Account is deactivated. Please contact administrator.",
        });
      }

      let validPassword;
      try {
        validPassword = await user.comparePassword(password);
      } catch (error) {
        await user.incLoginAttempts();
        return res.status(401).json({
          success: false,
          message: "Authentication failed",
        });
      }

      if (validPassword) {
        await user.resetLoginAttempts();

        await user.updateLastLogin();

        const token = jwt.sign(
          { userId: user.userId },
          process.env.SECRET_KEY,
          {
            expiresIn: "24h", // Extended to 24 hours for better user experience
            algorithm: "HS256", // Explicitly specify the algorithm
          }
        );

        const isProduction = process.env.NODE_ENV === "production";
        const cookieOptions = {
          httpOnly: true, // ✅ Prevent XSS attacks
          maxAge: 24 * 3600 * 1000, // 24 hours expiration to match JWT
          path: "/",
          secure: isProduction, // Only send over HTTPS in production
          sameSite: isProduction ? "none" : "lax", // Cross-origin support in production
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
          },
        });
      } else {
        await user.incLoginAttempts();
        return res.status(401).json({
          success: false,
          message: "Invalid credentials",
        });
      }
    } else {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

router.post("/register", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId, email, password, fName, lName, role = "user" } = req.body;

    if (!userId || !email || !password || !fName || !lName) {
      return res.status(400).json({
        success: false,
        message:
          "User ID, email, password, first name, and last name are required",
      });
    }

    // Validate password strength
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters long",
      });
    }

    // Validate role is valid
    const validRoles = ["admin", "manager", "user"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role. Must be one of: admin, manager, user",
      });
    }

    const existingUser = await User.findOne({
      $or: [{ userId }, { email }],
    });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists with this User ID or email",
      });
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
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

router.get("/verify", async (req, res) => {
  try {
    let token = req.cookies.token; // Try cookie first

    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No token provided",
      });
    }

    const decoded = jwt.verify(token, process.env.SECRET_KEY, {
      algorithms: ["HS256"], // Explicitly specify the algorithm
    });

    const user = await User.findOne({ userId: decoded.userId });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Token is valid",
      user: {
        userId: user.userId,
        fName: user.fName,
        lName: user.lName,
        email: user.email,
        avatarUrl: user.avatarUrl,
        name: `${user.fName} ${user.lName}`,
      },
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: "Invalid token",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

router.post("/logout", (req, res) => {
  try {
    const isProduction = process.env.NODE_ENV === "production";
    const cookieOptions = {
      httpOnly: true,
      path: "/",
      secure: isProduction, // Only send over HTTPS in production
      sameSite: isProduction ? "none" : "lax",
    };

    res.clearCookie("token", cookieOptions);

    res.status(200).json({
      success: true,
      message: "Logout successful",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

export default router;
