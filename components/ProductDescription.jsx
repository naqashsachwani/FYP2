'use client'

import { ArrowRight, StarIcon } from "lucide-react" // Importing icons from lucide-react
import Image from "next/image" // Next.js optimized Image component
import Link from "next/link" // Next.js Link component for client-side navigation
import { useState } from "react" // React hook for managing state

// ProductDescription component receives a 'product' prop
const ProductDescription = ({ product }) => {

    // State to manage which tab is selected ('Description' or 'Reviews')
    const [selectedTab, setSelectedTab] = useState('Description')

    return (
        <div className="my-18 text-sm text-slate-600">
            {/* Tabs Section */}
            <div className="flex border-b border-slate-200 mb-6 max-w-2xl">
                {/* Mapping over tab names to create buttons */}
                {['Description', 'Reviews'].map((tab, index) => (
                    <button 
                        key={index} 
                        className={`${tab === selectedTab ? 'border-b-[1.5px] font-semibold' : 'text-slate-400'} px-3 py-2 font-medium`}
                        onClick={() => setSelectedTab(tab)} // Update selected tab on click
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Description Tab Content */}
            {selectedTab === "Description" && (
                <p className="max-w-xl">{product.description}</p> // Display product description
            )}

            {/* Reviews Tab Content */}
            {selectedTab === "Reviews" && (
                <div className="flex flex-col gap-3 mt-14">
                    {/* Loop through product ratings/reviews */}
                    {product.rating.map((item, index) => (
                        <div key={index} className="flex gap-5 mb-10">
                            {/* User profile image */}
                            <Image 
                                src={item.user.image} 
                                alt="" 
                                className="size-10 rounded-full" 
                                width={100} 
                                height={100} 
                            />
                            <div>
                                {/* Star rating display */}
                                <div className="flex items-center">
                                    {Array(5).fill('').map((_, index) => (
                                        <StarIcon 
                                            key={index} 
                                            size={18} 
                                            className='text-transparent mt-0.5' 
                                            fill={item.rating >= index + 1 ? "#00C950" : "#D1D5DB"} // Fill color based on rating
                                        />
                                    ))}
                                </div>
                                {/* User review text */}
                                <p className="text-sm max-w-lg my-4">{item.review}</p>
                                {/* Reviewer name */}
                                <p className="font-medium text-slate-800">{item.user.name}</p>
                                {/* Review date */}
                                <p className="mt-3 font-light">{new Date(item.createdAt).toDateString()}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Store Info Section */}
            <div className="flex gap-3 mt-14">
                {/* Store logo */}
                <Image 
                    src={product.store.logo} 
                    alt="" 
                    className="size-11 rounded-full ring ring-slate-400" 
                    width={100} 
                    height={100} 
                />
                <div>
                    {/* Store name */}
                    <p className="font-medium text-slate-600">Product by {product.store.name}</p>
                    {/* Link to the store page */}
                    <Link href={`/shop/${product.store.username}`} className="flex items-center gap-1.5 text-green-500">
                        view store <ArrowRight size={14} />
                    </Link>
                </div>
            </div>
        </div>
    )
}

export default ProductDescription
