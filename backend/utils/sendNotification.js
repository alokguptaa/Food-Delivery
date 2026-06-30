import User from "../models/user.model.js";
import Notification from "../models/notification.model.js";
import { EVENTS } from "../constants/events.js";

export const sendNotification = async ({
    io,
    receiver,
    sender = null,
    order = null,
    title,
    message,
    type = "system",
}) => {

    try {

        const notification = await Notification.create({
            receiver,
            sender,
            order,
            title,
            message,
            type,
        });

        const user = await User.findById(receiver);

        if (user?.socketId) {

            io.to(user.socketId).emit(
                EVENTS.NEW_NOTIFICATION,
                notification
            );

        }

        return notification;

    } catch (error) {

        console.log("Notification Error :", error);

    }

}
