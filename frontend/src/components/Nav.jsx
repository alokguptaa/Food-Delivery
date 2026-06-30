import React, { useState, useEffect, useCallback } from 'react';
import { FaLocationDot } from "react-icons/fa6";
import { IoIosSearch } from "react-icons/io";
import { FiShoppingCart } from "react-icons/fi";
import { RxCross2 } from "react-icons/rx";
import { FaPlus } from "react-icons/fa";
import { TbReceiptRupeeFilled } from "react-icons/tb";
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import { serverUrl } from './../App';
import { setSearchItems, setUserData } from '../redux/userSlice';
import { useNavigate } from 'react-router-dom';
import NotificationBell from './Notification';
import { socket } from '../socket.js';



const Nav = () => {

    const {userData, currentCity, cartItems, MyOrders} = useSelector(state => state.user)
    const {myShopData} = useSelector(state => state.owner)
    const [showinfo, setshowinfo] = useState(false)
    const [showsearch, setshowsearch] = useState(false)
    const [query, setquery] = useState("")

    const dispatch = useDispatch()
    const navigate = useNavigate()

    const pendingOrdersCount = MyOrders.filter(order => {
    const shopOrder = Array.isArray(order.shopOrders)
        ? order.shopOrders[0]
        : order.shopOrders;

        return shopOrder?.status !== "out of delivery"  && shopOrder?.status !== "delivered";
    }).length;

    const handleLogOut = async () => {
        try {
            await axios.post(`${serverUrl}/api/auth/signOut`,{},
                {withCredentials:true})
                socket.disconnect(); 
            dispatch(setUserData(null)
            )
        } catch (error) {
            console.log(error)
        }
    }

    const handleSearchItems = useCallback(async () => {
        if (!query.trim() || !currentCity) return;
        try {
            const result = await axios.get(`${serverUrl}/api/item/search-items?query=${query}&city=${currentCity}`,
                {withCredentials:true}
            );
            dispatch(setSearchItems(result.data))
            console.log(result.data)
        } catch (error) {
            console.log(error)
        }
    },[query, currentCity,dispatch])

    useEffect(() => {
        if(query.trim() && currentCity){
            handleSearchItems()
        }else{
            dispatch(setSearchItems([]))
        }
    },[handleSearchItems, query, currentCity, dispatch])


return (
        <div className='fixed top-0 left-0 w-full flex items-center justify-between md:justify-center bg-[#fff9f6] h-20 z-50 px-5 gap-7.5'>
            {
            showsearch && userData?.role==="user" && 
                <div className='w-[90%] h-17.5 bg-white shadow-xl rounded-lg flex items-center md:hidden fixed top-20 left-[5%]'>
                    <div className='flex items-center flex-[0.4] min-w-0 overflow-hidden gap-2.5 px-2.5 border-r border-gray-400'>
                        <FaLocationDot size={25} className="text-[#ff4d2d]" />
                        <div className='truncate text-gray-600'>{currentCity}</div>
                    </div>
                    <div className='flex flex-[0.6] items-center gap-0 px-1'>
                        <IoIosSearch size={25} className="text-[#ff4d2d]" />
                        <input 
                            type='text'
                            placeholder='Search delicious food...'
                            className='px-2.5 text-gray-700 outline-0 w-full'
                            onChange={(e) => setquery(e.target.value)} value={query}/>
                    </div>
                </div>
            }
            <h1 className='text-3xl font-bold mb-2 text-[#ff4d2d]'>Vingo</h1>

            {userData?.role==="user" && 
                <div className='md:w-[65%] lg:w-[60%] h-17.5 bg-white shadow-xl rounded-lg items-center gap-5 hidden md:flex'>
                    <div className='flex items-center w-[35%] min-w-[35%] overflow-hidden gap-2.5 px-2.5 border-r border-gray-400'>
                        <FaLocationDot size={25} className="text-[#ff4d2d]"/>
                        <div className='w-[80%] truncate text-gray-600'>{currentCity}</div>
                    </div>
                    <div className='w-[90%] flex items-center gap-2.5'>
                        <IoIosSearch size={25} className="text-[#ff4d2d]" onClick={() => setshowsearch(true)}/>
                        <input type='text' placeholder='Search delicious food...' className='px-2.5 text-gray-700 outline-0 w-full' onChange={(e) => setquery(e.target.value)} value={query} />
                    </div>
                </div>
            }
            

            <div className='flex items-center gap-4'>
                {userData?.role==="user" && 
                    (showsearch?<RxCross2 size={25} className="text-[#ff4d2d] md:hidden" onClick={() => setshowsearch(false)}/>:<IoIosSearch size={25} className="text-[#ff4d2d] md:hidden" onClick={() => setshowsearch(true)}/>)
                }

                {userData?.role==="owner" ?
                <>
                    {myShopData && 
                    <>
                        <button className='hidden md:flex items-center gap-1 p-2 cursor-pointer rounded-full bg-[#ff4d2d]/10 text-[#ff4d2d]' onClick={() => navigate("/add-item")}>
                            <FaPlus size={25} />
                            <span>Add Food Item</span>
                        </button>
                        <button className='md:hidden flex items-center p-2 cursor-pointer rounded-full bg-[#ff4d2d]/10 text-[#ff4d2d]' onClick={() => navigate("/add-item")}>
                            <FaPlus size={25} />
                        </button>
                    </>
                    }
                    
                        <div className='hidden md:flex items-center gap-2 cursor-pointer relative px-3 py-1 rounded-lg bg-[#ff4d2d]/10 text-[#ff4d2d] font-medium' onClick={() => navigate("/my-orders")} >
                            <TbReceiptRupeeFilled size={25}/>
                            <span>My Orders</span>
                            <span className='absolute -right-2 -top-2 text-xs font-bold text-white bg-[#ff4d2d] rounded-full px-1.5 py-1'>{pendingOrdersCount}</span>
                        </div>

                        <div className='md:hidden flex items-center gap-2 cursor-pointer relative px-3 py-1 rounded-lg bg-[#ff4d2d]/10 text-[#ff4d2d] font-medium' onClick={() => navigate("/my-orders")} >
                            <TbReceiptRupeeFilled size={25}/>
                            <span className='absolute -right-2 -top-2 text-xs font-bold text-white bg-[#ff4d2d] rounded-full px-1.5 py-.25'>{pendingOrdersCount}</span>
                        </div>
                    </>
                : (
                    <>
                    {userData?.role == "user" && <NotificationBell /> &&
                        <div className='relative cursor-pointer' onClick={() => navigate("/cart")}>
                            <FiShoppingCart size={20} className='text-[#ff4d2d]'/>
                            <span className='absolute -right-2.25 -top-3 text-[#ff4d2d]'>{cartItems.length}</span>
                        </div>   
                    }
                    <button className='hidden md:block px-3 py-1 rounded-lg bg-[#ff4d2d]/10 text-[#ff4d2d] text-sm font-medium cursor-pointer ' onClick={() => navigate("/my-orders")}>
                        My Orders
                    </button>
                    </>
                )}

                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#ff4d2d]/10 text-[#ff4d2d] cursor-pointer">
                    <NotificationBell />
                </div>

                <div className='w-10 h-10 rounded-full md:flex flex items-center justify-center bg-[#ff4d2d] text-white text-xl shadow-xl font-semibold cursor-pointer' onClick={() => setshowinfo(prev => !prev)}>
                    {userData?.fullname?.slice(0,1)}
                </div>

                {showinfo &&
                    <div className=' fixed top-20 md:w-[95%] lg:w-[11%] w-45 bg-white shadow-2xl rounded-xl p-5 flex flex-col gap-2.5 z-9999'>
                        <div className='text-4 font-semibold'>{userData?.fullname}</div>
                    {userData.role === "user" &&     
                        <div className='md:hidden text-[#ff4d2d] font-semibold  cursor-pointer' onClick={() => navigate("/my-orders")}>My Orders</div>
                    } 
                        <div className='text-[#ff4d2d] font-semibold cursor-pointer' onClick={handleLogOut}>LogOut</div>  
                    </div>
                }
            </div>
        </div>
    )
}

export default Nav;

