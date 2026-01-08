import { Router } from "express";
import * as notificationsService from "../services/notificationsService.js";
import { authenticateToken } from "../../auth/middleware/auth.js";

const router: any = Router();

// Get user's notifications
router.get("/", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 50, skip = 0, read } = req.query;

    const notifications = await notificationsService.getUserNotifications(
      userId,
      {
        limit: parseInt(limit),
        skip: parseInt(skip),
        read,
      }
    );

    const unreadCount = await notificationsService.getUnreadCount(userId);

    res.json({
      success: true,
      data: notifications,
      unreadCount,
    });
  } catch (error) {
    console.error("Error getting notifications:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving notifications",
      error: error.message,
    });
  }
});

// Get unread count
router.get("/unread-count", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const count = await notificationsService.getUnreadCount(userId);

    res.json({
      success: true,
      data: { count },
    });
  } catch (error) {
    console.error("Error getting unread count:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving unread count",
      error: error.message,
    });
  }
});

// Mark notification as read
router.put("/:id/read", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const notification = await notificationsService.markNotificationAsRead(
      id,
      userId
    );

    res.json({
      success: true,
      data: notification,
      message: "Notification marked as read",
    });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    if (error.message === "Notification not found or unauthorized") {
      res.status(404).json({
        success: false,
        message: error.message,
        error: "NOTIFICATION_NOT_FOUND",
      });
      return;
    }
    res.status(500).json({
      success: false,
      message: "Error marking notification as read",
      error: error.message,
    });
  }
});

// Mark all notifications as read
router.put("/read-all", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const result =
      await notificationsService.markAllNotificationsAsRead(userId);

    res.json({
      success: true,
      message: "All notifications marked as read",
      data: result,
    });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    res.status(500).json({
      success: false,
      message: "Error marking all notifications as read",
      error: error.message,
    });
  }
});

// Delete notification
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    await notificationsService.deleteNotification(id, userId);

    res.json({
      success: true,
      message: "Notification deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting notification:", error);
    if (error.message === "Notification not found or unauthorized") {
      res.status(404).json({
        success: false,
        message: error.message,
        error: "NOTIFICATION_NOT_FOUND",
      });
      return;
    }
    res.status(500).json({
      success: false,
      message: "Error deleting notification",
      error: error.message,
    });
  }
});

// Delete all notifications
router.delete("/", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await notificationsService.deleteAllNotifications(userId);

    res.json({
      success: true,
      message: "All notifications deleted successfully",
      data: result,
    });
  } catch (error) {
    console.error("Error deleting all notifications:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting all notifications",
      error: error.message,
    });
  }
});

export default router;
