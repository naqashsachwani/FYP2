'use client' 

import { Suspense, useState, useMemo, useEffect } from "react"
import { useSelector } from "react-redux" 
import { useSearchParams } from "next/navigation" 
import { ChevronDown, PackageX, SlidersHorizontal, ChevronLeft, ChevronRight } from "lucide-react" 
import ProductCard from "@/components/ProductCard" 

function ShopContent() {
    const [isMounted, setIsMounted] = useState(false)

    const products = useSelector(state => state.product.list)
    const searchParams = useSearchParams()
    const searchQuery = searchParams.get("search")?.toLowerCase() || ""

    const [selectedCategory, setSelectedCategory] = useState("All")
    const [sortOrder, setSortOrder] = useState("default")
    const [minPrice, setMinPrice] = useState("")
    const [maxPrice, setMaxPrice] = useState("")
    
    const [showMobileFilters, setShowMobileFilters] = useState(false)
    
    // ✅ Pagination State
    const [currentPage, setCurrentPage] = useState(1)
    const ITEMS_PER_PAGE = 12

    useEffect(() => {
        setIsMounted(true)
    }, [])

    // ✅ Reset pagination when filters change
    useEffect(() => {
        setCurrentPage(1)
    }, [searchQuery, selectedCategory, sortOrder, minPrice, maxPrice])

    const predefinedCategories = [
        "Electronics", "Men's Fashion", "Women's Fashion", "Home & Kitchen",
        "Sports & Outdoors", "Beauty & Personal Care", "Automotive & JDM",
        "Toys & Games", "Health & Wellness", "Books & Stationery",
        "Jewelry", "Watches", "Groceries", "Pet Supplies",
        "Tools & Home Improvement", "Furniture", "Office Supplies"
    ];
    
    const dynamicCategories = products.map(p => p.category).filter(Boolean);
    const uniqueCategories = [...new Set([...predefinedCategories, ...dynamicCategories])].sort();
    const categories = ["All", ...uniqueCategories];

    // --- FILTER & SORT LOGIC  ---
    const processedProducts = useMemo(() => {
        let result = products.filter(product => {
            const matchesCategory = selectedCategory === "All" || product.category === selectedCategory;

            const matchesSearch = !searchQuery || 
                product.name?.toLowerCase().includes(searchQuery) ||
                product.category?.toLowerCase().includes(searchQuery) ||
                product.description?.toLowerCase().includes(searchQuery);

            const price = product.price || 0;
            const min = minPrice === "" ? 0 : Number(minPrice);
            const max = maxPrice === "" ? Infinity : Number(maxPrice);
            const matchesPrice = price >= min && price <= max;

            return matchesCategory && matchesSearch && matchesPrice;
        });

        switch (sortOrder) {
            case "price-asc": return result.sort((a, b) => (a.price || 0) - (b.price || 0)); 
            case "price-desc": return result.sort((a, b) => (b.price || 0) - (a.price || 0)); 
            case "name-asc": return result.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
            case "name-desc": return result.sort((a, b) => (b.name || "").localeCompare(a.name || "")); 
            default: return result; 
        }
    }, [products, searchQuery, selectedCategory, minPrice, maxPrice, sortOrder]);

    const clearFilters = () => {
        setSelectedCategory("All");
        setSortOrder("default");
        setMinPrice("");
        setMaxPrice("");
        setCurrentPage(1);
    };

    // ✅ Pagination Logic
    const totalPages = Math.max(1, Math.ceil(processedProducts.length / ITEMS_PER_PAGE));
    const currentProducts = processedProducts.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    if (!isMounted) {
        return (
            <div className="min-h-[70vh] flex items-center justify-center">
                <div className="animate-pulse flex flex-col items-center">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mb-3 sm:mb-4"></div>
                    <p className="text-slate-500 font-medium text-sm sm:text-base">Loading store...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-[70vh] mx-3 sm:mx-6 flex flex-col">
            <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col">
                
                <div className="flex flex-col lg:flex-row lg:items-end justify-between mt-6 sm:mt-8 mb-6 sm:mb-8 gap-4 sm:gap-6 shrink-0">
                    
                    {/* Title & Mobile Filter Toggle Button */}
                    <div className="flex items-center justify-between">
                        <h1 className="text-xl sm:text-2xl text-slate-500 truncate pr-2"> 
                            {searchQuery ? (
                                <>Results for <span className="text-slate-800 font-bold">"{searchParams.get("search")}"</span></>
                            ) : (
                                <>All <span className="text-slate-800 font-bold">Products</span></>
                            )}
                        </h1>
                        
                        <button 
                            onClick={() => setShowMobileFilters(!showMobileFilters)}
                            className="lg:hidden flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-slate-100 text-slate-700 rounded-lg sm:rounded-xl font-bold text-xs sm:text-sm shrink-0"
                        >
                            <SlidersHorizontal size={16} className="sm:w-[18px] sm:h-[18px]" /> Filters
                        </button>
                    </div>

                    <div className={`flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2.5 sm:gap-3 ${showMobileFilters ? 'flex' : 'hidden lg:flex'}`}>
                        
                        {/* Category Dropdown */}
                        <div className="relative w-full sm:w-44 lg:w-48 shrink-0">
                            <select 
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="w-full pl-3 sm:pl-4 pr-10 py-2.5 sm:py-3 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-700 appearance-none focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500 cursor-pointer transition-all shadow-sm"
                            >
                                {categories.map(cat => (
                                    <option key={cat} value={cat}>
                                        {cat === "All" ? "All Categories" : cat}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none w-4 h-4 sm:w-5 sm:h-5" />
                        </div>

                        {/* Price Range */}
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <input 
                                type="number" placeholder="Min Rs" value={minPrice} onChange={(e) => setMinPrice(e.target.value)}
                                className="w-full sm:w-20 md:w-24 px-3 py-2.5 sm:py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500 text-xs sm:text-sm text-slate-700 shadow-sm placeholder:text-slate-400 transition-shadow"
                            />
                            <span className="text-slate-400 font-medium">-</span>
                            <input 
                                type="number" placeholder="Max Rs" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)}
                                className="w-full sm:w-20 md:w-24 px-3 py-2.5 sm:py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500 text-xs sm:text-sm text-slate-700 shadow-sm placeholder:text-slate-400 transition-shadow"
                            />
                        </div>

                        {/* Sort Dropdown */}
                        <div className="relative w-full sm:w-44 lg:w-48 shrink-0">
                            <select 
                                value={sortOrder}
                                onChange={(e) => setSortOrder(e.target.value)}
                                className="w-full pl-3 sm:pl-4 pr-10 py-2.5 sm:py-3 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-700 appearance-none focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500 cursor-pointer transition-all shadow-sm"
                            >
                                <option value="default">Sort by: Default</option>
                                <option value="price-asc">Price: Low to High</option>
                                <option value="price-desc">Price: High to Low</option>
                                <option value="name-asc">Name: A to Z</option>
                                <option value="name-desc">Name: Z to A</option>
                            </select>
                            
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none w-4 h-4 sm:w-5 sm:h-5" />
                        </div>

                        {/* Clear Filters */}
                        {(selectedCategory !== "All" || sortOrder !== "default" || minPrice || maxPrice) && (
                            <button 
                                onClick={clearFilters}
                                className="w-full sm:w-auto px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-bold text-red-500 bg-red-50 sm:bg-transparent hover:bg-red-100 sm:hover:bg-red-50 rounded-xl transition-colors"
                            >
                                Clear
                            </button>
                        )}
                    </div>
                </div>
                
                {currentProducts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 sm:py-20 px-4 text-center bg-white rounded-2xl sm:rounded-3xl border border-slate-100 shadow-sm mb-20 sm:mb-32">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-50 rounded-full flex items-center justify-center mb-3 sm:mb-4">
                            <PackageX className="text-slate-300 w-8 h-8 sm:w-10 sm:h-10" />
                        </div>
                        <h3 className="text-lg sm:text-xl font-bold text-slate-800 mb-1.5 sm:mb-2">No products found</h3>
                        <p className="text-slate-500 text-xs sm:text-sm max-w-md">We couldn't find any items matching your current filters and search query.</p>
                        <button onClick={clearFilters} className="mt-5 sm:mt-6 px-5 sm:px-6 py-2.5 bg-green-50 text-green-700 font-bold rounded-xl hover:bg-green-100 transition-colors text-sm">
                            Reset Filters
                        </button>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col">
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6 xl:gap-8 mx-auto mb-10 w-full">
                            {currentProducts.map((product) => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </div>

                        {/* ✅ Pagination Controls */}
                        {totalPages > 1 && (
                            <div className="mt-auto mb-12 sm:mb-16 pt-6 sm:pt-8 border-t border-slate-200 flex justify-between items-center">
                                <span className="text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-wider">
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
            </div>
        </div>
    )
}

export default function Shop() {
  return (
    <Suspense fallback={
        <div className="min-h-[70vh] flex items-center justify-center">
            <div className="animate-pulse flex flex-col items-center">
                <div className="w-10 h-10 sm:w-12 sm:h-12 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mb-3 sm:mb-4"></div>
                <p className="text-slate-500 font-medium text-sm sm:text-base">Loading store...</p>
            </div>
        </div>
    }>
      <ShopContent />
    </Suspense>
  );
}