import { configureStore } from "@reduxjs/toolkit";
import productsReducer from "./slices/productSlice";
import productReducer from './slices/productSlice';
import authReducer from './slices/authSlice';
import profileReducer from './slices/profileSlice';
import cartReducer from './slices/cartSlice';
import reviewReducer from './slices/reviewSlice';
import wishlistReducer from './slices/wishlistSlice';
// import orderReducer from './slices/orderSlice';

const store = configureStore({
    reducer: {
        productsState: productsReducer,
        productState: productReducer,
        authState: authReducer,
        profileState: profileReducer,
        cartState: cartReducer,
        reviewState: reviewReducer,
        wishlistState: wishlistReducer,
        // orderState: orderReducer,
    }
    // ✅ Thunk is automatically included - no need to specify
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;