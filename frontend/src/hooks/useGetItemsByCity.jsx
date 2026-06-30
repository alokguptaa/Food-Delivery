import { useCallback, useEffect } from 'react';
import axios from "axios";
import { useDispatch, useSelector } from 'react-redux';
import { setitemsInMyCity } from '../redux/userSlice';
import { socket } from '../socket.js';
import { EVENTS } from '../socket/events.js';
import { updateShopStatusInCity } from "../redux/userSlice";

const serverUrl = "https://food-delivery-2jxx.onrender.com";

const useGetItemsByCity = () => {

    const dispatch = useDispatch();
    const { currentCity } = useSelector(state => state.user);

    const fetchItemss = useCallback(async () => {
        try {
            if (!currentCity) return;
            const result = await axios.get(
                `${serverUrl}/api/shop/get-by-city/${currentCity}`,
                { withCredentials: true }
            );
            const allItems = result.data
                .filter(shop => shop.isOpen)
                .flatMap(shop => shop.items || []);
        
            dispatch(setitemsInMyCity(allItems));
        } catch (error) {
            console.log(error.response?.data || error);
        }
    },[currentCity, dispatch]);

    
    useEffect(() => {
        fetchItemss();
    }, [fetchItemss]);

    
    useEffect(() => {

        const refreshItems = () => {
        fetchItemss();
    };

    const handleShopStatus = ({ shopId, isOpen }) => {
        dispatch(updateShopStatusInCity({
            shopId,
            isOpen
        }));
        fetchItemss();
    };

    socket.on(EVENTS.SHOP_STATUS_CHANGED, handleShopStatus);
    socket.on(EVENTS.ITEM_ADDED, refreshItems);
    socket.on(EVENTS.ITEM_UPDATED, refreshItems);
    socket.on(EVENTS.ITEM_DELETED, refreshItems);

    return () => {
        socket.off(EVENTS.SHOP_STATUS_CHANGED, handleShopStatus);
        socket.off(EVENTS.ITEM_ADDED, refreshItems);
        socket.off(EVENTS.ITEM_UPDATED, refreshItems);
        socket.off(EVENTS.ITEM_DELETED, refreshItems);
    };

}, [fetchItemss, dispatch]);



};

export default useGetItemsByCity;
