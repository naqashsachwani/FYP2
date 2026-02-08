'use client' // Marks this as a Client Component (required for Redux hooks)

// Section title component
import Title from './Title'

// Individual product card
import ProductCard from './ProductCard'

// Redux hook to access global state
import { useSelector } from 'react-redux'

// Best Selling Products Section
const BestSelling = () => {

  // Number of products to display in this section
  const displayQuantity = 8

  // Fetch product list from Redux store
  const products = useSelector((state) => state.product.list)

  // Sort products based on number of ratings (popularity)
  // Then select only the top `displayQuantity` products
  const sortedProducts = products
    ?.slice() // Create a copy to avoid mutating Redux state
    .sort(
      (a, b) =>
        (b.rating?.length || 0) - (a.rating?.length || 0) // Descending order
    )
    .slice(0, displayQuantity)

  return (
    <div className="px-4 sm:px-6 lg:px-8 my-24 max-w-7xl mx-auto">

      {/* Section title & description */}
      <Title
        title="Best Selling"
        description={`Showing ${
          products?.length < displayQuantity
            ? products.length
            : displayQuantity
        } of ${products?.length || 0} products`}
        href="/shop" // Redirect to full shop page
      />

      {/* ================= PRODUCT GRID ================= */}
      <div className="mt-12 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6 sm:gap-8 xl:gap-10">
        {sortedProducts?.map((product, index) => (
          <div
            key={index}
            className="bg-white rounded-2xl p-2 sm:p-4 shadow-md
                       hover:shadow-2xl hover:scale-105
                       transition-transform duration-300 ease-in-out"
          >
            {/* Product Card */}
            <ProductCard product={product} />
          </div>
        ))}
      </div>

      {/* Decorative gradient divider */}
      <div className="mt-12 h-1 w-full max-w-3xl mx-auto rounded-full
                      bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500
                      opacity-30" />
    </div>
  )
}

export default BestSelling
