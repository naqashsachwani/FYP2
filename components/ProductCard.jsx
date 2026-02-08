'use client'

import { StarIcon } from 'lucide-react' // Star icon for rating display
import Image from 'next/image'          // Next.js optimized Image component
import Link from 'next/link'            // Next.js Link for navigation
import React from 'react'

// ProductCard component: displays a single product in a card format
const ProductCard = ({ product }) => {
  // Currency symbol, fallback to 'Rs ' if env variable not set
  const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || 'Rs '

  // Calculate average rating rounded to nearest integer
  // If there are no ratings, default to 0
  const rating = product?.rating?.length
    ? Math.round(
        product.rating.reduce((acc, curr) => acc + (curr.rating || 0), 0) / product.rating.length
      )
    : 0

  return (
    // Ensure this is the ONLY Link in this component tree
    // Navigates to product detail page
    <Link href={`/product/${product.id}`} className='group max-xl:mx-auto block'>
      
      {/* Product image container */}
      {/* 
        - Background color: light gray
        - Height: h-40 on mobile, sm:h-68 on small screens
        - Width: sm:w-60 on small screens
        - Rounded corners: rounded-lg
        - Flex center to align image
        - overflow-hidden to prevent image overflow
      */}
      <div className='bg-[#F5F5F5] h-40 sm:w-60 sm:h-68 rounded-lg flex items-center justify-center relative overflow-hidden'>
        
        {/* Out of Stock Badge */}
        {/* 
          - Shown only if product.inStock is false
          - Positioned at top-right: absolute top-2 right-2
          - Red background, white bold text
          - Small font size: text-[10px]
          - Padding: px-2 py-1
          - Rounded corners and shadow
        */}
        {!product.inStock && (
            <div className="absolute top-2 right-2 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm z-10">
                Out of Stock
            </div>
        )}

        {/* Image wrapper */}
        {/* 
          - Flex center
          - If out of stock: apply opacity-60 and grayscale
        */}
        <div className={`flex items-center justify-center w-full h-full ${!product.inStock ? "opacity-60 grayscale" : ""}`}>
            {product?.images?.[0] ? (
            <Image
                width={500} 
                height={500}
                className='max-h-30 sm:max-h-40 w-auto group-hover:scale-115 transition duration-300'
                src={product.images[0]} // Product image
                alt={product.name || "product image"}
            />
            ) : (
            // Placeholder if no image is available
            <div className='w-full h-full flex items-center justify-center text-slate-400'>No Image</div>
            )}
        </div>
      </div>
      
      {/* Product info section */}
      {/* 
        - Flex container: space between name/rating and price
        - Gap: 3
        - Text size: small, color: slate-800
        - Top padding: pt-2
        - Max width: max-w-60
      */}
      <div className='flex justify-between gap-3 text-sm text-slate-800 pt-2 max-w-60'>
        
        {/* Left section: name and rating */}
        <div>
          {/* Product name */}
          <p className={!product.inStock ? "text-slate-400" : ""}>{product.name}</p>

          {/* Star rating */}
          <div className='flex'>
            {Array(5).fill('').map((_, index) => (
              <StarIcon
                key={index}
                size={14} // small star size
                className='text-transparent mt-0.5' // placeholder for spacing
                fill={rating >= index + 1 ? "#00C950" : "#D1D5DB"} // green for filled, gray for empty
              />
            ))}
          </div>
        </div>

        {/* Right section: price */}
        <p className={!product.inStock ? "text-slate-400" : ""}>
          {currency}{product.price}
        </p>
      </div>
    </Link>
  )
}

export default ProductCard
