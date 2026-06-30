import React, { useState, useEffect } from 'react'
import Nav from './Nav.jsx';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { serverUrl } from '../App.jsx';
import DeliveryBoyTracking from './DeliveryBoyTracking.jsx';
import { socket } from "../socket";
import { EVENTS } from '../socket/events.js';
import { Bar, BarChart, CartesianGrid, Label, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ClipLoader } from 'react-spinners';

const DeliveryBoy = () => {

  const {userData} = useSelector(state => state.user)

  const [currentOrder, setcurrentOrder] = useState()
  const [availableAssignments, setavailableAssignments] = useState([])
  const [showOtpBox, setshowOtpBox] = useState(false)
  const [otp, setotp] = useState("")
  const [todayDeliveries, settodayDeliveries] = useState([])
  const [deliveryBoyLocation, setdeliveryBoyLocation] = useState({
    lat: userData?.location?.coordinates?.[1] || 0,
  lon: userData?.location?.coordinates?.[0] || 0,
  })
  const [loading, setloading] = useState(false)
  const [message, setmessage] = useState("")

  useEffect(() => {
  if (!userData?._id || userData.role !== "deliveryBoy") return;

  const watchId = navigator.geolocation.watchPosition(
    (position) => {
      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;

      setdeliveryBoyLocation({
        lat: latitude,
        lon: longitude,
      });

      socket.emit(EVENTS.UPDATE_DELIVERY_LOCATION, {
        latitude,
        longitude,
        userId: userData._id,
      });
    },
    (error) => {
      console.log(error);
    },
    {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 5000,
    }
  );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [userData?._id, userData.role]);

  
  const ratePerDelivery = 40
  const totalEarning = todayDeliveries.reduce((sum, d) => sum + d.count*ratePerDelivery, 0)

  const getAssignments = async () => {
    try {
      const result = await axios.get(`${serverUrl}/api/order/get-assignments`,
        {withCredentials:true})
        setavailableAssignments(result.data)
    } catch (error) {
    console.log(error);
    }
  };

  const getCurrentOrder = async () => {
    try {
      const result = await axios.get(`${serverUrl}/api/order/get-current-order`,
        {withCredentials:true})
        setcurrentOrder(result.data)
    } catch (error) {
      if (error.response?.status === 400) {
        setcurrentOrder(null);
        return;
    }
      console.log(error)
    }
  }

  const acceptOrder = async (assignmentId) => {
    try {
      const result = await axios.get(`${serverUrl}/api/order/accept-order/${assignmentId}`,
        {withCredentials:true})
        setavailableAssignments(result.data)
        console.log(result.data)
        await getCurrentOrder()
    } catch (error) {
      console.log(error)
    }
  }

  const sendOtp = async () => {
    setloading(true)
    try {
      const result = await axios.post(`${serverUrl}/api/order/send-delivery-otp`,{
        orderId:currentOrder._id, shopOrderId:currentOrder.shopOrder._id
      },
        {withCredentials:true})
        setloading(false)
        setshowOtpBox(true)
        console.log(result.data)
    } catch (error) {
      console.log(error)
      loading(false)
    }
  }

  const verifyOtp = async () => {
      setmessage("")
    try {
      const result = await axios.post(`${serverUrl}/api/order/verify-delivery-otp`,{
        orderId:currentOrder._id, shopOrderId:currentOrder.shopOrder._id, otp
      },
        {withCredentials:true})
        setshowOtpBox(false)
        setmessage(result.data.message)
        location.reload()
    } catch (error) {
      console.log(error)
    }
  }

  const handleTodayDeliveries = async () => {
    try {
      const result = await axios.get(`${serverUrl}/api/order/get-order-deliveries`,
        {withCredentials:true})
        settodayDeliveries(result.data)
    } catch (error) {
      console.log(error)
    }
  }

  useEffect(() => {
  const handleNewAssignment = (data) => {
    if (data.sentTo == userData._id) {
      setavailableAssignments(prev => [...prev, data]);
    }
  };

  socket.on(EVENTS.ORDER_STATUS, handleNewAssignment);

  return () => {
    socket.off(EVENTS.ORDER_STATUS, handleNewAssignment);
  };
}, [userData?._id]);

  useEffect(() => {
  const handleDelivered = async () => {
    setshowOtpBox(false);
    setotp("");

    await Promise.all([
      getCurrentOrder(),
      getAssignments(),
      handleTodayDeliveries()
    ]);
  };

  socket.on(EVENTS.ORDER_DELIVERED, handleDelivered);

  return () => {
    socket.off(EVENTS.ORDER_DELIVERED, handleDelivered);
  };
}, []);

    useEffect(() => {

    const handleOrderAccepted = ({ assignmentId, acceptedBy }) => {

        if (acceptedBy === userData._id) return;

        setavailableAssignments(prev =>
            prev.filter(order => order.assignmentId !== assignmentId)
        );
    };

    socket.on(EVENTS.ORDER_ACCEPTED, handleOrderAccepted);

    return () => {
        socket.off(EVENTS.ORDER_ACCEPTED, handleOrderAccepted);
    };

}, [userData]);

  useEffect(() => {
    const fetchData = async () => {
    await getAssignments();
    await getCurrentOrder();
    await handleTodayDeliveries();
      };
  fetchData();
  },[userData]);

return (
  <div className='w-screen min-h-screen flex flex-col gap-5 items-center bg-[#fff9f6] overflow-auto'>
      < Nav />
      <div className='w-full max-w-200 flex flex-col gap-5 items-center'>
        <div className='bg-white rounded-2xl shadow-md p-5 flex flex-col justify-start items-center w-[90%] border border-orange-100 text-center gap-2'>
          <h1 className='text-xl font-bold text-[#ff4d2d]'>
            Welcome, {userData?.fullname}
          </h1>
          <p className='text-[#ff4d2d]'>
            <span className='font-semibold'>Latitude:</span> {" "} {deliveryBoyLocation.lat ?? userData?.location?.coordinates?.[1]}, 
            <span className='font-semibold'>Longitude:</span> {" "} {deliveryBoyLocation.lon ?? userData?.location?.coordinates?.[0]}
          </p>
        </div>
      <div className='bg-white rounded-2xl shadow-md p-5 w-[90%] mb-6 border border-orange-100 '>
        <h1 className='text-lg font-bold mb-3 text-[#ff4d2d]'>
          Today Deliveries
        </h1>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={todayDeliveries} >
            <CartesianGrid strokeDasharray="3 3"/>
            <XAxis dataKey="hour" tickFormatter={(h) => `${h}:00`}/>
            <YAxis allowDecimals={false}/>
            <Tooltip formatter={(value) => {value, "orders"}} labelFormatter={(Label) => `${Label} : 00`}/>
            <Bar dataKey="count" fill='#ff4d2d' />
          </BarChart>
        </ResponsiveContainer>
        <div className='max-w-sm mx-auto mt-6 p-6 bg-white rounded-2xl shadow-lg text-center'>
          <h1 className='text-xl font-semibold text-gray-800 mb-2'>
            Total Todays Earning
          </h1>
          <span className='text-3xl font-bold text-green-600'>
            ₹{totalEarning}
          </span>
        </div>
      </div>
      {
      !currentOrder &&
        <div className='bg-white rounded-2xl p-5 shadow-md w-[90%] border border-orange-100'>
          <h1 className='text-lg font-bold mb-4 items-center gap-2'>
            Available Orders
          </h1>
          <div className='space-y-4'>
            {availableAssignments.length > 0 ? 
              (
                availableAssignments.map((a, index) => (
                  <div className='border rounded-lg p-4 flex justify-between items-center' key={index}>
                    <div>
                      <p className='text-sm font-semibold'>
                        {a.shopName}
                      </p>
                      <p className='text-sm text-gray-500'>
                        Shop Address- <span className='text-orange-500'>{a.shopAddress}, {a.shopCity}, {a.shopState}</span>
                      </p>
                      <p className='text-sm text-gray-500'>
                        Shopkeeper Name- <span className='text-orange-500'>{a.fullname}</span>
                      </p>
                      <p className='text-sm text-gray-500'>
                        Shopkeeper Mobile No- <span className='text-orange-500'>{a.mobile}</span>
                      </p>
                      <p className='text-sm text-gray-500'>
                        <span className='font-semibold'>Delivery Address:</span> {a?.deliveryAddress.text}
                      </p>
                      <p className='text-xs text-gray-400'>
                        {a.items.length} items | ₹ {a.subtotal}
                      </p>
                    </div>
                    <button className='bg-orange-500 text-white px-4 py-1 rounded-lg text-sm hover:bg-orange-600 cursor-pointer' onClick={() => acceptOrder(a.assignmentId)}>
                      Accept
                    </button>
                  </div>
                ))
              ) : <p className='text-gray-400 text-sm'>No Available Orders</p>
            }
          </div>
        </div>
      }
      {
        currentOrder &&
        <div className='bg-white rounded-2xl p-5 shadow-md w-[90%] border border-orange-100'>
          <h2 className='text-lg font-bold mb-3'>
            📦 Current Order 
          </h2>
          <div className='border rounded-lg p-4 mb-3'>
            <p className='font-semibold text-sm'>
              {currentOrder?.shopOrder?.shop}
            </p>
            <p className='text-sm text-gray-500'>
              Customer Address- <span className='text-orange-500'>{currentOrder?.deliveryAddress.text}</span>
            </p>
            <p className='text-sm text-gray-500'>
              Customer Name- <span className='text-orange-500'>{currentOrder?.user.fullname}</span>
            </p>
            <p className='text-sm text-gray-500'>
              Customer Mobile No- <span className='text-orange-500'>{currentOrder?.user.mobile}</span>
            </p>
            <p className='text-xs text-gray-400'>
              {currentOrder?.shopOrder?.shopOrderItems.length} items | ₹{currentOrder?.shopOrder?.subtotal}
            </p>
          </div>

          < DeliveryBoyTracking data={{
            deliveryBoyLocation: deliveryBoyLocation || {
              lat: userData.location.coordinates[1],
              lon: userData.location.coordinates[0]
                },
              customerLocation:{
                lat: currentOrder.deliveryAddress.latitude,
                lon: currentOrder.deliveryAddress.longitude
              }
          }} />
          {!showOtpBox ? 
            <button className='mt-4 w-full bg-gray-500 text-white font-semibold py-2 px-4 rounded-xl shadow-md hover:bg-green-600 active:scale-95 transition-all duration-200 cursor-pointer'
              onClick={sendOtp} disabled={loading}
            >
              {loading ? <ClipLoader size={20} color='white'/> : "Mark As Delivered"}
            </button>
            : 
            <div className='t-4 p-4 border rounded-xl bg-gray-50'>
              <p className='text-sm font-semibold mb-2'>
                Enter Otp send to <span className='text-orange-500'>{currentOrder?.user.fullname}</span>
              </p>
              <input type="text" placeholder='Enter OTP' className='w-full border px-3 py-2 rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-orange-400' 
                onChange={(e) => setotp(e.target.value)} value={otp}
              />
              {message && <p className='text-center text-gray-400'>{message}</p>}
              <button className='w-full bg-orange-500 text-white py-2 rounded-lg font-semibold hover:bg-orange-600 transition-all cursor-pointer' onClick={verifyOtp}>
                Submit Otp
              </button>
            </div>
          }
        </div>
      }
      </div>
  </div>
  )
}

export default DeliveryBoy

