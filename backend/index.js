import dotenv from "dotenv";
dotenv.config({ path: "./.env" });

import cors from "cors"
import http from "http"
import express from "express";
import cookieParser from "cookie-parser";
import { Server } from "socket.io";

import connectDb from "./config/db.js";

import authRouter from "./routes/auth.routes.js";
import userRouter from "./routes/user.routes.js";
import shopRouter from "./routes/shop.routes.js";
import itemRouter from './routes/item.routes.js';
import orderRouter from "./routes/order.routes.js";
import notificationRouter from "./routes/notification.routes.js";

import { socketHandler } from "./socket.js";

const app = express();
const server = http.createServer(app)

const port = process.env.PORT || 3000;

connectDb();

app.use(express.json())
app.use(cookieParser())
app.set("trust proxy", 1);

const allowedOrigins = [
    "http://localhost:5173",
    "https://food-delivery-1dl9-git-main-alokguptaas-projects.vercel.app",
    "https://food-delivery-1dl9.vercel.app"
];


app.use(cors({
    origin:allowedOrigins,
    credentials:true
}))


app.use("/api/user", userRouter)
app.use("/api/auth", authRouter)
app.use("/api/shop", shopRouter)
app.use("/api/item", itemRouter)
app.use("/api/order", orderRouter)
app.use("/api/notification", notificationRouter);

const io = new Server(server, {
    cors: {
    origin:allowedOrigins,
    credentials:true,
    methods: ['POST', 'GET']
    }
})

app.set("io", io)
socketHandler(io)

app.get("/", (req, res) => {
    res.send("🚀 Backend is running successfully");
});

server.listen(port, () => {
    console.log(`🚀 Server running: http://localhost:3000`)
})
