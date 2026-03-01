'use client'

import { Star, XIcon, MessageSquareHeart } from 'lucide-react'; 
import React, { useState } from 'react';
import toast from 'react-hot-toast'; 
import { useAuth } from '@clerk/nextjs'; 
import { useDispatch } from 'react-redux'; 
import axios from 'axios';
import { addRating } from '@/lib/features/rating/ratingSlice'; 

const RatingModal = ({ ratingModal, setRatingModal, onSuccess }) => {

    const { getToken } = useAuth(); 
    const dispatch = useDispatch(); 

    const [rating, setRating] = useState(0);
    const [review, setReview] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false); // Prevents double-clicking

    const handleSubmit = async () => {
        // Validation
        if (rating === 0) {
            return toast.error('Please select a star rating.');
        }
        if (review.trim().length < 5) {
            return toast.error('Please write a short review (at least 5 characters).'); 
        }

        setIsSubmitting(true);
        const toastId = toast.loading('Submitting your review...');

        try {
            const token = await getToken(); 
            const { data } = await axios.post('/api/rating', {
                productId: ratingModal.productId,
                orderId: ratingModal.orderId, // Might be undefined from Product page, but backend finds it automatically!
                rating,
                review
            }, {
                headers: { Authorization: `Bearer ${token}` } 
            });

            // Update Redux globally
            dispatch(addRating(data.rating)); 
            
            toast.success(data.message, { id: toastId }); 
            setRatingModal(null); // Close modal
            
            // If the parent component passed an onSuccess function, run it!
            // This instantly updates the ProductDescription page without refreshing.
            if (onSuccess) {
                onSuccess(data.rating);
            }

        } catch (error) {
            // Our backend API sends specific error messages (e.g., "Already reviewed", "Not delivered yet")
            toast.error(error?.response?.data?.error || 'Failed to submit review.', { id: toastId });
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        // Modal backdrop
        <div className='fixed inset-0 z- flex items-center justify-center bg-slate-900/40 backdrop-blur-sm'>
            
            {/* Modal container */}
            <div className='bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md relative mx-4 transform transition-all'>

                {/* Close button */}
                <button 
                    onClick={() => setRatingModal(null)} 
                    className='absolute top-4 right-4 p-2 bg-slate-50 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors'
                >
                    <XIcon size={20} />
                </button>

                {/* Modal Header */}
                <div className='flex items-center gap-3 mb-6 border-b border-slate-100 pb-4'>
                    <div className='p-2 bg-emerald-50 text-emerald-600 rounded-lg'>
                        <MessageSquareHeart size={24} />
                    </div>
                    <h2 className='text-xl font-bold text-slate-800'>Rate Product</h2>
                </div>

                {/* Star rating selector */}
                <div className='flex flex-col items-center justify-center mb-6'>
                    <p className='text-sm text-slate-500 mb-2 font-medium'>Tap a star to rate</p>
                    <div className='flex gap-1'>
                        {Array.from({ length: 5 }, (_, i) => (
                            <Star
                                key={i}
                                className={`size-10 cursor-pointer transition-all hover:scale-110 ${rating > i ? "text-emerald-500 fill-current" : "text-slate-200"}`}
                                onClick={() => setRating(i + 1)} 
                            />
                        ))}
                    </div>
                </div>

                {/* Review textarea */}
                <div className='mb-6'>
                    <label className='block text-sm font-medium text-slate-700 mb-2'>Your Review</label>
                    <textarea
                        className='w-full p-3 border border-slate-200 bg-slate-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all resize-none text-slate-700'
                        placeholder='What did you like or dislike about this product?'
                        rows='4'
                        value={review}
                        onChange={(e) => setReview(e.target.value)}
                        disabled={isSubmitting}
                    ></textarea>
                </div>

                {/* Submit button */}
                <button 
                    onClick={handleSubmit} 
                    disabled={isSubmitting}
                    className={`w-full py-3 rounded-xl font-semibold shadow-md transition-all 
                        ${isSubmitting 
                            ? 'bg-emerald-400 text-white cursor-not-allowed opacity-70' 
                            : 'bg-emerald-600 text-white hover:bg-emerald-700 hover:shadow-lg active:scale-[0.98]'
                        }`
                    }
                >
                    {isSubmitting ? 'Posting Review...' : 'Submit Review'}
                </button>
                
            </div>
        </div>
    )
}

export default RatingModal;