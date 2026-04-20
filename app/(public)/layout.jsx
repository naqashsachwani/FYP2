// Marks this layout as a Client Component. While Next.js App Router defaults layouts to Server Components, 
// this specific layout requires React hooks (useEffect) and Redux (useDispatch, useSelector) which only run on the client.
'use client' 

// --- Component Imports ---
import Navbar from "@/components/Navbar"; // Top navigation bar persistent across all public pages
import Footer from "@/components/Footer"; // Bottom footer persistent across all public pages

// --- Hook Imports ---
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux"; // Redux hooks for state management

// --- Redux Slice / Action Imports ---
// These are asynchronous thunks used to fetch or push data to the backend API.
import { fetchProducts } from "@/lib/features/product/productSlice";
import { uploadCart } from "@/lib/features/cart/cartSlice";
import { fetchAddress } from "@/lib/features/address/addressSlice";
import { fetchCart } from "@/lib/features/cart/cartSlice";
import { fetchUserRatings } from "@/lib/features/rating/ratingSlice";

// --- Authentication Imports ---
import { useAuth, useUser } from "@clerk/nextjs";

// ================= MAIN LAYOUT COMPONENT =================
// This layout wraps all pages inside the app/(public) directory. 
// The 'children' prop represents the specific page component currently being viewed.
export default function PublicLayout({ children }) {
    
    // Initialize Redux dispatch function to trigger actions that modify the global state.
    const dispatch = useDispatch();

    // --- Authentication State ---
    // 'user' holds the current user object (null if logged out).
    // 'isLoaded' ensures Clerk has finished checking the auth state before we try to use the 'user' object.
    const { user, isLoaded } = useUser();
    // 'getToken' is an async function from Clerk used to securely sign backend API requests.
    const { getToken } = useAuth(); 

    // --- Redux State Subscriptions ---
    // Subscribes to the cart items array to monitor for any changes the user makes (e.g., adding to cart).
    const { cartItems } = useSelector((state) => state.cart);

    // Subscribes to the global product list to see if we have already downloaded the store's inventory.
    const products = useSelector((state) => state.product.list);

    // ================= EFFECT 1: Initial Product Fetch =================
    // Runs exactly once when the layout (and thus the application) first mounts.
    useEffect(() => {
        // Optimization: Check if the Redux store is empty.
        // If the user navigates between pages, we don't want to re-fetch the entire product catalog 
        // if we already have it safely stored in Redux memory.
        if (products.length === 0) {
            dispatch(fetchProducts({}));
        }
    }, []); // Empty dependency array ensures this effect only runs on initial mount.

    // ================= EFFECT 2: Authenticated User Data Fetch =================
    // Runs whenever the 'user' object changes (i.e., a user logs in or logs out).
    useEffect(() => {
        // If a user exists, fetch their private, user-specific data to hydrate the Redux store.
        if (user) {
            dispatch(fetchCart({ getToken }));       // Pulls their saved cart from the database
            dispatch(fetchAddress({ getToken }));    // Pulls their saved shipping addresses
            dispatch(fetchUserRatings({ getToken }));// Pulls the reviews/ratings they have previously left
        }
    }, [user]); // Dependency array: only re-runs if the 'user' object changes.

    // ================= EFFECT 3: Cart Synchronization (Debounced) =================
    // This is a highly optimized effect that watches the 'cartItems' array. 
    // If the user clicks "Add to Cart" 5 times rapidly, we do NOT want to hit the database 5 times.
    useEffect(() => {
        // Only attempt to sync if the user is fully logged in.
        if (user && isLoaded) {
            // Set a 1000ms (1 second) timer.
            const timeoutId = setTimeout(() => {
                // After 1 second of inactivity, trigger the uploadCart thunk to push the new cart state to the backend.
                dispatch(uploadCart({ getToken }));
            }, 1000); 

            // Cleanup Function (The "Debounce" mechanism):
            // If the user modifies 'cartItems' AGAIN before the 1 second is up, 
            // React calls this cleanup function, clearing the old timer, and starts a fresh 1-second countdown.
            return () => clearTimeout(timeoutId);
        }
    }, [cartItems, user, isLoaded]); // Runs every time 'cartItems', 'user', or 'isLoaded' changes.

    // ================= RENDER =================
    return (
        // React Fragment (<>...</>) groups multiple top-level elements without adding an extra <div> to the DOM.
        <>
            {/* The top navigation bar stays pinned at the top of every public page. */}
            <Navbar />
            
            {/* The main content wrapper. Ensures the footer is pushed down even if the page content is short. */}
            <main className="min-h-screen">
                {/* This dynamically renders whatever specific page route the user is currently on. */}
                {children}
            </main>
            
            {/* The footer stays pinned at the bottom of every public page. */}
            <Footer />
        </>
    );
}