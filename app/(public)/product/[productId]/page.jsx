'use client' 

import { useEffect, useState } from "react";
import { useParams } from "next/navigation"; 
import { useSelector } from "react-redux"; 
import Link from "next/link"; 
import ProductDescription from "@/components/ProductDescription";
import ProductDetails from "@/components/ProductDetails";

export default function Product() {

    const { productId } = useParams();
    // Access the global product list from the Redux store state
    const products = useSelector(state => state.product.list);
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);

   
    const fetchProduct = async () => {

        const foundInRedux = products.find(
            (item) => item.id === productId
        );

        // If found in the global state, set it immediately and turn off the loading spinner.
        if (foundInRedux) {
            setProduct(foundInRedux);
            setLoading(false);
        }

        // ALWAYS fetch from the API in the background
        // Even if we found the product in Redux, we make a network call to guarantee data freshness.
        try {
            const res = await fetch(`/api/products/${productId}`, {
                cache: 'no-store'
            });

            if (!res.ok) {
                if (!foundInRedux) {
                    console.error("Product not found");
                    setLoading(false);
                }
                return; 
            }

            // Convert the successful HTTP response to a JSON object
            const data = await res.json();

            // overwrite the Redux data (if any) with the 100% fresh API data
            setProduct(data.product || data);

        } catch (error) {
            console.error("Failed to fetch fresh product data:", error);
        } finally {     
            setLoading(false);
        }
    };

    
    useEffect(() => {
        if (productId) {
            fetchProduct();
        }
        window.scrollTo(0, 0);

    }, [productId, products]); // Dependency array ensures re-fetch on route change or store update

   
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

    return (
        <div className="mx-6">
            <div className="max-w-7xl mx-auto">

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

                <div className="mt-10">
                    <ProductDescription product={product} />
                </div>
                
            </div>
        </div>
    );
}