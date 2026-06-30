import { createSlice } from "@reduxjs/toolkit";

const ownerSlice = createSlice({
    name: "owner",
    initialState:{
        myShopData:null
    },
    reducers:{
        setMyshopdata:(state, action) => {
            state.myShopData = action.payload
        },

        updateShopStatus: (state, action) => {
            if (state.myShopData) {
                state.myShopData.isOpen = action.payload;
            }
        },

        updateOwnerItemRating: (state, action) => {
            
            const { itemId, rating } = action.payload;

            const item = state.myShopData?.items?.find(
                i => i._id === itemId
            );

            if (item) {
                item.rating = rating;
            }
        },
    }
})

export const {setMyshopdata, updateOwnerItemRating, updateShopStatus} = ownerSlice.actions
export default ownerSlice.reducer
