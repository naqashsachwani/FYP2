'use client'

import Loading from "@/components/Loading"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState, Suspense } from "react"

// 1. Move the logic into a separate internal component
function LoadingContent() {
    const router = useRouter()
    const searchParams = useSearchParams() // This hook causes the build error if not suspended
    
    const [count, setCount] = useState(8)

    useEffect(() => {
        const url = searchParams.get('nextUrl')

        // Security Check & Redirect Logic
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

            return () => clearInterval(interval)
        }
    }, [router, searchParams])

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
export default function LoadingPage() {
    return (
        // Next.js needs this boundary to build the page correctly
        <Suspense fallback={
            <div className="flex flex-col items-center justify-center min-h-screen">
                <Loading />
            </div>
        }>
            <LoadingContent />
        </Suspense>
    )
}