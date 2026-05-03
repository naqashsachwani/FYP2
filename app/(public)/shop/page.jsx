'use client' 

import { Suspense, useState, useMemo, useEffect } from "react"
import { useSelector } from "react-redux" 
import { useSearchParams } from "next/navigation" 
import { ChevronDown, PackageX, SlidersHorizontal } from "lucide-react" 
import ProductCard from "@/components/ProductCard" 

function ShopContent() {
    // ✅ FIX: Track when the component has mounted on the client
    const [isMounted, setIsMounted] = useState(false)

    const products = useSelector(state => state.product.list)
    const searchParams = useSearchParams()
    const searchQuery = searchParams.get("search")?.toLowerCase() || ""

    const [selectedCategory, setSelectedCategory] = useState("All")
    const [sortOrder, setSortOrder] = useState("default")
    const [minPrice, setMinPrice] = useState("")
    const [maxPrice, setMaxPrice] = useState("")
    
    const [showMobileFilters, setShowMobileFilters] = useState(false)

    // ✅ FIX: Set mounted to true after first client-side render
    useEffect(() => {
        setIsMounted(true)
    }, [])

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
    };

    // ✅ FIX: Show a loading state during SSR to prevent Hydration mismatches
    if (!isMounted) {
        return (
            <div className="min-h-[70vh] flex items-center justify-center">
                <div className="animate-pulse flex flex-col items-center">
                    <div className="w-12 h-12 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mb-4"></div>
                    <p className="text-slate-500 font-medium">Loading store...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-[70vh] mx-4 sm:mx-6">
            <div className="max-w-7xl mx-auto">
                
                <div className="flex flex-col lg:flex-row lg:items-end justify-between mt-8 mb-8 gap-6">
                    
                    {/* Title & Mobile Filter Toggle Button */}
                    <div className="flex items-center justify-between">
                        <h1 className="text-2xl text-slate-500"> 
                            {searchQuery ? (
                                <>Results for <span className="text-slate-800 font-bold">"{searchParams.get("search")}"</span></>
                            ) : (
                                <>All <span className="text-slate-800 font-bold">Products</span></>
                            )}
                        </h1>
                        
                        <button 
                            onClick={() => setShowMobileFilters(!showMobileFilters)}
                            className="lg:hidden flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-medium"
                        >
                            <SlidersHorizontal size={18} /> Filters
                        </button>
                    </div>

                    <div className={`flex flex-col sm:flex-row flex-wrap items-center gap-3 ${showMobileFilters ? 'flex' : 'hidden lg:flex'}`}>
                        
                        {/* Category Dropdown */}
                        <div className="relative w-full sm:w-48 shrink-0">
                            <select 
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="w-full pl-4 pr-10 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500 text-sm text-slate-700 font-medium appearance-none cursor-pointer shadow-sm"
                            >
                                {categories.map(cat => (
                                    <option key={cat} value={cat}>
                                        {cat === "All" ? "All Categories" : cat}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                        </div>

                        {/* Price Range */}
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <input 
                                type="number" placeholder="Min Rs" value={minPrice} onChange={(e) => setMinPrice(e.target.value)}
                                className="w-full sm:w-24 px-3 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500 text-sm text-slate-700 shadow-sm placeholder:text-slate-400"
                            />
                            <span className="text-slate-400 font-medium">-</span>
                            <input 
                                type="number" placeholder="Max Rs" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)}
                                className="w-full sm:w-24 px-3 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500 text-sm text-slate-700 shadow-sm placeholder:text-slate-400"
                            />
                        </div>

                        {/* Sort Dropdown */}
                        <div className="relative w-full sm:w-48 shrink-0">
                            <select 
                                value={sortOrder}
                                onChange={(e) => setSortOrder(e.target.value)}
                                className="w-full pl-4 pr-10 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500 text-sm text-slate-700 font-medium appearance-none cursor-pointer shadow-sm"
                            >
                                <option value="default">Sort by: Default</option>
                                <option value="price-asc">Price: Low to High</option>
                                <option value="price-desc">Price: High to Low</option>
                                <option value="name-asc">Name: A to Z</option>
                                <option value="name-desc">Name: Z to A</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                        </div>

                        {/* Clear Filters */}
                        {(selectedCategory !== "All" || sortOrder !== "default" || minPrice || maxPrice) && (
                            <button 
                                onClick={clearFilters}
                                className="w-full sm:w-auto px-4 py-3 text-sm font-medium text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl transition-colors"
                            >
                                Clear
                            </button>
                        )}
                    </div>
                </div>
                
                {processedProducts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-white rounded-3xl border border-slate-100 shadow-sm mb-32">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                            <PackageX className="text-slate-300 w-10 h-10" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">No products found</h3>
                        <p className="text-slate-500 max-w-md">We couldn't find any items matching your current filters and search query.</p>
                        <button onClick={clearFilters} className="mt-6 px-6 py-2.5 bg-green-50 text-green-700 font-bold rounded-xl hover:bg-green-100 transition-colors">
                            Reset Filters
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 xl:gap-8 mx-auto mb-32">
                        {processedProducts.map((product) => (
                            <ProductCard key={product.id} product={product} />
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