'use client'

import { useAuth } from "@clerk/nextjs"
import axios from "axios"
import Image from "next/image"
import { useState } from "react"
import { toast } from "react-hot-toast"
import { UploadCloud, X, RefreshCcw } from "lucide-react" 

export default function StoreAddProduct() {
  
  const categories = [
    'Electronics', 'Clothing', 'Home & Kitchen', 'Beauty & Health',
    'Toys & Games', 'Sports & Outdoors', 'Books & Media',
    'Food & Drink', 'Hobbies & Crafts', 'Others'
  ]

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

  const onChangeHandler = (e) => {
    const { name, value } = e.target
    setProductInfo(prev => ({ ...prev, [name]: value }))
  }

  // Handler specifically for the hidden file inputs.
  const handleImageUpload = (key, file) => {
    setImages(prev => ({ ...prev, [key]: file }))
  }

  // Pure refresh without confirmation dialog to act as a normal reset
  const handleRefresh = () => {
    setProductInfo({ name: "", description: "", mrp: 0, price: 0, category: "" })
    setImages({ 1: null, 2: null, 3: null, 4: null })
  }

  // Resets all state back to initial empty values, allowing the user to start over.
  const handleReset = () => {
    if(confirm("Are you sure you want to clear the form?")) {
        handleRefresh()
        toast.success("Form cleared")
    }
  }

  // --- Form Submission ---
  // Handles the final submission to the backend API
  const onSubmitHandler = async (e) => {
    e.preventDefault() // Prevents the browser from reloading the page
    
    if (Number(productInfo.price) > Number(productInfo.mrp)) {
        return toast.error("Offer Price cannot be higher than Actual Price (MRP)")
    }

    try {
      // Client-Side Validation: Ensure at least one image has been uploaded
      if (!images[1] && !images[2] && !images[3] && !images[4]) {
        return toast.error('Please upload at least one image')
      }
      setLoading(true) // Lock the submit button

      
      const formData = new FormData()
      
      // Append text fields
      formData.append('name', productInfo.name)
      formData.append('description', productInfo.description)
      formData.append('mrp', productInfo.mrp)
      formData.append('price', productInfo.price)
      formData.append('category', productInfo.category)

      Object.keys(images).forEach((key) => {
        if (images[key]) formData.append('images', images[key])
      })

      const token = await getToken()
      
      // Send the POST request to the backend
      const { data } = await axios.post('/api/store/product', formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        },
      })

      // Notify success
      toast.success(data?.message || "Product added")
      
      setProductInfo({ name: "", description: "", mrp: 0, price: 0, category: "" })
      setImages({ 1: null, 2: null, 3: null, 4: null })
      
    } catch (error) {
      toast.error(error?.response?.data?.error || error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    // Outer layout wrapper with a soft gradient background
    <div className="flex flex-col items-center px-4 sm:px-6 md:px-16 py-8 sm:py-10 bg-gradient-to-b from-slate-50 to-white min-h-[100dvh]">
      
      {/* Header */}
      <div className="w-full max-w-2xl flex justify-between items-center mb-5 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-semibold text-slate-800 text-center w-full">
            DreamSaver <span className="text-blue-600">Product Upload</span>
        </h1>
        <button 
            onClick={handleRefresh}
            className="p-2 sm:p-2.5 bg-white border border-slate-200 rounded-lg sm:rounded-xl hover:bg-slate-50 shadow-sm transition-colors text-slate-600"
            title="Clear Form"
        >
            <RefreshCcw size={18} className="sm:w-5 sm:h-5" />
        </button>
      </div>

      {/* Main Form */}
      <form
        onSubmit={(e) =>
          toast.promise(onSubmitHandler(e), { loading: "Adding Product..." })
        }
        className="bg-white w-full max-w-2xl shadow-sm sm:shadow-md rounded-2xl p-5 sm:p-8 border border-slate-100"
      >
        
        <div>
          <p className="text-xs sm:text-sm text-slate-700 font-bold mb-2 uppercase tracking-wider">Product Images <span className="text-red-500 normal-case font-medium tracking-normal">* (At least 1 required)</span></p>
          <div className="grid grid-cols-4 gap-2 sm:gap-3">
            {Object.keys(images).map((key) => (
              <label
                key={key}
                htmlFor={`images${key}`}
                className="cursor-pointer hover:scale-[1.03] transition-transform block"
              >
                
                <div className="h-16 sm:h-24 w-full border border-dashed border-slate-300 rounded-lg bg-slate-50 flex items-center justify-center overflow-hidden relative">
                    {/* Conditionally render: If an image file exists in state for this key, show a preview. */}
                    {images[key] ? (
                        <Image
                            width={200}
                            height={200}
                            className="h-full w-full object-cover"
                            src={URL.createObjectURL(images[key])}
                            alt={`upload-${key}`}
                        />
                    ) : (
                        // If no image exists, show the upload icon and placeholder text
                        <div className="text-slate-400 flex flex-col items-center gap-1">
                            <UploadCloud className="w-5 h-5 sm:w-6 sm:h-6" />
                            <span className="text-[9px] sm:text-[10px] font-medium">Upload</span>
                        </div>
                    )}
                </div>

                {/* Hidden File Input */}
                <input
                  type="file"
                  accept="image/*" 
                  id={`images${key}`} 
                  onChange={e => handleImageUpload(key, e.target.files[0])} 
                  hidden 
                />
              </label>
            ))}
          </div>
        </div>
        
        {/* Product Name Input */}
        <label className="flex flex-col gap-1.5 sm:gap-2 mt-6 mb-5">
          <span className="text-xs sm:text-sm font-bold text-slate-700 uppercase tracking-wider">Product Name</span>
          <input
            type="text"
            name="name" // Must match the state property name exactly for onChangeHandler to work
            onChange={onChangeHandler}
            value={productInfo.name}
            placeholder="Enter product name"
            className="p-2.5 sm:p-3 text-sm sm:text-base outline-none border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-400 transition-shadow"
            required
          />
        </label>

        {/* Description Textarea */}
        <label className="flex flex-col gap-1.5 sm:gap-2 my-5">
          <span className="text-xs sm:text-sm font-bold text-slate-700 uppercase tracking-wider">Description</span>
          <textarea
            name="description"
            onChange={onChangeHandler}
            value={productInfo.description}
            placeholder="Enter product description"
            rows={4}
            className="p-2.5 sm:p-3 text-sm sm:text-base outline-none border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-400 resize-y min-h-[100px] transition-shadow custom-scrollbar"
            required
          />
        </label>

        {/* Pricing Grid */}
        <div className="grid grid-cols-2 gap-3 sm:gap-5 my-5">
          {/* Actual Price (MRP) */}
          <label className="flex flex-col gap-1.5 sm:gap-2">
            <span className="text-xs sm:text-sm font-bold text-slate-700 uppercase tracking-wider">Actual Price (MRP)</span>
            <input
              type="number"
              name="mrp"
              onChange={onChangeHandler}
              value={productInfo.mrp || ""} // Prevents leading 0
              placeholder="0"
              className="p-2.5 sm:p-3 text-sm sm:text-base outline-none border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-400 transition-shadow"
              required
            />
          </label>

          {/* Offer Price */}
          <label className="flex flex-col gap-1.5 sm:gap-2">
            <span className="text-xs sm:text-sm font-bold text-slate-700 uppercase tracking-wider text-green-600">Offer Price</span>
            <input
              type="number"
              name="price"
              onChange={onChangeHandler}
              value={productInfo.price || ""}
              placeholder="0"
              className="p-2.5 sm:p-3 text-sm sm:text-base outline-none border border-green-200 bg-green-50/30 rounded-xl focus:ring-2 focus:ring-green-500 transition-shadow"
              required
            />
          </label>
        </div>

        {/* Category Dropdown */}
        <div className="mt-5">
          <label className="text-xs sm:text-sm font-bold text-slate-700 uppercase tracking-wider mb-1.5 block">
            Category
          </label>
          <select
            onChange={(e) =>
              setProductInfo({ ...productInfo, category: e.target.value })
            }
            value={productInfo.category}
            className="p-2.5 sm:p-3 w-full text-sm sm:text-base border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-400 transition-shadow cursor-pointer bg-white"
            required
          >
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
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-8">
            {/* Clear Form Button */}
            <button
                type="button" // Prevents this button from attempting to submit the form
                onClick={handleReset}
                disabled={loading} 
                className="w-full sm:w-1/3 bg-slate-100 text-slate-600 py-3 sm:py-3.5 rounded-xl font-bold hover:bg-slate-200 transition-colors disabled:opacity-50 text-sm sm:text-base order-2 sm:order-1"
            >
                Clear Form
            </button>
            
            {/* Submit Button */}
            <button
                type="submit"
                disabled={loading}
                className={`w-full sm:w-2/3 bg-blue-600 text-white py-3 sm:py-3.5 rounded-xl font-bold shadow-lg shadow-blue-500/30 hover:bg-blue-700 transition-all active:scale-[0.98] text-sm sm:text-base order-1 sm:order-2 ${
                    loading ? "opacity-75 cursor-not-allowed" : ""
                }`}
            >
                {/* Dynamically changes text based on the loading state */}
                {loading ? "Uploading..." : "Add Product to Store"}
            </button>
        </div>

      </form>
    </div>
  )
}