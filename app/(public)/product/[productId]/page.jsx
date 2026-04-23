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

    useEffect(() => {
        const foundInRedux = products.find((item) => item.id === productId);

        if (foundInRedux) {
            setProduct(foundInRedux);
            setLoading(false);
        }
    }, [productId, products]);

    useEffect(() => {
        let isMounted = true;

        const fetchProduct = async () => {
            try {
                const res = await fetch(`/api/products/${productId}`);

                if (!res.ok) {
                    if (isMounted) {
                        console.error("Product not found");
                        setLoading(false);
                    }
                    return;
                }

                const data = await res.json();

                if (isMounted) {
                    setProduct(data.product || data);
                }
            } catch (error) {
                console.error("Failed to fetch fresh product data:", error);
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        if (productId) {
            setLoading(true);
            fetchProduct();
        }

        window.scrollTo(0, 0);
        return () => {
            isMounted = false;
        };
    }, [productId]);

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
