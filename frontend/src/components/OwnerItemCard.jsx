import axios from 'axios';
import React from 'react'
import { FaPen } from "react-icons/fa";
import { FaTrashAlt } from "react-icons/fa";
import { useNavigate } from 'react-router-dom';
import { serverUrl } from './../App';
import { useDispatch } from 'react-redux';
import { setMyshopdata } from '../redux/ownerSlice';

const OwnerItemCard = ({data}) => {

    const navigate = useNavigate()
    const dispatch = useDispatch()

    const handleDelete = async () => {
        try {
            const result = await axios.delete(`${serverUrl}/api/item/delete/${data._id}`,
                {withCredentials:true})
                dispatch(setMyshopdata(result.data))
        } catch (error) {
            console.log(error.response.data)
        }
    }

return (
    <div className='flex bg-white rounded-lg shadow-md overflow-hidden border border-[#ff4d2d] w-full max-w-2xl'>
        <div className='w-36 h-36 flex shrink-0 bg-gray-50'>
            <img src={data.image} alt="" className='w-full h-full object-cover'/>
        </div>
        <div className='flex flex-col justify-between p-3 flex-1'>
            <div className='flex justify-between items-start'>
                <div>
                    <h2 className='text-base font-semibold text-[#ff4d2d]'>{data.name}</h2>
                    <p><span className='font-medium text-gray-70'>Category: </span>{data.category}</p>
                    <p><span className='font-medium text-gray-70'>Food Type: </span>{data.foodType}</p>
                </div>
                {data.rating?.count > 0 && (
                <div>
                {[1, 2, 3, 4, 5].map((star) => (
                    <span
                        key={star}
                        className={`text-3xl ${
                            (data.rating?.average || 0) >= star
                                ? "text-yellow-400"
                                : "text-gray-400"
                        }`}
                    >
                        ★
                    </span>
                ))}
                <span className='text-2xl text-gray-600 ml-2'>
                    ({data.rating?.count || 0})
                </span>
                </div>
                )}
            </div>
            <div className='flex items-center justify-between'>
                <div className='text-[#ff4d2d] font-bold'>
                    Price: ₹{data.price}
                </div>
                <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-3 ml-auto'>
                        <div className='p-2 rounded-full hover:bg-[#ff4d2d]/10 cursor-pointer' onClick={() => navigate(`/edit-item/${data._id}`)}>
                            <FaPen size={16}/>
                        </div>
                        <div className='p-2 rounded-full hover:bg-[#ff4d2d]/10 cursor-pointer' onClick={handleDelete}>
                            <FaTrashAlt size={16}/>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    )
}

export default OwnerItemCard

