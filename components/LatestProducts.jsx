'use client'

/* ================= Imports ================= */
import React from 'react'
import Title from './Title'
import ProductCard from './ProductCard'
import { useSelector } from 'react-redux'

const LatestProducts = () => {
  // Number of products to display on the homepage
  const displayQuantity = 4

  // Get product list from Redux store (fallback to empty array)
  const products = useSelector((state) => state.product.list || [])

  /* ================= Latest Products Logic =================
     1. Create a shallow copy of products (to avoid mutating Redux state)
     2. Sort products by creation date (newest first)
     3. Limit results to displayQuantity
  =========================================================== */
  const latestProducts = products
    .slice()
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, displayQuantity)

  return (
    <div className="px-4 sm:px-6 lg:px-8 my-24 max-w-7xl mx-auto">
      
      {/* Section Title */}
      <Title
        title="Latest from DreamSaver"
        description={`Showing ${latestProducts.length} of ${products.length} new arrivals`}
        href="/shop"
      />

      {/* Products Grid */}
      <div className="mt-12 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6 sm:gap-8 xl:gap-10">
        {latestProducts.map((product, index) => (
          <div
            key={index}
            className="rounded-2xl overflow-hidden transform transition-all duration-300 
                       hover:scale-105 hover:-translate-y-1 hover:shadow-2xl"
          >
            {/* Individual Product Card */}
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </div>
  )
}

export default LatestProducts
