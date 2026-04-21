'use client';

import { useState, useMemo } from "react";
import ProductCard from "@/components/ProductCard"; 
import { LayoutGrid, ChevronDown, StoreIcon, PackageX } from "lucide-react"; 

export default function StoreProducts({ products }) {
    
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [sortOrder, setSortOrder] = useState("default");

    const categories = useMemo(() => {
      
        const predefinedCategories = [
            "Electronics", "Men's Fashion", "Women's Fashion", "Home & Kitchen",
            "Sports & Outdoors", "Beauty & Personal Care", "Automotive & JDM",
            "Toys & Games", "Health & Wellness", "Books & Stationery",
            "Jewelry", "Watches", "Groceries", "Pet Supplies",
            "Tools & Home Improvement", "Furniture", "Office Supplies"
        ];
        
        // This maps through the store's actual products to extract their categories.

        const dynamicCategories = products.map(p => p.category).filter(Boolean);
        
        // Merge predefined and dynamic categories.
        // Using `new Set()` automatically removes all duplicate entries.
        const uniqueCategories = [...new Set([...predefinedCategories, ...dynamicCategories])].sort();
        
        return ["All", ...uniqueCategories];
    }, [products]); 

    // --- Product Filtering & Sorting Engine ---
    const processedProducts = useMemo(() => {
        
        // Creates a new array containing only products that match the selected category.
        let result = products.filter(product => 
            selectedCategory === "All" || product.category === selectedCategory
        );

        switch (sortOrder) {
            case "price-asc":
                return result.sort((a, b) => (a.price || 0) - (b.price || 0));
            case "price-desc":
                return result.sort((a, b) => (b.price || 0) - (a.price || 0));
            case "name-asc":
                return result.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
            case "name-desc":
                return result.sort((a, b) => (b.name || "").localeCompare(a.name || ""));
            default:
                return result; 
        }
    }, [products, selectedCategory, sortOrder]); 

    return (
        <>
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4 mt-6">
                
                {/* Title Section */}
                <h2 className="text-lg sm:text-xl font-bold text-slate-800 flex items-center gap-2">
                    <LayoutGrid className="text-emerald-600" size={20} />
                    Store Products 
                    {/* Displays the dynamic count of products currently visible based on filters */}
                    <span className="text-slate-400 text-base font-medium ml-1">
                        ({processedProducts.length})
                    </span>
                </h2>

                {/* Filter Controls (Only renders if the store actually has products) */}
                {products.length > 0 && (
                    <div className="flex flex-col sm:flex-row gap-3">
                        
                        {/* Category Filter Dropdown */}
                        <div className="relative w-full sm:w-44">
                            <select 
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="w-full pl-4 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 appearance-none focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 cursor-pointer transition-all shadow-sm"
                            >
                                {/* Maps over our generated categories array to build the <option> list */}
                                {categories.map(cat => (
                                    <option key={cat} value={cat}>
                                        {cat === "All" ? "All Categories" : cat}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                        </div>

                        {/* Sort Order Dropdown */}
                        <div className="relative w-full sm:w-48">
                            <select 
                                value={sortOrder}
                                onChange={(e) => setSortOrder(e.target.value)}
                                className="w-full pl-4 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 appearance-none focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 cursor-pointer transition-all shadow-sm"
                            >
                                <option value="default">Sort by: Default</option>
                                <option value="price-asc">Price: Low to High</option>
                                <option value="price-desc">Price: High to Low</option>
                                <option value="name-asc">Name: A to Z</option>
                                <option value="name-desc">Name: Z to A</option>
                            </select>
                            
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                        </div>
                    </div>
                )}
            </div>

            {/* The store has absolutely zero products in the database */}
            {products.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-dashed border-slate-300 shadow-sm">
                    <div className="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                        <StoreIcon size={28} className="text-slate-300" />
                    </div>
                    <h3 className="text-base font-semibold text-slate-700">No products available</h3>
                    <p className="text-slate-500 mt-1 text-sm">This store hasn't listed any active products yet.</p>
                </div>
            ) 
            
            /*The store has products, but the current category filter resulted in 0 matches */
            : processedProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-slate-100 shadow-sm">
                    <div className="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                        <PackageX size={28} className="text-slate-300" />
                    </div>
                    <h3 className="text-base font-semibold text-slate-700">No matches found</h3>
                    <p className="text-slate-500 mt-1 text-sm">We couldn't find anything in the <b>{selectedCategory}</b> category.</p>
                    {/* Quick-action button to reset the category filter back to "All" */}
                    <button 
                        onClick={() => setSelectedCategory("All")}
                        className="mt-4 text-sm font-bold text-emerald-600 hover:text-emerald-700 hover:underline"
                    >
                        Clear Filters
                    </button>
                </div>
            ) 
            
            /* Products exist and match the filters. Render the grid. */
            : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 pb-12">
                    {/* Map over the processed array, rendering a Card for each product */}
                    {processedProducts.map(product => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>
            )}
        </>
    );
}