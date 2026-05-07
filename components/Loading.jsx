'use client'

/* ================= Loading Spinner Component =================
   Displays a full-screen centered spinner while data or content is loading.
   Uses Tailwind CSS for styling and animation.
================================================================= */
const Loading = () => {
    return (
        // Changed h-screen to min-h-[100dvh] to prevent issues with mobile browser address bars
        <div className='flex items-center justify-center min-h-[100dvh] w-full bg-transparent'>
            {/* Spinner Circle */}
            <div
                className='
                    w-10 h-10 sm:w-11 sm:h-11        /* Width and height of the spinner (scales on mobile) */
                    rounded-full             /* Makes it circular */
                    border-3                 /* Thickness of the border */
                    border-gray-300          /* Base border color */
                    border-t-green-500       /* Top border color (visible during spin) */
                    animate-spin             /* Tailwind spin animation */
                '
            ></div>
        </div>
    )
}

export default Loading