import User from "./models/user.model.js";
import { EVENTS } from "./constants/events.js";


export const sendNotification = async ({
    io, receiver, sender = null, order = null, title, message, type = "system",

    }) => {
    try {
        const notification = await Notification.create({
            receiver, sender, order, title, message, type,
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
            console.log(error);
        }
    };

export const socketHandler = async (io) => {
    io.on('connection', (socket) => {
        socket.on("identity", async ({userId}, callback) => {
            try {
                const user = await User.findByIdAndUpdate(
                    userId,
                    {
                        socketId: socket.id,
                        isOnline: true
                    },
                    {
                        new: true,
                    }
                );
                if (!user) {
                    console.log("User not found");
                    return;
                }

                if (callback) {
                    callback(user);
                }

                if (user.role === "deliveryBoy") {
                    io.emit(EVENTS.DELIVERY_BOY_STATUS_CHANGED, {
                        userId: user._id,
                        isOnline: true
                    });
                }
                } catch (error) {
                    console.log(error)
                }
            })
        
        socket.on(EVENTS.JOIN_CITY, (city) => {
            socket.join(city);
            console.log(`${socket.id} joined city ${city}`);
        });
        
        socket.on(EVENTS.LEAVE_CITY, (city) => {
            socket.leave(city);
            console.log(`${socket.id} left city ${city}`);
        });

        socket.on(EVENTS.UPDATE_DELIVERY_LOCATION, async({latitude, longitude, userId}) => {
            try {
                const user = await User.findByIdAndUpdate(userId, {
                    location:{
                        type: "Point",
                        coordinates: [longitude, latitude]
                    },
                    isOnline: true,
                    socketId: socket.id
                })
                if(user){
                    io.emit(EVENTS.DELIVERY_LOCATION_UPDATED, {
                        deliveryBoyId: userId,
                        latitude, 
                        longitude
                    })
                }
            } catch (error) {
                console.log("", error)
            }
        })



        socket.on("disconnect", async () => {
            try {
            await User.findOneAndUpdate(
                { socketId: socket.id },
            {
                socketId: null,
                isOnline: false,
            },
            {
                returnDocument: "after",
            }
        );
        } catch (err) {
            console.log(err);
        }
    });
    })
}
