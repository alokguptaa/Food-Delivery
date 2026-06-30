import axios from 'axios'
import React, { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { serverUrl } from '../App'
import { IoIosArrowRoundBack } from "react-icons/io";
import DeliveryBoyTracking from '../components/DeliveryBoyTracking.jsx';
import { socket } from '../socket.js';
import { EVENTS } from '../socket/events.js';
import { useDispatch } from 'react-redux';
import { updateRealtimeOrderStatus } from '../redux/userSlice.js';

const TrackOrderPage = () => {

    const navigate = useNavigate()
    const dispatch = useDispatch()
    const {orderId} = useParams()
    const [currentOrder, setcurrentOrder] = useState()
    const [liveLocation, setliveLocation] = useState({})

    const handleGetOrder = useCallback(async () => {
        try {
            const result = await axios.get(`${serverUrl}/api/order/get-order-by-id/${orderId}`,
                {withCredentials: true}
            )
                setcurrentOrder(result.data)
        } catch (error) {
            console.log(error)
        }
    },[orderId])

    useEffect(() => {
    const handleLocation = ({ deliveryBoyId, latitude, longitude }) => {
        
        console.log("LOCATION RECEIVED:")
        setliveLocation(prev => ({
            ...prev,
            [deliveryBoyId]: {
                lat: latitude,
                lon: longitude
            }
        }));
    };

    socket.on(EVENTS.DELIVERY_LOCATION_UPDATED, handleLocation);

    return () => {
        socket.off(EVENTS.DELIVERY_LOCATION_UPDATED, handleLocation);
    };
}, [orderId]);

useEffect(() => {
    const handleOrderUpdate = (payload) => {
        
        if (payload.orderId !== orderId) return;

        dispatch(updateRealtimeOrderStatus({
        orderId: payload.orderId,
        shopId: payload.shopId,
        status: payload.status
    }));

        setcurrentOrder(prev => {
            if (!prev) return prev;

            return {
                ...prev,
                shopOrders: prev.shopOrders.map(so => {
                    if (String(so.shop._id) === String(payload.shopId)) {
                        return {
                            ...so,
                            status: payload.status
                        };
                    }
                    return so;
                })
            };
        });
    };

    socket.on(EVENTS.ORDER_STATUS, handleOrderUpdate);
    socket.on(EVENTS.ORDER_DELIVERED, handleOrderUpdate);

    return () => {
        socket.off(EVENTS.ORDER_STATUS, handleOrderUpdate);
        socket.off(EVENTS.ORDER_DELIVERED, handleOrderUpdate);
    };
}, [orderId, dispatch]);

useEffect(() => {
    handleGetOrder();
}, [handleGetOrder]);



return (
    <div className='max-w-4xl mx-auto p-4 flex flex-col gap-6'>
        <div className='relative top-5 left-5 flex items-center gap-4 z-2.5 mb-2.5 cursor-pointer' onClick={() => navigate("/signin")}>
            <IoIosArrowRoundBack size={25} className='text-[#ff4d2d]'/>
            <h1 className='text-2xl font-bold md:text-center'>Track Order</h1>
        </div>
        {
            currentOrder?.shopOrders?.map((shopOrder, index) => (
                <div className='bg-white p-4 rounded-2xl shadow-md border-orange-100 space-y-4' key={index}>
                    <div>
                        <p className='text-lg font-bold mb-2 text-[#ff4d2d]'>
                            {shopOrder?.shop.name}
                        </p>
                        <p className='font-semibold'>
                            <span>Items:</span> {shopOrder.shopOrderItems?.map(i => i.name).join(", ")}
                        </p>
                        <p>
                            <span className='font-semibold'>Subtotal:</span> ₹{shopOrder.subtotal}
                        </p>
                        <p className='mt-4'>
                            <span className='font-semibold'>DeliveryAddress</span> {currentOrder.deliveryAddress?.text}
                        </p>
                    </div>
                    <div>
                        {
                            shopOrder.status!="delivered" ? 
                            <>  
                                {
                                    shopOrder.assignDeliveryBoy ? 
                                    <div className='text-sm text-gray-700'>
                                        <p className='font-semibold'>
                                            <span>Delivery Boy Name: </span>{shopOrder.assignDeliveryBoy.fullname}
                                        </p>
                                        <p className='font-semibold'>
                                            <span>Delivery Boy Contact No: </span>{shopOrder.assignDeliveryBoy.mobile}
                                        </p>
                                    </div> : <p className='font-semibold'>Delivery Boy not Assigned yet.</p>
                                }
                            </> : <p className='text-green-600 font-semibold text-lg'>Delivered</p>
                        }
                        {
                        (shopOrder.assignDeliveryBoy && shopOrder.status!=="delivered") &&
                            <div className='h-100 w-full rounded-2xl overflow-hidden shadow-md'>
                                <DeliveryBoyTracking data={{
                                    deliveryBoyLocation: liveLocation[shopOrder.assignDeliveryBoy._id] || {
                                        lat: shopOrder.assignDeliveryBoy.location.coordinates[1],
                                        lon: shopOrder.assignDeliveryBoy.location.coordinates[0]
                                    },
                                    customerLocation:{
                                        lat: currentOrder.deliveryAddress.latitude,
                                        lon: currentOrder.deliveryAddress.longitude
                                    }
                                }}/>
                            </div>
                        }
                    </div>
                </div>
            ))
        }
    </div>
    )
}

export default TrackOrderPage

