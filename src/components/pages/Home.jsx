import React from "react";
import HeroSection from "@/components/events/HeroSection";
import FeaturedEvents from "@/components/events/FeaturedEvents";
import CategoryGrid from "@/components/events/CategoryGrid";

export default function Home() {
  return (
    <div>
      <HeroSection />
      <FeaturedEvents />
      <CategoryGrid />
    </div>
  );
}