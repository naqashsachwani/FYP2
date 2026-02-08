'use client' 

import { Suspense } from "react"
// Suspense is used to handle async behavior of useSearchParams in Next.js App Router
import ProductCard from "@/components/ProductCard"
import { useSearchParams } from "next/navigation"
import { useSelector } from "react-redux"

function ShopContent() {

    // Get access to URL query parameters
    const searchParams = useSearchParams()

    const search = searchParams.get('search')

    const products = useSelector(state => state.product.list)

    const filteredProducts = search
        ? products.filter(product =>
            product.name.toLowerCase().includes(search.toLowerCase())
        )
        : products; // If no search term, show all products

    return (
        <div className="min-h-[70vh] mx-6">
            {/* Layout container to maintain page height and spacing */}
            <div className="max-w-7xl mx-auto">
                
                <h1 className="text-2xl text-slate-500 my-6"> 
                    All <span className="text-slate-700 font-medium">Products</span>
                </h1>
               
                <div className="grid grid-cols-2 sm:flex flex-wrap gap-6 xl:gap-12 mx-auto mb-32">
                    
                    {filteredProducts.map((product) => (
                        <ProductCard 
                            key={product.id} 
                            product={product} 
                        />
                    ))}
                </div>
            </div>
        </div>
    )
}

export default function Shop() {
  return (
    // Suspense is required because useSearchParams is asynchronous
    // Fallback UI is shown until the component is ready
    <Suspense fallback={<div className="p-10 text-center">Loading shop...</div>}>
      <ShopContent />
    </Suspense>
  );
}
