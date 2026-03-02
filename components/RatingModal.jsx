'use client'

import { Star, XIcon, MessageSquareHeart, ImagePlus, Trash2 } from 'lucide-react'; 
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

        } catch (error) {
            toast.error(error?.response?.data?.error || 'Failed to submit review.', { id: toastId });
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className='fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm'>
            <div className='bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md relative mx-4 max-h-[90vh] overflow-y-auto'>

                <button onClick={() => setRatingModal(null)} className='absolute top-4 right-4 p-2 bg-slate-50 text-slate-400 hover:text-red-500 rounded-full transition-colors'>
                    <XIcon size={20} />
                </button>

                <div className='flex items-center gap-3 mb-6 border-b border-slate-100 pb-4'>
                    <div className='p-2 bg-emerald-50 text-emerald-600 rounded-lg'>
                        <MessageSquareHeart size={24} />
                    </div>
                    <h2 className='text-xl font-bold text-slate-800'>Rate Product</h2>
                </div>

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

                <div className='mb-4'>
                    <label className='block text-sm font-medium text-slate-700 mb-2'>Your Review</label>
                    <textarea
                        className='w-full p-3 border border-slate-200 bg-slate-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all resize-none text-slate-700'
                        placeholder='What did you like or dislike about this product?'
                        rows='3'
                        value={review}
                        onChange={(e) => setReview(e.target.value)}
                        disabled={isSubmitting}
                    ></textarea>
                </div>

                <div className='mb-6'>
                    <label className='block text-sm font-medium text-slate-700 mb-2'>Add Photos (Max 5)</label>
                    
                    {images.length > 0 && (
                        <div className='flex gap-3 mb-3 flex-wrap'>
                            {images.map((img, idx) => (
                                <div key={idx} className='relative w-16 h-16 rounded-lg overflow-hidden border border-slate-200'>
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
                        <label className='flex items-center justify-center gap-2 w-full p-3 border-2 border-dashed border-emerald-200 bg-emerald-50/50 text-emerald-600 rounded-xl cursor-pointer hover:bg-emerald-50 transition-colors'>
                            <ImagePlus size={18} />
                            <span className='text-sm font-medium'>Upload Image</span>
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
                    className={`w-full py-3 rounded-xl font-semibold shadow-md transition-all ${isSubmitting ? 'bg-emerald-400 text-white cursor-not-allowed opacity-70' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}
                >
                    {isSubmitting ? 'Posting Review...' : 'Submit Review'}
                </button>
                
            </div>
        </div>
    )
}

export default RatingModal;