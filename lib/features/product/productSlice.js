import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import axios from 'axios'

/**
 * "It is a middleware function that dispatches 3 actions automatically:
 * 1. pending (start loading)
 * 2. fulfilled (data received successfully)
 * 3. rejected (API error)"
 */
export const fetchProducts = createAsyncThunk(
    'product/fetchProducts', 
    
    // Payload Creator
    // Destructures 'storeId' from the input argument to allow filtering.
    async ({ storeId }, thunkAPI) => {
        try {
            // If a 'storeId' is provided, we fetch products for that specific store.
            // If not, we fetch ALL products.
            const url = '/api/products' + (storeId ? `?storeId=${storeId}` : '');
            
            const { data } = await axios.get(url);
            
            return data.products;

        } catch (error) {
            // ERROR HANDLING:
            // We use 'rejectWithValue' to pass the custom error message from the backend 
            // to the Redux store, rather than a generic serialization error.
            return thunkAPI.rejectWithValue(error.response?.data || error.message);
        }
    }
)


 //Combines State, Reducers, and Actions into one object.

const productSlice = createSlice({
    name: 'product', // Namespace for actions (e.g., product/setProduct)
    
    // Defined as an object with a 'list' array. 
    // initialize arrays as [] to avoid "map is not a function" errors in UI.
    initialState: {
        list: [], 
    },

    // REDUCERS (Synchronous):
    // Actions we can trigger manually from components (client-side updates).
    reducers: {
        setProduct: (state, action) => {
            // Redux Toolkit uses 'Immer' library, allowing us to write "mutating" code 
            // (state.list = ...) which is safely converted to immutable updates internally.
            state.list = action.payload;
        },
        clearProduct: (state) => {
            // Useful for resetting state when leaving a page (cleanup).
            state.list = [];
        }
    },

    // EXTRA REDUCERS (Asynchronous):
    // Listen for actions created by Thunks (fetchProducts).
    extraReducers: (builder) => {
        // When the API call finishes successfully:
        builder.addCase(fetchProducts.fulfilled, (state, action) => {
            // Populate the global store with the data fetched from the API.
            state.list = action.payload;
        })
        
        // You could add .addCase(fetchProducts.rejected, ...) here to handle errors globally.
    }
})

// Export actions for use in components via dispatch()
export const { setProduct, clearProduct } = productSlice.actions

// Export reducer to attach to the global store config
export default productSlice.reducer