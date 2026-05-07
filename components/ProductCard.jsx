'use client'

import { StarIcon } from 'lucide-react' 
import Image from 'next/image'          
import Link from 'next/link'            
import React from 'react'

// ProductCard component: displays a single product in a card format
const ProductCard = ({ product }) => {
  // Currency symbol, fallback to 'Rs ' if env variable not set
  const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || 'Rs '

  // --- FIXED: Looking for product.ratings (plural) instead of product.rating ---
  // We check both just in case your Redux state differs slightly from Prisma
  const reviewsArray = product?.ratings || product?.rating || []
  const totalReviews = reviewsArray.length
  
  const averageRating = totalReviews > 0
    ? reviewsArray.reduce((acc, curr) => acc + (curr.rating || 0), 0) / totalReviews
    : 0

  return (
    // Ensure this is the ONLY Link in this component tree
    // Navigates to product detail page
    <Link href={`/product/${product.id}`} className='group block mx-auto w-full'>
      
      {/* Product image container */}
      <div className='bg-[#F5F5F5] h-32 sm:h-40 md:h-48 lg:h-60 w-full rounded-lg flex items-center justify-center relative overflow-hidden'>
        
        {/* Out of Stock Badge */}
        {!product.inStock && (
            <div className="absolute top-1 right-1 sm:top-2 sm:right-2 bg-red-500 text-white text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 sm:py-1 rounded shadow-sm z-10">
                Out of Stock
            </div>
        )}

        {/* Image wrapper */}
        <div className={`flex items-center justify-center w-full h-full p-2 sm:p-4 ${!product.inStock ? "opacity-60 grayscale" : ""}`}>
            {product?.images?.[0] ? (
            <Image
                width={500} 
                height={500}
                className='max-h-24 sm:max-h-32 md:max-h-40 w-auto object-contain group-hover:scale-105 sm:group-hover:scale-110 transition duration-300'
                src={product.images[0]} // Product image
                alt={product.name || "product image"}
            />
            ) : (
            // Placeholder if no image is available
            <div className='w-full h-full flex items-center justify-center text-slate-400 text-xs sm:text-sm'>No Image</div>
            )}
        </div>
      </div>
      
      {/* Product info section */}
      <div className='flex flex-col justify-between gap-1 sm:gap-2 text-xs sm:text-sm text-slate-800 pt-2 sm:pt-3 w-full'>
        
        {/* Left section: name and rating */}
        <div className="w-full">
          {/* Product name */}
          <p className={`line-clamp-2 leading-tight ${!product.inStock ? "text-slate-400 font-medium" : "font-medium"}`}>
            {product.name}
          </p>

          {/* --- FIXED: Star rating & Dynamic Math --- */}
          <div className='flex items-center gap-1 mt-1 sm:mt-1.5'>
            <div className='flex'>
              {Array(5).fill('').map((_, index) => (
                <StarIcon
                  key={index}
                  size={10} // Adjusted size for mobile screens
                  className={`sm:w-3 sm:h-3 ${index < Math.round(averageRating) ? "text-[#00C950]" : "text-gray-300"}`}
                  fill={index < Math.round(averageRating) ? "#00C950" : "#D1D5DB"}
                />
              ))}
            </div>
            
            {/* Shows: "4.6 (12)" or "0 (0)" next to the stars */}
            <span className="text-[9px] sm:text-[11px] text-slate-500 font-medium mt-0.5">
              {averageRating > 0 ? averageRating.toFixed(1) : "0"} ({totalReviews})
            </span>
          </div>
        </div>

        {/* Right section: price */}
        <p className={`font-semibold text-sm sm:text-base ${!product.inStock ? "text-slate-400" : ""}`}>
          {currency}{product.price.toLocaleString()}
        </p>
      </div>
    </Link>
  )
}

export default ProductCard