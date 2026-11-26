import { Router } from "express";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  createNotification,
} from "../controllers/notification.controller.js";

const router = Router();

router.route("/").get(getNotifications).post(createNotification);
router.route("/:id/read").patch(markAsRead);
router.route("/read-all").patch(markAllAsRead);

export default router;
