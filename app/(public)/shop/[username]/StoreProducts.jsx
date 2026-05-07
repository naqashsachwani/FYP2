'use client';

import { useState, useMemo, useEffect } from "react";
import ProductCard from "@/components/ProductCard"; 
import { LayoutGrid, ChevronDown, StoreIcon, PackageX, ChevronLeft, ChevronRight } from "lucide-react"; 

export default function StoreProducts({ products }) {
    
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [sortOrder, setSortOrder] = useState("default");

    // ✅ Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 12;

    // ✅ Reset pagination when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [selectedCategory, sortOrder]);

    const categories = useMemo(() => {
        const predefinedCategories = [
            "Electronics", "Men's Fashion", "Women's Fashion", "Home & Kitchen",
            "Sports & Outdoors", "Beauty & Personal Care", "Automotive & JDM",
            "Toys & Games", "Health & Wellness", "Books & Stationery",
            "Jewelry", "Watches", "Groceries", "Pet Supplies",
            "Tools & Home Improvement", "Furniture", "Office Supplies"
        ];
        
        const dynamicCategories = products.map(p => p.category).filter(Boolean);
        const uniqueCategories = [...new Set([...predefinedCategories, ...dynamicCategories])].sort();
        
        return ["All", ...uniqueCategories];
    }, [products]); 

    // --- Product Filtering & Sorting Engine ---
    const processedProducts = useMemo(() => {
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

    // ✅ Pagination Logic
    const totalPages = Math.max(1, Math.ceil(processedProducts.length / ITEMS_PER_PAGE));
    const currentProducts = processedProducts.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    return (
        <>
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4 mt-6">
                
                {/* Title Section */}
                <h2 className="text-lg sm:text-xl font-bold text-slate-800 flex items-center gap-2">
                    <LayoutGrid className="text-emerald-600" size={20} />
                    Store Products 
                    <span className="text-slate-400 text-base font-medium ml-1">
                        ({processedProducts.length})
                    </span>
                </h2>

                {/* Filter Controls */}
                {products.length > 0 && (
                    <div className="flex flex-col sm:flex-row gap-3">
                        
                        {/* Category Filter Dropdown */}
                        <div className="relative w-full sm:w-44">
                            <select 
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="w-full pl-4 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 appearance-none focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 cursor-pointer transition-all shadow-sm"
                            >
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

            {products.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-dashed border-slate-300 shadow-sm">
                    <div className="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                        <StoreIcon size={28} className="text-slate-300" />
                    </div>
                    <h3 className="text-base font-semibold text-slate-700">No products available</h3>
                    <p className="text-slate-500 mt-1 text-sm">This store hasn't listed any active products yet.</p>
                </div>
            ) 
            
            : currentProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-slate-100 shadow-sm">
                    <div className="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                        <PackageX size={28} className="text-slate-300" />
                    </div>
                    <h3 className="text-base font-semibold text-slate-700">No matches found</h3>
                    <p className="text-slate-500 mt-1 text-sm">We couldn't find anything matching your filters.</p>
                    <button 
                        onClick={() => { setSelectedCategory("All"); setSortOrder("default"); }}
                        className="mt-4 text-sm font-bold text-emerald-600 hover:text-emerald-700 hover:underline"
                    >
                        Clear Filters
                    </button>
                </div>
            ) 
            
            : (
                <div className="flex flex-col">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 pb-10">
                        {currentProducts.map(product => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>

                    {/* ✅ Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="mt-4 mb-10 pt-6 border-t border-slate-200 flex justify-between items-center">
                            <span className="text-sm font-medium text-slate-500">
                                Page {currentPage} of {totalPages}
                            </span>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                                    disabled={currentPage === 1} 
                                    className="p-2 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 disabled:opacity-50 text-slate-600 transition-colors shadow-sm"
                                >
                                    <ChevronLeft size={18}/>
                                </button>
                                <button 
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
                                    disabled={currentPage === totalPages} 
                                    className="p-2 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 disabled:opacity-50 text-slate-600 transition-colors shadow-sm"
                                >
                                    <ChevronRight size={18}/>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </>
    );
}