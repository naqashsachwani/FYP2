'use client' 

import { useEffect, useState } from "react";
import { useParams } from "next/navigation"; 
import { useSelector } from "react-redux"; 
import Link from "next/link"; 
import ProductDescription from "@/components/ProductDescription";
import ProductDetails from "@/components/ProductDetails";


export default function Product() {

    // Extracts the dynamic productId from the URL
    const { productId } = useParams();

    // Access product list from Redux 
    const products = useSelector(state => state.product.list);
    
    // Stores the selected product details
    const [product, setProduct] = useState(null);

    // Controls loading UI while data is being fetched
    const [loading, setLoading] = useState(true);

    // This function first checks Redux, then API
    const fetchProduct = async () => {

        // Try to find product in Redux store
        const foundInRedux = products.find(
            (item) => item.id === productId
        );

        if (foundInRedux) {
            // If product exists in Redux, use it directly
            setProduct(foundInRedux);
            setLoading(false);
        } else {
            // If not found in Redux, fetch from backend API
            try {
                const res = await fetch(`/api/products/${productId}`);

                // Handle invalid product ID or server error
                if (!res.ok) {
                    console.error("Product not found");
                    setLoading(false);
                    return;
                }

                // Convert response to JSON
                const data = await res.json();

                setProduct(data.product || data);

            } catch (error) {
                // Handles network or server errors
                console.error("Failed to fetch product:", error);
            } finally {
                // Ensures loader stops even if error occurs
                setLoading(false);
            }
        }
    };

    useEffect(() => {
        // Fetch product whenever productId or Redux products change
        if (productId) {
            fetchProduct();
        }

        // Scroll page to top when product changes
        window.scrollTo(0, 0);

    }, [productId, products]);
    // Dependency array ensures re-fetch on route change

    // Prevents rendering before data is available
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
    // Graceful error handling for wrong productId
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
                    <span className="font-medium text-gray-800 cursor-default">
                        {product.category}
                    </span>
                </div>

                {/* Product main details (price, image, add to cart etc.) */}
                <ProductDetails product={product} />

                {/* Product description / specs section */}
                <div className="mt-10">
                    <ProductDescription product={product} />
                </div>
                
            </div>
        </div>
    );
}
