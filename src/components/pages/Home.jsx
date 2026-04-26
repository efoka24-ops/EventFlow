import HeroSection from "@/components/landing/HeroSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import FeaturedEvents from "@/components/events/FeaturedEvents";
import TestimonialsSection from "@/components/landing/TestimonialsSection";
import ComparisonSection from "@/components/landing/ComparisonSection";
import FAQSection from "@/components/landing/FAQSection";
import CTASection from "@/components/landing/CTASection";

export default function Home() {
  return (
    <div>
      <HeroSection />
      <FeaturesSection />
      <FeaturedEvents />
      <ComparisonSection />
      <TestimonialsSection />
      <FAQSection />
      <CTASection />
    </div>
  );
}
