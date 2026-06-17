import LandingNav from "@/components/landing/LandingNav";
import LandingHero from "@/components/landing/LandingHero";
import LandingFeatures from "@/components/landing/LandingFeatures";
import LandingHowItWorks from "@/components/landing/LandingHowItWorks";
import LandingPricing from "@/components/landing/LandingPricing";
import LandingTestimonials from "@/components/landing/LandingTestimonials";
import LandingCTA from "@/components/landing/LandingCTA";
import LandingFooter from "@/components/landing/LandingFooter";

export default function Landing() {
  return (
    <div className="bg-white font-body text-slate-900">
      <LandingNav />
      <LandingHero />
      <LandingFeatures />
      <LandingHowItWorks />
      <LandingTestimonials />
      <LandingPricing />
      <LandingCTA />
      <LandingFooter />
    </div>
  );
}