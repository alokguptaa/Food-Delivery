import { useEffect } from "react";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { serverUrl } from "../App";
import { setNotifications } from "../redux/notificationSlice";

const useGetNotifications = () => {

    const dispatch = useDispatch();
    const { userData } = useSelector(state => state.user);

    useEffect(() => {

        if (!userData?._id) return;

        const fetchNotifications = async () => {

            try {

                const { data } = await axios.get(
                    `${serverUrl}/api/notification`,
                    {
                        withCredentials: true
                    }
                );

                dispatch(setNotifications(data));

            } catch (error) {

                console.log(error);

            }

        };

        fetchNotifications();

    }, [userData?._id, dispatch]);

};

export default useGetNotifications;
