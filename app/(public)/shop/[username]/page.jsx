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
        <div className="min-h-screen bg-slate-50 py-8 sm:py-10">
            {/* Centered container constraining the maximum width on large screens */}
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 mb-2 overflow-hidden">
                    
                    <div className="h-28 sm:h-32 w-full bg-gradient-to-r from-emerald-50 via-green-50 to-teal-50 relative">
                        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:20px_20px]"></div>
                    </div>

                    <div className="relative px-6 pb-6 flex flex-col items-center text-center">
                        
                        {/* Smaller Profile Picture */}
                        <div className="relative -mt-14 sm:-mt-16 w-28 h-28 sm:w-32 sm:h-32 rounded-full border-4 border-white shadow-sm bg-white flex items-center justify-center overflow-hidden mb-3">
                            {validLogo ? (
                                // Render Next.js Image if a valid logo URL exists
                                <Image src={validLogo} alt={store.name} fill className="object-cover" />
                            ) : (
                                <StoreIcon size={40} className="text-slate-300" />
                            )}
                        </div>

                        {/* Store Name & Verification Badge */}
                        <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 flex items-center justify-center gap-2">
                            {store.name}
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

               
                <StoreProducts products={formattedProducts} />

            </div>
        </div>
    );
}
