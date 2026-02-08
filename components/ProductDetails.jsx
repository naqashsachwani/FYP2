'use client'

import { useRouter } from "next/navigation"; // For client-side routing
import { StarIcon, TagIcon, EarthIcon, CreditCardIcon, UserIcon } from "lucide-react"; // Icons
import { useState } from "react";
import Image from "next/image"; // Next.js optimized images

// ProductDetails component: displays product info and allows setting a goal
const ProductDetails = ({ product }) => {
  const productId = String(product.id); // Ensure productId is string
  const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || 'Rs '; // Currency symbol
  const router = useRouter(); // Next.js router for navigation

  // State for main image display
  const [mainImage, setMainImage] = useState(product.images?.[0] || "");

  // Handler for "Set Goal" button
  const setGoalHandler = () => {
    if (product.inStock) {
      // Navigate to set-goal page with productId as query param
      router.push(`/set-goal?productId=${encodeURIComponent(productId)}`);
    }
  }

  // Calculate average rating safely
  const averageRating = product?.ratings && product.ratings.length > 0
    ? product.ratings.reduce((acc, item) => acc + item.rating, 0) / product.ratings.length
    : 0;

  return (
    <div className="flex max-lg:flex-col gap-12">
      {/* ================= IMAGE SECTION ================= */}
      {/* Flex container: on smaller screens, layout stacks vertically */}
      <div className={`flex max-sm:flex-col-reverse gap-3 ${!product.inStock ? 'opacity-75' : ''}`}>
        
        {/* Thumbnail images */}
        <div className="flex sm:flex-col gap-3">
          {product.images?.map((image, index) => (
            <div
              key={index}
              onClick={() => setMainImage(product.images[index])} // Set main image on click
              className={`bg-slate-100 flex items-center justify-center size-26 rounded-lg cursor-pointer transition-transform transform hover:scale-105
                ${mainImage === image ? 'ring-2 ring-offset-1 ring-slate-300' : ''}`} // Highlight selected image
            >
              <Image src={image} alt="" width={45} height={45} />
            </div>
          ))}
        </div>

        {/* Main product image */}
        <div className="flex justify-center items-center h-100 sm:size-113 bg-slate-100 rounded-lg shadow-lg relative">
          {mainImage ? (
            <Image src={mainImage} alt="" width={250} height={250} className="transition-transform hover:scale-105" />
          ) : (
            // Placeholder if no image is available
            <div className="w-64 h-64 flex items-center justify-center bg-gray-200 text-gray-500">No Image</div>
          )}
        </div>
      </div>

      {/* ================= DETAILS SECTION ================= */}
      <div className="flex-1">
        {/* Product name + out-of-stock badge */}
        <h1 className="text-3xl font-semibold text-slate-800 flex items-center">
          {product.name}
          {!product.inStock && (
            <span className="ml-4 text-sm font-bold text-red-600 bg-red-100 px-3 py-1 rounded-full border border-red-200">
              Out of Stock
            </span>
          )}
        </h1>

        {/* Rating stars + review count */}
        <div className='flex items-center mt-2'>
          {Array(5).fill('').map((_, index) => (
            <StarIcon key={index} size={14} fill={averageRating >= index + 1 ? "#00C950" : "#D1D5DB"} />
          ))}
          <p className="text-sm ml-3 text-slate-500">{product.ratings?.length || 0} Reviews</p>
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
                ? "bg-gray-400 cursor-not-allowed text-white" // Disabled styles
                : "active:scale-95 bg-green-500 text-white hover:bg-green-600" // Active/hover styles
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
