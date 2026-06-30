import React from 'react'
import { useEffect } from 'react'
import axios from "axios"
import { useDispatch, useSelector} from 'react-redux';
import { setMyOrders } from '../redux/userSlice.js';


const serverUrl = "http://localhost:3000";

const useGetMyOrders = () => {

    const dispatch = useDispatch()
    const {userData} = useSelector(state => state.user)

    useEffect(() => {

        const fetchOrders = async () => {
            try {
                const result = await axios.get(
                    `${serverUrl}/api/order/my-orders`,
                    {withCredentials:true})

                    dispatch(setMyOrders(result.data))

            } catch (error) {
                console.log(error.response?.data || error);
            }
        }
        fetchOrders()
    },[dispatch, userData])
}

export default useGetMyOrders;
