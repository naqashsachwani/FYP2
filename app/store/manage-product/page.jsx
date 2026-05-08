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
    <div className="min-h-[100dvh] bg-gradient-to-b from-blue-50 to-white py-6 sm:py-8 px-3 sm:px-6 md:px-12">
      <div className="max-w-6xl mx-auto">
        
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-1.5 sm:mb-2">
          Manage <span className="text-blue-600">Products</span>
        </h1>
        <p className="text-sm sm:text-base text-gray-600 mb-5 sm:mb-6">Update, edit, or remove items from your <span className="font-medium text-blue-500">DreamSaver</span> store catalog.</p>

        {/* Search Bar */}
        <div className="mb-5 sm:mb-6 relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
            <input 
                type="text" 
                placeholder="Search by name, description, or price..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 sm:pl-10 pr-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl border border-gray-200 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition-shadow"
            />
        </div>

        {/* Data Table Wrapper */}
        <div className="bg-white shadow-md rounded-xl sm:rounded-2xl flex flex-col min-h-[300px] sm:min-h-[400px] border border-gray-100 overflow-hidden">
          
          <div className="overflow-x-auto custom-scrollbar flex-1">
            {/* ✅ INCREASED min-width to 850px so columns have room to expand */}
            <table className="w-full text-left border-collapse min-w-[850px]">
              <thead className="bg-blue-50/80 text-gray-700 uppercase text-xs sm:text-sm border-b border-blue-100">
                <tr>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">Product Details</th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 hidden md:table-cell w-1/3">Description</th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 hidden md:table-cell whitespace-nowrap">MRP</th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">Price</th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-center whitespace-nowrap">Status</th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-center whitespace-nowrap">Actions</th>
                </tr>
              </thead>

              <tbody className="text-gray-700 divide-y divide-gray-50">
                {currentProducts.length > 0 ? (
                    currentProducts.map((product) => (
                      <tr key={product.id} className="hover:bg-blue-50/40 transition-colors align-top">
                        
                        {/* Column 1: Multiple Product Images & Name */}
                        <td className="px-4 sm:px-6 py-4">
                          <div className="flex flex-col gap-2.5 sm:gap-3">
                            {/* Image Gallery */}
                            <div className="flex flex-wrap gap-1.5 sm:gap-2">
                              {product.images?.map((imgUrl, index) => (
                                editingProduct === product.id ? (
                                  <label key={index} htmlFor={`image-upload-${product.id}-${index}`} className="cursor-pointer relative group flex-shrink-0">
                                    <Image
                                      width={48}
                                      height={48}
                                      className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl shadow-sm bg-white object-cover border border-gray-200"
                                      src={formData.imageFiles[index] ? URL.createObjectURL(formData.imageFiles[index]) : (imgUrl || "/placeholder.png")}
                                      alt={`${product.name} - img ${index + 1}`}
                                    />
                                    <div className="absolute inset-0 bg-black/40 rounded-lg sm:rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                      <Upload className="text-white w-3 h-3 sm:w-4 sm:h-4" />
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
                                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl shadow-sm bg-white object-cover border border-gray-200 flex-shrink-0"
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
                                className="border border-gray-300 p-1.5 sm:p-2 rounded-lg text-xs sm:text-sm w-full sm:w-48 focus:ring-2 focus:ring-blue-400 outline-none font-semibold text-gray-900 transition-shadow"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                              />
                            ) : (
                              <span className="font-semibold text-gray-900 text-xs sm:text-sm mt-0.5 sm:mt-1 line-clamp-2">{product.name}</span>
                            )}
                          </div>
                        </td>

                        {/* ✅ Column 2: Description (Fixed sizing) */}
                        <td className="px-4 sm:px-6 py-4 hidden md:table-cell">
                          {editingProduct === product.id ? (
                            <textarea
                              rows="4" 
                              className="border border-gray-300 p-2.5 rounded-lg text-sm w-full min-w-[250px] focus:ring-2 focus:ring-blue-400 outline-none resize-y custom-scrollbar transition-shadow"
                              value={formData.description}
                              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                          ) : (
                            <span className="text-gray-500 text-xs sm:text-sm line-clamp-3 block min-w-[200px] leading-relaxed pr-2">
                              {product.description}
                            </span>
                          )}
                        </td>

                        {/* Column 3: MRP (Hidden on mobile) */}
                        <td className="px-4 sm:px-6 py-4 hidden md:table-cell text-gray-500">
                          {editingProduct === product.id ? (
                            <input
                              type="number"
                              className="border border-gray-300 p-1.5 rounded-lg text-sm w-20 focus:ring-2 focus:ring-blue-400 outline-none transition-shadow"
                              value={formData.mrp}
                              onChange={(e) => setFormData({ ...formData, mrp: e.target.value })}
                              placeholder="MRP"
                            />
                          ) : (
                            <span className="line-through text-xs sm:text-sm">{currency}{product.mrp?.toLocaleString()}</span>
                          )}
                        </td>

                        {/* Column 4: Price */}
                        <td className="px-4 sm:px-6 py-4 font-semibold text-green-600">
                          {editingProduct === product.id ? (
                            <input
                              type="number"
                              className="border border-gray-300 p-1.5 sm:p-2 rounded-lg text-xs sm:text-sm w-20 sm:w-24 focus:ring-2 focus:ring-green-400 outline-none transition-shadow"
                              value={formData.price}
                              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                              placeholder="Price"
                            />
                          ) : (
                            <span className="text-sm sm:text-base whitespace-nowrap">{currency}{product.price?.toLocaleString()}</span>
                          )}
                        </td>

                        {/* Column 5: Status Toggle */}
                        <td className="px-4 sm:px-6 py-4 text-center align-middle">
                          <div className="flex flex-col items-center justify-center gap-1.5 sm:gap-2 h-full">
                            <span className={`text-[10px] sm:text-xs px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full font-medium whitespace-nowrap ${product.inStock ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-100 text-red-700 border border-red-200'}`}>
                              {product.inStock ? "In Stock" : "Out of Stock"}
                            </span>
                            
                            <label className="relative inline-flex items-center cursor-pointer mt-1">
                              <input
                                type="checkbox"
                                className="sr-only peer" 
                                onChange={() => toggleStock(product.id)} 
                                checked={product.inStock}
                              />
                              <div className="w-8 sm:w-10 h-4 sm:h-5 bg-gray-300 rounded-full peer peer-checked:bg-green-500 transition-all"></div>
                              <span className="absolute left-[3px] top-[3px] sm:top-[3px] w-2.5 sm:w-3.5 h-2.5 sm:h-3.5 bg-white rounded-full transition-transform peer-checked:translate-x-4 sm:peer-checked:translate-x-5"></span>
                            </label>
                          </div>
                        </td>

                        {/* Column 6: Actions */}
                        <td className="px-4 sm:px-6 py-4 text-center align-middle">
                          <div className="flex justify-center items-center gap-2 flex-wrap xl:flex-nowrap h-full">
                            {editingProduct === product.id ? (
                              <button
                                onClick={() => handleEditSubmit(product.id)}
                                className="flex items-center justify-center gap-1 sm:gap-1.5 bg-green-500 hover:bg-green-600 text-white px-2 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-sm shadow-sm transition-colors w-full xl:w-auto"
                              >
                                Save
                              </button>
                            ) : (
                              <button
                                onClick={() => handleEditClick(product)}
                                className="flex items-center justify-center gap-1 sm:gap-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 px-2 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-sm transition-colors w-full xl:w-auto font-medium"
                              >
                                <Pencil className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" /> Edit
                              </button>
                            )}
                            
                            <button
                              onClick={() => handleDelete(product.id)}
                              className="flex items-center justify-center gap-1 sm:gap-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-2 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-sm transition-colors w-full xl:w-auto font-medium"
                            >
                              <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" /> Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                ) : (
                    <tr>
                        <td colSpan="6" className="text-center py-12 sm:py-16 text-gray-400 font-medium text-sm sm:text-base">
                            No products found matching "{searchTerm}"
                        </td>
                    </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination Controls */}
          {filteredProducts.length > 0 && (
            <div className="p-3 sm:p-4 border-t border-gray-100 bg-gray-50 flex justify-between items-center shrink-0">
               <span className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider">
                 Page {currentPage} of {totalPages}
               </span>
               <div className="flex gap-1.5 sm:gap-2">
                  <button 
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                    disabled={currentPage === 1} 
                    className="p-1 sm:p-1.5 border border-gray-200 rounded-lg bg-white hover:bg-gray-100 disabled:opacity-50 text-gray-600 transition-colors shadow-sm"
                  >
                    <ChevronLeft size={16} className="sm:w-5 sm:h-5"/>
                  </button>
                  <button 
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
                    disabled={currentPage === totalPages} 
                    className="p-1 sm:p-1.5 border border-gray-200 rounded-lg bg-white hover:bg-gray-100 disabled:opacity-50 text-gray-600 transition-colors shadow-sm"
                  >
                    <ChevronRight size={16} className="sm:w-5 sm:h-5"/>
                  </button>
               </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}