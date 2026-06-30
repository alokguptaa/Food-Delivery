import { configureStore } from "@reduxjs/toolkit";
import userReducer from "./userSlice";
import ownerSlice from "./ownerSlice";
import mapSlice from "./mapSlice";
import notificationReducer from "./notificationSlice";;

export const store = configureStore({
    reducer: {
        user: userReducer,
        owner: ownerSlice,
        map: mapSlice,
        notification: notificationReducer
    }
});
