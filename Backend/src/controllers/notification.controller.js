import { Notification } from "../models/notification.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Fetch notifications for the requesting role / user
const getNotifications = asyncHandler(async (req, res) => {
  const role = req.query.role || (req.admin ? "admin" : "all");
  const recipientId =
    req.query.recipientId ||
    req.user?._id ||
    req.customer?._id ||
    req.worker?._id ||
    req.admin?._id;

  const conditions = [{ recipientRole: "all" }];
  if (role) {
    conditions.push({ recipientRole: role });
  }
  if (recipientId) {
    conditions.push({ recipientId });
  }

  const notifications = await Notification.find({ $or: conditions })
    .sort({ createdAt: -1 })
    .limit(40);
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return res.status(200).json(
    new ApiResponse(200, { notifications, unreadCount }, "Notifications fetched successfully")
  );
});

import { emitNotification, getIO } from "../socket/socketManager.js";

// Helper function to create only necessary notifications
export const sendNotification = async ({
  recipientRole,
  recipientId = null,
  title,
  message,
  type = "system",
  link = "",
}) => {
  try {
    const notif = await Notification.create({
      recipientRole,
      recipientId,
      title,
      message,
      type,
      link,
      isRead: false,
    });

    if (notif) {
      if (recipientId) {
        emitNotification(recipientId, notif);
      }
      if (recipientRole === "admin" || recipientRole === "all") {
        const io = getIO();
        if (io) {
          io.to("admin_channel").emit("new_notification", notif);
        }
      }
    }

    return notif;
  } catch (err) {
    console.error("Failed to send notification:", err.message);
    return null;
  }
};

// Mark single notification as read
const markAsRead = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updated = await Notification.findByIdAndUpdate(id, { isRead: true }, { new: true });
  if (!updated) {
    throw new ApiError(404, "Notification not found");
  }

  return res.status(200).json(new ApiResponse(200, updated, "Notification marked as read"));
});

// Mark all notifications for a role as read
const markAllAsRead = asyncHandler(async (req, res) => {
  const role = req.body.role || (req.admin ? "admin" : req.user ? "customer" : "all");
  await Notification.updateMany(
    { $or: [{ recipientRole: role }, { recipientRole: "all" }] },
    { $set: { isRead: true } }
  );

  return res.status(200).json(new ApiResponse(200, {}, "All notifications marked as read"));
});

// Create a new notification (system or internal trigger)
const createNotification = asyncHandler(async (req, res) => {
  const { title, message, recipientRole, recipientId, type, link } = req.body;
  if (!title || !message) {
    throw new ApiError(400, "Title and message are required");
  }

  const notif = await Notification.create({
    title,
    message,
    recipientRole: recipientRole || "admin",
    recipientId: recipientId || null,
    type: type || "system",
    link: link || "",
  });

  return res.status(201).json(new ApiResponse(201, notif, "Notification created successfully"));
});

export { getNotifications, markAsRead, markAllAsRead, createNotification };
