'use client' // Required for client-side components in Next.js (hooks, events, etc.)

// Importing arrow icon from lucide-react
import { ArrowRight } from 'lucide-react'
// Next.js Link for client-side navigation
import Link from 'next/link'
// React import
import React from 'react'

/**
 * REUSABLE UI COMPONENT: Title
 * This component is reusable across multiple pages (Home, Shop, etc.).
 * Instead of repeating the same heading layout, we pass dynamic data using props.
 */
const Title = ({ 
    title,                 // Main heading text
    description,           // Short description shown under the heading
    visibleButton = true,  // Controls button visibility (default: true)
    href = ''              // Navigation link for "View more"
}) => {

    return (
        // Parent container
        // Flex column layout to center items vertically and horizontally
        <div className='flex flex-col items-center px-2 sm:px-0'>
            
            {/* Main Heading */}
            <h2 className='text-xl sm:text-2xl lg:text-3xl font-bold text-slate-800 text-center mb-1'>
                {title}
            </h2>
            {/* Next.js Link Wrapper
                Wraps both the description text and button.
                Clicking anywhere inside navigates to the given `href`.
            */}
            <Link 
                href={href} 
                className='flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-xs sm:text-sm text-slate-600 mt-2 sm:mt-3 group cursor-pointer'
            >            
                {/* Description Text
                    max-w-lg prevents the text from becoming too wide on large screens
                */}
                <p className='max-w-xs sm:max-w-md lg:max-w-lg text-center leading-relaxed px-4 sm:px-0'>
                    {description}
                </p>               
                {/* Conditional Rendering using Logical AND (&&)
                    - If `visibleButton` is true → button renders
                    - If false → React ignores this block
                */}
                {visibleButton && (
                    <button className='text-green-500 flex items-center gap-1.5 font-semibold group-hover:text-green-600 transition-colors shrink-0 mt-1 sm:mt-0'>
                        View more 
                        <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                )}
            </Link>
        </div>
    )
}

// Exporting component so it can be used in other pages/components
export default Title