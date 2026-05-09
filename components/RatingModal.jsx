'use client'

import { Star, XIcon, MessageSquareHeart, ImagePlus, Trash2 } from 'lucide-react'; 
import React, { useState } from 'react';
import toast from 'react-hot-toast'; 
import { useAuth } from '@clerk/nextjs'; 
import { useDispatch } from 'react-redux'; 
import axios from 'axios';
import { addRating } from '@/lib/features/rating/ratingSlice'; 
import { useRouter } from 'next/navigation'; // ✅ Import useRouter

const RatingModal = ({ ratingModal, setRatingModal, onSuccess }) => {

    const { getToken } = useAuth(); 
    const dispatch = useDispatch(); 
    const router = useRouter(); // ✅ Initialize router

    const [rating, setRating] = useState(0);
    const [review, setReview] = useState('');
    const [images, setImages] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleImageUpload = (e) => {
        const files = Array.from(e.target.files);
        
        // Limit to 5 images max
        if (images.length + files.length > 5) {
            return toast.error("You can only upload up to 5 images.");
        }

        files.forEach(file => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onloadend = () => {
                setImages(prev => [...prev, reader.result]);
            };
        });
    };

    const removeImage = (index) => {
        setImages(images.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        if (rating === 0) return toast.error('Please select a star rating.');
        
        setIsSubmitting(true);
        const toastId = toast.loading('Submitting your review...');

        try {
            const token = await getToken(); 
            const { data } = await axios.post('/api/rating', {
                productId: ratingModal.productId,
                rating,
                review,
                images // Send the Base64 strings
            }, {
                headers: { Authorization: `Bearer ${token}` } 
            });

            dispatch(addRating(data.rating)); 
            toast.success(data.message, { id: toastId }); 
            setRatingModal(null); 
            
            if (onSuccess) onSuccess(data.rating);

            // ✅ CRITICAL FIX: Tell Next.js to refresh the page cache so the review doesn't disappear on reload
            router.refresh();

        } catch (error) {
            toast.error(error?.response?.data?.error || 'Failed to submit review.', { id: toastId });
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className='fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4'>
            <div className='bg-white p-6 sm:p-8 rounded-2xl shadow-2xl w-[95%] sm:w-full max-w-md relative max-h-[90vh] overflow-y-auto custom-scrollbar'>

                <button onClick={() => setRatingModal(null)} className='absolute top-3 right-3 sm:top-4 sm:right-4 p-2 bg-slate-50 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors'>
                    <XIcon size={20} className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>

                <div className='flex items-center gap-3 mb-5 sm:mb-6 border-b border-slate-100 pb-3 sm:pb-4'>
                    <div className='p-2 bg-emerald-50 text-emerald-600 rounded-lg shrink-0'>
                        <MessageSquareHeart className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <h2 className='text-lg sm:text-xl font-bold text-slate-800'>Rate Product</h2>
                </div>

                <div className='flex flex-col items-center justify-center mb-5 sm:mb-6'>
                    <p className='text-xs sm:text-sm text-slate-500 mb-2 font-medium'>Tap a star to rate</p>
                    <div className='flex gap-1 sm:gap-2'>
                        {Array.from({ length: 5 }, (_, i) => (
                            <Star
                                key={i}
                                className={`w-8 h-8 sm:w-10 sm:h-10 cursor-pointer transition-all hover:scale-110 shrink-0 ${rating > i ? "text-emerald-500 fill-current" : "text-slate-200"}`}
                                onClick={() => setRating(i + 1)} 
                            />
                        ))}
                    </div>
                </div>

                <div className='mb-4'>
                    <label className='block text-xs sm:text-sm font-medium text-slate-700 mb-2'>Your Review</label>
                    <textarea
                        className='w-full p-3 border border-slate-200 bg-slate-50 rounded-xl text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all resize-none text-slate-700 custom-scrollbar'
                        placeholder='What did you like or dislike about this product?'
                        rows='3'
                        value={review}
                        onChange={(e) => setReview(e.target.value)}
                        disabled={isSubmitting}
                    ></textarea>
                </div>

                <div className='mb-5 sm:mb-6'>
                    <label className='block text-xs sm:text-sm font-medium text-slate-700 mb-2'>Add Photos (Max 5)</label>
                    
                    {images.length > 0 && (
                        <div className='flex gap-2 sm:gap-3 mb-3 flex-wrap'>
                            {images.map((img, idx) => (
                                <div key={idx} className='relative w-14 h-14 sm:w-16 sm:h-16 rounded-lg overflow-hidden border border-slate-200 shrink-0'>
                                    {/* Using standard img to prevent Next.js Base64 crashes */}
                                    <img src={img} alt="Preview" className="w-full h-full object-cover" />
                                    <button 
                                        onClick={() => removeImage(idx)}
                                        className='absolute top-1 right-1 bg-white/80 p-0.5 rounded text-red-500 hover:bg-white'
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {images.length < 5 && (
                        <label className='flex items-center justify-center gap-2 w-full p-2.5 sm:p-3 border-2 border-dashed border-emerald-200 bg-emerald-50/50 text-emerald-600 rounded-xl cursor-pointer hover:bg-emerald-50 transition-colors'>
                            <ImagePlus size={18} className="w-4 h-4 sm:w-[18px] sm:h-[18px] shrink-0" />
                            <span className='text-xs sm:text-sm font-medium'>Upload Image</span>
                            <input 
                                type='file' 
                                accept='image/*' 
                                multiple 
                                className='hidden' 
                                onChange={handleImageUpload}
                                disabled={isSubmitting}
                            />
                        </label>
                    )}
                </div>

                <button 
                    onClick={handleSubmit} 
                    disabled={isSubmitting}
                    className={`w-full py-3 text-sm sm:text-base rounded-xl font-semibold shadow-md transition-all ${isSubmitting ? 'bg-emerald-400 text-white cursor-not-allowed opacity-70' : 'bg-emerald-600 text-white hover:bg-emerald-700 active:scale-[0.98]'}`}
                >
                    {isSubmitting ? 'Posting Review...' : 'Submit Review'}
                </button>
                
            </div>
        </div>
    )
}

export default RatingModal;