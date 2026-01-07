import Notification from "../models/Notifications.js";

export const findByUserId = async (userId, options: any = {}) => {
  try {
    const { limit = 50, skip = 0, read = null } = options;
    const query: any = { userId };

    if (read !== null) {
      query.read = read === true || read === "true";
    }

    const notifications = await (Notification as any)
      .find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .lean();

    return notifications;
  } catch (error) {
    console.error("Error finding notifications by user ID:", error);
    throw error;
  }
};

export const findUnreadCount = async (userId) => {
  try {
    const count = await (Notification as any).countDocuments({
      userId,
      read: false,
    });
    return count;
  } catch (error) {
    console.error("Error counting unread notifications:", error);
    throw error;
  }
};

export const findById = async (notificationId) => {
  try {
    const notification = await (Notification as any)
      .findById(notificationId)
      .lean();
    return notification;
  } catch (error) {
    console.error("Error finding notification by ID:", error);
    throw error;
  }
};

export const findByUserIdAndLeadId = async (userId, leadId) => {
  try {
    const notification = await (Notification as any)
      .findOne({
        userId,
        leadId,
      })
      .lean();
    return notification;
  } catch (error) {
    console.error("Error finding notification by userId and leadId:", error);
    throw error;
  }
};

export const create = async (data) => {
  try {
    const notification = new Notification(data);
    await notification.save();
    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
    throw error;
  }
};

export const createOrUpdate = async (userId, leadId, data) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { userId, leadId },
      {
        ...data,
        userId,
        leadId,
        read: false, // Reset read status when updating
        readAt: null,
      },
      { new: true, upsert: true }
    );
    return notification;
  } catch (error) {
    console.error("Error creating or updating notification:", error);
    throw error;
  }
};

export const markAsRead = async (notificationId, userId) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, userId }, // Ensure user owns the notification
      { read: true, readAt: new Date() },
      { new: true }
    );
    return notification;
  } catch (error) {
    console.error("Error marking notification as read:", error);
    throw error;
  }
};

export const markAllAsRead = async (userId) => {
  try {
    const result = await (Notification as any).updateMany(
      { userId, read: false },
      { read: true, readAt: new Date() }
    );
    return result;
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    throw error;
  }
};

export const deleteById = async (notificationId, userId) => {
  try {
    const result = await Notification.findOneAndDelete({
      _id: notificationId,
      userId, // Ensure user owns the notification
    });
    return result;
  } catch (error) {
    console.error("Error deleting notification:", error);
    throw error;
  }
};

export const deleteByLeadId = async (leadId) => {
  try {
    const result = await (Notification as any).deleteMany({ leadId });
    return result;
  } catch (error) {
    console.error("Error deleting notifications by leadId:", error);
    throw error;
  }
};

export const deleteAll = async (userId) => {
  try {
    const result = await (Notification as any).deleteMany({ userId });
    return result;
  } catch (error) {
    console.error("Error deleting all notifications:", error);
    throw error;
  }
};

export const deleteOldNotifications = async (daysOld = 30) => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    const result = await (Notification as any).deleteMany({
      createdAt: { $lt: cutoffDate },
    });
    return result;
  } catch (error) {
    console.error("Error deleting old notifications:", error);
    throw error;
  }
};
