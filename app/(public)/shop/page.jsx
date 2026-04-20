// Designates this as a Next.js Client Component, allowing the use of React hooks (useState, useMemo) and browser-only APIs.
'use client' 

// --- React & Next.js Imports ---
import { Suspense, useState, useMemo } from "react"
import { useSelector } from "react-redux" // Hook to access global state from the Redux store
import { useSearchParams } from "next/navigation" // Hook to read URL query parameters (e.g., ?search=phone)

// --- UI & Custom Components ---
import { ChevronDown, PackageX, SlidersHorizontal } from "lucide-react" // Lightweight SVG icons
import ProductCard from "@/components/ProductCard" // Reusable component for individual product display

// ================= INTERNAL COMPONENT =================
// We separate the main logic into ShopContent so it can be wrapped in a <Suspense> boundary later.
function ShopContent() {
    // Extract the global list of products fetched previously and stored in Redux.
    const products = useSelector(state => state.product.list)
    
    // Extract the search query from the URL (if any exists) and normalize it to lowercase for case-insensitive matching.
    const searchParams = useSearchParams()
    const searchQuery = searchParams.get("search")?.toLowerCase() || ""

    // --- STATES FOR FILTERS & SORTING ---
    // Local state to manage user interactions with the filtering UI.
    const [selectedCategory, setSelectedCategory] = useState("All")
    const [sortOrder, setSortOrder] = useState("default")
    const [minPrice, setMinPrice] = useState("")
    const [maxPrice, setMaxPrice] = useState("")
    
    // Toggles the visibility of the filter toolbar on mobile devices.
    const [showMobileFilters, setShowMobileFilters] = useState(false)

    // --- CATEGORY GENERATION ---
    // 1. Define a static, predefined list of categories to ensure common departments always exist in the UI.
    const predefinedCategories = [
        "Electronics", "Men's Fashion", "Women's Fashion", "Home & Kitchen",
        "Sports & Outdoors", "Beauty & Personal Care", "Automotive & JDM",
        "Toys & Games", "Health & Wellness", "Books & Stationery",
        "Jewelry", "Watches", "Groceries", "Pet Supplies",
        "Tools & Home Improvement", "Furniture", "Office Supplies"
    ];
    
    // 2. Extract categories from the actual products in the database. .filter(Boolean) removes null/undefined values.
    const dynamicCategories = products.map(p => p.category).filter(Boolean);
    
    // 3. Merge the two lists, use a Set to remove any duplicates, and sort them alphabetically.
    const uniqueCategories = [...new Set([...predefinedCategories, ...dynamicCategories])].sort();
    
    // 4. Prepend "All" to the beginning of the list for the default reset state.
    const categories = ["All", ...uniqueCategories];

    // --- FILTER & SORT LOGIC (Memoized for performance) ---
    // useMemo ensures this heavy calculation only runs when the products or specific filter states change,
    // rather than running on every single component re-render.
    const processedProducts = useMemo(() => {
        
        // 1. Filtering Phase
        let result = products.filter(product => {
            // Check if the product's category matches the dropdown (or if 'All' is selected).
            const matchesCategory = selectedCategory === "All" || product.category === selectedCategory;

            // Check if the search query string exists anywhere in the product's name, category, or description.
            const matchesSearch = !searchQuery || 
                product.name?.toLowerCase().includes(searchQuery) ||
                product.category?.toLowerCase().includes(searchQuery) ||
                product.description?.toLowerCase().includes(searchQuery);

            // Check if the product's price falls between the user-defined min and max bounds.
            // If inputs are empty, default to 0 and Infinity to effectively bypass the check.
            const price = product.price || 0;
            const min = minPrice === "" ? 0 : Number(minPrice);
            const max = maxPrice === "" ? Infinity : Number(maxPrice);
            const matchesPrice = price >= min && price <= max;

            // The product must pass ALL active filters to be included in the final array.
            return matchesCategory && matchesSearch && matchesPrice;
        });

        // 2. Sorting Phase
        // Takes the filtered array and reorganizes it based on the user's dropdown selection.
        switch (sortOrder) {
            case "price-asc":
                return result.sort((a, b) => (a.price || 0) - (b.price || 0)); // Lowest to highest
            case "price-desc":
                return result.sort((a, b) => (b.price || 0) - (a.price || 0)); // Highest to lowest
            case "name-asc":
                return result.sort((a, b) => (a.name || "").localeCompare(b.name || "")); // A to Z
            case "name-desc":
                return result.sort((a, b) => (b.name || "").localeCompare(a.name || "")); // Z to A
            default:
                return result; // "default" leaves it in the original array order
        }
    }, [products, searchQuery, selectedCategory, minPrice, maxPrice, sortOrder]); // Dependency array for useMemo

    // --- UTILITY FUNCTION ---
    // Resets all state variables back to their default values, removing all active filters.
    const clearFilters = () => {
        setSelectedCategory("All");
        setSortOrder("default");
        setMinPrice("");
        setMaxPrice("");
    };

    // --- MAIN RENDER ---
    return (
        // Outer wrapper standardizing the minimum height and horizontal margins.
        <div className="min-h-[70vh] mx-4 sm:mx-6">
            <div className="max-w-7xl mx-auto">
                
                {/* ================= HEADER SECTION ================= */}
                <div className="flex flex-col lg:flex-row lg:items-end justify-between mt-8 mb-8 gap-6">
                    
                    {/* Title & Mobile Filter Toggle Button */}
                    <div className="flex items-center justify-between">
                        {/* Dynamically adjust the header text based on whether a URL search query exists. */}
                        <h1 className="text-2xl text-slate-500"> 
                            {searchQuery ? (
                                <>Results for <span className="text-slate-800 font-bold">"{searchParams.get("search")}"</span></>
                            ) : (
                                <>All <span className="text-slate-800 font-bold">Products</span></>
                            )}
                        </h1>
                        
                        {/* Mobile Filter Toggle: Only visible on smaller screens (lg:hidden). Toggles state on click. */}
                        <button 
                            onClick={() => setShowMobileFilters(!showMobileFilters)}
                            className="lg:hidden flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-medium"
                        >
                            <SlidersHorizontal size={18} />
                            Filters
                        </button>
                    </div>

                    {/* ================= FILTERS TOOLBAR ================= */}
                    {/* Wraps all filter inputs. Uses CSS to hide on mobile unless toggled open. Always visible on desktop. */}
                    <div className={`flex flex-col sm:flex-row flex-wrap items-center gap-3 ${showMobileFilters ? 'flex' : 'hidden lg:flex'}`}>
                        
                        {/* Category Dropdown (Controlled Input) */}
                        <div className="relative w-full sm:w-48 shrink-0">
                            <select 
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="w-full pl-4 pr-10 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500 text-sm text-slate-700 font-medium appearance-none cursor-pointer shadow-sm"
                            >
                                {/* Maps over the generated categories array to build <option> elements */}
                                {categories.map(cat => (
                                    <option key={cat} value={cat}>
                                        {cat === "All" ? "All Categories" : cat}
                                    </option>
                                ))}
                            </select>
                            {/* Custom chevron icon placed over the native dropdown arrow */}
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                        </div>

                        {/* Price Range Inputs (Min & Max) */}
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <input 
                                type="number" 
                                placeholder="Min Rs" 
                                value={minPrice}
                                onChange={(e) => setMinPrice(e.target.value)}
                                className="w-full sm:w-24 px-3 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500 text-sm text-slate-700 shadow-sm placeholder:text-slate-400"
                            />
                            <span className="text-slate-400 font-medium">-</span>
                            <input 
                                type="number" 
                                placeholder="Max Rs" 
                                value={maxPrice}
                                onChange={(e) => setMaxPrice(e.target.value)}
                                className="w-full sm:w-24 px-3 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500 text-sm text-slate-700 shadow-sm placeholder:text-slate-400"
                            />
                        </div>

                        {/* Sort Order Dropdown (Controlled Input) */}
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

                        {/* Clear Filters Button */}
                        {/* Conditionally renders ONLY if the user has altered a filter from its default state. */}
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

                {/* ================= PRODUCT GRID ================= */}
                {/* Rendering logic branches based on whether the filtered array has any items. */}
                {processedProducts.length === 0 ? (
                    
                    // Branch A: Empty State UI (No products match the filters/search)
                    <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-white rounded-3xl border border-slate-100 shadow-sm mb-32">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                            <PackageX className="text-slate-300 w-10 h-10" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">No products found</h3>
                        <p className="text-slate-500 max-w-md">
                            We couldn't find any items matching your current filters and search query.
                        </p>
                        <button 
                            onClick={clearFilters}
                            className="mt-6 px-6 py-2.5 bg-green-50 text-green-700 font-bold rounded-xl hover:bg-green-100 transition-colors"
                        >
                            Reset Filters
                        </button>
                    </div>

                ) : (
                    
                    // Branch B: Display Products Grid
                    // Responsive grid: 2 cols on mobile, 3 on tablet, 4 on large desktops.
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 xl:gap-8 mx-auto mb-32">
                        {/* Maps over the sorted/filtered array, generating a <ProductCard> for each. */}
                        {processedProducts.map((product) => (
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

// ================= DEFAULT EXPORT =================
// This is the actual component Next.js mounts for the /shop route.
export default function Shop() {
  return (
    // We wrap the entire ShopContent inside a React Suspense boundary.
    // This is strictly required by Next.js App Router because ShopContent uses 'useSearchParams()'.
    // While the URL parameters are resolving on the server/client, the fallback UI (a spinner) is displayed.
    <Suspense fallback={
        <div className="min-h-[70vh] flex items-center justify-center">
            <div className="animate-pulse flex flex-col items-center">
                {/* CSS animated spinning circle using Tailwind border utilities */}
                <div className="w-12 h-12 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mb-4"></div>
                <p className="text-slate-500 font-medium">Loading store...</p>
            </div>
        </div>
    }>
      <ShopContent />
    </Suspense>
  );
}