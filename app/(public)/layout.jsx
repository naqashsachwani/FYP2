'use client' 

import Navbar from "@/components/Navbar"; 
import Footer from "@/components/Footer"; 
import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux"; 
import { fetchProducts } from "@/lib/features/product/productSlice";
import { uploadCart } from "@/lib/features/cart/cartSlice";
import { fetchAddress } from "@/lib/features/address/addressSlice";
import { fetchCart } from "@/lib/features/cart/cartSlice";
import { fetchUserRatings } from "@/lib/features/rating/ratingSlice";

import { useAuth, useUser } from "@clerk/nextjs";

export default function PublicLayout({ children }) {
    
    const dispatch = useDispatch();
    const { user, isLoaded } = useUser();
    const { getToken } = useAuth(); 
    const { cartItems } = useSelector((state) => state.cart);
    const products = useSelector((state) => state.product.list);
    const hasSyncedInitialCart = useRef(false);

    // ================= EFFECT 1: Initial Product Fetch =================
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

        if (!hasSyncedInitialCart.current) {
            hasSyncedInitialCart.current = true;
            return;
        }

        dispatch(uploadCart({ getToken }));
    }, [cartItems, dispatch, getToken, isLoaded, user]); 

    return (
        // ✅ FIXED: Single flex column wrapper to control the whole page layout cleanly
        <div className="flex flex-col min-h-screen bg-white">
            <Navbar />   
            {/* ✅ FIXED: flex-grow forces this to take up empty space without stretching internal components */}
            <main className="flex-grow w-full">
                {children}
            </main>     
            <Footer />
        </div>
    );
}