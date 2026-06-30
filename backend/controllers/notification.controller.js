import Notification from "../models/notification.model.js";

export const getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({
            receiver: req.userId
        })
        .populate("sender", "fullname role")
        .sort({ createdAt: -1 });

        return res.status(200).json(notifications);

    } catch (error) {
        return res.status(500).json({
            message: error.message
        });
    }
};

export const getUnreadCount = async (req, res) => {
    try {
        const count = await Notification.countDocuments({
            receiver: req.userId,
            isRead: false
        });

        return res.json({ count });

    } catch (error) {
        return res.status(500).json({
            message: error.message
        });
    }
};

export const markAsRead = async (req, res) => {
    try {
        await Notification.findByIdAndUpdate(
            req.params.id,
            {
                isRead: true
            }
        );

        return res.json({
            message: "Notification marked as read"
        });

    } catch (error) {
        return res.status(500).json({
            message: error.message
        });
    }
};

export const markAllAsRead = async (req, res) => {
    try {
        await Notification.updateMany(
            {
                receiver: req.userId,
                isRead: false
            },
            {
                isRead: true
            }
        );

        return res.json({
            message: "All notifications marked as read"
        });

    } catch (error) {
        return res.status(500).json({
            message: error.message
        });
    }
};

export const deleteNotification = async (req, res) => {
    try {

        const notification = await Notification.findOneAndDelete({
            _id: req.params.id,
            receiver: req.userId
        });

        if (!notification) {
            return res.status(404).json({
                message: "Notification not found"
            });
        }

        return res.json({
            message: "Notification deleted"
        });

    } catch (error) {
        return res.status(500).json({
            message: error.message
        });
    }
};

export const clearAllNotifications = async (req, res) => {
    try {

        await Notification.deleteMany({
            receiver: req.userId
        });

        return res.json({
            message: "All notifications deleted"
        });

    } catch (error) {
        return res.status(500).json({
            message: error.message
        });
    }
};
