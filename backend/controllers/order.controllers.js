import Shop from './../models/shop.model.js';
import Order from "./../models/order.model.js"
import User from './../models/user.model.js';
import DeliveryAssignment from "../models/delivery.model.js";
import { sendDeliveryOtpMail } from '../utils/mail.js';
import { EVENTS } from '../constants/events.js';
import RazorPay from "razorpay"
import { sendNotification } from "../utils/sendNotification.js";
import dotenv from "dotenv"
dotenv.config()

    let instance = new RazorPay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
    });


export const placeOrder = async (req, res) => {
    try {
        const { cartItems, paymentMethod, deliveryAddress, totalAmount } = req.body
        if(!cartItems || cartItems.length == 0){
            return res.status(400).json({message: "cart is empty"})
        }
        if(!deliveryAddress.text || !deliveryAddress.latitude || !deliveryAddress.longitude){
            return res.status(400).json({message: "send complete Delivery Address"})
        }

        const groupItemsByShop = {}

        cartItems.forEach(item => {
            const shopId = item.shop._id || item.shop;

            if(!groupItemsByShop[shopId]){
                groupItemsByShop[shopId] = []
            }
            groupItemsByShop[shopId].push(item)
        });

        const shopOrders = await Promise.all (Object.keys(groupItemsByShop).map( async (shopId) => {
            const shop = await Shop.findById(shopId).populate("owner")
            if(!shop){
                return res.status(400).json({message: "shop not found"})
            }
            if (!shop.isOpen) {
                return res.status(400).json({message: `${shop.name} is currently closed`});
            }
            const items = groupItemsByShop[shopId]
            const subtotal = items.reduce((sum, i) =>sum+Number(i.price)*Number(i.quantity), 0)
            return {
                shop:shop._id,
                owner:shop.owner._id,
                subtotal,
                shopOrderItems:items.map((i) => ({
                item:i.id,
                price:i.price,
                quantity:i.quantity,
                name:i.name
                })
            )}
        })
    )

    if(paymentMethod == "online"){
        const razorOrder = await instance.orders.create({
            amount:Math.round(totalAmount*100),
            currency: "INR",
            receipt: `receipt_${Date.now()}`
        })
        const newOrder = await Order.create({
            user:req.userId,
            paymentMethod,
            deliveryAddress,
            totalAmount,
            shopOrders,
            razorpayOrderId: razorOrder.id,
            payment: false
        })
        return res.status(200).json({
            razorOrder,
            orderId: newOrder._id
        })
    }

    const newOrder = await Order.create({
        user:req.userId,
        paymentMethod,
        deliveryAddress,
        totalAmount,
        shopOrders
    })

    await newOrder.populate("shopOrders.shopOrderItems.item", "name image price")
    await newOrder.populate("shopOrders.shop", "name")
    await newOrder.populate("shopOrders.owner", "_id fullname socketId");
    await newOrder.populate("user", "name email mobile")

    const io = req.app.get('io')
    await newOrder.populate("shopOrders.owner", "fullname socketId");
    if(io){
        newOrder.shopOrders.forEach(shopOrder => {
            const ownerSocketId = shopOrder.owner?.socketId

            if(ownerSocketId){
                io.to(ownerSocketId).emit(EVENTS.ORDER_NEW, {
                    _id: newOrder._id, 
                    paymentMethod: newOrder.paymentMethod, 
                    user: newOrder.user, 
                    shopOrders: shopOrder, 
                    createdAt: newOrder.createdAt, 
                    deliveryAddress: newOrder.deliveryAddress,
                    payment: newOrder.payment
                })
            }
        });
    }

    for (const shopOrder of newOrder.shopOrders) {

    await sendNotification({
        io,
        receiver: shopOrder.owner._id,
        sender: req.userId,
        order: newOrder._id,
        title: "New Order",
        message: "You have received a new order.",
        type: "order",
    });

}

    return res.status(201).json(newOrder)


    } catch (error) {
        console.log("PLACE ORDER ERROR:",error)
        return res.status(500).json({message:`place order error, ${error}`})
    }
}

export const verifyPayment = async (req, res) => {
    try {
        const {razorpay_payment_id, orderId} = req.body
        const payment = await instance.payments.fetch(razorpay_payment_id)
        if(!payment || payment.status!="captured"){
            return res.status(400).json({message: "payment not capured"})
        }

        const order = await Order.findById(orderId)
        if(!order){
            return res.status(400).json({message: "order not found"})
        }

        order.payment = true
        order.razorpayPaymentId = razorpay_payment_id
        await order.save();

        await order.populate("shopOrders.shopOrderItems.item", "name image price")
        await order.populate("shopOrders.shop", "name")
        await order.populate("shopOrders.owner", "fullname socketId");
        await order.populate("user", "name email mobile")

        const io = req.app.get('io')

        if(io){
            order.shopOrders.forEach(shopOrder => {

            const ownerSocketId = shopOrder.owner?.socketId

            if(ownerSocketId){
                io.to(ownerSocketId).emit(EVENTS.ORDER_NEW, {
                    _id: order._id, 
                    paymentMethod: order.paymentMethod, 
                    user: order.user, 
                    shopOrders: shopOrder, 
                    createdAt: order.createdAt, 
                    deliveryAddress: order.deliveryAddress,
                    payment: order.payment
                })
            }
        });
    }

        return res.status(200).json(order)

    } catch (error) {
        console.log(error)
        return res.status(500).json({message:`verify payment error, ${error}`})
    }
}

export const getMyOrders = async (req, res) => {
    try {
        const user = await User.findById(req.userId)

        if(user.role == "user"){

            const orders = await Order.find({user: req.userId})
                .populate("shopOrders.shop", "name")
                .populate("shopOrders.owner", "name email mobile")
                .populate("shopOrders.shopOrderItems.item", "name image price")
                .lean()

                orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            return res.status(200).json(orders)

        }else if(user.role == "owner"){

            const orders = await Order.find({"shopOrders.owner":req.userId})
                .populate("shopOrders.shop", "name")
                .populate("user")
                .populate("shopOrders.shopOrderItems.item", "name image price")
                .populate("shopOrders.assignDeliveryBoy", "fullname mobile")

                orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

            const filterOrder = orders.map((order => ({ 
                _id: order._id, 
                paymentMethod: order.paymentMethod, 
                user: order.user, 
                shopOrders: order.shopOrders.find( 
                    o => o.owner._id.toString() === req.userId), 
                createdAt: order.createdAt, 
                deliveryAddress: order.deliveryAddress,
                payment: order.payment,
                totalAmount: order.totalAmount
            })))

            return res.status(200).json(filterOrder)
        }

    } catch (error) {
        console.log(error)
        return res.status(500).json({message:`get user order error, ${error}`})
    }
}

export const updateOrderStatus = async (req, res) => {
    try {
        const {orderId, shopId} = req.params
        const {status} = req.body
        const order = await Order.findById(orderId)

        const shopOrder = order.shopOrders.find(o => o.shop.toString() === shopId)

        if(!shopOrder){
            return res.status(400).json({message: "shop order not found"})
        }
        if(shopOrder.status === "delivered"){
            return res.status(400).json({message: "Delivered order status cannot be changed"})
        }
        shopOrder.status = status
        let deliveryBoysPayload = []

        if(status == "out of delivery" && !shopOrder.assignment){
            const {longitude, latitude} = order.deliveryAddress

            const nearByDeliveryBoys = await User.find({
                role: "deliveryBoy",
                isOnline: true,
                location: {
                    $near: {
                        $geometry: {
                            type: "Point",
                            coordinates: [Number(longitude), Number(latitude)]
                        },
                        $maxDistance: 12000
                    }
                }
            });

            const nearByIds = nearByDeliveryBoys.map(b => b._id)
            const busyIds = await DeliveryAssignment.find({
                assignedTo:{$in:nearByIds},
                status:{$nin:["broadcasted", "completed"]}
            }).distinct("assignedTo")

            const busyIdSet = new Set(busyIds.map(id => String(id)))
            const availableBoys = nearByDeliveryBoys.filter(b => !busyIdSet.has(String(b._id)))
            const candidates = availableBoys.map(b => b._id)

            if(candidates.length == 0){
                await order.save()
                return res.json({
                    message:"order status updated but there is no available delivery boy",availableBoys: []
                })
            }

            const deliveryAssignment = await DeliveryAssignment.create({
                order:order._id,
                shop:shopOrder.shop,
                shopOrderId:shopOrder._id,
                brodcastedTo:candidates,
                status:"broadcasted"
            })

            shopOrder.assignDeliveryBoy = deliveryAssignment.assignedTo
            shopOrder.assignment = deliveryAssignment._id

                deliveryBoysPayload = availableBoys.map(b => ({
                    id: b._id,
                    fullName: b.fullname,
                    longitude: b.location.coordinates[0],
                    latitude: b.location.coordinates[1],
                    mobile: b.mobile
                }))

            await deliveryAssignment.populate("order")
            await deliveryAssignment.populate({
                path: "shop",
                populate: {
                path: "owner",
                select: "fullname mobile"
                }
            })
            
            const io = req.app.get('io')
            if(io){
                availableBoys.forEach((boy) => {
                const boySocketId = boy.socketId
                    if(boySocketId){
                        io.to(boySocketId).emit(EVENTS.ORDER_STATUS, {
                            sentTo:boy._id,
                            assignmentId: deliveryAssignment._id,
                            orderId: deliveryAssignment.order._id,
                            shopName: deliveryAssignment.shop.name,
                            fullname: deliveryAssignment.shop.owner.fullname,
                            mobile: deliveryAssignment.shop.owner.mobile,
                            shopAddress: deliveryAssignment.shop.address,
                            shopCity: deliveryAssignment.shop.city,
                            shopState: deliveryAssignment.shop.state,
                            deliveryAddress: deliveryAssignment.order.deliveryAddress,
                            items: deliveryAssignment.order.shopOrders.find(
                                so => so._id.equals(deliveryAssignment.shopOrderId))?.
                            shopOrderItems || [],
                            subtotal: deliveryAssignment.order.shopOrders.find(
                                so => so._id.equals(deliveryAssignment.shopOrderId))?.subtotal
                        })
                    }
                });

                for (const boy of availableBoys) {

            await sendNotification({
                io,
                receiver: boy._id,
                sender: req.userId,
                order: order._id,
                title: "New Delivery Request",
                message: "A new delivery is available near you.",
                type: "delivery",
            });
            }}
        }

            
        await order.save()
        await order.populate("shopOrders.shop", "name");
        await order.populate("shopOrders.assignDeliveryBoy", "fullname email mobile" )
        await order.populate("user", "socketId" )
        const updateShopOrder = order.shopOrders.find(o => String(o.shop._id) === String(shopId))

        const io = req.app.get("io");

        await sendNotification({
            io,
            receiver: order.user._id || order.user,
            sender: req.userId,
            order: order._id,
            title: `Order ${status}`,
            message: `Your order is now ${status}.`,
            type: "order",
        });


        if(io && updateShopOrder){
            const userSocketId = order.user.socketId
            if(userSocketId){
                io.to(userSocketId).emit(EVENTS.ORDER_STATUS, {
                    orderId: order._id,
                    shopId: updateShopOrder.shop._id,
                    status: shopOrder.status,
                    userId: order.user._id
                })
            }
        }

        await sendNotification({
            io,
            receiver: order.user._id,
            sender: req.userId,
            order: order._id,
            title: "Order Status Updated",
            message: `Your order is now ${status}.`,
            type: "order",
        });

        return res.status(200).json({
            shopOrder:updateShopOrder,
            assignedDeliveryBoy:updateShopOrder?.assignDeliveryBoy,
            availableBoys: deliveryBoysPayload,
            assignment: updateShopOrder?.assignment?._id
        })

        } catch (error) {
        console.error(error);
        console.error(error.stack);
    
        return res.status(500).json({
            message: `order status error ${error.message}`
        });
    }
}

export const getDeliveryBoyAssignment = async (req, res) => {
    try {
        const deliveryBoyId = req.userId
        const assignments = await DeliveryAssignment.find({
            brodcastedTo: deliveryBoyId,
            status: "broadcasted"
        })
        .populate("order")
        .populate({
            path: "shop",
            populate: {
            path: "owner",
            select: "fullname mobile"
            }
        })

        const formatted = assignments.map(a => {
            const shopOrder = a.order.shopOrders.find(
                so => so._id.equals(a.shopOrderId)
            );

            return {
                assignmentId: a._id,
                orderId: a.order._id,
                shopName: a.shop.name,
                shopAddress: a.shop.address,
                shopCity: a.shop.city,
                shopState: a.shop.state,
                fullname: a.shop.owner.fullname,
                mobile: a.shop.owner.mobile,
                deliveryAddress: a.order.deliveryAddress,
                items: shopOrder?.shopOrderItems || [],
                subtotal: shopOrder?.subtotal
            };
        });

        return res.status(200).json(formatted)

        } catch (error) {
            console.error(error);
            console.error(error.stack);

        return res.status(500).json({
            message: error.message
        });

        return res.status(500).json({
            message: `get Assignment error ${error.message}`
        });
    }
}

export const acceptOrder = async (req, res) => {
    try {
        const {assignmentId} = req.params
        const assignment = await DeliveryAssignment.findById(assignmentId)
        if(!assignment){
            return res.status(400).json({message: "assignment not found"})
        }
        if(assignment.status!=="broadcasted"){
            return res.status(400).json({message: "assignment is expired"})
        }
        const alreadyAssigned = await DeliveryAssignment.findOne({
            assignedTo:req.userId,
            status:{$nin:["broadcasted", "completed"]}
        })
        if(alreadyAssigned){
            return res.status(400).json({message: "You are already assigned toanorther order"})
        }

        assignment.assignedTo = req.userId
        assignment.status = "assigned"
        assignment.accepteAt = new Date()
        await assignment.save()


        const order = await Order.findById(assignment.order)
        if(!order){
            return res.status(400).json({message: "order not found"})
        }

        const shopOrder = order.shopOrders.find(so => String(so._id) === String(assignment.shopOrderId))

        if (!shopOrder) {
            return res.status(400).json({
            message: "shop order not found"
            })
        }

        shopOrder.assignDeliveryBoy = req.userId
        await order.save()
        await order.populate("shopOrders.assignDeliveryBoy")
        const io = req.app.get("io");

        
        const deliveryBoys = await User.find({
            _id: { $in: assignment.brodcastedTo }
        }).select("socketId");

        deliveryBoys.forEach((boy) => {
        if (boy.socketId) {
            io.to(boy.socketId).emit(EVENTS.ORDER_ACCEPTED, {
            assignmentId: assignment._id,
            acceptedBy: req.userId
        });
        }
    });

        const shop = await Shop.findById(assignment.shop).populate("owner");

        await sendNotification({
            io,
            receiver: shop.owner._id,
            sender: req.userId,
            order: order._id,
            title: "Delivery Boy Assigned",
            message: "A delivery boy has accepted the order.",
            type: "delivery",
        });

        await order.populate("user");

await sendNotification({
    io,
    receiver: order.user._id,
    sender: req.userId,
    order: order._id,
    title: "Delivery Boy Assigned",
    message: "A delivery boy has accepted your order.",
    type: "delivery",
});

    if (shop?.owner?.socketId) {

        io.to(shop.owner.socketId).emit(EVENTS.DELIVERY_ACCEPTED, {
            orderId: order._id,
            shopOrderId: assignment.shopOrderId,
            deliveryBoy: shopOrder.assignDeliveryBoy
        });
    }

        return res.status(200).json({
            message: "order accepted"
        })

    } catch (error) {
        console.error("ERROR:", error);
        console.error(error.stack);

        return res.status(500).json({
            message: error.message
        });
        return res.status(500).json({message: `accept order error, ${error}`})
    }
}

export const getCurrentOrder = async (req, res) => {
    try {
        const assignment = await DeliveryAssignment.findOne({
            assignedTo: req.userId,
            status: "assigned"
        })
        .populate("shop", "name")
        .populate("assignedTo", "fullname email mobile location")
        .populate({
            path: "order",
            populate: [{path:"user", select: "fullname email mobile location"}]
        })
        if(!assignment){
            return res.status(200).json(null)
        }

        if(!assignment?.order){
            return res.status(500).json({message: `order not found`})
        }
        const shopOrder = assignment.order.shopOrders.find(so => String(so._id) == String(assignment.shopOrderId))
        if(!shopOrder){
            return res.status(500).json({message: `shoporder not found`})
        }


        let deliveryBoyLocation = {lat:null, lon:null}
        if(assignment?.assignedTo?.location?.coordinates.length == 2) {
            deliveryBoyLocation.lat =  assignment?.assignedTo?.location?.coordinates[1]
            deliveryBoyLocation.lon =  assignment?.assignedTo?.location?.coordinates[0]
        }
        
        let customerLocation = {lat:null, lon:null}
        if(assignment?.order?.deliveryAddress){
            customerLocation.lat = assignment?.order?.deliveryAddress.latitude
            customerLocation.lon = assignment?.order?.deliveryAddress.longitude
        }

        return res.status(200).json({
            _id: assignment.order._id,
            user: assignment.order.user,
            shopOrder,
            deliveryAddress: assignment?.order?.deliveryAddress,
            deliveryBoyLocation,
            customerLocation
        })

    } catch (error) {
        return res.status(500).json({message: `current order error${error}`})
    }
}

export const getOrderById = async (req, res) => {
    try {
        const {orderId} = req.params
        const order = await Order.findById(orderId)
        
        .populate("user")
        .populate({
            path: "shopOrders.shop",
            model:"Shop"
        })
        .populate({
            path: "shopOrders.assignDeliveryBoy",
            model:"User"
        })
        .populate({
            path: "shopOrders.shopOrderItems.item",
            model: "Item"
        })
        .lean()

        if(!order){
            return res.status(400).json({message: "Order not found"})
        }

        return res.status(200).json(order)

    } catch (error) {
        return res.status(400).json({message: `get order id error, ${error}`})
    }
}

export const sendDeliveryOtp = async (req, res) => {
    try {
        const {orderId, shopOrderId} = req.body

        const order = await Order.findById(orderId).populate("user")
        if(!order){
            return res.status(400).json({message: "enter valid order/shoporderid"})
        }

        const shopOrder = order.shopOrders.id(shopOrderId)
        if (!shopOrder) {
            return res.status(400).json({ message: "Shop order not found" });
        }


        const otp = Math.floor(1000 + Math.random() * 9000).toString()
            shopOrder.delieveryOtp = otp;
            shopOrder.otpExpires = Date.now() + 5 * 60 * 1000
            await order.save()
            await sendDeliveryOtpMail(order.user, otp)

            return res.status(200).json({message: `Otp sent Successfully to ${order?.user?.fullname}`})

        } catch (error) {
            return res.status(500).json({message: `delivery otp error ${error}`})
        }
    }

export const verifyDeliveryOtp = async (req, res) => {
    try {
        const {orderId, shopOrderId, otp} = req.body

        const order = await Order.findById(orderId).populate("user")
        if(!order){
            return res.status(400).json({message: "order not found"})
        }

        const shopOrder = order.shopOrders.id(shopOrderId)
        if(!shopOrder){
            return res.status(400).json({message: "shoporder not found"})
        }

        if(shopOrder.delieveryOtp!==otp || !shopOrder.otpExpires || shopOrder.otpExpires<Date.now()){
            return res.status(400).json({message: "Invalid/Expired Otp"})
        }

        shopOrder.status = "delivered"
        shopOrder.deliveredAt = Date.now()
        await order.save()

        await DeliveryAssignment.deleteOne({
            shopOrderId: shopOrder._id,
            order: order._id,
            assignedTo: shopOrder.assignDeliveryBoy,
        });

        await order.populate("user", "socketId");
        await order.populate("shopOrders.owner", "socketId");
        await order.populate("shopOrders.assignDeliveryBoy", "socketId");

        const io = req.app.get("io");
        const shop = await Shop.findById(shopOrder.shop).populate("owner");

        await sendNotification({
            io,
            receiver: order.user._id,
            sender: req.userId,
            order: order._id,
            title: "Order Delivered",
            message: "Your order has been delivered successfully.",
            type: "delivery",
        });

        if (shop?.owner?._id) {
            await sendNotification({
                io,
                receiver: shop.owner._id,
                sender: req.userId,
                order: order._id,
                title: "Order Delivered",
                message: "The order has been delivered to the customer.",
                type: "delivery",
            });
        }
        
        const updatedShopOrder = order.shopOrders.id(shopOrderId);


        if (order.user?.socketId) {
            io.to(order.user.socketId).emit(EVENTS.ORDER_DELIVERED, {
                orderId: order._id,
                shopId: shopOrder.shop,
                status: "delivered"
            });
        }
            
        if (updatedShopOrder?.owner?.socketId) {
        io.to(updatedShopOrder.owner.socketId).emit(EVENTS.ORDER_DELIVERED, {
            orderId: order._id,
            shopId: updatedShopOrder.shop,
            status: "delivered"
        });
        }
    
        if (updatedShopOrder?.assignDeliveryBoy?.socketId) {
            io.to(updatedShopOrder.assignDeliveryBoy.socketId).emit(
                EVENTS.ORDER_DELIVERED,
            {
                orderId: order._id,
                shopId: updatedShopOrder.shop,
                status: "delivered"
            });
        }


        return res.status(200).json({message: "Order Delivered Successfully"})

        } catch (error) {
        console.log(error)
            return res.status(500).json({message: `verify delivery otp error, ${error}`})
        }
    }

export const deleteOrder = async (req, res) => {
    try {
        const { orderId } = req.params;

        const order = await Order.findOne({
            _id: orderId,
            user: req.userId
        });

        if (!order) {
            return res.status(404).json({
                message: "Order not found"
            });
        }
        await order.populate("shopOrders.owner", "socketId");

        const cannotDelete = order.shopOrders.some(
            (shopOrder) =>
                shopOrder.status === "out of delivery" ||
                shopOrder.status === "delivered"
        );

        if (cannotDelete) {
            return res.status(400).json({
                message: "Order cannot be deleted now."
            });
        }

        await Order.findByIdAndDelete(orderId);

        const io = req.app.get("io");

        order.shopOrders.forEach((shopOrder) => {
        if (shopOrder.owner?.socketId) {
            io.to(shopOrder.owner.socketId).emit(EVENTS.ORDER_DELETED, {
                orderId: order._id
            });
        }
    });
        return res.status(200).json({
            message: "Order deleted successfully."
        });

    } catch (error) {
        console.log(error);

        return res.status(500).json({
            message: error.message
        });
    }
};

export const getTodayDeliveries = async (req, res) => {
    try {
        const deliveryBoyId = req.userId
        const startOfDay = new Date()
        startOfDay.setHours(0, 0, 0, 0)

        const orders = await Order.find({
            "shopOrders.assignDeliveryBoy": deliveryBoyId,
            "shopOrders.status": "delivered",
            "shopOrders.deliveredAt": {$gte:startOfDay}
        }).lean()

        let todayDeliveries = []
        orders.forEach(order => {
    order.shopOrders.forEach(shopOrder => {

        if (
            String(shopOrder.assignDeliveryBoy) === String(deliveryBoyId) &&
            shopOrder.status === "delivered" &&
            shopOrder.deliveredAt >= startOfDay
            ) {
                todayDeliveries.push(shopOrder);
            }
            });
        });

        let stats = {}

        todayDeliveries.forEach(shopOrder => {
            const hour = new Date(shopOrder.deliveredAt).getHours()
            stats[hour] = (stats[hour] || 0) + 1
        })

        let formattedStats = Object.keys(stats).map(hour => ({
            hour: parseInt(hour),
            count: stats[hour]
        }))

        formattedStats.sort((a, b) => a.hour-b.hour)

        return res.status(200).json(formattedStats)

    } catch (error) {
            console.log(error);
            console.log(error.stack);

        return res.status(500).json({message: `today deliveries error, ${error}`})
    }
}
