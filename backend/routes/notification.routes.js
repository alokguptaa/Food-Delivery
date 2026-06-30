import express from "express";
import { getNotifications, getUnreadCount, markAsRead, markAllAsRead, clearAllNotifications, deleteNotification } from "../controllers/notification.controller.js";

import isAuth from "../middlewares/isAuth.js";

const router = express.Router();

router.get("/", isAuth, getNotifications);

router.get("/unread-count", isAuth, getUnreadCount);

router.patch("/read-all", isAuth, markAllAsRead);

router.patch("/read/:id", isAuth, markAsRead);

router.delete("/clear", isAuth, clearAllNotifications);

router.delete("/:id", isAuth, deleteNotification);

export default router;
