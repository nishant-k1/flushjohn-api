import express from "express";
import User from "../models/User.js";
import { AsyncRouteHandler, MongooseFilter } from "../../../types/common.js";

const router: any = express.Router();

router.get("/", (async (req, res) => {
  try {
    const users = await (User as any).find({} as MongooseFilter, {
      password: 0,
    }); // Exclude password field

    res.status(200).json({
      success: true,
      data: users,
    });
  } catch {
    res.status(500).json({
      success: false,
      message: "Failed to fetch users",
    });
  }
}) as AsyncRouteHandler);

router.get("/:userId", (async (req, res) => {
  try {
    const user = await (User as any).findOne(
      { userId: req.params.userId } as any,
      { password: 0 }
    );

    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch {
    res.status(500).json({
      success: false,
      message: "Failed to fetch user",
    });
  }
}) as AsyncRouteHandler);

router.patch("/:userId", (async (req, res) => {
  try {
    const { fName, lName, email, role, isActive } = req.body;

    const user = await (User as any).findOneAndUpdate(
      { userId: req.params.userId } as any,
      { fName, lName, email, role, isActive },
      { new: true, select: "-password" }
    );

    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: user,
      message: "User updated successfully",
    });
  } catch {
    res.status(500).json({
      success: false,
      message: "Failed to update user",
    });
  }
}) as AsyncRouteHandler);

router.post("/update-avatar", authenticateToken, (async (req, res) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Unauthorized - No user ID found",
      });
      return;
    }

    const { avatarUrl, fName, lName, phone } = req.body;

    const updateData: {
      avatarUrl?: string;
      fName?: string;
      lName?: string;
      phone?: string;
    } = {};
    if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;
    if (fName !== undefined) updateData.fName = fName;
    if (lName !== undefined) updateData.lName = lName;
    if (phone !== undefined) updateData.phone = phone;

    const user = await (User as any).findOneAndUpdate(
      { userId } as any,
      updateData,
      {
        new: true,
        select: "-password",
      }
    );

    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: user,
      message: "Profile updated successfully",
    });
  } catch {
    res.status(500).json({
      success: false,
      message: "Failed to update profile",
      error:
        process.env.NODE_ENV === "development"
          ? "Internal server error"
          : undefined,
    });
  }
}) as AsyncRouteHandler);

router.delete("/:userId", (async (req, res) => {
  try {
    // Prevent users from deleting themselves
    if (req.user?.userId === req.params.userId) {
      res.status(400).json({
        success: false,
        message: "Cannot delete your own account",
        error: "CANNOT_DELETE_SELF",
      });
      return;
    }

    const user = await (User as any).findOneAndDelete({
      userId: req.params.userId,
    } as any);

    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
        error: "USER_NOT_FOUND",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch {
    res.status(500).json({
      success: false,
      message: "Failed to delete user",
    });
  }
}) as AsyncRouteHandler);

export default router;
