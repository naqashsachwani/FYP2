import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import axios from 'axios'


export const fetchAddress = createAsyncThunk(
  'address/fetchAddress', // Action Type Prefix
  
  // We destructure { getToken } because we need the Auth Token for a secured API route.
  async ({ getToken }, thunkAPI) => {
    try {
      // 1. SECURITY: Get the latest session token (JWT)
      const token = await getToken()

      // 2. NETWORK REQUEST:
      // We pass the token in the 'Authorization' header to prove identity.
      const { data } = await axios.get('/api/address', {
        headers: { Authorization: `Bearer ${token}` },
      })

      // 3. RETURN DATA:
      // This returned value becomes the 'action.payload' in the .fulfilled case below.
      return data?.Addresses || []

    } catch (error) {
      // By default, Redux only captures the error message. rejectWithValue allows us
      // to pass the custom error object sent by the backend (like validation errors) to the UI."
      return thunkAPI.rejectWithValue(error.response?.data || error.message)
    }
  }
)


const addressSlice = createSlice({
  name: 'address',
  
  // INITIAL STATE
  // Defines the starting point of our store.
  initialState: {
    list: [], // We initialize as an empty array so .map() functions don't crash in the UI.
  },

  // REDUCERS (Synchronous Actions)
  // Used for client-side updates that don't need to wait for the server (Optimistic Updates).
  reducers: {
    addAddress: (state, action) => {
      // Check if state.list got corrupted or is undefined before pushing.
      if (!Array.isArray(state.list)) state.list = [] 

      //"Redux Toolkit uses the 'Immer' library internally. 
      // It allows us to write mutable code (like .push), which it then converts 
      // into a safe, immutable state update behind the scenes."
      state.list.push(action.payload)
    },
  },

  // EXTRA REDUCERS (Asynchronous Actions)
  // This is where we listen to the lifecycle of the 'fetchAddress' Thunk defined above.
  extraReducers: (builder) => {
    // When the API call succeeds (HTTP 200):
    builder.addCase(fetchAddress.fulfilled, (state, action) => {
      // Update the local store with the data fetched from the database.
      state.list = action.payload
    })
    
  },
})

// Export the synchronous action to be used in components (dispatch(addAddress(...)))
export const { addAddress } = addressSlice.actions
// Export the reducer to be added to the Global Store (configureStore)
export default addressSlice.reducer