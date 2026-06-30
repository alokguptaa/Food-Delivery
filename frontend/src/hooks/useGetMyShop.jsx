import React from 'react'
import { useEffect } from 'react'
import axios from "axios"
import { useDispatch, useSelector} from 'react-redux';
import { setMyshopdata } from '../redux/ownerSlice';

const serverUrl = "http://localhost:3000";

const useGetMyShop = () => {

    const dispatch = useDispatch()
    const {userData} = useSelector(state => state.user)

    useEffect(() => {

    if(userData?.role !== "owner")
        return;
    
        const fetchShop = async () => {
            try {
                const result = await axios.get(`${serverUrl}/api/shop/get-my-shop`,
                    {withCredentials:true}
                )
                    dispatch(setMyshopdata(result.data))

            } catch (error) {
                console.log(error);
            }
        }
        fetchShop()
    },[dispatch, userData])
}

export default useGetMyShop;
