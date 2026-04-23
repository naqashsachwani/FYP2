'use client' 

import Navbar from "@/components/Navbar"; // Top navigation bar persistent across all public pages
import Footer from "@/components/Footer"; // Bottom footer persistent across all public pages
import { useEffect, useRef } from "react";
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
    const hasSyncedInitialCart = useRef(false);

    // ================= EFFECT 1: Initial Product Fetch =================
    // Runs exactly once when the layout (and thus the application) first mounts.
    useEffect(() => {
        if (products.length === 0) {
            dispatch(fetchProducts({}));
        }
    }, [dispatch, products.length]);

    // Runs whenever the 'user' object changes.
    useEffect(() => {
        if (user && isLoaded) {
            dispatch(fetchCart({ getToken }));     
            dispatch(fetchAddress({ getToken }));    
            dispatch(fetchUserRatings({ getToken }));
        }
    }, [dispatch, getToken, isLoaded, user]); 

   
    useEffect(() => {
        if (!user || !isLoaded) {
            hasSyncedInitialCart.current = false;
            return;
        }

        // Skip the first cart change after hydration so we don't POST the same cart we just fetched.
        if (!hasSyncedInitialCart.current) {
            hasSyncedInitialCart.current = true;
            return;
        }

        dispatch(uploadCart({ getToken }));
    }, [cartItems, dispatch, getToken, isLoaded, user]); 

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
