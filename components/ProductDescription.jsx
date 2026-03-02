'use client'

import { ArrowRight, StarIcon, PlusCircle, MessageSquareQuote, X, ChevronLeft, ChevronRight } from "lucide-react" 
import Image from "next/image" 
import Link from "next/link" 
import { useState, useEffect } from "react" 
import { useUser } from "@clerk/nextjs" 
import { useRouter } from "next/navigation" 
import RatingModal from "./RatingModal" 

const ProductDescription = ({ product }) => {
    const { user } = useUser(); 
    const router = useRouter(); 
    
    const [selectedTab, setSelectedTab] = useState('Description');
    const [ratingModalData, setRatingModalData] = useState(null);
    
    const [localReviews, setLocalReviews] = useState(product?.ratings || []);
    
    // --- THE FIX: Watch the entire 'product' object to catch fresh API background updates ---
    useEffect(() => {
        if (product?.ratings) {
            setLocalReviews(product.ratings);
        }
    }, [product]);

    const [selectedViewerImage, setSelectedViewerImage] = useState(null);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const REVIEWS_PER_PAGE = 5; 

    const handleReviewSuccess = (newReview) => {
        // Optimistically add the new review to the top
        setLocalReviews(prev => [newReview, ...prev]);
        setCurrentPage(1); // Instantly jump back to page 1 to see the new review
        router.refresh(); 
    };

    const formatSafeDate = (dateValue) => {
        if (!dateValue) return "Just now";
        const d = new Date(dateValue);
        return isNaN(d.getTime()) ? "Just now" : d.toDateString();
    };

    // Pagination Logic
    const totalPages = Math.ceil(localReviews.length / REVIEWS_PER_PAGE);
    const indexOfLastReview = currentPage * REVIEWS_PER_PAGE;
    const indexOfFirstReview = indexOfLastReview - REVIEWS_PER_PAGE;
    const currentReviews = localReviews.slice(indexOfFirstReview, indexOfLastReview);

    return (
        <div className="my-18 text-sm text-slate-600 relative">
            {/* Tabs */}
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

            {selectedTab === "Description" && (
                <p className="max-w-xl leading-relaxed">{product.description}</p> 
            )}

            {selectedTab === "Reviews" && (
                <div className="mt-8">
                    
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

                    <div className="flex flex-col gap-3">
                        {currentReviews.length > 0 ? (
                            <>
                                {/* Map over currentReviews for pagination */}
                                {currentReviews.map((item, index) => (
                                    <div key={index} className="flex gap-5 mb-8">
                                        <div className="w-10 h-10 shrink-0 bg-slate-200 rounded-full overflow-hidden relative flex items-center justify-center">
                                            {item.user?.image ? (
                                                <Image 
                                                    src={item.user.image} 
                                                    alt={item.user?.name || "User"} 
                                                    fill className="object-cover" 
                                                />
                                            ) : (
                                                <span className="text-slate-400 font-bold">{item.user?.name?.[0] || "U"}</span>
                                            )}
                                        </div>
                                        <div>
                                            <div className="flex items-center">
                                                {Array(5).fill('').map((_, i) => (
                                                    <StarIcon 
                                                        key={i} 
                                                        size={16} 
                                                        className='text-transparent mt-0.5' 
                                                        fill={item.rating >= i + 1 ? "#10b981" : "#D1D5DB"} 
                                                    />
                                                ))}
                                            </div>
                                            
                                            <p className="text-sm max-w-lg my-3 leading-relaxed text-slate-600">{item.review}</p>
                                            
                                            {/* Bulletproof Image Gallery */}
                                            {(() => {
                                                let parsedImages = [];
                                                const rawImages = item.images;

                                                if (!rawImages) return null;

                                                if (Array.isArray(rawImages)) {
                                                    parsedImages = rawImages;
                                                } else if (typeof rawImages === 'string' && rawImages.trim() !== '') {
                                                    try {
                                                        parsedImages = JSON.parse(rawImages);
                                                        if (!Array.isArray(parsedImages)) {
                                                            parsedImages = [parsedImages];
                                                        }
                                                    } catch {
                                                        parsedImages = [rawImages];
                                                    }
                                                }

                                                if (parsedImages && parsedImages.length > 0) {
                                                    return (
                                                        <div className="flex gap-2 mb-3 flex-wrap">
                                                            {parsedImages.map((imgUrl, imgIdx) => (
                                                                <div 
                                                                    key={imgIdx} 
                                                                    onClick={() => setSelectedViewerImage(imgUrl)}
                                                                    className="w-20 h-20 rounded-lg overflow-hidden border border-slate-200 shadow-sm hover:scale-105 hover:border-emerald-300 transition-all cursor-pointer relative"
                                                                >
                                                                    <img 
                                                                        src={imgUrl} 
                                                                        alt={`Review Attachment ${imgIdx + 1}`} 
                                                                        className="w-full h-full object-cover" 
                                                                    />
                                                                </div>
                                                            ))}
                                                        </div>
                                                    );
                                                }
                                                
                                                return null;
                                            })()}

                                            <p className="font-medium text-slate-800">{item.user?.name || "Anonymous User"}</p>
                                            <p className="mt-1 text-xs text-slate-400">{formatSafeDate(item.createdAt)}</p>
                                        </div>
                                    </div>
                                ))}

                                {/* Pagination Controls */}
                                {totalPages > 1 && (
                                    <div className="flex items-center justify-center gap-6 mt-6 pt-6 border-t border-slate-100">
                                        <button 
                                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                            disabled={currentPage === 1}
                                            className="p-2 rounded-full border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent transition-all"
                                        >
                                            <ChevronLeft size={20} className={currentPage === 1 ? "text-slate-400" : "text-slate-700"} />
                                        </button>
                                        
                                        <span className="text-sm font-medium text-slate-600">
                                            Page {currentPage} of {totalPages}
                                        </span>

                                        <button 
                                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                            disabled={currentPage === totalPages}
                                            className="p-2 rounded-full border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent transition-all"
                                        >
                                            <ChevronRight size={20} className={currentPage === totalPages ? "text-slate-400" : "text-slate-700"} />
                                        </button>
                                    </div>
                                )}
                            </>
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

            {/* Store Info */}
            <div className="flex gap-3 mt-14 pt-8 border-t border-slate-100">
                <div className="w-11 h-11 shrink-0 rounded-full border border-slate-200 overflow-hidden relative bg-white flex items-center justify-center">
                    {product.store?.logo ? (
                        <Image 
                            src={product.store.logo} 
                            alt={product.store?.name || "Store"} 
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

            {ratingModalData && (
                <RatingModal 
                    ratingModal={ratingModalData} 
                    setRatingModal={setRatingModalData} 
                    onSuccess={handleReviewSuccess} 
                />
            )}

            {/* IMAGE LIGHTBOX OVERLAY */}
            {selectedViewerImage && (
                <div 
                    className="fixed inset-0 z-[9999] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 transition-opacity duration-300"
                    onClick={() => setSelectedViewerImage(null)}
                >
                    <button 
                        onClick={() => setSelectedViewerImage(null)}
                        className="absolute top-4 right-4 md:top-6 md:right-6 p-3 bg-slate-800/80 text-white rounded-full hover:bg-red-500 transition-colors z-[10000]"
                    >
                        <X size={24} />
                    </button>

                    <div 
                        className="relative flex items-center justify-center max-w-6xl w-full h-full max-h-[90vh]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <img 
                            src={selectedViewerImage} 
                            alt="Full Screen Review Attachment" 
                            className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl border-2 border-slate-700/50" 
                        />
                    </div>
                </div>
            )}
        </div>
    )
}

export default ProductDescription;