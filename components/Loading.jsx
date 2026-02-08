'use client'

/* ================= Loading Spinner Component =================
   Displays a full-screen centered spinner while data or content is loading.
   Uses Tailwind CSS for styling and animation.
================================================================= */
const Loading = () => {
    return (
        <div className='flex items-center justify-center h-screen'>
            {/* Spinner Circle */}
            <div
                className='
                    w-11 h-11                /* Width and height of the spinner */
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
