import { createSlice } from "@reduxjs/toolkit";

const userSlice = createSlice({
    name: "user",
    initialState:{
        userData:null,
        currentCity:null,
        currentState:null,
        currentAddress:null,
        shopInMyCity:null,
        itemsInMyCity:null,
        cartItems:[],
        totalAmount:0,
        MyOrders:[],
        searchItems:null
    },
    reducers:{
        setUserData:(state, action) => {
            state.userData = action.payload
        },

        setcurrentCity:(state, action) => {
            state.currentCity = action.payload
        },

        setcurrentState:(state, action) => {
            state.currentState = action.payload
        },

        setcurrentAddress:(state, action) => {
            state.currentAddress = action.payload
        },

        setshopsInMyCity:(state, action) => {
            state.shopInMyCity = action.payload
        },

        setitemsInMyCity:(state, action) => {
            state.itemsInMyCity = action.payload
        },
        
        addToCart:(state, actions) => {
            const cartItem = actions.payload
            const existingItem = state.cartItems.find(i => i.id == cartItem.id)
            if(existingItem){
                existingItem.quantity += cartItem.quantity
            }else{
                state.cartItems.push(cartItem)
            }
            state.totalAmount = state.cartItems.reduce((sum, i) => sum+i.price*i.quantity, 0)
        },

        updateQuantity:(state, action) => {
            const {id, quantity} = action.payload
            const item = state.cartItems.find(i => i.id == id)
            if(item){
                item.quantity = quantity
            } 
            state.totalAmount = state.cartItems.reduce((sum, i) => sum+i.price*i.quantity, 0)
        },

        removeCartItem:(state, action) => {
            state.cartItems = state.cartItems.filter(i => i.id !== action.payload)
            state.totalAmount = state.cartItems.reduce((sum, i) => sum+i.price*i.quantity, 0)
        },

        setMyOrders:(state, action) => {
            state.MyOrders = action.payload
        },

        addMyOrder:(state, action) => {
            state.MyOrders = [action.payload,...state.MyOrders]
        },

        updateOrderStatus: (state, action) => {
            const { orderId, shopId, status } = action.payload;
            const order = state.MyOrders.find(o => o._id == orderId);

            if (order && order.shopOrders?.shop?._id == shopId) {
                order.shopOrders.status = status;
            }
        },

        updateRealtimeOrderStatus: (state, action) => {
            const { orderId, shopId, status } = action.payload 
            const order = state.MyOrders.find(o => o._id === orderId);
            if (!order) return;   
            const shopOrder = order.shopOrders;
            if (Array.isArray(shopOrder)) {
                const shop = shopOrder.find(
                    s => String(s.shop?._id) === String(shopId)
                );
            if (shop) {
                shop.status = status;
            }
            }else if (shopOrder && String(shopOrder.shop?._id) === String(shopId)) {
                shopOrder.status = status;
            }
        },
        
        updateAssignedDeliveryBoy: (state, action) => {
            const { orderId, shopOrderId, deliveryBoy } = action.payload;
            const order = state.MyOrders.find(
                o => String(o._id) === String(orderId)
            );
            if (!order) return;
        
            if (!Array.isArray(order.shopOrders)) {
                if (String(order.shopOrders._id) === String(shopOrderId)) {
                    order.shopOrders.assignDeliveryBoy = deliveryBoy;
                }
                return;
            }
            const shopOrder = order.shopOrders.find(
                so => String(so._id) === String(shopOrderId)
            );
            if (shopOrder) {
                shopOrder.assignDeliveryBoy = deliveryBoy;
            }
        },

        removeOrder: (state, action) => {
            state.MyOrders = state.MyOrders.filter(
                order => String(order._id) !== String(action.payload)
            );
        },

        updateItemRating: (state, action) => {
            const { itemId, rating } = action.payload;
        
            const item = state.itemsInMyCity?.find(
                i => i._id === itemId
            );
            if (item) {
                item.rating = rating;
            }
            const searchItem = state.searchItems?.find(
                i => i._id === itemId
            );
            if (searchItem) {
                searchItem.rating = rating;
            }
        },

        updateShopStatusInCity: (state, action) => {
            const { shopId, isOpen } = action.payload;
        
            state.shopInMyCity = state.shopInMyCity?.map(shop =>
                String(shop._id) === String(shopId)
                    ? { ...shop, isOpen }
                    : shop
            );
        },

        setSearchItems: (state, action) => {
            state.searchItems = action.payload;
        }
    } 
})

export const {setUserData, setcurrentCity, setcurrentState, setcurrentAddress, setshopsInMyCity, setitemsInMyCity,  addToCart, updateQuantity, removeCartItem, setMyOrders, addMyOrder, updateOrderStatus, setSearchItems, updateRealtimeOrderStatus, updateAssignedDeliveryBoy, removeOrder, updateItemRating, updateShopStatusInCity} = userSlice.actions
export default userSlice.reducer

