import prisma from "@/lib/prisma";
import Image from "next/image";
import { notFound } from "next/navigation";
import ProductCard from "@/components/ProductCard";
import { StoreIcon, BadgeCheck, LayoutGrid } from "lucide-react";

// Server Component to fetch and render the store page
export default async function ViewStorePage({ params }) {
    // Next.js 15 requires awaiting dynamic route params
    const resolvedParams = await params;
    
    // SAFE DECODE: Fixes the "%20" issue in URLs
    const decodedUsername = decodeURIComponent(resolvedParams.username);

    // Fetch the store and active products
    const store = await prisma.store.findUnique({
        where: { username: decodedUsername },
        include: {
            products: {
                where: { inStock: true }, 
                include: { ratings: true } // Fetch ratings from DB
            }
        }
    });

    if (!store) {
        return notFound();
    }

    // Format products so they match what ProductCard.jsx expects 
    const formattedProducts = store.products.map(prod => ({
        ...prod,
        rating: prod.ratings 
    }));

    // SAFE LOGO CHECK
    const validLogo = typeof store.logo === 'string' && store.logo.trim() !== '' ? store.logo : null;

    return (
        <div className="min-h-screen bg-slate-50 py-8 sm:py-10">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                
                {/* ================= COMPACT CENTERED STORE CARD ================= */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 mb-8 sm:mb-10 overflow-hidden">
                    
                    {/* Smaller Pastel Banner */}
                    <div className="h-28 sm:h-32 w-full bg-gradient-to-r from-emerald-50 via-green-50 to-teal-50 relative">
                        {/* Subtle decorative dots/pattern */}
                        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:20px_20px]"></div>
                    </div>

                    {/* Centered Profile Section */}
                    <div className="relative px-6 pb-6 flex flex-col items-center text-center">
                        
                        {/* Smaller Avatar */}
                        <div className="relative -mt-14 sm:-mt-16 w-28 h-28 sm:w-32 sm:h-32 rounded-full border-4 border-white shadow-sm bg-white flex items-center justify-center overflow-hidden mb-3">
                            {validLogo ? (
                                <Image src={validLogo} alt={store.name} fill className="object-cover" />
                            ) : (
                                <StoreIcon size={40} className="text-slate-300" />
                            )}
                        </div>

                        {/* Store Name & Badge */}
                        <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 flex items-center justify-center gap-2">
                            {store.name}
                            {store.isActive && (
                                <BadgeCheck className="text-emerald-500 w-6 h-6 sm:w-7 sm:h-7" />
                            )}
                        </h1>

                        {/* Store Description */}
                        <p className="text-slate-500 mt-1.5 max-w-2xl text-sm sm:text-base leading-relaxed">
                            {store.description || "Welcome to our official DreamSaver storefront! Browse our collection below."}
                        </p>
                    </div>
                </div>

                {/* ================= PRODUCTS GRID AREA ================= */}
                <div className="mb-6 flex items-center justify-between border-b border-slate-200 pb-3">
                    <h2 className="text-lg sm:text-xl font-bold text-slate-800 flex items-center gap-2">
                        <LayoutGrid className="text-emerald-600" size={20} />
                        All Products 
                        <span className="text-slate-400 text-base font-medium ml-1">
                            ({formattedProducts.length})
                        </span>
                    </h2>
                </div>

                {/* Grid */}
                {formattedProducts.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {formattedProducts.map(product => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-dashed border-slate-300 shadow-sm">
                        <div className="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                            <StoreIcon size={28} className="text-slate-300" />
                        </div>
                        <h3 className="text-base font-semibold text-slate-700">No products available</h3>
                        <p className="text-slate-500 mt-1 text-sm">This store hasn't listed any active products yet.</p>
                    </div>
                )}

            </div>
        </div>
    );
}