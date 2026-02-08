'use client' 

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchProducts } from "@/lib/features/product/productSlice";
import { useAuth, useUser } from "@clerk/nextjs";
import { uploadCart } from "@/lib/features/cart/cartSlice";
import { fetchAddress } from "@/lib/features/address/addressSlice";
import { fetchCart } from "@/lib/features/cart/cartSlice";
import { fetchUserRatings } from "@/lib/features/rating/ratingSlice";

export default function PublicLayout({ children }) {
    // Redux dispatch to trigger actions
    const dispatch = useDispatch();

    // isLoaded → ensures auth state is fully loaded before using it
    const { user, isLoaded } = useUser();
    const { getToken } = useAuth(); // Used to securely call protected APIs

    // Redux selectors to read global state
    const { cartItems } = useSelector((state) => state.cart);

    // Product list from Redux
    // Used to prevent unnecessary re-fetching of products
    const products = useSelector((state) => state.product.list);

    useEffect(() => {
        // We check length to avoid re-fetching products
        // if they already exist in Redux store
        if (products.length === 0) {
            dispatch(fetchProducts({}));
        }
    }, []); 

    useEffect(() => {
        // These APIs require authentication,
        // so we only call them when user is logged in
        if (user) {
            dispatch(fetchCart({ getToken }));
            dispatch(fetchAddress({ getToken }));
            dispatch(fetchUserRatings({ getToken }));
        }
    }, [user]); 
    // Re-runs only when user logs in or logs out

    useEffect(() => {
        // This effect syncs cart changes with backend
        // Debounce is used to prevent API spam
        if (user && isLoaded) {
            const timeoutId = setTimeout(() => {
                dispatch(uploadCart({ getToken }));
            }, 1000); // Waits 1 second after last cart change

            // If cartItems change again before 1s,
            // previous API call is cancelled
            return () => clearTimeout(timeoutId);
        }
    }, [cartItems, user, isLoaded]);

    return (
        <>
            <Navbar />
            <main className="min-h-screen">
                {children}
            </main>
            <Footer />
        </>
    );
}
