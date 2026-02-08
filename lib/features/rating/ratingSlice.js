import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import axios from 'axios'

/**
 * "thunkAPI provides access to Redux internals like dispatch, getState, 
 * and rejectWithValue. It allows us to handle errors gracefully by passing 
 * backend error messages to the reducer."
 */
export const fetchUserRatings = createAsyncThunk(
    'rating/fetchUserRatings', 
    
    // We destructure { getToken } to ensure the request is authenticated.
    async ({ getToken }, thunkAPI) => {
        try {
            // 1. SECURITY: Get the latest session token
            const token = await getToken()

            // 2. API REQUEST:
            // We pass the token in the headers. This is critical for protected routes.
            const { data } = await axios.get('/api/rating', {
                headers: { Authorization: `Bearer ${token}` }
            })

            // 3. RETURN DATA:
            return data ? data.ratings : []

        } catch (error) {
            // ERROR HANDLING:
            // Instead of crashing, we return a rejected action with the specific 
            // error message from the server response.
            return thunkAPI.rejectWithValue(error.response?.data || error.message)
        }
    }
)


const ratingSlice = createSlice({
    name: 'rating',
    
    // INITIAL STATE:
    // We start with an empty array to ensure UI components don't crash 
    // when trying to map over ratings before data loads.
    initialState: {
        ratings: [],
    },

    // REDUCERS (Synchronous Actions):
    // These are triggered by the UI components (e.g., after a user submits a review).
    reducers: {
        addRating: (state, action) => {
            // "Redux Toolkit uses a library called 'Immer' under the hood. 
            // It allows me to write mutable code (like .push), which it then safely 
            // converts into an immutable state update. It makes the code cleaner."
            state.ratings.push(action.payload)
        },
    },

    // EXTRA REDUCERS (Asynchronous Actions):
    // These listen for actions generated *outside* this slice (specifically, our Thunk).
    extraReducers: (builder) => {
        // When the API call finishes successfully (HTTP 200 OK):
        builder.addCase(fetchUserRatings.fulfilled, (state, action) => {
            // We replace the local empty array with the actual data from the database.
            state.ratings = action.payload
        })
    }
})

// Export the synchronous action for use in components
export const { addRating } = ratingSlice.actions

// Export the reducer to be included in the central Redux Store
export default ratingSlice.reducer