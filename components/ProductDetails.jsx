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
    <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
      {/* ================= IMAGE SECTION ================= */}
      {/* Flex container: on smaller screens, layout stacks vertically, thumbnails go bottom */}
      <div className={`flex flex-col-reverse sm:flex-row gap-3 sm:gap-4 lg:w-1/2 shrink-0 ${!product.inStock ? 'opacity-75' : ''}`}>
        
        {/* Thumbnail images (Max 3 shown) */}
        <div className="flex sm:flex-col gap-2 sm:gap-3 justify-center sm:justify-start overflow-x-auto sm:overflow-visible pb-2 sm:pb-0 custom-scrollbar shrink-0">
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
                className={`relative bg-slate-100 flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 rounded-lg cursor-pointer transition-transform transform hover:scale-105 overflow-hidden border-2 shrink-0
                  ${isActive ? 'border-green-500 shadow-md' : 'border-transparent'}`}
              >
                <Image src={image} alt={`Thumbnail ${index + 1}`} width={96} height={96} className="object-cover w-full h-full" />
                
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
                    <span className="text-base sm:text-lg lg:text-xl font-bold">+{remainingCount}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Main product image with Interactive Arrows */}
        <div className="flex justify-center items-center h-64 sm:h-80 lg:h-[500px] bg-slate-100 rounded-lg shadow-sm sm:shadow-lg relative group overflow-hidden w-full">
          {images[currentIndex] ? (
            <Image 
              src={images[currentIndex]} 
              alt={product.name || "Product image"} 
              width={600} 
              height={600} 
              className="transition-transform duration-300 object-contain w-full h-full max-w-[85%] max-h-[85%]" 
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-500 text-sm">No Image</div>
          )}

          {/* Left / Right Navigation Arrows (Only show if multiple images exist) */}
          {images.length > 1 && (
            <>
              <button 
                onClick={prevImage}
                className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 p-1.5 sm:p-2 bg-white/80 hover:bg-white text-slate-800 rounded-full shadow opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-all z-10"
              >
                <ChevronLeft size={20} className="sm:w-6 sm:h-6" />
              </button>
              
              <button 
                onClick={nextImage}
                className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 p-1.5 sm:p-2 bg-white/80 hover:bg-white text-slate-800 rounded-full shadow opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-all z-10"
              >
                <ChevronRight size={20} className="sm:w-6 sm:h-6" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* ================= DETAILS SECTION ================= */}
      <div className="flex-1 flex flex-col">
        {/* Product name + out-of-stock badge */}
        <h1 className="text-2xl sm:text-3xl font-semibold text-slate-800 flex items-center flex-wrap gap-3 sm:gap-4 leading-tight">
          <span className="break-words w-full sm:w-auto">{product.name}</span>
          {!product.inStock && (
            <span className="text-xs sm:text-sm font-bold text-red-600 bg-red-100 px-2.5 py-1 rounded-full border border-red-200 shrink-0">
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
                size={14} 
                fill={index < Math.round(averageRating) ? "#00C950" : "#D1D5DB"} 
                className={`sm:w-4 sm:h-4 ${index < Math.round(averageRating) ? "text-[#00C950]" : "text-gray-300"}`}
              />
            ))}
          </div>
          <p className="text-xs sm:text-sm ml-2 sm:ml-3 text-slate-500 font-medium">
            {averageRating > 0 ? averageRating.toFixed(1) : "0"} ({totalReviews} {totalReviews === 1 ? 'Review' : 'Reviews'})
          </p>
        </div>

        {/* Price section: current price + MRP */}
        <div className="flex flex-wrap items-end my-5 sm:my-6 gap-2 sm:gap-3 text-xl sm:text-2xl font-semibold text-slate-800">
          <p>{currency}{product.price.toLocaleString()}</p>
          {product.mrp > product.price && (
             <p className="text-base sm:text-xl text-slate-500 line-through mb-0.5">{currency}{product.mrp.toLocaleString()}</p>
          )}
        </div>

        {/* Discount info */}
        {product.mrp > product.price && (
          <div className="flex items-center gap-1.5 sm:gap-2 text-slate-500 text-xs sm:text-sm">
            <TagIcon size={14} className="sm:w-4 sm:h-4 shrink-0" />
            <p>Save {((product.mrp - product.price) / product.mrp * 100).toFixed(0)}% right now</p>
          </div>
        )}

        {/* Set Goal Button */}
        <div className="flex items-end gap-5 mt-8 sm:mt-10 w-full sm:w-auto">
          <button
            onClick={setGoalHandler}
            disabled={!product.inStock} // Disable if out of stock
            className={`w-full sm:w-auto px-8 sm:px-10 py-3 sm:py-3.5 text-sm sm:text-base font-medium rounded transition-transform transform shadow-md
              ${!product.inStock
                ? "bg-gray-400 cursor-not-allowed text-white" 
                : "active:scale-95 bg-green-500 text-white hover:bg-green-600" 
              }`}
          >
            {!product.inStock ? "Currently Unavailable" : "Set Goal"}
          </button>
        </div>

        {/* Divider */}
        <hr className="border-gray-200 my-5 sm:my-6" />

        {/* Additional product features */}
        <div className="flex flex-col gap-3 sm:gap-4 text-slate-500 text-sm sm:text-base">
          <p className="flex items-center gap-3"><EarthIcon className="text-slate-400 shrink-0" size={18} /> Free shipping above {currency}5,000</p>
          <p className="flex items-center gap-3"><CreditCardIcon className="text-slate-400 shrink-0" size={18} /> 100% Secured Payment</p>
          <p className="flex items-center gap-3"><UserIcon className="text-slate-400 shrink-0" size={18} /> Trusted by top brands</p>
        </div>
      </div>
    </div>
  )
}

export default ProductDetails;