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
            <div className="mb-5 sm:mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 border-b border-slate-200 pb-4 mt-5 sm:mt-6">
                
                {/* Title Section */}
                <h2 className="text-lg sm:text-xl font-bold text-slate-800 flex items-center gap-2">
                    <LayoutGrid className="text-emerald-600 w-5 h-5 sm:w-6 sm:h-6" />
                    Store Products 
                    <span className="text-slate-400 text-sm sm:text-base font-medium ml-1">
                        ({processedProducts.length})
                    </span>
                </h2>

                {/* Filter Controls */}
                {products.length > 0 && (
                    <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 w-full sm:w-auto">
                        
                        {/* Category Filter Dropdown */}
                        <div className="relative w-full sm:w-44 shrink-0">
                            <select 
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="w-full pl-3 sm:pl-4 pr-10 py-2 sm:py-2.5 bg-white border border-slate-200 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium text-slate-700 appearance-none focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 cursor-pointer transition-shadow shadow-sm"
                            >
                                {categories.map(cat => (
                                    <option key={cat} value={cat}>
                                        {cat === "All" ? "All Categories" : cat}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none w-4 h-4 sm:w-5 sm:h-5" />
                        </div>

                        {/* Sort Order Dropdown */}
                        <div className="relative w-full sm:w-44 shrink-0">
                            <select 
                                value={sortOrder}
                                onChange={(e) => setSortOrder(e.target.value)}
                                className="w-full pl-3 sm:pl-4 pr-10 py-2 sm:py-2.5 bg-white border border-slate-200 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium text-slate-700 appearance-none focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 cursor-pointer transition-shadow shadow-sm"
                            >
                                <option value="default">Sort by: Default</option>
                                <option value="price-asc">Price: Low to High</option>
                                <option value="price-desc">Price: High to Low</option>
                                <option value="name-asc">Name: A to Z</option>
                                <option value="name-desc">Name: Z to A</option>
                            </select>
                            
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none w-4 h-4 sm:w-5 sm:h-5" />
                        </div>
                    </div>
                )}
            </div>

            {products.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 sm:py-16 bg-white rounded-xl border border-dashed border-slate-300 shadow-sm">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 bg-slate-50 rounded-full flex items-center justify-center mb-2.5 sm:mb-3">
                        <StoreIcon className="text-slate-300 w-6 h-6 sm:w-7 sm:h-7" />
                    </div>
                    <h3 className="text-sm sm:text-base font-semibold text-slate-700">No products available</h3>
                    <p className="text-slate-500 mt-1 text-xs sm:text-sm">This store hasn't listed any active products yet.</p>
                </div>
            ) 
            
            : currentProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 sm:py-16 bg-white rounded-xl border border-slate-100 shadow-sm">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 bg-slate-50 rounded-full flex items-center justify-center mb-2.5 sm:mb-3">
                        <PackageX className="text-slate-300 w-6 h-6 sm:w-7 sm:h-7" />
                    </div>
                    <h3 className="text-sm sm:text-base font-semibold text-slate-700">No matches found</h3>
                    <p className="text-slate-500 mt-1 text-xs sm:text-sm">We couldn't find anything matching your filters.</p>
                    <button 
                        onClick={() => { setSelectedCategory("All"); setSortOrder("default"); }}
                        className="mt-3 sm:mt-4 text-xs sm:text-sm font-bold text-emerald-600 hover:text-emerald-700 hover:underline"
                    >
                        Clear Filters
                    </button>
                </div>
            ) 
            
            : (
                <div className="flex flex-col">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6 pb-8 sm:pb-10">
                        {currentProducts.map(product => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>

                    {/* ✅ Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="mt-2 sm:mt-4 mb-8 sm:mb-10 pt-5 sm:pt-6 border-t border-slate-200 flex justify-between items-center">
                            <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-500">
                                Page {currentPage} of {totalPages}
                            </span>
                            <div className="flex gap-1.5 sm:gap-2">
                                <button 
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                                    disabled={currentPage === 1} 
                                    className="p-1.5 sm:p-2 border border-slate-200 rounded-lg sm:rounded-xl bg-white hover:bg-slate-50 disabled:opacity-50 text-slate-600 transition-colors shadow-sm"
                                >
                                    <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5"/>
                                </button>
                                <button 
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
                                    disabled={currentPage === totalPages} 
                                    className="p-1.5 sm:p-2 border border-slate-200 rounded-lg sm:rounded-xl bg-white hover:bg-slate-50 disabled:opacity-50 text-slate-600 transition-colors shadow-sm"
                                >
                                    <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5"/>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </>
    );
}