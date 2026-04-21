'use client' 

import Navbar from "@/components/Navbar"; // Top navigation bar persistent across all public pages
import Footer from "@/components/Footer"; // Bottom footer persistent across all public pages
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux"; // Redux hooks for state management
import { fetchProducts } from "@/lib/features/product/productSlice";
import { uploadCart } from "@/lib/features/cart/cartSlice";
import { fetchAddress } from "@/lib/features/address/addressSlice";
import { fetchCart } from "@/lib/features/cart/cartSlice";
import { fetchUserRatings } from "@/lib/features/rating/ratingSlice";

import { useAuth, useUser } from "@clerk/nextjs";

// This layout wraps all pages inside the app/(public) directory. 
export default function PublicLayout({ children }) {
    
    // Initialize Redux dispatch function to trigger actions that modify the global state.
    const dispatch = useDispatch();

    const { user, isLoaded } = useUser();
    const { getToken } = useAuth(); 
    const { cartItems } = useSelector((state) => state.cart);
    const products = useSelector((state) => state.product.list);

    // ================= EFFECT 1: Initial Product Fetch =================
    // Runs exactly once when the layout (and thus the application) first mounts.
    useEffect(() => {
        if (products.length === 0) {
            dispatch(fetchProducts({}));
        }
    }, []); // Empty dependency array ensures this effect only runs on initial mount.

    // Runs whenever the 'user' object changes.
    useEffect(() => {
        if (user) {
            dispatch(fetchCart({ getToken }));     
            dispatch(fetchAddress({ getToken }));    
            dispatch(fetchUserRatings({ getToken }));
        }
    }, [user]); 

   
    useEffect(() => {
        // Only attempt to sync if the user is fully logged in.
        if (user && isLoaded) {
            // Set a 1000ms (1 second) timer.
            const timeoutId = setTimeout(() => {
                dispatch(uploadCart({ getToken }));
            }, 1000); 
 
            // React calls this cleanup function, clearing the old timer, and starts a fresh 1-second countdown.
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