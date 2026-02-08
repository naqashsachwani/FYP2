'use client' // Marks this layout as a Client Component (required for hooks & auth)

// React hooks
import { useEffect, useState } from "react"

// Custom loading component
import Loading from "../Loading"

// Next.js routing
import Link from "next/link"

// Icons
import { ArrowRightIcon } from "lucide-react"

// Seller UI components
import SellerNavbar from "./StoreNavbar"
import SellerSidebar from "./StoreSidebar"

// (Optional / unused) dummy data import
import { dummyStoreData } from "@/assets/assets"

// HTTP client
import axios from "axios"

// Clerk authentication
import { useAuth } from "@clerk/nextjs"

// Store layout wrapper component
const StoreLayout = ({ children }) => {

    // Get token generator from Clerk
    const { getToken } = useAuth()

    // State to check if current user is a seller
    const [isSeller, setIsSeller] = useState(false)

    // Loading state while verifying seller access
    const [loading, setLoading] = useState(true)

    // Store details returned from backend
    const [storeInfo, setStoreInfo] = useState(null)

    // Fetch seller verification & store info from backend
    const fetchIsSeller = async () => {
        try {
            // Get auth token
            const token = await getToken()

            // Call API to check seller status
            const { data } = await axios.get(
                '/api/store/is-seller',
                {
                    headers: {
                        Authorization: `Bearer ${token}` // Secure request
                    }
                }
            )

            // Update seller state
            setIsSeller(data.isSeller)

            // Save store information for sidebar/navbar
            setStoreInfo(data.storeInfo)

        } catch (error) {
            // Log error for debugging
            console.log(error)

        } finally {
            // Stop loading whether success or failure
            setLoading(false)
        }
    }

    // Run seller check once when layout mounts
    useEffect(() => {
        fetchIsSeller()
    }, [])

    // ===================== CONDITIONAL RENDERING =====================

    // Show loading spinner while checking access
    return loading ? (
        <Loading />

    ) : isSeller ? (
        // ===================== SELLER DASHBOARD LAYOUT =====================
        <div className="flex flex-col h-screen bg-gray-50">

            {/* Top navigation bar */}
            <SellerNavbar brandName="DreamSaver" />

            <div className="flex flex-1 h-full overflow-hidden">

                {/* Sidebar with store information */}
                <SellerSidebar storeInfo={storeInfo} />

                {/* Main content area */}
                <main className="flex-1 h-full p-6 lg:p-12 overflow-y-auto bg-white rounded-tl-3xl shadow-inner">
                    {children}
                </main>

            </div>
        </div>

    ) : (
        // ===================== ACCESS DENIED SCREEN =====================
        <div className="min-h-screen flex flex-col items-center justify-center text-center px-6 bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300">

            {/* Error heading */}
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-600 mb-6">
                🚫 Access Denied
            </h1>

            {/* Description */}
            <p className="text-gray-500 max-w-md">
                You are not authorized to access this page. Please go back to the homepage.
            </p>

            {/* Redirect button */}
            <Link
                href="/"
                className="mt-8 inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold p-3 px-6 rounded-full transition-transform transform hover:scale-105"
            >
                Go to DreamSaver <ArrowRightIcon size={20} />
            </Link>

        </div>
    )
}

export default StoreLayout
