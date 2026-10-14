import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import BenefitsSection from "@/components/BenefitsSection";
import TemplatesSection from "@/components/TemplatesSection";
import GuideStepsSection from "@/components/GuideStepsSection";
import FeedbackSection from "@/components/FeedbackSection";
import FaqSection from "@/components/FaqSection";
import CtaBanner from "@/components/CtaBanner";
import Footer from "@/components/Footer";
import FloatingSupport from "@/components/FloatingSupport";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-white text-zen-black">
      {/* Navigation */}
      <Navbar />

      {/* Main Content */}
      <main className="flex-1">
        <HeroSection />
        <BenefitsSection />
        <TemplatesSection />
        <GuideStepsSection />
        <FeedbackSection />
        <FaqSection />
        <CtaBanner />
      </main>

      {/* Footer */}
      <Footer />

      {/* Floating Support Widget */}
      <FloatingSupport />
    </div>
  );
}
