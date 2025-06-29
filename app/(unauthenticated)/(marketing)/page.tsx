import { FAQSection } from "./_components/sections/faq-section"
import { FeaturesSection } from "./_components/sections/features-section"
import { HeroSection } from "./_components/sections/hero-section"

export default function MarketingPage() {
  return (
    <main className="min-h-screen">
      <HeroSection />
      <FeaturesSection />
      <FAQSection />
    </main>
  )
}
