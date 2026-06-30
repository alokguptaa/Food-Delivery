import React from "react";
import { useState } from "react";
import { IoNotificationsOutline } from "react-icons/io5";
import { useDispatch, useSelector } from "react-redux";
import { markNotificationRead, markAllNotificationsRead, deleteNotification, clearAllNotifications} from "../redux/notificationSlice";
import { RiDeleteBin6Line } from "react-icons/ri";
import axios from "axios";
import { serverUrl } from "../App";

const NotificationBell = () => {

    const dispatch = useDispatch();

    const [open, setOpen] = useState(false)

    const { notifications, unreadCount } = useSelector(
        state => state.notification
    );


    const handleDeleteNotification = async (id) => {
        try {
            await axios.delete(
                `${serverUrl}/api/notification/${id}`,
                {
                    withCredentials: true
                }
            );
            dispatch(deleteNotification(id));
        } catch (error) {
            console.log(error);
        }
    };

    const handleClearAllNotifications = async () => {
        try {
            await axios.delete(
                `${serverUrl}/api/notification/clear`,
                {
                    withCredentials: true
                }
            );
            dispatch(clearAllNotifications());
        } catch (error) {
            console.log(error);
        }
    };


    return (
        <div className="relative cursor-pointer" onClick={() => setOpen(!open)} >
    <IoNotificationsOutline size={28} />

    {unreadCount > 0 && (
        <span
            className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full min-w-5 h-5 flex items-center justify-center text-xs px-1">
            {unreadCount > 99 ? "99+" : unreadCount}
        </span>
    )}

    {open && (
    <div className="absolute right-0 mt-3 w-96 bg-white rounded-xl shadow-2xl border z-9999">
        <div className="flex justify-between items-center p-4 border-b">
            <h2 className="font-semibold text-lg">
                Notifications
            </h2>
            {notifications.length > 0 && (
    <div className="flex gap-3">

        <button
            className="text-sm text-blue-600 cursor-pointer"
            onClick={() => dispatch(markAllNotificationsRead())}
        >
            Mark all read
        </button>

        <button
            className="text-sm text-red-600 cursor-pointer"
            onClick={handleClearAllNotifications}
        >
            Clear All
        </button>

    </div>
)}
        </div>

        <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                    No Notifications
                </div>
            ) : (
            notifications.map((n) => (
            <div key={n._id} className={`p-4 border-b cursor-pointer hover:bg-gray-100 ${!n.isRead ? "bg-orange-50" : ""}`} 
                onClick={() => dispatch(markNotificationRead(n._id))}>
                <div className="flex justify-between items-start">
                    <div className="flex-1">
                        <h3 className="font-semibold">    
                            {n.title}
                        </h3>
                        <p className="text-sm text-gray-600">
                            {n.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                            {new Date(n.createdAt).toLocaleString()}
                        </p>
                    </div>
                    <button className="ml-3 text-red-500 hover:text-red-700 cursor-pointer"
                        onClick={(e) => { e.stopPropagation(); handleDeleteNotification(n._id)}}>
                        <RiDeleteBin6Line size={18} />
                    </button>
                </div>
            </div>
            ))
        )}
        </div>
    </div>
    )}
    </div>
    );
};

export default NotificationBell;
