import { createSlice } from "@reduxjs/toolkit";

const notificationSlice = createSlice({
    name: "notification",

    initialState: {
        notifications: [],
        unreadCount: 0,
    },

    reducers: {

        setNotifications: (state, action) => {
            state.notifications = action.payload;
            state.unreadCount = action.payload.filter(
                n => !n.isRead
            ).length;
        },

        addNotification: (state, action) => {
            state.notifications.unshift(action.payload);
            if (!action.payload.isRead) {
                state.unreadCount++;
            }
        },

        markNotificationRead: (state, action) => {
            const notification = state.notifications.find(
                n => n._id === action.payload
            );
            if (notification && !notification.isRead) {
                notification.isRead = true;
                state.unreadCount--;
            }
        },

        markAllNotificationsRead: (state) => {
            state.notifications.forEach(notification => {
                notification.isRead = true;
            });
            state.unreadCount = 0;
        },

        deleteNotification: (state, action) => {
            const notification = state.notifications.find(
                n => n._id === action.payload
            );
            if (notification && !notification.isRead) {
                state.unreadCount--;
            }
            state.notifications =
                state.notifications.filter(
                    n => n._id !== action.payload
            );
        },

        clearAllNotifications: (state) => {
            state.notifications = [];
            state.unreadCount = 0;
        }

    }
});

export const {

    setNotifications,
    addNotification,
    markNotificationRead,
    markAllNotificationsRead,
    deleteNotification,
    clearAllNotifications
} = notificationSlice.actions;

export default notificationSlice.reducer;
