import React, { useState } from 'react'
import { IoIosArrowRoundBack } from "react-icons/io";
import { FaUtensils } from "react-icons/fa";
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import axios  from 'axios';
import { serverUrl } from './../App';
import { setMyshopdata } from '../redux/ownerSlice';
import { ClipLoader } from 'react-spinners';


const CreateEditShop = () => {
    const navigate = useNavigate()
    const dispatch = useDispatch()
    const {myShopData } = useSelector(state => state.owner)
    const {currentCity, currentState, currentAddress} = useSelector(state => state.user)

    const [name, setname] = useState(myShopData?.name || "")
    const [address, setaddress] = useState(myShopData?.address || currentAddress || "")
    const [city, setcity] = useState(myShopData?.city || currentCity || "")
    const [state, setstate] = useState(myShopData?.state || currentState || "")
    const [frontendimage, setfrontendimage] = useState(myShopData?.image || null)
    const [backendimage, setbackendimage] = useState(null)
    const [loading, setloading] = useState(false)
    const [openingTime, setOpeningTime] = useState(myShopData?.openingTime || "09:00")
    const [closingTime, setClosingTime] = useState(myShopData?.closingTime || "22:00")
    
    const handleImage = (e) => {
        const file = e.target.files[0]
        setbackendimage(file)
        setfrontendimage(URL.createObjectURL(file))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setloading(true)
        try {
            const formData = new FormData()
            formData.append("name", name)
            formData.append("city", city)
            formData.append("state", state)
            formData.append("address", address)
            formData.append("openingTime", openingTime)
            formData.append("closingTime", closingTime)
            if(backendimage){
                formData.append("image", backendimage)
            }
            const result = await axios.post(`${serverUrl}/api/shop/create-edit`, formData,
                {withCredentials:true})
                    dispatch(setMyshopdata(result.data))
                    setloading(false) 
                    navigate("/")
            }
        catch (error) {
            console.log(error)
            console.log(error?.response?.data?.message)
            setloading(false)
        }
    }

return (
    <div className='flex justify-center flex-col items-center p-6 bg-linear-to-br from-orange-50 relative to-white min-h-screen'>
        <div className='absolute top-5 left-5 z-2.5 mb-2.5 cursor-pointer' onClick={() => navigate("/signin")}>
            <IoIosArrowRoundBack size={25} className='text-[#ff4d2d]'/>
        </div>
        <div className='max-w-lg w-full bg-white shadow-xl rounded-2xl p-8 border border-orange-100'>
            <div className='flex flex-col items-center mb-6'>
                <div className='bg-orange-100 p-4 rounded-full mb-4'>
                    <FaUtensils className='text-[#ff4d2d] w-16 h-16'/>
                </div>
                <div className='text-3xl font-extrabold text-gray-900'>
                    {myShopData ? "Edit Shop" : "Add Shop"}
                </div>
            </div>
            <form className='space-y-5' onSubmit={handleSubmit}>
                <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>Shop Name</label>
                    <input type="text" placeholder='Enter Shop Name' className='w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500' onChange={(e) => setname(e.target.value)} value={name} />
                </div>
                <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>Shop Image</label>
                    <input type="file" accept='image/*' className='w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500' onChange={handleImage} />
                    {frontendimage && 
                        <div className='mt-4'>
                        <img src={frontendimage} alt="" className='w-full h-48 object-cover rounded-lg border'/>
                    </div>
                    }
                </div>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    <div>
                        <label className='block text-sm font-medium text-gray-700 mb-1'>City</label>
                        <input type="text" placeholder='City' className='w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500' onChange={(e) => setcity(e.target.value)} value={city} />
                    </div>
                    <div>
                        <label className='block text-sm font-medium text-gray-700 mb-1'>State</label>
                        <input type="text" placeholder='State' className='w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500' onChange={(e) => setstate(e.target.value)} value={state} />
                    </div>
                </div>
                <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>Address</label>
                    <input type="text" placeholder='Enter Shop Address' className='w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500' onChange={(e) => setaddress(e.target.value)} value={address} />
                </div>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
    <div>
        <label className='block text-sm font-medium text-gray-700 mb-1'>
            Opening Time
        </label>

        <input
            type="time"
            value={openingTime}
            onChange={(e) => setOpeningTime(e.target.value)}
            className='w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500'
        />
    </div>

    <div>
        <label className='block text-sm font-medium text-gray-700 mb-1'>
            Closing Time
        </label>

        <input
            type="time"
            value={closingTime}
            onChange={(e) => setClosingTime(e.target.value)}
            className='w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500'
        />
    </div>
</div>
                <button className='w-full bg-[#ff4d2d] text-white px-6 py-3 rounded-lg font-semibold shadow-md hover:bg-orange-600 hover:shadow-lg transition-all duration-200 cursor-pointer' disabled={loading}>
                    {loading?< ClipLoader size={20} color='white'/> : "Save"}
                </button>
            </form>
        </div>
    </div>
    )  
}

export default CreateEditShop;

