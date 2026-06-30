import { useEffect } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import { serverUrl } from "../App";

const useUpdateLocation = () => {
    const { userData } = useSelector((state) => state.user);

    useEffect(() => {
        if (!userData) return;

        const updateLocation = async (lat, lon) => {
            try {
                const result = await axios.post(
                    `${serverUrl}/api/user/update-location`,
                    { lat, lon },
                    { withCredentials: true }
                );
                console.log(result.data)
            } catch (error) {
                console.log(error);
            }
        };

        const watchId = navigator.geolocation.watchPosition(
            (pos) => {
                updateLocation(
                    pos.coords.latitude,
                    pos.coords.longitude
                );
            },
            (err) => {
                console.log("Geolocation Error:", err);
            }
        );
        return () => {
            navigator.geolocation.clearWatch(watchId);
        };
    }, [userData]);
};

export default useUpdateLocation;
