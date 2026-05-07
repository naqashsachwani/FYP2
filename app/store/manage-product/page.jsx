'use client'

import { useEffect, useState } from "react" 
import { toast } from "react-hot-toast" 
import Image from "next/image" 
import Loading from "@/components/Loading" 
import { useAuth, useUser } from "@clerk/nextjs"
import axios from "axios" 
import { Pencil, Trash2, Upload, Search, ChevronLeft, ChevronRight } from "lucide-react" 

export default function StoreManageProducts() {

  const { getToken } = useAuth()
  const { user } = useUser()
  const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || 'Rs '

  // --- State Management ---
  const [loading, setLoading] = useState(true) 
  const [products, setProducts] = useState([]) 
  const [editingProduct, setEditingProduct] = useState(null) 
  
  const [searchTerm, setSearchTerm] = useState("")

  // --- Pagination State ---
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 5;

  // Form state. imageFiles is an object containing index:file pairs to support multi-image editing
  const [formData, setFormData] = useState({ 
    name: "", 
    price: "", 
    mrp: "", 
    description: "", 
    imageFiles: {} 
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
    const originalProducts = [...products];

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
      setProducts(originalProducts);
      toast.error(error?.response?.data?.error || "Failed to update stock")
    }
  }

  const handleEditClick = (product) => {
    setEditingProduct(product.id) 
    setFormData({
      name: product.name,
      price: product.price,
      mrp: product.mrp,
      description: product.description,
      imageFiles: {}, // Reset individual file tracker on edit open
    })
  }

  // --- UI: Handle Image Upload at Specific Index ---
  const handleImageChange = (e, index) => {
    const file = e.target.files[0]
    if (file) {
      setFormData(prev => ({
        ...prev,
        imageFiles: { ...prev.imageFiles, [index]: file }
      }))
    }
  }

  // --- API: Save Edits ---
  const handleEditSubmit = async (id) => {
    try {
      const token = await getToken()
      
      const submissionData = new FormData();
      submissionData.append('id', id);
      submissionData.append('name', formData.name);
      submissionData.append('description', formData.description);
      submissionData.append('price', formData.price);
      submissionData.append('mrp', formData.mrp);
      
      // Append specific images attached to specific indexes
      Object.keys(formData.imageFiles).forEach(index => {
        submissionData.append(`image_${index}`, formData.imageFiles[index]);
      });

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
      fetchProducts(); 
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
      
      // Adjust pagination if deleting the last item on a page
      const newFilteredLength = products.length - 1;
      const newTotalPages = Math.max(1, Math.ceil(newFilteredLength / ITEMS_PER_PAGE));
      if (currentPage > newTotalPages) setCurrentPage(newTotalPages);

    } catch (error) {
      toast.error(error?.response?.data?.error || error.message)
    }
  }

  useEffect(() => {
    if (user) fetchProducts()
  }, [user])

  // Reset pagination to page 1 when searching
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm])

  // --- Filtering & Pagination Logic ---
  const filteredProducts = products.filter(product => {
    const term = searchTerm.toLowerCase();
    return (
      product.name?.toLowerCase().includes(term) ||
      product.description?.toLowerCase().includes(term) ||
      product.price?.toString().includes(term) ||
      product.mrp?.toString().includes(term)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / ITEMS_PER_PAGE));
  const currentProducts = filteredProducts.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

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
        <div className="overflow-x-auto bg-white shadow-md rounded-2xl flex flex-col min-h-[400px]">
          <table className="w-full text-left border-collapse min-w-max flex-1">
            <thead className="bg-blue-100 text-gray-700 uppercase text-sm">
              <tr>
                <th className="px-6 py-4">Product Details</th>
                <th className="px-6 py-4 hidden md:table-cell w-1/4">Description</th>
                <th className="px-6 py-4 hidden md:table-cell">MRP</th>
                <th className="px-6 py-4">Price</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>

            <tbody className="text-gray-700">
              {currentProducts.length > 0 ? (
                  currentProducts.map((product) => (
                    <tr key={product.id} className="border-t hover:bg-blue-50 transition-all align-top">
                      
                      {/* Column 1: Multiple Product Images & Name */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-3">
                          {/* Image Gallery */}
                          <div className="flex flex-wrap gap-2">
                            {product.images?.map((imgUrl, index) => (
                              editingProduct === product.id ? (
                                <label key={index} htmlFor={`image-upload-${product.id}-${index}`} className="cursor-pointer relative group flex-shrink-0">
                                  <Image
                                    width={48}
                                    height={48}
                                    className="w-12 h-12 rounded-xl shadow-sm bg-white object-cover border border-gray-200"
                                    src={formData.imageFiles[index] ? URL.createObjectURL(formData.imageFiles[index]) : (imgUrl || "/placeholder.png")}
                                    alt={`${product.name} - img ${index + 1}`}
                                  />
                                  <div className="absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Upload className="text-white w-4 h-4" />
                                  </div>
                                  <input
                                    id={`image-upload-${product.id}-${index}`}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => handleImageChange(e, index)}
                                  />
                                </label>
                              ) : (
                                <Image
                                  key={index}
                                  width={48}
                                  height={48}
                                  className="w-12 h-12 rounded-xl shadow-sm bg-white object-cover border border-gray-200 flex-shrink-0"
                                  src={imgUrl || "/placeholder.png"}
                                  alt={`${product.name} - img ${index + 1}`}
                                />
                              )
                            ))}
                          </div>
                          
                          {/* Name Box */}
                          {editingProduct === product.id ? (
                            <input
                              type="text"
                              className="border border-gray-300 p-1.5 rounded-lg text-sm w-48 focus:ring-2 focus:ring-blue-400 outline-none font-semibold text-gray-900"
                              value={formData.name}
                              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                          ) : (
                            <span className="font-semibold text-gray-900 text-sm mt-1">{product.name}</span>
                          )}
                        </div>
                      </td>

                      {/* Column 2: Description */}
                      <td className="px-6 py-4 hidden md:table-cell">
                        {editingProduct === product.id ? (
                          <textarea
                            rows="2"
                            className="border border-gray-300 p-1.5 rounded-lg text-sm w-full focus:ring-2 focus:ring-blue-400 outline-none resize-none"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          />
                        ) : (
                          <span className="text-gray-500 text-sm line-clamp-2 block max-w-xs leading-relaxed">{product.description}</span>
                        )}
                      </td>

                      {/* Column 3: MRP */}
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
                          <span className="line-through text-sm">{currency}{product.mrp?.toLocaleString()}</span>
                        )}
                      </td>

                      {/* Column 4: Price */}
                      <td className="px-6 py-4 font-semibold text-green-600">
                        {editingProduct === product.id ? (
                          <input
                            type="number"
                            className="border border-gray-300 p-1.5 rounded-lg text-sm w-24 focus:ring-2 focus:ring-green-400 outline-none"
                            value={formData.price}
                            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                            placeholder="Price"
                          />
                        ) : (
                          <span className="text-base">{currency}{product.price?.toLocaleString()}</span>
                        )}
                      </td>

                      {/* Column 5: Status Toggle */}
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

                      {/* Column 6: Actions */}
                      <td className="px-6 py-4 text-center">
                        <div className="flex justify-center items-center gap-3 flex-wrap md:flex-nowrap">
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
                  <tr>
                      <td colSpan="6" className="text-center py-16 text-gray-500 font-medium">
                          No products found matching "{searchTerm}"
                      </td>
                  </tr>
              )}
            </tbody>
          </table>
          
          {/* Pagination Controls */}
          {filteredProducts.length > 0 && (
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-between items-center rounded-b-2xl mt-auto">
               <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                 Page {currentPage} of {totalPages}
               </span>
               <div className="flex gap-2">
                  <button 
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                    disabled={currentPage === 1} 
                    className="p-1.5 border border-gray-200 rounded-lg bg-white hover:bg-gray-100 disabled:opacity-50 text-gray-600 transition-colors shadow-sm"
                  >
                    <ChevronLeft size={16}/>
                  </button>
                  <button 
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
                    disabled={currentPage === totalPages} 
                    className="p-1.5 border border-gray-200 rounded-lg bg-white hover:bg-gray-100 disabled:opacity-50 text-gray-600 transition-colors shadow-sm"
                  >
                    <ChevronRight size={16}/>
                  </button>
               </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}