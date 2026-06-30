import React, { useState, useEffect } from 'react'
import { MdPhone } from "react-icons/md";
import { serverUrl } from './../App.jsx';
import  axios  from 'axios';
import { useDispatch } from 'react-redux';
import { removeOrder, updateOrderStatus } from '../redux/userSlice.js';
import { socket } from '../socket.js';
import { EVENTS } from '../socket/events.js';


const OwnerOrderCard = ({data}) => {

    const [availableBoys, setavailableBoys] = useState([])
    const [statusMessage, setstatusMessage] = useState("")
    const dispatch = useDispatch()

    useEffect(() => {
    const handleOrderDeleted = (data) => {
        dispatch(removeOrder(data.orderId));
    };

    socket.on(EVENTS.ORDER_DELETED, handleOrderDeleted);

    return () => {
        socket.off(EVENTS.ORDER_DELETED, handleOrderDeleted);
    };
}, [dispatch]);

    const handleUpdateStatus = async (orderId, shopId, status) => {
        
        try {
            const result = await axios.post(`${serverUrl}/api/order/update-status/${orderId}/${shopId}`,
                {status}, {withCredentials:true})
                dispatch(updateOrderStatus({orderId, shopId, status}))
                setavailableBoys(result?.data?.availableBoys || [])

        } catch (error) {
            console.log(error.response?.data);
            console.log(error)
        }
    }

    useEffect(() => {
    const handleDeliveryBoyStatus = ({ userId, isOnline }) => {

        if (!isOnline) {
            setavailableBoys(prev =>
                prev.filter(
                    boy => String(boy.id) !== String(userId)
                )
            );
        }

    };

    socket.on(EVENTS.DELIVERY_BOY_STATUS_CHANGED, handleDeliveryBoyStatus);

    return () => {
        socket.off(EVENTS.DELIVERY_BOY_STATUS_CHANGED, handleDeliveryBoyStatus);
    };

}, []);
    if (!data) return null;

return (
    <div className='bg-white rounded-lg shadow p-4 space-y-4'>
        <div>
            <h2 className='text-lg font-semibold text-gray-800'>
                {data?.user?.fullname}
            </h2>
            <p className='text-sm text-gray-500'>
                {data?.user?.email}
            </p>
            <p className='flex items-center gap-2 text-sm text-gray-600 mt-1'>
                <MdPhone />
                <span>
                    {data?.user?.mobile}
                </span>
            </p>
            {
                data.paymentMethod == "online" ? 
                    <p className='flex items-center gap-2 text-sm text-gray-600 mt-1'>payment: {data.payment ? "true" : "false"} </p> 
                : 
                    <p className='flex items-center gap-2 text-sm text-gray-600 mt-1'>payment: {data.paymentMethod}</p>
            }
        </div>

        <div className='flex items-start flex-col gap-2 text-gray-600 text-sm'>
            <p>
                {data?.deliveryAddress?.text}
            </p>
            <p className='text-xs text-gray-500'>
                Lat: {data?.deliveryAddress?.latitude}, Lon: {data?.deliveryAddress?.longitude}
            </p>
        </div>

        <div className='flex space-x-4 overflow-x-auto pb-2'>
            {data?.shopOrders?.shopOrderItems.map((item, index) => (
                <div key={index} className='shrink-0 w-40 border rounded-lg p-2 bg-white'>
                    <img src={item?.item?.image} alt="" className='w-full h-24 object-cover rounded'/>
                    <p className='text-m font-semibold mt-1'>
                        {item?.name}
                    </p>
                    <p className='text-sm text-gray-500'>
                        Qty{item?.quantity} x ₹{item?.price}
                    </p>
                </div>
            ))}
        </div>

        <div className='flex justify-between items-center mt-auto border-t border-gray-100'>
            <span className='text-sm'>
                status: <span className='font-semibold capitalize text-[#ff4d2d]'>
                    {data?.shopOrders?.status}
                    </span>
                </span>
                <select className='rounded-md border px-3 py-1 text-sm focus:outline-none focus:ring-2 border-[#ff4d2d] text-[#ff4d2d] cursor-pointer' 
                onChange={(e) => handleUpdateStatus(data._id, data.shopOrders.shop._id, e.target.value)}
                onClick={() => {
                    if(data.shopOrders.status === "delivered"){
                        setstatusMessage("Delivered order status cannot be changed")
                    }else{
                        setstatusMessage("")
                    }
                }}>
                    <option value="">Change</option>
                    <option value="pending">Pending</option>
                    <option value="preparing">Preparing</option>
                    <option value="out of delivery">Out of delivery</option>
                </select>
            </div>
            {statusMessage && (
                    <p className='mt-2 text-xl text-red-500'>
                        {statusMessage}
                    </p>
                )}
            {
            data.shopOrders.status === "out of delivery" && 
            <div className='mt-3 p-2 border rounded-lg text-m text-gray-700 bg-orange-50 gap-4'>
                {
    data.shopOrders.assignDeliveryBoy ? (
        <>
            <p>Assigned Delivery Boy:</p>

            <div className="text-gray-800">
                {data.shopOrders.assignDeliveryBoy?.fullname} - {data.shopOrders.assignDeliveryBoy?.mobile}
            </div>
        </>
    ) : (
        <>
            <p>Available Delivery Boys:</p>

            {availableBoys?.length > 0 ? (
                availableBoys.map((b) => (
                    <div key={b.id} className="text-gray-800">
                        {b.fullName} - {b.mobile}
                    </div>
                ))
            ) : (
                <div>Waiting for delivery boy to accept</div>
            )}
        </>
    )
}
            </div>
        }
        <div className='text-right font-bold text-gray-800 text-sm'>
            Total: ₹{data.shopOrders.subtotal} 
        </div>
    </div>
    )
}

export default OwnerOrderCard;

