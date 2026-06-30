import React  from 'react'
import Nav from './Nav'
import { useDispatch, useSelector } from 'react-redux'
import { FaUtensils } from "react-icons/fa";
import { FaPen } from "react-icons/fa";
import { useNavigate } from "react-router-dom"
import OwnerItemCard from './OwnerItemCard';
import axios from 'axios';
import { serverUrl } from '../App';
import { updateShopStatus } from '../redux/ownerSlice';


const OwnerDashboard = () => {
  const {myShopData} = useSelector(state => state.owner)
  const navigate = useNavigate()
  const dispatch = useDispatch()

  const handleToggleShop = async () => {
    try {
        const result = await axios.patch(
            `${serverUrl}/api/shop/toggle-shop-status`,
            {},
            { withCredentials: true }
        );
        dispatch(updateShopStatus(result.data.shop.isOpen));
    } catch (error) {
        console.log(error.response?.data || error);
    }
};

  

  return (
    <div className='w-full mix-h-screen flex bg-[#fff9f6] flex-col items-center '>
      <Nav />
      {!myShopData && 
        <div className='flex justify-center items-center p-4 sm:p-6'>
          <div className='w-full max-w-md bg-white shadow-lg rounded-2xl p-6 border border-gray-100 hover:shadow-xl transition-shadow duration-300'>
            <div className='flex flex-col items-center text-center'>
              <FaUtensils className='text-[#ff4d2d] w-16 h-16 sm:w-20 sm:h-20 mb-4'/>
              <h2 className='text-xl sm:text-2xl font-bold text-gray-800 mb-2'>
                Add your Restaurant
              </h2>
              <p className='text-gray-600 mb-4 text-sm sm:text-base'>
                Join our food delivery platform and reach thousands of hungry comtomers every day.
              </p>
              <button className='bg-[#ff4d2d] text-white px-5 sm:px-6 py-2 rounded-full font-medium shadow-md hover:bg-orange-600 transition-colors duration-200' onClick={() => navigate("/create-edit-shop")}>
                Get Started
              </button>
            </div>
          </div>
        </div>
      }
      {
        myShopData && 
        <div className='w-full flex flex-col items-center gap-6 px-4 sm:px-6'>
          <h1 className='text-2xl sm:text-3xl items-center text-gray-900 flex gap-3 mt-8'>
            <FaUtensils className='text-[#ff4d2d] sm:w-20 w-14 h-14'/>
            Welcome to {myShopData.name}
          </h1>
          <div className="flex justify-center">
            <button
                onClick={handleToggleShop}
                className={` relative px-6 py-2 rounded-full font-semibold text-white transition-all duration-300 shadow-md flex items-center gap-2 cursor-pointer
                  ${
                    myShopData.isOpen
                      ? "bg-green-500 hover:bg-green-600 shadow-green-200"
                      : "bg-red-500 hover:bg-red-600 shadow-red-200"
                  }
                `}>
                <span
                  className={`w-2.5 h-2.5 rounded-full animate-pulse ${
                    myShopData.isOpen ? "bg-green-200" : "bg-red-200"
                  }`}
                ></span>
              
                {myShopData.isOpen ? "Shop Open" : "Shop Closed"}
              </button>
          </div>
          <div className='bg-white shadow-lg rounded-xl overflow-hidden border border-orange-100 hover:shadow-2xl transition-all duration-300 w-full max-w-3xl relative'>
            <div className='absolute top-4 ringt-4 bg-[#ff4d2d] text-white p-2 rounded-full shadow-md hover:bg-orange-600 transition-colors cursor-pointer' onClick={() => navigate("/create-edit-shop")}>
              <FaPen size={20}/>
            </div>
            <img src={myShopData.image} alt={myShopData.name} className='w-full h-48 sm:h-64 object-cover'/>
            <div className='p-4 sm:p-6'>
              <h1 className='text-xl sm:text-2xl font-bold text-gray-800 mb-2'>{myShopData.name}</h1>
              <p className='text-gray-500'>{myShopData.city},{myShopData.state}</p>
              <p className='text-gray-500'>{myShopData.address}</p>
            </div>
          </div>
          {
          myShopData?.items?.length ===  0 && 
            <div className='flex justify-center items-center p-4 sm:p-6'>
              <div className='w-full max-w-md bg-white shadow-lg rounded-2xl p-6 border border-gray-100 hover:shadow-xl transition-shadow duration-300'>
                <div className='flex flex-col items-center text-center'>
                  <FaUtensils className='text-[#ff4d2d] w-16 h-16 sm:w-20 sm:h-20 mb-4'/>
                  <h2 className='text-xl sm:text-2xl font-bold text-gray-800 mb-2'>
                    Add your Food Item
                  </h2>
                  <p className='text-gray-600 mb-4 text-sm sm:text-base'>
                    Share your delicious creatios with our customers by adding them to the menu.
                  </p>
                  <button className='bg-[#ff4d2d] text-white px-5 sm:px-6 py-2 rounded-full font-medium shadow-md hover:bg-orange-600 transition-colors duration-200' onClick={() => navigate("/add-item")}>
                    Add Food
                  </button>
                </div>
              </div>
            </div>
          }

          {
            myShopData?.items?.length>0 &&
            <div className='flex flex-col items-center gap-4 w-full max-w-3xl'>
              {myShopData.items.map((item, index) => (
                  < OwnerItemCard data={item} key={index} />
                ))}
            </div>
          }

        </div>
      }
      
    </div>
  )
}

export default OwnerDashboard;

