// --- Imports ---
import prisma from "@/lib/prisma"; // Internal Prisma ORM instance for database access
import Image from "next/image"; // Next.js optimized image component
import { notFound } from "next/navigation"; // Next.js utility to trigger a 404 page
import { StoreIcon, BadgeCheck } from "lucide-react"; // SVG Icons for UI
import StoreProducts from "./StoreProducts"; // <-- Import the new client component (interactive product grid)

// Server Component to fetch and render the store page.
// Because there is no 'use client' directive, this entire component runs securely on the Node.js server.
export default async function ViewStorePage({ params }) {
    // Next.js 15 requires awaiting dynamic route params (e.g., [username])
    const resolvedParams = await params;
    
    // SAFE DECODE: Fixes the "%20" issue in URLs
    // If a username has a space (e.g., "Tech Store"), the URL is /shop/Tech%20Store. 
    // decodeURIComponent turns "%20" back into a normal space so Prisma can find it in the database.
    const decodedUsername = decodeURIComponent(resolvedParams.username);

    // Fetch the store and active products directly from the PostgreSQL database using Prisma.
    const store = await prisma.store.findUnique({
        where: { username: decodedUsername }, // Look for the exact username
        include: {
            products: { // If the store is found, also fetch their associated products
                where: { inStock: true }, // ONLY fetch products that are currently marked as inStock
                include: { ratings: true } // Fetch ratings from DB so we can display stars on the ProductCards
            }
        }
    });

    // If Prisma returns null (the store doesn't exist in the database), instantly trigger the Next.js 404 page.
    if (!store) {
        return notFound();
    }

    // Format products so they match what ProductCard.jsx expects 
    // The database schema likely returns a 'ratings' array, but the ProductCard component
    // is hardcoded to look for a 'rating' property. This maps the data to fit the prop.
    const formattedProducts = store.products.map(prod => ({
        ...prod,
        rating: prod.ratings 
    }));

    // SAFE LOGO CHECK
    // Database fields for images can sometimes be null, undefined, or empty strings.
    // This strictly ensures the logo is a valid string before we attempt to pass it to the <Image> component, preventing crashes.
    const validLogo = typeof store.logo === 'string' && store.logo.trim() !== '' ? store.logo : null;

    // --- Main Render Block ---
    return (
        // Outer wrapper standardizing background color and vertical padding
        <div className="min-h-screen bg-slate-50 py-8 sm:py-10">
            {/* Centered container constraining the maximum width on large screens */}
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                
                {/* ================= COMPACT CENTERED STORE CARD ================= */}
                {/* The main profile header card for the vendor */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 mb-2 overflow-hidden">
                    
                    {/* Smaller Pastel Banner (Top half of the profile card) */}
                    <div className="h-28 sm:h-32 w-full bg-gradient-to-r from-emerald-50 via-green-50 to-teal-50 relative">
                        {/* Subtle decorative dots/pattern using CSS radial gradients */}
                        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:20px_20px]"></div>
                    </div>

                    {/* Centered Profile Section (Bottom half of the profile card) */}
                    <div className="relative px-6 pb-6 flex flex-col items-center text-center">
                        
                        {/* Smaller Avatar Profile Picture */}
                        {/* Uses negative top margin (-mt-14) to pull the circle up so it overlaps the banner */}
                        <div className="relative -mt-14 sm:-mt-16 w-28 h-28 sm:w-32 sm:h-32 rounded-full border-4 border-white shadow-sm bg-white flex items-center justify-center overflow-hidden mb-3">
                            {validLogo ? (
                                // Render Next.js Image if a valid logo URL exists
                                <Image src={validLogo} alt={store.name} fill className="object-cover" />
                            ) : (
                                // Render a fallback SVG icon if no logo exists
                                <StoreIcon size={40} className="text-slate-300" />
                            )}
                        </div>

                        {/* Store Name & Verification Badge */}
                        <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 flex items-center justify-center gap-2">
                            {store.name}
                            {/* Only show the blue/emerald checkmark if the store is marked 'isActive' in the DB */}
                            {store.isActive && (
                                <BadgeCheck className="text-emerald-500 w-6 h-6 sm:w-7 sm:h-7" />
                            )}
                        </h1>

                        {/* Store Description with fallback text if empty */}
                        <p className="text-slate-500 mt-1.5 max-w-2xl text-sm sm:text-base leading-relaxed">
                            {store.description || "Welcome to our official DreamSaver storefront! Browse our collection below."}
                        </p>
                    </div>
                </div>

                {/* ================= INTERACTIVE PRODUCTS AREA ================= */}
                {/* Pass the formatted products array into our new Client Component.
                    Because this is a Server Component, it fetches the data securely and instantly, 
                    then hands the raw JSON to StoreProducts so the user can filter/sort it in the browser. 
                */}
                <StoreProducts products={formattedProducts} />

            </div>
        </div>
    );
}