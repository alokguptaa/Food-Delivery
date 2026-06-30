import React, { useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { addMyOrder, setUserData } from './redux/userSlice.js';

import SignUp from './pages/SignUp.jsx';
import SignIn from './pages/SignIn.jsx';
import Forgotpassword from './pages/Forgotpassword.jsx';
import AddItem from "./pages/AddItem.jsx"
import Home from './pages/Home.jsx';
import CreateEditShop from './pages/CreateEditShop.jsx';
import EditItem from './pages/EditItem.jsx';
import CartPage from './pages/CartPage.jsx';
import CheckOut from './pages/CheckOut.jsx';
import OrderPlaced from './pages/OrderPlaced.jsx';
import MyOrders from './pages/MyOrders.jsx';
import TrackOrderPage from './pages/TrackOrderPage.jsx';
import Shop from './pages/Shop.jsx';

import useGetCurrentUser from './hooks/useGetCurrentUser.jsx';
import useGetShopByCity from './hooks/useGetShopByCity.jsx';
import useGetItemsByCity from './hooks/useGetItemsByCity.jsx';
import useGetCity from './hooks/useGetCity.jsx';
import useGetMyShop from './hooks/useGetMyShop.jsx';
import useGetMyOrders from './hooks/useGetMyOrders.jsx';
import useUpdateLocation from './hooks/useUpdateLocation.jsx';
import useGetNotifications from './hooks/useGetNotification.jsx';

import { socket } from "./socket";
import { EVENTS } from './socket/events.js';
import { updateItemRating } from './redux/userSlice.js';
import { updateOwnerItemRating } from './redux/ownerSlice.js';
import { addNotification } from "./redux/notificationSlice.js";
import { updateAssignedDeliveryBoy, updateRealtimeOrderStatus } from './redux/userSlice.js';


export const serverUrl = "https://food-delivery-2jxx.onrender.com"

const App = () => {

    const {userData, currentCity} = useSelector(state => state.user)
    const dispatch = useDispatch()

    useGetCurrentUser()
    useUpdateLocation()
    useGetCity()
    useGetMyShop()
    useGetShopByCity()
    useGetItemsByCity()
    useGetMyOrders()
    useGetNotifications()


useEffect(() => {
    if (!userData) return;
    const handleUpdateStatus = ({ orderId, shopId, status }) => {
        dispatch(updateRealtimeOrderStatus({orderId, shopId, status})
        );
    }
    const handleOrderDelivered = ({ orderId, shopId, status }) => {
        dispatch(updateRealtimeOrderStatus({
            orderId,
            shopId,
            status
        }));
    };

    const handleDeliveryBoyAccepted = (data) => {
        dispatch(updateAssignedDeliveryBoy(data));
    }; 
    
    const handleNewOrder = (order) => {
        if (
            userData.role === "owner" &&
            order.shopOrders.owner?._id === userData._id
        ) {
            dispatch(addMyOrder(order));
        }
        if (
            userData.role === "user" &&
            order.user?._id === userData._id
        ) {
            dispatch(addMyOrder(order));
        }
    };
    
    socket.on(EVENTS.ORDER_NEW, handleNewOrder);
    socket.on(EVENTS.ORDER_STATUS, handleUpdateStatus);
    socket.on(EVENTS.DELIVERY_ACCEPTED, handleDeliveryBoyAccepted);
    socket.on(EVENTS.ORDER_DELIVERED, handleOrderDelivered);

    return () => {
        socket.off(EVENTS.ORDER_NEW, handleNewOrder);
        socket.off(EVENTS.ORDER_STATUS, handleUpdateStatus);
        socket.off(EVENTS.DELIVERY_ACCEPTED, handleDeliveryBoyAccepted);
        socket.off(EVENTS.ORDER_DELIVERED, handleOrderDelivered);
        };
    },[userData?._id, userData?.role, dispatch, userData]);

    useEffect(() => {
    const handleItemRated = ({ itemId, rating }) => {

        dispatch(updateItemRating({
            itemId,
            rating
        }));

        dispatch(updateOwnerItemRating({
            itemId,
            rating
        }));
    };

    socket.on(EVENTS.ITEM_RATED, handleItemRated);

    return () => {
        socket.off(EVENTS.ITEM_RATED, handleItemRated);
    };
}, [dispatch]);

useEffect(() => {
    const handleNotification = (notification) => {
        dispatch(addNotification(notification));
    };

    socket.on(EVENTS.NEW_NOTIFICATION, handleNotification);

    return () => {
        socket.off(EVENTS.NEW_NOTIFICATION, handleNotification);
    };
}, [dispatch]);


useEffect(() => {
    if (!userData?._id) return;

    socket.connect();

    const handleConnect = () => {
        socket.emit(
            "identity",
            { userId: userData._id },
            (updatedUser) => {
                dispatch(setUserData(updatedUser));
            }
        );
        socket.emit(EVENTS.JOIN_CITY, currentCity);
    };

    if (socket.connected) {
        handleConnect();
    } else {
        socket.once("connect", handleConnect);
    }

    return () => {
        socket.off("connect", handleConnect);
    };
}, [userData?._id, dispatch, currentCity]);



return (
    <Routes>
        <Route path='/signup' element={!userData?<SignUp/>:<Navigate to={"/"}/>} />
        <Route path='/signin' element={!userData?<SignIn/>:<Navigate to={"/"}/>} />
        <Route path='/forgot-password' element={!userData?<Forgotpassword/>:<Navigate to={"/"}/>} />
        <Route path='/' element={userData?<Home/>:<Navigate to={"/signin"}/>} />
        <Route path='/create-edit-shop' element={userData?<CreateEditShop/>:<Navigate to={"/signin"} />} />
        <Route path='/add-item' element={userData?<AddItem/>:<Navigate to={"/signin"} />} />
        <Route path='/edit-item/:itemId' element={userData?<EditItem/>:<Navigate to={"/signin"} />} />
        <Route path='/cart' element={userData?<CartPage/>:<Navigate to={"/signin"} />} />
        <Route path='/checkout' element={userData?<CheckOut/>:<Navigate to={"/signin"} />} />
        <Route path='/order-placed' element={userData?<OrderPlaced/>:<Navigate to={"/signin"} />} />
        <Route path='/my-orders' element={userData?<MyOrders/>:<Navigate to={"/signin"} />} />
        <Route path='/track-order/:orderId' element={userData?<TrackOrderPage/>:<Navigate to={"/signin"} />} />
        <Route path='/shop/:shopId' element={userData?<Shop/>:<Navigate to={"/signin"} />} />
    </Routes>
    )
}

export default App;

