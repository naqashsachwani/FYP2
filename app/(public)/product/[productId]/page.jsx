// Marks this component as a Client Component, allowing the use of React hooks like useState and useEffect in Next.js 13+.
'use client' 

// --- React & Next.js Imports ---
import { useEffect, useState } from "react";
import { useParams } from "next/navigation"; 
import { useSelector } from "react-redux"; 
import Link from "next/link"; 

// --- Custom Components ---
import ProductDescription from "@/components/ProductDescription";
import ProductDetails from "@/components/ProductDetails";

export default function Product() {

    // Extracts the dynamic productId from the URL route parameters (e.g., /product/123 -> productId = 123)
    const { productId } = useParams();

    // Access the global product list from the Redux store state
    const products = useSelector(state => state.product.list);
    
    // Local state to store the specific selected product's details
    const [product, setProduct] = useState(null);

    // Local state to control the loading UI while data is being fetched or resolved
    const [loading, setLoading] = useState(true);

    // --- FIXED: Always fetch fresh data to prevent Redux from hiding images ---
    // This asynchronous function ensures the UI is hydrated with the most up-to-date product info
    const fetchProduct = async () => {

        // 1. Try to find product in Redux store for an INSTANT initial load
        // This prevents the user from staring at a loading screen if we already downloaded the product list earlier.
        const foundInRedux = products.find(
            (item) => item.id === productId
        );

        // If found in the global state, set it immediately and turn off the loading spinner.
        if (foundInRedux) {
            setProduct(foundInRedux);
            setLoading(false);
        }

        // 2. ALWAYS fetch from the API in the background (Notice the 'else' is gone!)
        // Even if we found the product in Redux, we make a network call to guarantee data freshness.
        try {
            const res = await fetch(`/api/products/${productId}`, {
                cache: 'no-store' // Force Next.js to bypass its aggressive caching and hit the database
            });

            // Error handling for the network request
            if (!res.ok) {
                // Only show a hard error/stop loading if we also didn't have fallback Redux data
                if (!foundInRedux) {
                    console.error("Product not found");
                    setLoading(false);
                }
                return; // Exit the function early if the fetch failed
            }

            // Convert the successful HTTP response to a JSON object
            const data = await res.json();

            // Silently overwrite the Redux data (if any) with the 100% fresh API data
            setProduct(data.product || data);

        } catch (error) {
            // Catch and log severe network failures
            console.error("Failed to fetch fresh product data:", error);
        } finally {
            // Ensure the loading state is turned off regardless of success or failure
            setLoading(false);
        }
    };

    // The useEffect hook manages side-effects and runs when the component mounts or dependencies change
    useEffect(() => {
        // Fetch product whenever the URL parameter (productId) or Redux products array changes
        if (productId) {
            fetchProduct();
        }

        // UX feature: Force the browser window to scroll to the top when navigating to a new product page
        window.scrollTo(0, 0);

    }, [productId, products]); // Dependency array ensures re-fetch on route change or store update

    // --- RENDER GUARDS ---
    // Prevents rendering the main layout before data is available
    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="text-xl font-medium text-gray-500 animate-pulse">
                    Loading product details...
                </div>
            </div>
        );
    }

    // 404 / Invalid Product State
    // Graceful error handling for a wrong productId (data finished loading, but 'product' is still null)
    if (!product) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
                <p className="text-xl text-gray-600">Product not found.</p>
                <Link href="/products" className="text-blue-600 hover:underline">
                    Back to Shop
                </Link>
            </div>
        );
    }

    // --- MAIN RENDER LOGIC ---
    return (
        <div className="mx-6">
            <div className="max-w-7xl mx-auto">

                {/* Breadcrumb Navigation Loop */}
                <div className="text-gray-500 text-sm mt-8 mb-5 flex items-center gap-2">
                    <Link href="/" className="hover:text-black transition-colors">
                        Home
                    </Link>
                    <span>/</span>
                    <Link href="/products" className="hover:text-black transition-colors">
                        Products
                    </Link>
                    <span>/</span>
                    {/* Displays the category of the currently loaded product */}
                    <span className="font-medium text-gray-800 cursor-default">
                        {product.category}
                    </span>
                </div>

                {/* Product main details component (handles price, image gallery, add to cart, etc.) */}
                <ProductDetails product={product} />

                {/* Product description / technical specs section */}
                <div className="mt-10">
                    <ProductDescription product={product} />
                </div>
                
            </div>
        </div>
    );
}