'use client'
import BestSelling from "@/components/BestSelling";
import Hero from "@/components/Hero";
import CallToAction from "@/components/CallToAction";
import OurSpecs from "@/components/OurSpec";
import LatestProducts from "@/components/LatestProducts";

export default function Home() {
    return (
        // ✅ FIXED: Removed `pb-16 md:pb-24` from here so the CTA sits flush with the footer
        <div className="w-full space-y-16 md:space-y-24">
            <Hero />
            <LatestProducts />
            <BestSelling />
            <OurSpecs />
            <CallToAction />
        </div>
    );
}