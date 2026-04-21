'use client'

import { useEffect, useState } from "react" 
import { toast } from "react-hot-toast" 
import Image from "next/image" 
import Loading from "@/components/Loading" 
import { useAuth, useUser } from "@clerk/nextjs"
import axios from "axios" 
import { Pencil, Trash2, Upload, Search } from "lucide-react" 

export default function StoreManageProducts() {

  const { getToken } = useAuth()
  const { user } = useUser()
  const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || 'Rs '

  // --- State Management ---
  const [loading, setLoading] = useState(true) 
  const [products, setProducts] = useState([]) 
  const [editingProduct, setEditingProduct] = useState(null) 
  
  const [searchTerm, setSearchTerm] = useState("")

  // Form state specifically for the "Edit" row
  const [formData, setFormData] = useState({ 
    name: "", 
    price: "", 
    mrp: "", 
    description: "", 
    imageFile: null // Holds the raw binary file if the user uploads a new image
  })

  // --- API: Fetch Products ---
  const fetchProducts = async () => {
    try {
      const token = await getToken()
      const { data } = await axios.get('/api/store/product', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setProducts(data.products.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)))
    } catch (error) {
      toast.error(error?.response?.data?.error || error.message)
    }
    setLoading(false)
  }

  // --- API: Toggle Stock Status ---
  const toggleStock = async (productId) => {
    //Save current state to restore if API fails
    const originalProducts = [...products];

    // Switch the toggle in the UI immediately for a snappy feel
    setProducts(prev => prev.map(p => p.id === productId ? { ...p, inStock: !p.inStock } : p));

    try {
      const token = await getToken()
      await axios.post(
        '/api/store/stock-toggle',
        { productId },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      toast.success("Stock updated")
    } catch (error) {
      // If API failed, put the old data back in the UI
      setProducts(originalProducts);
      toast.error(error?.response?.data?.error || "Failed to update stock")
    }
  }

  const handleEditClick = (product) => {
    setEditingProduct(product.id) 
    // Pre-fill the form state with existing database data so the user doesn't have to re-type everything
    setFormData({
      name: product.name,
      price: product.price,
      mrp: product.mrp,
      description: product.description,
      imageFile: null, 
    })
  }

  // --- UI: Handle Image Upload ---
  // Captures the file from the <input type="file">
  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setFormData({ ...formData, imageFile: file })
    }
  }

  // --- API: Save Edits ---
  // Sends the modified data back to the server
  const handleEditSubmit = async (id) => {
    try {
      const token = await getToken()
      
      const submissionData = new FormData();
      
      // Append all text fields to the payload
      submissionData.append('id', id);
      submissionData.append('name', formData.name);
      submissionData.append('description', formData.description);
      submissionData.append('price', formData.price);
      submissionData.append('mrp', formData.mrp);
      
      // Only append the image file if the user actually picked a new one.
      if (formData.imageFile) {
        submissionData.append('image', formData.imageFile);
      }

      // Send a PUT request to update the product
      const { data } = await axios.put(
        '/api/store/product',
        submissionData,
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
          } 
        }
      )
      
      toast.success(data.message)
      fetchProducts(); // Refresh list from the server to show the new image/data
      setEditingProduct(null) 
    } catch (error) {
      console.error(error)
      toast.error(error?.response?.data?.error || error.message)
    }
  }

  // --- API: Delete Product ---
  const handleDelete = async (id) => {
    if(!confirm("Are you sure you want to delete this product?")) return;
    
    try {
      const token = await getToken()
      await axios.delete(`/api/store/product?id=${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      toast.success("Product deleted successfully")
      setProducts(prev => prev.filter(p => p.id !== id))
    } catch (error) {
      toast.error(error?.response?.data?.error || error.message)
    }
  }

  useEffect(() => {
    if (user) fetchProducts()
  }, [user])

  // --- Client-Side Filtering ---
  // Create a computed variable 'filteredProducts' instead of modifying the main 'products' state.
  const filteredProducts = products.filter(product => {
    const term = searchTerm.toLowerCase();
    return (
      product.name?.toLowerCase().includes(term) ||
      product.description?.toLowerCase().includes(term) ||
      product.price?.toString().includes(term) ||
      product.mrp?.toString().includes(term)
    );
  });

  if (loading) return <Loading />

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-8 px-4 md:px-12">
      <div className="max-w-6xl mx-auto">
        
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Manage <span className="text-blue-600">Products</span>
        </h1>
        <p className="text-gray-600 mb-6">Update, edit, or remove items from your <span className="font-medium text-blue-500">DreamSaver</span> store catalog.</p>

        {/* Search Bar */}
        <div className="mb-6 relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input 
                type="text" 
                placeholder="Search by name, description, or price..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
            />
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto bg-white shadow-md rounded-2xl">
          <table className="w-full text-left border-collapse">
            {/* Table Headers */}
            <thead className="bg-blue-100 text-gray-700 uppercase text-sm">
              <tr>
                <th className="px-6 py-4">Product</th>
                <th className="px-6 py-4 hidden md:table-cell">Description</th>
                <th className="px-6 py-4 hidden md:table-cell">MRP</th>
                <th className="px-6 py-4">Price</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="text-gray-700">
              {filteredProducts.length > 0 ? (
                  filteredProducts.map((product) => (
                    <tr key={product.id} className="border-t hover:bg-blue-50 transition-all">
                      
                      {/* Column 1: Product Name & Image */}
                      <td className="px-6 py-4 flex items-center gap-3">
                        {/* CONDITIONAL RENDER: Edit Mode vs View Mode */}
                        {editingProduct === product.id ? (
                          // Edit Mode: Shows Image Upload + Text Input
                          <div className="flex flex-col gap-2">
                            <label htmlFor={`image-upload-${product.id}`} className="cursor-pointer relative group">
                              <Image
                                width={50}
                                height={50}
                                className="p-1 rounded-xl shadow-md bg-white object-cover"
                                // URL.createObjectURL creates a temporary browser preview of the new file without needing a backend URL.
                                src={formData.imageFile ? URL.createObjectURL(formData.imageFile) : product.images[0]}
                                alt={product.name}
                              />
                              <div className="absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Upload className="text-white w-4 h-4" />
                              </div>
                            </label>
                            {/* Hidden file input */}
                            <input
                              id={`image-upload-${product.id}`}
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handleImageChange}
                            />
                          </div>
                        ) : (
                          // View Mode: Static Image
                          <Image
                            width={50}
                            height={50}
                            className="p-1 rounded-xl shadow-md bg-white object-cover"
                            src={product.images[0]}
                            alt={product.name}
                          />
                        )}
                        
                        {/* Edit Mode: Text Input vs View Mode: Span */}
                        {editingProduct === product.id ? (
                          <input
                            type="text"
                            className="border border-gray-300 p-1.5 rounded-lg text-sm w-36 focus:ring-2 focus:ring-blue-400 outline-none"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          />
                        ) : (
                          <span className="font-semibold">{product.name}</span>
                        )}
                      </td>

                      {/* Column 2: Description */}
                      <td className="px-6 py-4 hidden md:table-cell">
                        {editingProduct === product.id ? (
                          <input
                            type="text"
                            className="border border-gray-300 p-1.5 rounded-lg text-sm w-full focus:ring-2 focus:ring-blue-400 outline-none"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          />
                        ) : (
                          // Truncate class prevents long descriptions from breaking the table layout
                          <span className="text-gray-500 truncate block max-w-xs">{product.description}</span>
                        )}
                      </td>

                      {/* Column 3: MRP (Maximum Retail Price) */}
                      <td className="px-6 py-4 hidden md:table-cell text-gray-500">
                        {editingProduct === product.id ? (
                          <input
                            type="number"
                            className="border border-gray-300 p-1.5 rounded-lg text-sm w-20 focus:ring-2 focus:ring-blue-400 outline-none"
                            value={formData.mrp}
                            onChange={(e) => setFormData({ ...formData, mrp: e.target.value })}
                            placeholder="MRP"
                          />
                        ) : (
                          <span className="line-through">{currency}{product.mrp?.toLocaleString()}</span>
                        )}
                      </td>

                      {/* Column 4: Price */}
                      <td className="px-6 py-4 font-semibold text-green-600">
                        {editingProduct === product.id ? (
                          <input
                            type="number"
                            className="border border-gray-300 p-1.5 rounded-lg text-sm w-20 focus:ring-2 focus:ring-green-400 outline-none"
                            value={formData.price}
                            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                            placeholder="Price"
                          />
                        ) : (
                          <span>{currency}{product.price?.toLocaleString()}</span>
                        )}
                      </td>

                      {/* Column 5: Status Toggle (In Stock / Out of Stock) */}
                      <td className="px-6 py-4 text-center">
                        <div className="flex flex-col md:flex-row justify-center items-center gap-2">
                          <span className={`text-xs px-2 py-1 rounded-full ${product.inStock ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {product.inStock ? "In Stock" : "Out of Stock"}
                          </span>
                          
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              className="sr-only peer" 
                              onChange={() => toggleStock(product.id)} 
                              checked={product.inStock}
                            />
                            <div className="w-10 h-5 bg-gray-300 rounded-full peer peer-checked:bg-green-500 transition-all"></div>
                            <span className="absolute left-1 top-0.5 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5"></span>
                          </label>
                        </div>
                      </td>

                      {/* Column 6: Actions (Save, Edit, Delete) */}
                      <td className="px-6 py-4 text-center">
                        <div className="flex justify-center items-center gap-3 flex-wrap md:flex-nowrap">
                          
                          {/* If in edit mode, show Save button. Otherwise, show Edit button. */}
                          {editingProduct === product.id ? (
                            <button
                              onClick={() => handleEditSubmit(product.id)}
                              className="flex items-center gap-1.5 bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm shadow-md transition-all"
                            >
                              Save
                            </button>
                          ) : (
                            <button
                              onClick={() => handleEditClick(product)}
                              className="flex items-center gap-1.5 bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm shadow-md transition-all"
                            >
                              <Pencil className="w-4 h-4" /> Edit
                            </button>
                          )}
                          
                          {/* Delete Button */}
                          <button
                            onClick={() => handleDelete(product.id)}
                            className="flex items-center gap-1.5 bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg text-sm shadow-md transition-all"
                          >
                            <Trash2 className="w-4 h-4" /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
              ) : (
                  // Empty State UI: If the search returns 0 results
                  <tr>
                      <td colSpan="6" className="text-center py-10 text-gray-500">
                          No products found matching "{searchTerm}"
                      </td>
                  </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}