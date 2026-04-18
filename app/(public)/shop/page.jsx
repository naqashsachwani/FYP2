'use client' 

import { Suspense, useState } from "react"
import { useSelector } from "react-redux"
import { ChevronDown, PackageX } from "lucide-react"
import ProductCard from "@/components/ProductCard"

function ShopContent() {
    const products = useSelector(state => state.product.list)

    // Local state for the category filter
    const [selectedCategory, setSelectedCategory] = useState("All")

    // 15+ predefined categories for your platform
    const predefinedCategories = [
        "Electronics",
        "Men's Fashion",
        "Women's Fashion",
        "Home & Kitchen",
        "Sports & Outdoors",
        "Beauty & Personal Care",
        "Automotive & JDM",
        "Toys & Games",
        "Health & Wellness",
        "Books & Stationery",
        "Jewelry",
        "Watches",
        "Groceries",
        "Pet Supplies",
        "Tools & Home Improvement",
        "Furniture",
        "Office Supplies"
    ];

    // Extract any categories currently in the database to ensure we don't miss anything
    const dynamicCategories = products.map(p => p.category).filter(Boolean);
    
    // Merge predefined + dynamic categories, remove duplicates, and sort alphabetically
    const uniqueCategories = [...new Set([...predefinedCategories, ...dynamicCategories])].sort();
    
    // Add "All" to the very top of the list
    const categories = ["All", ...uniqueCategories];

    // Filter logic: Only match the selected category
    const filteredProducts = selectedCategory === "All" 
        ? products 
        : products.filter(product => product.category === selectedCategory);

    return (
        <div className="min-h-[70vh] mx-4 sm:mx-6">
            <div className="max-w-7xl mx-auto">
                
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-8 mb-8 gap-4">
                    <h1 className="text-2xl text-slate-500"> 
                        All <span className="text-slate-800 font-bold">Products</span>
                    </h1>

                    {/* ================= CATEGORY DROPDOWN ================= */}
                    <div className="relative w-full sm:w-80 shrink-0 shadow-sm rounded-2xl">
                        <select 
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="w-full pl-5 pr-10 py-3.5 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500 transition-all text-slate-700 font-medium appearance-none cursor-pointer hover:border-slate-300 shadow-sm"
                        >
                            {categories.map(cat => (
                                <option key={cat} value={cat}>
                                    {cat === "All" ? "Browse All Categories" : cat}
                                </option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={20} />
                    </div>
                </div>

                {/* ================= PRODUCT GRID ================= */}
                {filteredProducts.length === 0 ? (
                    
                    // Empty State UI (When a category has no products)
                    <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-white rounded-3xl border border-slate-100 shadow-sm mb-32">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                            <PackageX className="text-slate-300 w-10 h-10" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">No products found</h3>
                        <p className="text-slate-500">We don't have any items in the <b>{selectedCategory}</b> category yet.</p>
                        <button 
                            onClick={() => setSelectedCategory("All")}
                            className="mt-6 px-6 py-2.5 bg-green-50 text-green-700 font-bold rounded-xl hover:bg-green-100 transition-colors"
                        >
                            View All Products
                        </button>
                    </div>

                ) : (
                    
                    // Display Products
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 xl:gap-8 mx-auto mb-32">
                        {filteredProducts.map((product) => (
                            <ProductCard 
                                key={product.id} 
                                product={product} 
                            />
                        ))}
                    </div>
                    
                )}
            </div>
        </div>
    )
}

export default function Shop() {
  return (
    <Suspense fallback={
        <div className="min-h-[70vh] flex items-center justify-center">
            <div className="animate-pulse flex flex-col items-center">
                <div className="w-12 h-12 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mb-4"></div>
                <p className="text-slate-500 font-medium">Loading store...</p>
            </div>
        </div>
    }>
      <ShopContent />
    </Suspense>
  );
}