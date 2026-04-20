// Marks this as a Next.js Client Component, enabling React state and interactive form handling.
'use client'

// --- Imports ---
// Authentication hook to securely sign requests sent to the backend
import { useAuth } from "@clerk/nextjs"
// HTTP client for making network requests
import axios from "axios"
// Next.js optimized Image component
import Image from "next/image"
// React hook for local state management
import { useState } from "react"
// Toast notification library for user feedback
import { toast } from "react-hot-toast"
// UI Icons
import { UploadCloud, X } from "lucide-react" 

export default function StoreAddProduct() {
  
  // --- Constants ---
  // Static array of categories used to populate the select dropdown.
  // Hardcoding this ensures consistent data formatting across the platform.
  const categories = [
    'Electronics', 'Clothing', 'Home & Kitchen', 'Beauty & Health',
    'Toys & Games', 'Sports & Outdoors', 'Books & Media',
    'Food & Drink', 'Hobbies & Crafts', 'Others'
  ]

  // --- State Management ---
  // State object to hold up to 4 image files. Initialized to null.
  // We use numeric keys (1, 2, 3, 4) to map to specific upload boxes in the UI.
  const [images, setImages] = useState({ 1: null, 2: null, 3: null, 4: null })
  
  // State object for the product's text metadata
  const [productInfo, setProductInfo] = useState({
    name: "",
    description: "",
    mrp: 0,
    price: 0,
    category: "",
  })
  
  // Controls the loading spinner state of the submit button to prevent double-submissions
  const [loading, setLoading] = useState(false)
  
  // Extract getToken function from Clerk
  const { getToken } = useAuth()

  // --- Input Handlers ---
  // A generic handler for all text and number inputs.
  // It uses ES6 computed property names [e.target.name] to update the correct state field dynamically.
  // For example, if the input name is "price", it updates productInfo.price.
  const onChangeHandler = (e) => {
    const { name, value } = e.target
    setProductInfo(prev => ({ ...prev, [name]: value }))
  }

  // Handler specifically for the hidden file inputs.
  // Takes a key (1, 2, 3, or 4) and the selected File object, placing it into the 'images' state.
  const handleImageUpload = (key, file) => {
    setImages(prev => ({ ...prev, [key]: file }))
  }

  // Resets all state back to initial empty values, allowing the user to start over.
  const handleReset = () => {
    // Native browser confirmation to prevent accidental data loss
    if(confirm("Are you sure you want to clear the form?")) {
        setProductInfo({ name: "", description: "", mrp: 0, price: 0, category: "" })
        setImages({ 1: null, 2: null, 3: null, 4: null })
        toast.success("Form cleared")
    }
  }

  // --- Form Submission ---
  // Handles the final submission to the backend API
  const onSubmitHandler = async (e) => {
    e.preventDefault() // Prevents the browser from reloading the page
    
    // Client-Side Validation: Ensure the merchant isn't setting an illogical price
    if (Number(productInfo.price) > Number(productInfo.mrp)) {
        return toast.error("Offer Price cannot be higher than Actual Price (MRP)")
    }

    try {
      // Client-Side Validation: Ensure at least one image has been uploaded
      if (!images[1] && !images[2] && !images[3] && !images[4]) {
        return toast.error('Please upload at least one image')
      }
      setLoading(true) // Lock the submit button

      // --- FormData Construction ---
      // Standard JSON payloads ({}) cannot handle binary file uploads. 
      // The FormData API mimics a standard HTML form submission, allowing us to 
      // send text fields AND binary image files in a single 'multipart/form-data' request.
      const formData = new FormData()
      
      // Append text fields
      formData.append('name', productInfo.name)
      formData.append('description', productInfo.description)
      formData.append('mrp', productInfo.mrp)
      formData.append('price', productInfo.price)
      formData.append('category', productInfo.category)

      // Iterate through the 'images' state object.
      // If a file exists for a specific key, append it to the formData under the name 'images'.
      // Note: Backend must be configured to accept an array of files under the 'images' key.
      Object.keys(images).forEach((key) => {
        if (images[key]) formData.append('images', images[key])
      })

      // Fetch JWT token for authorization
      const token = await getToken()
      
      // Send the POST request to the backend
      const { data } = await axios.post('/api/store/product', formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          // Axios usually sets this automatically when seeing a FormData object, 
          // but explicitly declaring it is a safe practice.
          'Content-Type': 'multipart/form-data'
        },
      })

      // Notify success
      toast.success(data?.message || "Product added")
      
      // Reset form fields to empty after a successful upload
      setProductInfo({ name: "", description: "", mrp: 0, price: 0, category: "" })
      setImages({ 1: null, 2: null, 3: null, 4: null })
      
    } catch (error) {
      // Notify failure, trying to pull the specific error message generated by the backend API
      toast.error(error?.response?.data?.error || error.message)
    } finally {
      // Unlock the submit button regardless of success or failure
      setLoading(false)
    }
  }

  // --- Main Render ---
  return (
    // Outer layout wrapper with a soft gradient background
    <div className="flex flex-col items-center px-5 py-10 md:px-16 bg-gradient-to-b from-slate-50 to-white min-h-screen">
      
      {/* Header */}
      <h1 className="text-3xl font-semibold text-slate-800 mb-6 text-center">
        DreamSaver <span className="text-blue-600">Product Upload</span>
      </h1>

      {/* Main Form */}
      <form
        // Intercepts the submit event. Wraps the async onSubmitHandler in a toast.promise.
        // This automatically shows a "Loading..." popup that turns green/red when the promise resolves/rejects.
        onSubmit={(e) =>
          toast.promise(onSubmitHandler(e), { loading: "Adding Product..." })
        }
        className="bg-white w-full max-w-2xl shadow-md rounded-2xl p-6 sm:p-8 border border-slate-100"
      >
        
        {/* === SECTION 1: Product Images Upload === */}
        <div>
          <p className="text-slate-700 font-medium mb-2">Product Images</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Map over the keys of the 'images' state (1, 2, 3, 4) to generate 4 upload boxes */}
            {Object.keys(images).map((key) => (
              // The <label> tag makes the entire dashed box clickable, triggering the hidden <input> inside it.
              <label
                key={key}
                htmlFor={`images${key}`}
                className="cursor-pointer hover:scale-[1.03] transition-transform block"
              >
                
                {/* Upload Box UI */}
                <div className="h-24 w-full border border-dashed border-slate-300 rounded-lg bg-slate-50 flex items-center justify-center overflow-hidden relative">
                    {/* Conditionally render: If an image file exists in state for this key, show a preview. */}
                    {images[key] ? (
                        <Image
                            width={200}
                            height={200}
                            className="h-full w-full object-cover"
                            // URL.createObjectURL creates a temporary, local URL pointing to the file stored in browser memory, allowing immediate preview without uploading to a server first.
                            src={URL.createObjectURL(images[key])}
                            alt={`upload-${key}`}
                        />
                    ) : (
                        // If no image exists, show the upload icon and placeholder text
                        <div className="text-slate-400 flex flex-col items-center gap-1">
                            <UploadCloud size={24} />
                            <span className="text-[10px]">Upload</span>
                        </div>
                    )}
                </div>

                {/* Hidden File Input */}
                <input
                  type="file"
                  accept="image/*" // Restrict file picker to image formats
                  id={`images${key}`} // Matches the htmlFor in the <label>
                  onChange={e => handleImageUpload(key, e.target.files[0])} // Passes the selected file to state
                  hidden // Hides the ugly default HTML file picker
                />
              </label>
            ))}
          </div>
        </div>

        {/* === SECTION 2: Text Metadata === */}
        
        {/* Product Name Input */}
        <label className="flex flex-col gap-2 my-5">
          <span className="font-medium text-slate-700">Product Name</span>
          <input
            type="text"
            name="name" // Must match the state property name exactly for onChangeHandler to work
            onChange={onChangeHandler}
            value={productInfo.name}
            placeholder="Enter product name"
            className="p-3 outline-none border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-400"
            required
          />
        </label>

        {/* Description Textarea */}
        <label className="flex flex-col gap-2 my-5">
          <span className="font-medium text-slate-700">Description</span>
          <textarea
            name="description"
            onChange={onChangeHandler}
            value={productInfo.description}
            placeholder="Enter product description"
            rows={4}
            className="p-3 outline-none border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-400 resize-none"
            required
          />
        </label>

        {/* Pricing Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Actual Price (MRP) */}
          <label className="flex flex-col gap-2">
            <span className="font-medium text-slate-700">Actual Price (MRP)</span>
            <input
              type="number"
              name="mrp"
              onChange={onChangeHandler}
              value={productInfo.mrp}
              placeholder="0"
              className="p-3 outline-none border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-400"
              required
            />
          </label>

          {/* Offer Price */}
          <label className="flex flex-col gap-2">
            <span className="font-medium text-slate-700">Offer Price</span>
            <input
              type="number"
              name="price"
              onChange={onChangeHandler}
              value={productInfo.price}
              placeholder="0"
              className="p-3 outline-none border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-400"
              required
            />
          </label>
        </div>

        {/* Category Dropdown */}
        <div className="mt-5">
          <label className="font-medium text-slate-700 mb-2 block">
            Category
          </label>
          <select
            onChange={(e) =>
              setProductInfo({ ...productInfo, category: e.target.value })
            }
            value={productInfo.category}
            className="p-3 w-full border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-400"
            required
          >
            {/* Disabled default option forcing the user to make a selection */}
            <option value="">Select a category</option>
            {/* Maps the static 'categories' array to create dropdown options */}
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        {/* === SECTION 3: Action Buttons === */}
        <div className="flex gap-4 mt-8">
            {/* Clear Form Button */}
            <button
                type="button" // Prevents this button from attempting to submit the form
                onClick={handleReset}
                disabled={loading} // Disables the button if a network request is running
                className="w-1/3 bg-slate-100 text-slate-600 py-3 rounded-lg font-medium hover:bg-slate-200 transition-all disabled:opacity-50"
            >
                Clear
            </button>
            
            {/* Submit Button */}
            <button
                type="submit"
                disabled={loading}
                className={`w-2/3 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-all ${
                    loading ? "opacity-75 cursor-not-allowed" : ""
                }`}
            >
                {/* Dynamically changes text based on the loading state */}
                {loading ? "Uploading..." : "Add Product"}
            </button>
        </div>

      </form>
    </div>
  )
}