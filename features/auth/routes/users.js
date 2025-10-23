import express from "express";
import User from "../models/User/index.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const users = await User.find({}, { password: 0 }); // Exclude password field

    res.status(200).json({
      success: true,
      data: users,
    });
  } catch (error) {

    res.status(500).json({
      success: false,
      message: "Failed to fetch users",
    });
  }
});

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

    res.status(500).json({
      success: false,
      message: "Failed to fetch user",
    });
  }
});

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

    res.status(500).json({
      success: false,
      message: "Failed to update user",
    });
  }
});

router.post("/update-avatar", authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {

      return res.status(401).json({
        success: false,
        message: "Unauthorized - No user ID found",
      });
    }

    const { avatarUrl, fName, lName, phone } = req.body;

    const updateData = {};
    if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;
    if (fName !== undefined) updateData.fName = fName;
    if (lName !== undefined) updateData.lName = lName;
    if (phone !== undefined) updateData.phone = phone;

    const user = await User.findOneAndUpdate({ userId }, updateData, {
      new: true,
      select: "-password",
    });

    if (!user) {

      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      data: user,
      message: "Profile updated successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update profile",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

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

    res.status(500).json({
      success: false,
      message: "Failed to delete user",
    });
  }
});

export default router;
