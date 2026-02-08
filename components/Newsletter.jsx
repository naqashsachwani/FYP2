import React from 'react'
import Title from './Title'

// Newsletter component for subscribing users to updates
const Newsletter = () => {
    return (
        // Container for the newsletter section
        <div className='flex flex-col items-center mx-4 my-20 lg:my-36'>
            
            {/* Title component: displays the main heading and description */}
            <Title 
                title="Join Our Newsletter" 
                description="Subscribe to get exclusive deals, new arrivals, and insider updates delivered straight to your inbox every week." 
                visibleButton={false} // hides the button inside Title component
            />

            {/* Newsletter input + button container */}
            {/* 
                - Flex layout: column on small screens, row on larger screens (sm:flex-row)
                - Gap between input and button: gap-4
                - Background: semi-transparent white with backdrop blur
                - Rounded corners: rounded-3xl
                - Shadow on hover: hover:shadow-xl
                - Smooth transitions: transition-all duration-300 ease-in-out
                - Responsive width: max-w-2xl
            */}
            <div className='flex flex-col sm:flex-row gap-4 bg-white/90 backdrop-blur-md text-sm p-4 rounded-3xl w-full max-w-2xl my-8 lg:my-12 border border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out'>
                
                {/* Email input field */}
                {/* 
                    - Flex-1: input takes remaining space
                    - Padding: px-6 py-4 on small screens, py-3 on sm+
                    - Rounded corners: rounded-2xl
                    - Focus ring: green-500 with opacity 30%
                    - Smooth transition for hover/focus: transition-all duration-300 ease-in-out
                    - Placeholder color: placeholder-slate-500
                */}
                <input 
                    className='flex-1 px-6 py-4 sm:py-3 outline-none bg-transparent placeholder-slate-500 rounded-2xl border border-slate-200 focus:border-green-500 focus:ring-2 focus:ring-green-500/30 transition-all duration-300 ease-in-out text-slate-700'
                    type="email" 
                    placeholder='Enter your email address' 
                />
                
                {/* Submit button */}
                {/* 
                    - Gradient background: from green-500 to emerald-600
                    - Hover gradient: slightly darker shades
                    - Padding: px-8 py-4, adjusted for sm screens
                    - Rounded corners: rounded-2xl
                    - Transform on hover: slight lift (-translate-y-0.5)
                    - Active state: reset translation and reduce shadow
                    - Shadows: shadow-md base, hover: shadow-lg, active: shadow-md
                    - Smooth transition: transition-all duration-300 ease-in-out
                */}
                <button 
                    className='font-semibold bg-gradient-to-r from-green-500 to-emerald-600 text-white px-8 py-4 sm:py-3 rounded-2xl hover:from-green-600 hover:to-emerald-700 transform hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 ease-in-out shadow-md hover:shadow-lg active:shadow-md'
                >
                    Get Updates
                </button>
            </div>
        </div>
    )
}

export default Newsletter
