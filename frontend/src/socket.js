import { io } from "socket.io-client";

export const socket = io("https://food-delivery-2jxx.onrender.com", {
    withCredentials: true,
    autoConnect: false,
});
