import express from "express";
import User from "../models/User/index.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// Get all users
router.get("/", async (req, res) => {
  try {
    const users = await User.find({}, { password: 0 }); // Exclude password field

    res.status(200).json({
      success: true,
      data: users,
    });
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch users",
    });
  }
});

// Get user by userId
router.get("/:userId", async (req, res) => {
  try {
    const user = await User.findOne(
      { userId: req.params.userId },
      { password: 0 }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch user",
    });
  }
});

// Update user
router.put("/:userId", async (req, res) => {
  try {
    const { fName, lName, email, role, isActive } = req.body;

    const user = await User.findOneAndUpdate(
      { userId: req.params.userId },
      { fName, lName, email, role, isActive },
      { new: true, select: "-password" }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      data: user,
      message: "User updated successfully",
    });
  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update user",
    });
  }
});

// Update profile avatar - New endpoint to avoid CORS cache
router.post("/update-avatar", authenticateToken, async (req, res) => {
  try {
    console.log("📝 Profile update request received");
    console.log("User from auth:", req.user);
    console.log("Request body:", req.body);

    // Get user from authenticated session
    const userId = req.user?.userId;

    if (!userId) {
      console.error("❌ No userId in request");
      return res.status(401).json({
        success: false,
        message: "Unauthorized - No user ID found",
      });
    }

    const { avatarUrl, fName, lName, phone } = req.body;

    // Build update object with only allowed fields
    const updateData = {};
    if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;
    if (fName !== undefined) updateData.fName = fName;
    if (lName !== undefined) updateData.lName = lName;
    if (phone !== undefined) updateData.phone = phone;

    console.log("Updating user:", userId);
    console.log("Update data:", updateData);

    const user = await User.findOneAndUpdate({ userId }, updateData, {
      new: true,
      select: "-password",
    });

    if (!user) {
      console.error("❌ User not found:", userId);
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    console.log("✅ Profile updated successfully");

    res.status(200).json({
      success: true,
      data: user,
      message: "Profile updated successfully",
    });
  } catch (error) {
    console.error("❌ Update profile error:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({
      success: false,
      message: "Failed to update profile",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// Delete user
router.delete("/:userId", async (req, res) => {
  try {
    const user = await User.findOneAndDelete({ userId: req.params.userId });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete user",
    });
  }
});

export default router;
