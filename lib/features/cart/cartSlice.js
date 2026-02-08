import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';

// GLOBAL VARIABLE: Debounce Timer
// This variable lives outside the Redux logic.
// It tracks the active timer ID so we can cancel it if a new action comes in too quickly.
let debounceTimer = null;


export const uploadCart = createAsyncThunk('cart/uploadCart',
    async ({ getToken }, thunkAPI) => {
        try {
            // 1. Cancel the previous pending upload (if any)
            clearTimeout(debounceTimer);
            // 2. Schedule a new upload in 1000ms (1 second)
            debounceTimer = setTimeout(async () => {
                // Access the *current* state of the cart from the Redux store
                const { cartItems } = thunkAPI.getState().cart;
                // Get Auth Token for security
                const token = await getToken();
                // Send the consolidated cart to the backend
                await axios.post('/api/cart', { cart: cartItems }, {
                    headers: { Authorization: `Bearer ${token}` },
                });
            }, 1000);
            // We resolve immediately because we don't need the UI to wait for the background sync.
            return Promise.resolve();
        } catch (error) {
            return thunkAPI.rejectWithValue(error.response?.data || error.message);
        }
    }
);


export const fetchCart = createAsyncThunk('cart/fetchCart',
    async ({ getToken }, thunkAPI) => {
        try {
            const token = await getToken();
            const { data } = await axios.get('/api/cart', {
                headers: { Authorization: `Bearer ${token}` },
            });
            // Returns the data which will be automatically handled in 'extraReducers' below
            return data;
        } catch (error) {
            return thunkAPI.rejectWithValue(error.response?.data || error.message);
        }
    }
);


const cartSlice = createSlice({
    name: 'cart',
    initialState: {
        total: 0,        // Tracks total number of items in cart
        cartItems: {},   // Object Map: { "prod_123": 2, "prod_456": 1 }
    },
    
    // REDUCERS: Synchronous Local Updates (Optimistic UI)
    reducers: {
        addToCart: (state, action) => {
            const { productId } = action.payload;

            // If key exists, increment. If not, initialize to 1.
            // We are "mutating" state here (state.cartItems[id]++), but Redux Toolkit 
            // uses 'Immer' under the hood to handle this safely.
            if (state.cartItems[productId]) {
                state.cartItems[productId]++;
            } else {
                state.cartItems[productId] = 1;
            }
            
            // Update total count
            state.total += 1;
        },

        removeFromCart: (state, action) => {
            const { productId } = action.payload;

            // Logic: Decrement quantity. If it hits 0, remove the key entirely.
            if (state.cartItems[productId]) {
                state.cartItems[productId]--;
                
                if (state.cartItems[productId] === 0) {
                    delete state.cartItems[productId];
                }
                
                state.total -= 1;
            }
        },

        // Removes an item completely, regardless of quantity (Trash icon action)
        deleteItemFromCart: (state, action) => {
            const { productId } = action.payload;
            
            // Subtract the specific item's quantity from the global total
            state.total -= state.cartItems[productId] || 0;
            
            // Remove key from object
            delete state.cartItems[productId];
        },

        clearCart: (state) => {
            // Reset state to initial values
            state.cartItems = {};
            state.total = 0;
        },
    },

    // EXTRA REDUCERS: Handling Async Actions (API responses)
    extraReducers: (builder) => {
        // When fetchCart succeeds (server responds with data):
        builder.addCase(fetchCart.fulfilled, (state, action) => {
            // 1. Load the cart from server response
            const cart = action.payload?.cart || {};
            state.cartItems = cart;

            // 2. Recalculate the 'total' based on the fetched data
            // Object.values returns array of quantities
            // .reduce sums them up
            state.total = Object.values(cart).reduce((acc, item) => acc + item, 0);
        });
    },
});

export const { addToCart, removeFromCart, clearCart, deleteItemFromCart } = cartSlice.actions;

export default cartSlice.reducer;