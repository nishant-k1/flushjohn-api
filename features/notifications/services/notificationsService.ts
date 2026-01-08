import * as notificationsRepository from "../repositories/notificationsRepository.js";

export const getUserNotifications = async (userId, options = {}) => {
  try {
    const notifications = await notificationsRepository.findByUserId(
      userId,
      options
    );
    return notifications;
  } catch (error) {
    console.error("Error getting user notifications:", error);
    throw error;
  }
};

export const getUnreadCount = async (userId) => {
  try {
    const count = await notificationsRepository.findUnreadCount(userId);
    return count;
  } catch (error) {
    console.error("Error getting unread count:", error);
    throw error;
  }
};

export const createNotification = async (notificationData) => {
  try {
    const notification = await notificationsRepository.create(notificationData);
    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
    throw error;
  }
};

export const createOrUpdateNotification = async (userId, leadId, data) => {
  try {
    const notification = await notificationsRepository.createOrUpdate(
      userId,
      leadId,
      data
    );
    return notification;
  } catch (error) {
    console.error("Error creating or updating notification:", error);
    throw error;
  }
};

export const markNotificationAsRead = async (notificationId, userId) => {
  try {
    const notification = await notificationsRepository.markAsRead(
      notificationId,
      userId
    );
    if (!notification) {
      throw new Error("Notification not found or unauthorized");
    }
    return notification;
  } catch (error) {
    console.error("Error marking notification as read:", error);
    throw error;
  }
};

export const markAllNotificationsAsRead = async (userId) => {
  try {
    const result = await notificationsRepository.markAllAsRead(userId);
    return result;
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    throw error;
  }
};

export const deleteNotification = async (notificationId, userId) => {
  try {
    const result = await notificationsRepository.deleteById(
      notificationId,
      userId
    );
    if (!result) {
      throw new Error("Notification not found or unauthorized");
    }
    return result;
  } catch (error) {
    console.error("Error deleting notification:", error);
    throw error;
  }
};

export const deleteNotificationsByLeadId = async (leadId) => {
  try {
    const result = await notificationsRepository.deleteByLeadId(leadId);
    return result;
  } catch (error) {
    console.error("Error deleting notifications by leadId:", error);
    throw error;
  }
};

export const deleteAllNotifications = async (userId) => {
  try {
    const result = await notificationsRepository.deleteAll(userId);
    return result;
  } catch (error) {
    console.error("Error deleting all notifications:", error);
    throw error;
  }
};
