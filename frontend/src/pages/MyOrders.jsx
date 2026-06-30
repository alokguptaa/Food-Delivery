import React from 'react'
import { IoIosArrowRoundBack } from "react-icons/io";
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import UserOrderCard from './../components/UserOrderCard.jsx';
import OwnerOrderCard from '../components/OwnerOrderCard.jsx';
const MyOrders = () => {

    const {userData, MyOrders } = useSelector(state => state.user)

    const navigate = useNavigate();

return (
    <div className='w-full min-h-screen bg-[#fff9f6] flex justify-center px-4'>
        <div className='w-full max-w-220 p-4'>

            <div className='flex items-center gap-5 mb-6'>
                <div className='z-2.5 cursor-pointer' onClick={() => navigate("/signin")}>
                    <IoIosArrowRoundBack size={25} className='text-[#ff4d2d]'/>
                </div>
                <h1 className='text-2xl font-bold text-start'>
                    My Orders
                </h1>
            </div>
            

            <div className='space-y-6'>
                {MyOrders?.map((order, index) => (
                    
                    userData.role === "user" ? (
                        < UserOrderCard data={order} key={index}/>
                    ) 
                    : 
                    userData.role === "owner" ? (
                        < OwnerOrderCard data={order} key={index}/>
                    ) : null
                ))}
            </div>
        </div>
    </div>
    )
}

export default MyOrders;

