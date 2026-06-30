import React, { useEffect, useState } from 'react'
import { IoIosArrowRoundBack } from "react-icons/io";
import { FaUtensils } from "react-icons/fa";
import { useDispatch } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import axios  from 'axios';
import { serverUrl } from './../App';
import { setMyshopdata } from '../redux/ownerSlice';
import { ClipLoader } from 'react-spinners';


const EditItem = () => {
    const navigate = useNavigate()
    const dispatch = useDispatch()
    const { itemId } = useParams()

    const [currentItem, setcurrentItem] = useState(null)
    const [name, setname] = useState("")
    const [price, setprice] = useState(0)
    const [image, setimage] = useState("")
    const [backendimage, setbackendimage] = useState(null)
    const [category, setcategory] = useState("")
    const [foodType, setfoodType] = useState("")
    const [loading, setloading] = useState(false)

    const categories = [
        "Snacks", "Main Course", "Dessert", "Pizza", "Burgers", "Sandwiches", 
        "South Indian", "North Indian", "Chinese", "Fast Food", "Others"
    ]
    
    const handleImage = (e) => {
        const file = e.target.files[0]
        setbackendimage(file)
        setimage(URL.createObjectURL(file))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setloading(true)
        try {
            const formData = new FormData()
            formData.append("name", name)
            formData.append("category", category)
            formData.append("foodType", foodType)
            formData.append("price", price)
            if(backendimage){
                formData.append("image", backendimage)
            }
            const result = await axios.post(`${serverUrl}/api/item/edit-item/${itemId}`, formData,
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

    useEffect(() => {
        const handleGetItemById = async () => {
            try {
                const result = await axios.get(`${serverUrl}/api/item/get-by-id/${itemId}`,
                    {withCredentials:true})
                    setcurrentItem(result.data)
            } catch (error) {
                console.log(error)
            }
        }
        handleGetItemById()
    },[itemId])

    useEffect(() => {
        setname(currentItem?.name || "")
        setprice(currentItem?.price || 0)
        setimage(currentItem?.image || "")
        setcategory(currentItem?.category || "")
        setfoodType(currentItem?.foodType || "")
    },[currentItem])

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
                    Edit Food
                </div>
            </div>
            <form className='space-y-5' onSubmit={handleSubmit}>
                <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>Food Name</label>
                    <input type="text" placeholder='Enter Food Name' className='w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500' onChange={(e) => setname(e.target.value)} value={name} />
                </div>
                <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>Food Image</label>
                    <input type="file" accept='image/*' className='w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500' onChange={handleImage} />
                    {image && 
                        <div className='mt-4'>
                        <img src={image} alt="" className='w-full h-48 object-cover rounded-lg border'/>
                    </div>
                    }
                </div>
                <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>Price</label>
                    <input type="number" placeholder='0' className='w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500' onChange={(e) => setprice(e.target.value)} value={price} />
                </div>
                <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>Select Food Type</label>
                    <select className='w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500' onChange={(e) => setfoodType(e.target.value)} value={foodType}>
                        <option value="veg">veg</option>
                        <option value="non veg">non veg</option>
                    </select>
                </div>
                <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>Select Category</label>
                    <select className='w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500' onChange={(e) => setcategory(e.target.value)} value={category}>
                        <option value="">select Category</option> 
                        {categories.map((cate, index) => (
                            <option value={cate} key={index}>{cate}</option>
                        ))}
                    </select>
                </div>
                <button className='w-full bg-[#ff4d2d] text-white px-6 py-3 rounded-lg font-semibold shadow-md hover:bg-orange-600 hover:shadow-lg transition-all duration-200 cursor-pointer' disabled={loading} >
                    { loading?<ClipLoader size={20} color='white'/> : "Save"}
                </button>
            </form>
        </div>
    </div>
    )  
}

export default EditItem;
