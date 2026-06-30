import React from 'react';


const CategoryCard = ({name, image, onClick}) => {
    
return (
    <div className='w-32 h-32 md:w-44 md:h-44 rounded-2xl border-2 border-[#ff4d2d] shrink-0 overflow-hidden bg-white shadow-2xl shadow-gray-200 hover:shadow-lg transition-shadow relative'
    onClick={() =>onClick()}>
        <img src={image} alt="" className='w-full h-full object-cover transform hover:scale-110 transition-transform duration-300'/>
        <div className='absolute bottom-0 w-full left-0 bg-[#ffffff96] bg-opacity-95 px-3 py-1 rounded-t-xl text-center shadow text-sm font-medium text-gray-800 backdrop-blur-2xl'>
            {name}
        </div>
    </div>
    )
}

export default CategoryCard

