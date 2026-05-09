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
    // ✅ Responsive Fix: min-h-[100dvh]
    return (
        <div className="flex flex-col items-center justify-center min-h-[100dvh] gap-3 sm:gap-4 bg-slate-50 px-4 text-center">
            <Loading />
            <p className="text-slate-600 font-bold text-sm sm:text-base animate-pulse mt-4">
                Redirecting you in <span className="text-green-600">{count}</span> seconds...
            </p>
        </div>
    )
}

// This is the main page component exported for the route.
export default function LoadingPage() {
    return (
        // Suspense catches the "loading" state of useSearchParams during server-side rendering.
        <Suspense fallback={
            <div className="flex flex-col items-center justify-center min-h-[100dvh] bg-slate-50">
                <Loading />
            </div>
        }>
            <LoadingContent />
        </Suspense>
    )
}