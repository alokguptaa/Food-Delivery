import { io } from "socket.io-client";

export const socket = io("https://food-delivery-yucy.onrender.com", {
    withCredentials: true,
    autoConnect: false,
});
