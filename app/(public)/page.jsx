'use client'
import BestSelling from "@/components/BestSelling";
import Hero from "@/components/Hero";
import CallToAction from "@/components/CallToAction";
import OurSpecs from "@/components/OurSpec";
import LatestProducts from "@/components/LatestProducts";

export default function Home() {
    return (
        <div>
            <Hero />
            <LatestProducts />
            <BestSelling />
            <OurSpecs />z
            <CallToAction />
        </div>
    );
}
