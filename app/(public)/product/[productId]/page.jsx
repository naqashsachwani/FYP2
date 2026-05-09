'use client' 

import { useEffect, useState } from "react";
import { useParams } from "next/navigation"; 
import { useSelector } from "react-redux"; 
import Link from "next/link"; 
import ProductDescription from "@/components/ProductDescription";
import ProductDetails from "@/components/ProductDetails";
import { Loader2 } from "lucide-react";

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
            <div className="min-h-[100dvh] flex items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-3 sm:gap-4 text-slate-500 animate-pulse">
                    <Loader2 className="w-8 h-8 sm:w-10 sm:h-10 animate-spin text-green-600" />
                    <span className="text-sm sm:text-base font-medium">Loading product details...</span>
                </div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="min-h-[100dvh] flex flex-col items-center justify-center gap-3 sm:gap-4 bg-slate-50 px-4 text-center">
                <p className="text-lg sm:text-xl text-slate-600 font-bold">Product not found.</p>
                <Link href="/products" className="text-blue-600 hover:text-blue-700 font-medium hover:underline text-sm sm:text-base">
                    Back to Shop
                </Link>
            </div>
        );
    }

    return (
        <div className="px-4 sm:px-6 w-full max-w-7xl mx-auto pb-16 sm:pb-24">
            
            {/* Breadcrumb Navigation */}
            <div className="text-slate-500 text-xs sm:text-sm mt-6 sm:mt-8 mb-4 sm:mb-6 flex flex-wrap items-center gap-1.5 sm:gap-2">
                <Link href="/" className="hover:text-slate-900 transition-colors font-medium">
                    Home
                </Link>
                <span>/</span>
                <Link href="/shop" className="hover:text-slate-900 transition-colors font-medium">
                    Products
                </Link>
                <span>/</span>
                {/* Displays the category of the currently loaded product */}
                <span className="font-bold text-slate-800 cursor-default truncate max-w-[150px] sm:max-w-xs">
                    {product.category}
                </span>
            </div>

            {/* Product main details component (handles price, image gallery, add to cart, etc.) */}
            <ProductDetails product={product} />

            <div className="mt-8 sm:mt-12">
                <ProductDescription product={product} />
            </div>
            
        </div>
    );
}