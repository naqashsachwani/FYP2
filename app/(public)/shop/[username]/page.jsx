import prisma from "@/lib/prisma"; 
import Image from "next/image"; 
import { unstable_cache } from "next/cache";
import { notFound } from "next/navigation"; 
import { StoreIcon, BadgeCheck } from "lucide-react"; 
import StoreProducts from "./StoreProducts"; 

// Server Component to fetch and render the store page.

const getCachedStore = unstable_cache(
    async (username) => prisma.store.findUnique({
        where: { username },
        include: {
            products: {
                where: { inStock: true },
                include: { ratings: true }
            }
        }
    }),
    ['public-store-page'],
    { revalidate: 60 }
);

export default async function ViewStorePage({ params }) {
  
    const resolvedParams = await params;
    const decodedUsername = decodeURIComponent(resolvedParams.username);

    // Fetch the store and active products directly from the PostgreSQL database using Prisma.
    const store = await getCachedStore(decodedUsername);

    if (!store) {
        return notFound();
    }

    const formattedProducts = store.products.map(prod => ({
        ...prod,
        rating: prod.ratings 
    }));

    // SAFE LOGO CHECK
    const validLogo = typeof store.logo === 'string' && store.logo.trim() !== '' ? store.logo : null;

    return (
        // Outer wrapper standardizing background color and vertical padding
        <div className="min-h-[100dvh] bg-slate-50 py-6 sm:py-8 lg:py-10">
            {/* Centered container constraining the maximum width on large screens */}
            <div className="max-w-6xl mx-auto px-3 sm:px-6 lg:px-8">
                
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 mb-2 overflow-hidden">
                    
                    <div className="h-24 sm:h-28 md:h-32 w-full bg-gradient-to-r from-emerald-50 via-green-50 to-teal-50 relative">
                        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:20px_20px]"></div>
                    </div>

                    <div className="relative px-4 sm:px-6 pb-5 sm:pb-6 flex flex-col items-center text-center">
                        
                        {/* Smaller Profile Picture */}
                        <div className="relative -mt-12 sm:-mt-14 md:-mt-16 w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full border-4 border-white shadow-sm bg-white flex items-center justify-center overflow-hidden mb-2 sm:mb-3">
                            {validLogo ? (
                                // Render Next.js Image if a valid logo URL exists
                                <Image src={validLogo} alt={store.name} fill className="object-cover" />
                            ) : (
                                <StoreIcon className="text-slate-300 w-10 h-10 sm:w-12 sm:h-12" />
                            )}
                        </div>

                        {/* Store Name & Verification Badge */}
                        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-800 flex items-center justify-center gap-1.5 sm:gap-2 px-2">
                            <span className="truncate">{store.name}</span>
                            {store.isActive && (
                                <BadgeCheck className="text-emerald-500 w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 shrink-0" />
                            )}
                        </h1>

                        {/* Store Description with fallback text if empty */}
                        <p className="text-slate-500 mt-1 sm:mt-1.5 max-w-2xl text-xs sm:text-sm md:text-base leading-relaxed px-2">
                            {store.description || "Welcome to our official DreamSaver storefront! Browse our collection below."}
                        </p>
                    </div>
                </div>

                <StoreProducts products={formattedProducts} />

            </div>
        </div>
    );
}