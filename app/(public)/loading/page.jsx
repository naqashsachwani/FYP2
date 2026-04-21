'use client'

import Loading from "@/components/Loading"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState, Suspense } from "react"

// This component handles the actual countdown and redirection logic.
function LoadingContent() {
    
    const router = useRouter()
    // Initialize search params to read query strings from the URL 
    const searchParams = useSearchParams() 
    
    // State to track the countdown timer, starting at 8 seconds.
    const [count, setCount] = useState(8)

    useEffect(() => {
        const url = searchParams.get('nextUrl')

        
        // This prevents "Open Redirect" vulnerabilities where malicious actors could redirect users to external sites.
        if (url && url.startsWith('/')) {
            const interval = setInterval(() => {
                setCount((prev) => {
                    if (prev <= 1) {
                        clearInterval(interval) 
                        router.push(url)        
                        return 0                
                    }
                    return prev - 1
                })
            }, 1000)

            // Cleanup function: Clears the interval if the component unmounts before the countdown finishes, preventing memory leaks and errors.
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

// This is the main page component exported for the route.
export default function LoadingPage() {
    return (
        // Suspense catches the "loading" state of useSearchParams during server-side rendering.
        <Suspense fallback={
            <div className="flex flex-col items-center justify-center min-h-screen">
                <Loading />
            </div>
        }>
            <LoadingContent />
        </Suspense>
    )
}