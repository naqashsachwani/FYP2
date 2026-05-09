'use client'
import BestSelling from "@/components/BestSelling";
import Hero from "@/components/Hero";
import CallToAction from "@/components/CallToAction";
import OurSpecs from "@/components/OurSpec";
import LatestProducts from "@/components/LatestProducts";

export default function Home() {
    return (
        <div className="flex flex-col min-h-[100dvh]">
            <Hero />
            <LatestProducts />
            <BestSelling />
            {/* ✅ FIXED: Removed the stray 'z' character */}
            <OurSpecs />
            <CallToAction />
        </div>
    );
}