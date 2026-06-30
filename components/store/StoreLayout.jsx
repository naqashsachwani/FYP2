'use client' 

import { useEffect, useState } from "react"
import Loading from "../Loading"
import Link from "next/link"
import { ArrowRightIcon } from "lucide-react"

import SellerNavbar from "./StoreNavbar"
import SellerSidebar from "./StoreSidebar"
import axios from "axios"
import { useAuth } from "@clerk/nextjs"

const StoreLayout = ({ children }) => {
    const { getToken } = useAuth()

    const [isSeller, setIsSeller] = useState(false)
    const [loading, setLoading] = useState(true)
    const [storeInfo, setStoreInfo] = useState(null)
    
    //  ADDED: State to manage mobile sidebar, matching Admin & Rider logic
    const [isSidebarOpen, setIsSidebarOpen] = useState(false) 

    const fetchIsSeller = async () => {
        try {
            const token = await getToken()
            const { data } = await axios.get(
                '/api/store/is-seller',
                {
                    headers: {
                        Authorization: `Bearer ${token}` 
                    }
                }
            )
            setIsSeller(data.isSeller)
            setStoreInfo(data.storeInfo)
        } catch (error) {
            console.log(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchIsSeller()
    }, [])

    return loading ? (
        <div className="min-h-[100dvh] flex items-center justify-center bg-gray-50 p-4">
           <Loading />
        </div>
    ) : isSeller ? (
        <div className="flex flex-col h-[100dvh] bg-gray-50 overflow-hidden">

            {/*  UPDATED: Passed toggle props to Navbar */}
            <SellerNavbar 
                brandName="DreamSaver" 
                onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
                isSidebarOpen={isSidebarOpen}
            />

            <div className="flex flex-1 h-full overflow-hidden relative">

                {/* UPDATED: Passed open/close props to Sidebar */}
                <SellerSidebar 
                    storeInfo={storeInfo} 
                    isOpen={isSidebarOpen}
                    onClose={() => setIsSidebarOpen(false)}
                />

                <main className="flex-1 h-full p-4 sm:p-6 lg:p-12 overflow-y-auto bg-white rounded-t-2xl lg:rounded-tl-3xl shadow-inner w-full">
                    {children}
                </main>

            </div>
        </div>

    ) : (
        <div className="min-h-[100dvh] flex flex-col items-center justify-center text-center px-4 sm:px-6 bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-600 mb-4 sm:mb-6">
                🚫 Access Denied
            </h1>
            <p className="text-gray-500 max-w-md text-sm sm:text-base">
                You are not authorized to access this page. Please go back to the homepage.
            </p>
            <Link
                href="/"
                className="mt-6 sm:mt-8 inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold p-3 px-5 sm:px-6 rounded-full transition-transform transform hover:scale-105 text-sm sm:text-base w-full sm:w-auto justify-center"
            >
                Go to DreamSaver <ArrowRightIcon size={18} className="sm:w-[20px] sm:h-[20px] shrink-0" />
            </Link>
        </div>
    )
}

export default StoreLayout