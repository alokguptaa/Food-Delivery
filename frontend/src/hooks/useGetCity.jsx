import React from 'react'
import { useEffect } from 'react'
import axios from "axios"
import { useDispatch, useSelector } from 'react-redux';
import { setcurrentAddress, setcurrentCity, setcurrentState } from '../redux/userSlice';
import { setAddress, setLocation } from '../redux/mapSlice';


const useGetCity = () => {

    const dispatch = useDispatch()
    const { userData } = useSelector(state => state.user)
    
    const apiKey = import.meta.env.VITE_GEOAPIKEY
    
    useEffect(() => {
        navigator.geolocation.getCurrentPosition(async (position) => {
            const latitute = position.coords.latitude
            const longitude = position.coords.longitude

            dispatch(setLocation({lat:latitute, lon:longitude}))
            
            const result = await axios.get(`https://api.geoapify.com/v1/geocode/reverse?lat=${latitute}&lon=${longitude}&format=json&apiKey=${apiKey}`)
            

            dispatch(
                setcurrentCity(result?.data?.results[0].state_district || result?.data?.results[0].county)
            )
            dispatch(
                setcurrentState(`${result?.data?.results[0].state} (${result?.data?.results[0].state_code})`)
            )
            dispatch(
                setcurrentAddress(result?.data?.results[0].address_line1 || result?.data?.results[0].county)
            )
            dispatch(setAddress(result?.data?.results[0].address_line1))
    
        })
    },[userData, apiKey, dispatch])
    
}

export default useGetCity;

