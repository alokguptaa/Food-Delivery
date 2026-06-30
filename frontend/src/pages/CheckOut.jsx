import React, { useEffect, useState } from 'react'
import { IoIosArrowRoundBack } from "react-icons/io";
import { IoLocationSharp } from "react-icons/io5"; 
import { IoIosSearch } from "react-icons/io";
import { TbCurrentLocation } from "react-icons/tb";
import { FaMobileScreenButton } from "react-icons/fa6";
import { FaCreditCard } from "react-icons/fa";
import { MdDeliveryDining } from "react-icons/md";
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { MapContainer, Marker, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { setAddress, setLocation } from '../redux/mapSlice.js';
import axios from 'axios';
import { serverUrl } from './../App.jsx';
import { addMyOrder } from '../redux/userSlice.js';


const RecenterMap = ({ location }) => {
    const map = useMap();

    useEffect(() => {
        if (location?.lat != null && location?.lon != null) {
            map.setView(
                [location.lat, location.lon],
                16,
                { animate: true }
            );
        }
    }, [location, map]);

    return null;
};


const CheckOut = () => {

    const navigate = useNavigate();
    const dispatch = useDispatch();

    const {location, address} = useSelector(state => state.map)
    const { cartItems, totalAmount, userData } = useSelector(state => state.user)

    const [addressInput, setaddressInput] = useState("")
    const [paymentMethod, setpaymentMethod] = useState("cod")

    const apiKey = import.meta.env.VITE_GEOAPIKEY

    const deliveryFee = totalAmount > 500 ? 0 : 40
    const amountWithDeliveryFee = totalAmount + deliveryFee;

const onDragEnd = (e) => {
    const {lat, lng} = e.target._latlng
        dispatch(setLocation({
            lat, 
            lon:lng
        }))
    getAddressByLatLng(lat, lng)
}

const getCurrentLocation = () => {
    const latitude = userData.location.coordinates[1]
    const longitude = userData.location.coordinates[0]
    dispatch(setLocation({lat:latitude, lon:longitude}))
    getAddressByLatLng(latitude, longitude)
}


const getAddressByLatLng = async (lat, lng) => {
    try {
        const result = await axios.get(`https://api.geoapify.com/v1/geocode/reverse?lat=${lat}&lon=${lng}&format=json&apiKey=${apiKey}`)
        dispatch(setAddress(result?.data?.results[0].address_line1))
    } catch (error) {
        console.log(error)
    }
}   

const getLatLngByAddress = async () => {
    try {
        const result = await axios.get(`https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(addressInput)}&apiKey=${apiKey}`)
        const {lat, lon} = result.data.features[0].properties
        dispatch(setLocation({lat, lon}))
    } catch (error) {
        console.log(error)
    }
}

const handlePlaceOrder = async () => {
    try {
        const result = await axios.post(`${serverUrl}/api/order/place-order`,{
            paymentMethod,
            deliveryAddress:{
                text:addressInput,
                latitude:location.lat,
                longitude:location.lon
            },
            totalAmount: amountWithDeliveryFee,
            cartItems
        },{withCredentials:true})

        if(paymentMethod == "cod"){
            dispatch(addMyOrder(result.data))
            navigate("/order-placed")
        }else{
            const { orderId, razorOrder } = result.data;
            openRazorpayWindow(orderId, razorOrder)
        }

    } catch (error) {
        console.log("Error:", error);
        console.log(error.response?.data);
    }
}

const openRazorpayWindow = (orderId, razorOrder) => {

    const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount:razorOrder.amount,
        currency: "INR",
        name: "Vingo",
        description: "Food Delivery Website",
        order_id: razorOrder.id,
        handler: async function (response) {
            try {
                const result = await axios.post(`${serverUrl}/api/order/verify-payment`,{
                    razorpay_payment_id: response.razorpay_payment_id,
                    orderId
                },{withCredentials:true})
                    dispatch(addMyOrder(result.data))
                    navigate("/order-placed")

            } catch (error) {
                console.log(error)
                console.log(error.response?.data);
            }
        }
    }

    const rzp = new window.Razorpay(options)
    rzp.open()
}

useEffect(() =>{
    setaddressInput(address)
},[address])

return (
    <div className='min-h-screen bg-[#fff9f6] flex items-center justify-center p-6'>
        <div className='absolute top-5 left-5 z-2.5 cursor-pointer' onClick={() => navigate("/signin")}>
            <IoIosArrowRoundBack size={25} className='text-[#ff4d2d]'/>
        </div>
        <div className='w-full max-w-225 bg-white rounded-2xl shadow-xl p-6 space-y-6'>
            <h1 className='text-2xl font-bold text-gray-800'>
                Checkout
            </h1>
            <section>
                <h2 className='text-lg font-semibold mb-2 flex items-center gap-2 text-gray-800'>
                    <IoLocationSharp className='text-[#ff4d2d]'/> Delivery Location
                </h2>
                <div className='flex gap-2 mb-3'>
                    <input className='flex-1 border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#ff4d2d]' 
                        type="text" placeholder='Enter Your Delivery Address...' value={addressInput} onChange={(e) => setaddressInput(e.target.value)}/>
                    <button className='bg-[#ff4d2d] hover:bg-[#e64526] text-white px-3 py-2 rounded-lg flex items-center justify-center cursor-pointer' onClick={getLatLngByAddress}>
                        <IoIosSearch size={18}/>
                    </button>
                    <button className='bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg flex items-center justify-center cursor-pointer' onClick={getCurrentLocation}>
                        <TbCurrentLocation size={18}/>
                    </button>
                </div>
                <div className='rounded-xl border overflow-hidden'>
                    <div className='h-64 w-full flex items-center justify-center'>
                        <MapContainer className='w-full h-full' center={[location?.lat, location?.lon]} zoom={16}>
                            <TileLayer
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' 
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />
                            < RecenterMap location={location}/>
                            <Marker position={[location?.lat, location?.lon]} draggable eventHandlers={{dragend:onDragEnd}}/>
                            
                        </MapContainer>
                    </div>
                </div>
            </section>

            <section>
                <h2 className='text-lg font-semibold mb-3 text-gray-800'>
                    Payment Method
                </h2>
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                    <div className={`flex items-center rounded-xl border p-4 text-left transition 
                    ${ paymentMethod === "cod" ? "border-[#ff4d2d] bg-orange-50 shadow" : "border-gray-200 hover:border-gray-300"
                        }`} onClick={() => setpaymentMethod("cod")}>
                        <span className='inline-flex h-10 w-10 items-center justify-center rounded-full bg-green-100'>
                            <MdDeliveryDining className='text-gray-600 text-xl'/>
                        </span>
                        <div>
                            <p className='font-medium text-gray-800'>
                                Cash On Delivery
                            </p>
                            <p className='font-medium text-gray-500'>
                                Pay when your food arrives
                            </p>
                        </div>
                    </div>

                    <div className={`flex items-center rounded-xl border p-4 text-left transition 
                    ${ paymentMethod === "online" ? "border-[#ff4d2d] bg-orange-50 shadow" : "border-gray-200 hover:border-gray-300"
                        }`} onClick={() => setpaymentMethod("online")}>
                        <span className='inline-flex h-10 w-10 items-center justify-center rounded-full bg-purple-100'>
                            <FaMobileScreenButton className='text-purple-700 text-lg'/>
                        </span>
                        <span className='inline-flex h-10 w-10 items-center justify-center rounded-full bg-blue-100'>
                            <FaCreditCard className='text-blue-700 text-lg'/>
                        </span>
                        <div>
                            <p className='font-medium text-gray-800'>
                                UPI / Credit / Debit Card
                            </p>
                            <p className='font-medium text-gray-500'>
                                Pay Securely Online
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            <section>
                <h2 className='text-lg font-semibold mb-3 text-gray-800'>
                    Order Summary
                </h2>
                <div className='rounded-xl border bg-gray-50 p-4 space-y-2'>
                    {cartItems.map((item, index) => (
                        <div key={index} className='flex justify-between text-sm text-gray-700'>
                            <span>
                                {item.name} x {item.quantity}
                            </span>
                            <span>
                                ₹{item.price*item.quantity}
                            </span>
                        </div>
                    ))}
                    <hr className='border-gray-200 my-2'/>
                    <div className='flex justify-between font-medium text-gray-800'>
                        <span>
                            SubTotal
                        </span>
                        <span>
                            ₹{totalAmount}
                        </span>
                    </div>
                    <div className='flex justify-between text-gray-700'>
                        <span>
                            Delivery Fee
                        </span>
                        <span>
                            {deliveryFee == 0 ? "Free" : deliveryFee}
                        </span>
                    </div>
                    <div className='flex justify-between text-lg font-bold text-[#ff4d2d] pt-2'>
                        <span>
                            Total
                        </span>
                        <span>
                            ₹{amountWithDeliveryFee}
                        </span>
                    </div>
                </div>
            </section>

            <button className='w-full bg-[#ff4d2d] hover:bg-[#e64526] text-white py-3 rounded-xl font-semibold cursor-pointer' onClick={handlePlaceOrder}>
                {paymentMethod == "cod" ? "Place Order" : "Pay & Place Order"}
            </button>
        </div>
    </div>
    )
}

export default CheckOut;

