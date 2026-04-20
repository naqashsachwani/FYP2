// Declares this as a Client Component, allowing the use of React hooks (useState, useEffect) and browser APIs.
'use client'

// --- Imports ---
import Loading from "@/components/Loading"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState, Suspense } from "react"

// 1. Move the logic into a separate internal component
// This component handles the actual countdown and redirection logic.
function LoadingContent() {
    // Initialize Next.js router for programmatic navigation.
    const router = useRouter()
    // Initialize search params to read query strings from the URL (e.g., ?nextUrl=/dashboard).
    // Note: Using this hook requires wrapping the component in <Suspense> in Next.js App Router.
    const searchParams = useSearchParams() 
    
    // State to track the countdown timer, starting at 8 seconds.
    const [count, setCount] = useState(8)

    // useEffect runs on component mount and whenever router or searchParams change.
    useEffect(() => {
        // Extract the 'nextUrl' parameter from the URL.
        const url = searchParams.get('nextUrl')

        // Security Check & Redirect Logic
        // Ensures the URL exists and is a relative path (starts with '/').
        // This prevents "Open Redirect" vulnerabilities where malicious actors could redirect users to external sites.
        if (url && url.startsWith('/')) {
            // Start an interval that runs every 1000ms (1 second).
            const interval = setInterval(() => {
                setCount((prev) => {
                    // When the countdown reaches 1 (about to hit 0):
                    if (prev <= 1) {
                        clearInterval(interval) // Stop the timer
                        router.push(url)        // Redirect the user to the target URL
                        return 0                // Set count to 0
                    }
                    // Otherwise, decrement the counter by 1.
                    return prev - 1
                })
            }, 1000)

            // Cleanup function: Clears the interval if the component unmounts before the countdown finishes,
            // preventing memory leaks and errors.
            return () => clearInterval(interval)
        }
    }, [router, searchParams])

    // Render the loading UI with the dynamic countdown.
    return (
        <div className="flex flex-col items-center justify-center min-h-screen gap-4">
            <Loading />
            <p className="text-slate-600 font-medium animate-pulse">
                Redirecting you in {count} seconds...
            </p>
        </div>
    )
}

// 2. Export the Page wrapped in Suspense
// This is the main page component exported for the route.
export default function LoadingPage() {
    return (
        // Next.js needs this boundary to build the page correctly
        // Suspense catches the "loading" state of useSearchParams during server-side rendering.
        <Suspense fallback={
            // The fallback UI shown immediately while the searchParams are resolving.
            <div className="flex flex-col items-center justify-center min-h-screen">
                <Loading />
            </div>
        }>
            {/* The actual content that uses useSearchParams */}
            <LoadingContent />
        </Suspense>
    )
}