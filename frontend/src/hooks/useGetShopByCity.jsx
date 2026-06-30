import { useCallback, useEffect } from "react";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { setshopsInMyCity } from "../redux/userSlice";
import { socket } from "../socket";
import { EVENTS } from "../socket/events";

const serverUrl = "https://food-delivery-2jxx.onrender.com";

const useGetShopByCity = () => {
    const dispatch = useDispatch();
    const { currentCity } = useSelector(state => state.user);

    const fetchShops = useCallback(async () => {
        try {
            if (!currentCity) return;

            const result = await axios.get(
                `${serverUrl}/api/shop/get-by-city/${currentCity}`,
                { withCredentials: true }
            );

            dispatch(setshopsInMyCity(result.data));
        } catch (error) {
            console.log(error.response?.data || error);
        }
    }, [currentCity, dispatch]);

    useEffect(() => {
        fetchShops();
    }, [fetchShops]);

    useEffect(() => {
        const refreshShops = () => {
            fetchShops();
        };

        socket.on(EVENTS.SHOP_ADDED, refreshShops);
        socket.on(EVENTS.SHOP_UPDATED, refreshShops);

        return () => {
            socket.off(EVENTS.SHOP_ADDED, refreshShops);
            socket.off(EVENTS.SHOP_UPDATED, refreshShops);
        };
    }, [fetchShops]);
};

export default useGetShopByCity;
