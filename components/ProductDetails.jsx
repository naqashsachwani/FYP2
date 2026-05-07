'use client'

import { useRouter } from "next/navigation"; // For client-side routing
import { 
  StarIcon, TagIcon, EarthIcon, CreditCardIcon, UserIcon, 
  ChevronLeft, ChevronRight 
} from "lucide-react"; // Icons
import { useState } from "react";
import Image from "next/image"; // Next.js optimized images

// ProductDetails component: displays product info and allows setting a goal
const ProductDetails = ({ product }) => {
  const productId = String(product.id); // Ensure productId is string
  const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || 'Rs '; // Currency symbol
  const router = useRouter(); // Next.js router for navigation

  // --- UPDATED: Image Gallery State ---
  const images = product?.images?.length > 0 ? product.images : ["/placeholder.png"];
  const [currentIndex, setCurrentIndex] = useState(0);

  // Navigation Handlers for Arrows
  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  // Handler for "Set Goal" button
  const setGoalHandler = () => {
    if (product.inStock) {
      // Navigate to set-goal page with productId as query param
      router.push(`/set-goal?productId=${encodeURIComponent(productId)}`);
    }
  }

  // --- Total reviews and Average Rating logic ---
  const totalReviews = product?.ratings?.length || 0;
  
  const averageRating = totalReviews > 0
    ? product.ratings.reduce((acc, item) => acc + item.rating, 0) / totalReviews
    : 0;

  return (
    <div className="flex max-lg:flex-col gap-12">
      {/* ================= IMAGE SECTION ================= */}
      {/* Flex container: on smaller screens, layout stacks vertically */}
      <div className={`flex max-sm:flex-col-reverse gap-3 ${!product.inStock ? 'opacity-75' : ''}`}>
        
        {/* Thumbnail images (Max 3 shown) */}
        <div className="flex sm:flex-col gap-3">
          {images.slice(0, 3).map((image, index) => {
            const isLastThumbnail = index === 2;
            const hasMoreImages = images.length > 3;
            const remainingCount = images.length - 3;
            
            // Highlight the active thumbnail. If user navigated to image 4+, keep the 3rd box highlighted
            const isHiddenImageActive = currentIndex >= 3;
            const isActive = currentIndex === index || (isLastThumbnail && isHiddenImageActive);

            return (
              <div
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`relative bg-slate-100 flex items-center justify-center size-26 rounded-lg cursor-pointer transition-transform transform hover:scale-105 overflow-hidden border-2
                  ${isActive ? 'border-green-500 shadow-md' : 'border-transparent'}`}
              >
                <Image src={image} alt={`Thumbnail ${index + 1}`} width={80} height={80} className="object-cover w-full h-full" />
                
                {/* "+ X More" Overlay on the 3rd image if applicable */}
                {isLastThumbnail && hasMoreImages && (
                  <div 
                    onClick={(e) => {
                        e.stopPropagation();
                        setCurrentIndex(3); // Jump straight to the 4th image
                    }}
                    className={`absolute inset-0 flex flex-col items-center justify-center text-white transition-colors
                        ${isHiddenImageActive ? 'bg-green-900/80' : 'bg-slate-900/60 hover:bg-slate-900/80'}
                    `}
                  >
                    <span className="text-xl font-bold">+{remainingCount}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Main product image with Interactive Arrows */}
        <div className="flex justify-center items-center h-100 sm:size-113 bg-slate-100 rounded-lg shadow-lg relative group overflow-hidden w-full">
          {images[currentIndex] ? (
            <Image 
              src={images[currentIndex]} 
              alt={product.name || "Product image"} 
              width={400} 
              height={400} 
              className="transition-transform duration-300 object-contain w-full h-full max-w-[80%] max-h-[80%]" 
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-500">No Image</div>
          )}

          {/* Left / Right Navigation Arrows (Only show if multiple images exist) */}
          {images.length > 1 && (
            <>
              <button 
                onClick={prevImage}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 hover:bg-white text-slate-800 rounded-full shadow opacity-0 group-hover:opacity-100 transition-all z-10"
              >
                <ChevronLeft size={24} />
              </button>
              
              <button 
                onClick={nextImage}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 hover:bg-white text-slate-800 rounded-full shadow opacity-0 group-hover:opacity-100 transition-all z-10"
              >
                <ChevronRight size={24} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* ================= DETAILS SECTION ================= */}
      <div className="flex-1">
        {/* Product name + out-of-stock badge */}
        <h1 className="text-3xl font-semibold text-slate-800 flex items-center flex-wrap gap-4">
          {product.name}
          {!product.inStock && (
            <span className="text-sm font-bold text-red-600 bg-red-100 px-3 py-1 rounded-full border border-red-200">
              Out of Stock
            </span>
          )}
        </h1>

        {/* Rating stars + dynamic review count */}
        <div className='flex items-center mt-3'>
          <div className="flex gap-0.5">
            {Array(5).fill('').map((_, index) => (
              <StarIcon 
                key={index} 
                size={16} 
                fill={index < Math.round(averageRating) ? "#00C950" : "#D1D5DB"} 
                className={index < Math.round(averageRating) ? "text-[#00C950]" : "text-gray-300"}
              />
            ))}
          </div>
          <p className="text-sm ml-3 text-slate-500 font-medium">
            {averageRating > 0 ? averageRating.toFixed(1) : "0"} ({totalReviews} {totalReviews === 1 ? 'Review' : 'Reviews'})
          </p>
        </div>

        {/* Price section: current price + MRP */}
        <div className="flex items-start my-6 gap-3 text-2xl font-semibold text-slate-800">
          <p>{currency}{product.price.toLocaleString()}</p>
          <p className="text-xl text-slate-500 line-through">{currency}{product.mrp.toLocaleString()}</p>
        </div>

        {/* Discount info */}
        <div className="flex items-center gap-2 text-slate-500">
          <TagIcon size={14} />
          <p>Save {((product.mrp - product.price) / product.mrp * 100).toFixed(0)}% right now</p>
        </div>

        {/* Set Goal Button */}
        <div className="flex items-end gap-5 mt-10">
          <button
            onClick={setGoalHandler}
            disabled={!product.inStock} // Disable if out of stock
            className={`px-10 py-3 text-sm font-medium rounded transition-transform transform shadow-md
              ${!product.inStock
                ? "bg-gray-400 cursor-not-allowed text-white" 
                : "active:scale-95 bg-green-500 text-white hover:bg-green-600" 
              }`}
          >
            {!product.inStock ? "Currently Unavailable" : "Set Goal"}
          </button>
        </div>

        {/* Divider */}
        <hr className="border-gray-300 my-5" />

        {/* Additional product features */}
        <div className="flex flex-col gap-4 text-slate-500">
          <p className="flex gap-3"><EarthIcon className="text-slate-400" /> Free shipping above {currency}5,000</p>
          <p className="flex gap-3"><CreditCardIcon className="text-slate-400" /> 100% Secured Payment</p>
          <p className="flex gap-3"><UserIcon className="text-slate-400" /> Trusted by top brands</p>
        </div>
      </div>
    </div>
  )
}

export default ProductDetails;