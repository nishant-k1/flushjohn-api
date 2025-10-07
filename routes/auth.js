import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User/index.js";

const router = express.Router();

// Login endpoint - Exact copy from original CRM with Express conversion
router.post("/", async (req, res) => {
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
      // ✅ SECURITY FIX: Check if account is locked
      if (user.isLocked()) {
        return res.status(423).json({
          success: false,
          message:
            "Account is temporarily locked due to too many failed login attempts. Please try again later.",
        });
      }

      // ✅ SECURITY FIX: Check if account is active
      if (!user.isActive) {
        return res.status(403).json({
          success: false,
          message: "Account is deactivated. Please contact administrator.",
        });
      }

      // ✅ SECURITY FIX: Use the secure password comparison method
      let validPassword;
      try {
        validPassword = await user.comparePassword(password);
      } catch (error) {
        console.error("Password verification error:", error);
        // Increment failed login attempts
        await user.incLoginAttempts();
        return res.status(401).json({
          success: false,
          message: "Authentication failed",
        });
      }

      if (validPassword) {
        // ✅ SECURITY FIX: Reset failed login attempts on successful login
        await user.resetLoginAttempts();

        // ✅ SECURITY FIX: Update last login
        await user.updateLastLogin();

        const token = jwt.sign(
          { userId: user.userId },
          process.env.SECRET_KEY,
          {
            expiresIn: "1h",
          }
        );

        // Set httpOnly cookie (Express equivalent of Next.js serialize)
        res.cookie("token", token, {
          httpOnly: true, // ✅ SECURITY FIX: Prevent XSS attacks
          sameSite: "none", // ✅ CSRF protection
          secure: process.env.NODE_ENV === "production", // ✅ HTTPS only in production
          maxAge: 3600 * 1000, // 1 hour expiration
          path: "/",
        });

        // ✅ DESKTOP APP FIX: Send token in response body for desktop app compatibility
        res.status(200).json({
          success: true,
          message: "Authentication successful",
          token: token, // Include token for desktop apps
          user: {
            userId: user.userId,
            fName: user.fName,
            lName: user.lName,
            email: user.email,
          },
        });
      } else {
        // ✅ SECURITY FIX: Increment failed login attempts for invalid password
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
    console.error("Authentication error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// Register endpoint
router.post("/register", async (req, res) => {
  try {
    const { userId, email, password, fName, lName, role = "user" } = req.body;

    if (!userId || !email || !password || !fName || !lName) {
      return res.status(400).json({
        success: false,
        message:
          "User ID, email, password, first name, and last name are required",
      });
    }

    // Check if user already exists by userId or email
    const existingUser = await User.findOne({
      $or: [{ userId }, { email }],
    });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists with this User ID or email",
      });
    }

    // Create user (password will be hashed by pre-save middleware)
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
    console.error("Registration error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// Verify token endpoint - Exact copy from original CRM with Express conversion
router.get("/verify", async (req, res) => {
  try {
    // ✅ DESKTOP APP FIX: Support both cookie and Bearer token authentication
    let token = req.cookies.token; // Try cookie first

    // If no cookie, try Authorization header (for desktop apps)
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

    // Verify the token
    const decoded = jwt.verify(token, process.env.SECRET_KEY);

    // Get user details
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
      },
    });
  } catch (error) {
    console.error("Token verification error:", error);
    res.status(401).json({
      success: false,
      message: "Invalid token",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// Logout endpoint
router.post("/logout", (req, res) => {
  try {
    console.log("🚪 Server logout endpoint called");

    // Clear the token cookie with multiple variations to ensure it's cleared
    const cookieOptions = {
      httpOnly: true,
      path: "/",
    };

    // Clear cookie for different scenarios
    res.clearCookie("token", cookieOptions);

    // Also try clearing with sameSite and secure options if they were set
    res.clearCookie("token", {
      ...cookieOptions,
      sameSite: "none",
      secure: process.env.NODE_ENV === "production",
    });

    // Additional clearing for different domain scenarios
    res.clearCookie("token", {
      ...cookieOptions,
      domain: req.get("host"),
    });

    console.log("✅ Cookie cleared successfully");

    res.status(200).json({
      success: true,
      message: "Logout successful",
    });
  } catch (error) {
    console.error("❌ Logout error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

export default router;
