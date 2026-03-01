'use client'

import { ArrowRight, StarIcon, PlusCircle, MessageSquareQuote } from "lucide-react" 
import Image from "next/image" 
import Link from "next/link" 
import { useState } from "react" 
import { useUser } from "@clerk/nextjs" // To check if user is logged in
import RatingModal from "./RatingModal" // Import your existing modal

const ProductDescription = ({ product }) => {
    const { user } = useUser(); // Get current logged-in user
    const [selectedTab, setSelectedTab] = useState('Description');
    const [ratingModalData, setRatingModalData] = useState(null);
    
    // Local state for reviews to allow instant UI updates without page reload
    const [localReviews, setLocalReviews] = useState(product.rating || []);

    // Callback when a review is successfully saved in the database
    const handleReviewSuccess = (newReview) => {
        // Instantly add the new review to the top of the list
        setLocalReviews([newReview, ...localReviews]);
    };

    return (
        <div className="my-18 text-sm text-slate-600 relative">
            {/* Tabs Section */}
            <div className="flex border-b border-slate-200 mb-6 max-w-2xl">
                {['Description', 'Reviews'].map((tab, index) => (
                    <button 
                        key={index} 
                        className={`${tab === selectedTab ? 'border-b-[1.5px] border-emerald-500 text-emerald-600 font-semibold' : 'text-slate-400'} px-4 py-2 font-medium transition-colors`}
                        onClick={() => setSelectedTab(tab)}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Description Tab Content */}
            {selectedTab === "Description" && (
                <p className="max-w-xl leading-relaxed">{product.description}</p> 
            )}

            {/* Reviews Tab Content */}
            {selectedTab === "Reviews" && (
                <div className="mt-8">
                    
                    {/* Add Review Header & Button */}
                    <div className="flex justify-between items-center mb-8 border-b border-slate-100 pb-4">
                        <h3 className="text-lg font-semibold text-slate-800">Customer Reviews</h3>
                        {user ? (
                            <button 
                                onClick={() => setRatingModalData({ productId: product.id })}
                                className="flex items-center gap-2 bg-emerald-50 text-emerald-600 px-4 py-2 rounded-full font-medium hover:bg-emerald-100 transition shadow-sm"
                            >
                                <PlusCircle size={16} />
                                Write a Review
                            </button>
                        ) : (
                            <p className="text-sm text-slate-400 italic">Sign in to write a review.</p>
                        )}
                    </div>

                    {/* Review List */}
                    <div className="flex flex-col gap-3">
                        {localReviews.length > 0 ? (
                            localReviews.map((item, index) => (
                                <div key={index} className="flex gap-5 mb-8">
                                    {/* Safe User Profile Image */}
                                    <div className="w-10 h-10 shrink-0 bg-slate-200 rounded-full overflow-hidden relative">
                                        {item.user?.image && (
                                            <Image 
                                                src={item.user.image} 
                                                alt={item.user?.name || "User"} 
                                                fill className="object-cover" 
                                            />
                                        )}
                                    </div>
                                    <div>
                                        {/* Star rating display */}
                                        <div className="flex items-center">
                                            {Array(5).fill('').map((_, i) => (
                                                <StarIcon 
                                                    key={i} 
                                                    size={16} 
                                                    className='text-transparent mt-0.5' 
                                                    fill={item.rating >= i + 1 ? "#10b981" : "#D1D5DB"} // emerald-500
                                                />
                                            ))}
                                        </div>
                                        <p className="text-sm max-w-lg my-3 leading-relaxed text-slate-600">{item.review}</p>
                                        <p className="font-medium text-slate-800">{item.user?.name || "Anonymous User"}</p>
                                        <p className="mt-1 text-xs text-slate-400">{new Date(item.createdAt).toDateString()}</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                <MessageSquareQuote size={40} className="text-slate-300 mb-3" />
                                <p className="text-slate-500 font-medium">No reviews yet.</p>
                                <p className="text-sm text-slate-400 mt-1">Be the first to review this product!</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Store Info Section */}
            <div className="flex gap-3 mt-14 pt-8 border-t border-slate-100">
                <div className="w-11 h-11 shrink-0 rounded-full border border-slate-200 overflow-hidden relative bg-white flex items-center justify-center">
                    {product.store?.logo ? (
                        <Image 
                            src={product.store.logo} 
                            alt={product.store?.name} 
                            fill className="object-cover" 
                        />
                    ) : (
                        <span className="text-xs font-bold text-slate-400">STORE</span>
                    )}
                </div>
                <div>
                    <p className="font-medium text-slate-600">Product by {product.store?.name}</p>
                    <Link href={`/shop/${product.store?.username}`} className="flex items-center gap-1.5 text-emerald-500 hover:text-emerald-600 transition font-medium mt-1">
                        View store <ArrowRight size={14} />
                    </Link>
                </div>
            </div>

            {/* Mount the Rating Modal when triggered */}
            {ratingModalData && (
                <RatingModal 
                    ratingModal={ratingModalData} 
                    setRatingModal={setRatingModalData} 
                    onSuccess={handleReviewSuccess} // Pass the success function down
                />
            )}
        </div>
    )
}

export default ProductDescription;