import React, { useEffect, useRef, useState } from 'react'
import Nav from './Nav';
import { categories } from '../../category.js';
import CategoryCard from './CategoryCard.jsx';
import { FaChevronCircleLeft } from "react-icons/fa";
import { FaChevronCircleRight } from "react-icons/fa";
import { useSelector } from 'react-redux';
import FoodCard from './FoodCard.jsx';
import { useNavigate } from 'react-router-dom';
import { socket } from '../socket.js';
import { EVENTS } from '../socket/events.js';


const UserDashboard = () => {

    const {currentCity, shopInMyCity, itemsInMyCity, searchItems} = useSelector(state => state.user)

    const cateScrollRef = useRef()
    const shopScrollRef = useRef()
    const navigate = useNavigate()

    const [LeftCateButton, setLeftCateButton] = useState(false)
    const [RightCateButton, setRightCateButton] = useState(false)
    const [LeftShopButton, setLeftShopButton] = useState(false)
    const [RightShopButton, setRightShopButton] = useState(false)
    const [updatedItemsList, setupdatedItemsList] = useState([])

    useEffect(() => {
        if(Array.isArray(itemsInMyCity)){
            setupdatedItemsList(itemsInMyCity)
        }
    }, [itemsInMyCity])

    const handleFilterByCategory = (categories) => {

    const filteredList = itemsInMyCity.filter(item => {
        console.log(
            "Comparing:",
            `"${item.category}"`,
            "===",
            `"${categories}"`
        );

        return item.category === categories;
    });

    setupdatedItemsList(filteredList);
};

    const updateButton = (ref, setLeftCateButton, setRightCateButton) => {
        const element = ref.current
        if(element){
            setLeftCateButton(element.scrollLeft > 0)
            

            setRightCateButton(
                Math.ceil(element.scrollLeft + element.clientWidth) < element.scrollWidth
            )
        }
    }

    const ScrollHandler = (ref, direction) => {
        if(ref.current){
            ref.current.scrollBy({
                left:direction === "left" ? -200 : 200,
                behavior: "smooth"
            })
        }
    }

    useEffect(() => {
    const cateEl = cateScrollRef.current;
    const shopEl = shopScrollRef.current;

    if (!cateEl || !shopEl) return;

    const handleCateScroll = () => {
        updateButton(cateScrollRef, setLeftCateButton, setRightCateButton);
    };

    const handleShopScroll = () => {
        updateButton(shopScrollRef, setLeftShopButton, setRightShopButton);
    };

    // add listeners
    cateEl.addEventListener("scroll", handleCateScroll);
    shopEl.addEventListener("scroll", handleShopScroll);

    // initial call (optional but good)
    updateButton(cateScrollRef, setLeftCateButton, setRightCateButton);
    updateButton(shopScrollRef, setLeftShopButton, setRightShopButton);

    // cleanup
    return () => {
        cateEl.removeEventListener("scroll", handleCateScroll);
        shopEl.removeEventListener("scroll", handleShopScroll);
    };

},[]);

    useEffect(() => {
    const handleOrderStatus = ({ orderId, shopId, status }) => {
        console.log("ORDER_STATUS RECEIVED:", orderId, status, shopId);

        setupdatedItemsList(prev =>
            prev.map(item => item)
        );
    };

    socket.on(EVENTS.ORDER_STATUS, handleOrderStatus);

    return () => {
        socket.off(EVENTS.ORDER_STATUS, handleOrderStatus);
    };
}, []);



return (
    <div className='w-screen min-h-screen flex flex-col gap-5 items-center bg-[#fff9f6] overflow-auto'>
        <Nav />
        {
            searchItems && searchItems.length > 0 &&(
            <div className='w-full max-w-6xl flex flex-col gap-5 items-start p-5 bg-white shadow-md rounded-2xl mt-4'>
                <h1 className='text-gray-900 text-2xl sm:text-3xl font-semibold border-b border-gray-200 pb-2'>
                    Search Results
                </h1>
                <div className='w-full h-auto flex flex-wrap gap-6 justify-center'>
                    {searchItems.map((item) => (
                        < FoodCard data={item} key={item._id}/>
                    ))}
                </div>
            </div>
        )}

        <div className='w-full max-w-6xl flex flex-col gap-5 items-start p-2.5'>
            <h1 className='text-gray-800 text-2xl sm:text-3xl'>
                Inspiration for your first order
            </h1>
            
            <div className='w-full relative'>
                { LeftCateButton && 
                    <button className='absolute left-0 top-1/2 -translate-y-1/2 bg-[#ff4d2d] text-white p-2 rounded-full shadow hover:bg-[#e64528] z-10 cursor-pointer' onClick={() =>ScrollHandler(cateScrollRef, "left")}>
                        <FaChevronCircleLeft />
                    </button>
                }
                <div className='w-full flex overflow-x-auto gap-4 pb-2 cursor-pointer' ref={cateScrollRef}>
                    {categories.map((cate, index) => (
                        <CategoryCard name={cate.categories} image={cate.image} key={index} onClick={() => handleFilterByCategory(cate.categories)}/>
                    ))}
                </div>
                { RightCateButton &&
                    <button className='absolute right-0 top-1/2 -translate-y-1/2 bg-[#ff4d2d] text-white p-2 rounded-full shadow hover:bg-[#e64528] z-10 cursor-pointer' onClick={() =>ScrollHandler(cateScrollRef, "right")}>
                        <FaChevronCircleRight />
                    </button>
                }
                
            </div>
        </div>

        <div className='w-full max-w-6xl flex flex-col gap-5 items-start p-2.5'>
            <h1 className='text-gray-800 text-2xl sm:text-3xl'>
                Best Shop in {currentCity}
            </h1>
            <div className='w-full relative'>
                { LeftShopButton && 
                    <button className='absolute left-0 top-1/2 -translate-y-1/2 bg-[#ff4d2d] text-white p-2 rounded-full shadow hover:bg-[#e64528] z-10 cursor-pointer' onClick={() =>ScrollHandler(shopScrollRef, "left")}>
                        <FaChevronCircleLeft />
                    </button>
                }
                <div className='w-full flex overflow-x-auto gap-4 pb-2 cursor-pointer' ref={shopScrollRef}>
                    {shopInMyCity?.map((shop, index) => {
                        return (
                            <div key={index} className="flex flex-col items-center">
                                <CategoryCard name={shop.name} image={shop.image}
                                    onClick={() => {
                                        if (shop.isOpen) {
                                            navigate(`shop/${shop._id}`);
                                        }
                                    }} />
                                {!shop.isOpen && (
                                    <div className="mt-2 text-center max-w-44 px-3 py-2 rounded-xl bg-red-50 shadow-sm" >
                                        
                                        <p className="text-red-600 text-sm font-semibold">
                                            🔒 Shop is Closed
                                        </p>
                                
                                        <p className="text-gray-600 text-xs mt-1">
                                            Sorry, we are currently not available.
                                        </p>
                                
                                        <p className="text-gray-700 text-xs mt-1 font-medium">
                                            Opens at {shop.openingTime}
                                        </p>
                                
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
                { RightShopButton &&
                    <button className='absolute right-0 top-1/2 -translate-y-1/2 bg-[#ff4d2d] text-white p-2 rounded-full shadow hover:bg-[#e64528] z-10 cursor-pointer' onClick={() =>ScrollHandler(shopScrollRef, "right")}>
                        <FaChevronCircleRight />
                    </button>
                    }
            </div>
        </div>

        <div className='w-full max-w-6xl flex flex-col gap-5 items-start p-2.5'>
            <h1 className='text-gray-800 text-2xl sm:text-3xl'>
                Suggested Food Items
            </h1>

            <div className='w-full h-auto flex flex-wrap gap-5 justify-center'>
                {updatedItemsList?.map((items, index) => ( 
                    < FoodCard key={index} data={items} /> 
                ))}
            </div>
        </div>

    </div>
)
}

export default UserDashboard;



