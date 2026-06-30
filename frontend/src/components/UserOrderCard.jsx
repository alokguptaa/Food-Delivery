import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { serverUrl } from '../App'
import axios from 'axios'
import { updateItemRating } from '../redux/userSlice'
import { updateOwnerItemRating } from '../redux/ownerSlice'
import { useDispatch } from 'react-redux';

const UserOrderCard = ({data}) => {

    const navigate = useNavigate()
    const dispatch = useDispatch()

    const [selectedRating, setselectedRating] = useState({})


    const formatDate = (dateString) => {
        if(!dateString) return ""
        const date = new Date (dateString)
        return date.toLocaleString('en-GB', {
            day: "2-digit",
            month: "short",
            year: "numeric"
        })
    }

    const handleRating = async (itemId, rating) => {
        try {
            const result = await axios.post(`${serverUrl}/api/item/rating`,{itemId, rating},
                {withCredentials: true})
                setselectedRating(prev => ({
                    ...prev, [itemId]: rating
                }))
                dispatch(updateItemRating({
                    itemId,
                    rating: result.data.rating
                }));
        
                dispatch(updateOwnerItemRating({
                    itemId,
                    rating: result.data.rating
                }));
        } catch (error) {
            console.log(error)
        }
    }

    const deleteOrder = async () => {
    try {
        const result = await axios.delete(
            `${serverUrl}/api/order/delete-order/${data._id}`,
            {
                withCredentials: true
            }
        );
            console.log(result)
        window.location.reload();
        } catch (error){
            console.log(error);
        }
    };

    const shopOrders = Array.isArray(data?.shopOrders)
    ? data.shopOrders : data?.shopOrders ? [data.shopOrders] : [];

return (
    <div className='bg-white rounded-lg shadow p-4 space-y-4'>
        <div className='flex justify-between border-b pb-2'>
            <div>
                <p className='font-semibold'>
                    order #{data?._id ? data._id.slice(-6) : "-------"}
                </p>
                <p className='text-sm text-gray-500'>
                    Date: {data?.createdAt ? formatDate(data.createdAt) : ""}
                </p>
            </div>
            <div className='text-right'>
                {
                    data.paymentMethod == "cod" ? 
                        <p className='text-sm text-gray-500'>
                    {data.paymentMethod?.toUpperCase()}
                </p>
                :
                <p className='text-sm text-gray-500 font-semibold'>
                    Payment: {data.payment ? "true" : "false"}
                </p>
                }
                <p className='font-medium text-blue-600'>
                    {data.shopOrders?.[0]?.status}
                </p>
            </div>
        </div>

        {shopOrders.map((shopOrder, index) => (
            <div className='border rounded-lg p-3 bg-[#fffaf7] space-y-3' key={index}>
                <p>
                    {shopOrder?.shop?.name}
                </p>
                <div className='flex space-x-4 overflow-x-auto pb-2'>
                    {shopOrder?.shopOrderItems?.map((item, index) => (
                        <div key={index} className='shrink-0 w-40 border rounded-lg p-2 bg-white'>
                            <img src={item?.item?.image} alt="" className='w-full h-24 object-cover rounded'/>
                            <p className='text-m font-semibold mt-1'>
                                {item.name}
                            </p>
                            <p className='text-sm text-gray-500'>
                                Qty{item.quantity} x ₹{item.price}
                            </p>
                            {
                                shopOrder.status == "delivered" && 
                                <div className='flex space-x-1 mt-2'>
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button className={`text-lg ${selectedRating[item.item._id] >= star ? `text-yellow-400` : `text-gray-400`} cursor-pointer`} 
                                            onClick={() => handleRating(item.item._id, star)}>
                                            ★
                                        </button>
                                    ))}
                                </div>
                            }
                        </div>
                    ))}
                </div>
                <div className='flex justify-between items-center border-t pt-2'>
                    <p className='font-semibold'>
                        Subtotal: ₹{shopOrder.subtotal}
                    </p>
                    <span className='text-sm font-medium text-blue-600'>
                        {shopOrder?.status}
                    </span>
                </div>
            </div>
        ))}
        <div className='flex justify-between items-center border-t pt-2'>
            <p className='font-semibold'>
                Total: ₹{data.totalAmount}
            </p>
            <div className='flex gap-2'>
                {shopOrders.every(
                so =>
                    so.status !== "out of delivery" &&
                    so.status !== "delivered"
                ) && (
                    <button className='bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm cursor-pointer' onClick={deleteOrder}>
                        Delete
                    </button>
                )}
                    <button className='bg-[#ff4d2d] hover:bg-[#e64526] text-white px-4 py-2 rounded-lg text-sm cursor-pointer' onClick={() => navigate(`/track-order/${data._id}`)}>
                        Track Order
                    </button>
            </div>
        </div>
    </div>
    )
}

export default UserOrderCard;

