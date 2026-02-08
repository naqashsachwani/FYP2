'use client'

import { Star } from 'lucide-react'; // Star icon for rating
import React, { useState } from 'react';
import { XIcon } from 'lucide-react'; // Close icon
import toast from 'react-hot-toast'; // Toast notifications
import { useAuth } from '@clerk/nextjs'; // Auth hooks
import { useDispatch } from 'react-redux'; // Redux dispatcher
import axios from 'axios';
import { addRating } from '@/lib/features/rating/ratingSlice'; // Redux action to update rating state

// RatingModal component: modal for submitting product rating & review
const RatingModal = ({ ratingModal, setRatingModal }) => {

    const { getToken } = useAuth(); // Get auth token
    const dispatch = useDispatch(); // Redux dispatcher

    // Local state for rating value (1-5) and review text
    const [rating, setRating] = useState(0);
    const [review, setReview] = useState('');

    // Submit handler for rating
    const handleSubmit = async () => {
        // Validation
        if (rating < 0 || rating > 5) {
            return toast('Please select a rating'); // Toast if invalid
        }
        if (review.length < 5) {
            return toast('write a short review'); // Require at least 5 characters
        }

        try {
            const token = await getToken(); // Get JWT token
            // POST rating to API
            const { data } = await axios.post('/api/rating', {
                productId: ratingModal.productId,
                orderId: ratingModal.orderId,
                rating,
                review
            }, {
                headers: { Authorization: `Bearer ${token}` } // Auth header
            });

            dispatch(addRating(data.rating)); // Update Redux store
            toast.success(data.message); // Success toast
            setRatingModal(null); // Close modal
        } catch (error) {
            // Show error from API or generic
            toast.error(error?.response?.data?.error || error.message);
        }
    }

    return (
        // Modal backdrop
        <div className='fixed inset-0 z-120 flex items-center justify-center bg-black/10'>
            
            {/* Modal container */}
            <div className='bg-white p-8 rounded-lg shadow-lg w-96 relative'>

                {/* Close button */}
                <button onClick={() => setRatingModal(null)} className='absolute top-3 right-3 text-gray-500 hover:text-gray-700'>
                    <XIcon size={20} />
                </button>

                {/* Modal heading */}
                <h2 className='text-xl font-medium text-slate-600 mb-4'>Rate Product</h2>

                {/* Star rating selector */}
                <div className='flex items-center justify-center mb-4'>
                    {Array.from({ length: 5 }, (_, i) => (
                        <Star
                            key={i}
                            className={`size-8 cursor-pointer ${rating > i ? "text-green-400 fill-current" : "text-gray-300"}`}
                            onClick={() => setRating(i + 1)} // Set rating on click
                        />
                    ))}
                </div>

                {/* Review textarea */}
                <textarea
                    className='w-full p-2 border border-gray-300 rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-green-400'
                    placeholder='Write your review (optional)'
                    rows='4'
                    value={review}
                    onChange={(e) => setReview(e.target.value)}
                ></textarea>

                {/* Submit button */}
                <button 
                    onClick={e => toast.promise(handleSubmit(), { loading: 'Submitting...' })} // Show toast while submitting
                    className='w-full bg-green-500 text-white py-2 rounded-md hover:bg-green-600 transition'
                >
                    Submit Rating
                </button>
            </div>
        </div>
    )
}

export default RatingModal;
