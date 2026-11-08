import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import BenefitsSection from "@/components/BenefitsSection";
import TemplatesSection from "@/components/TemplatesSection";
import PricingSection from "@/components/PricingSection";
import GuideStepsSection from "@/components/GuideStepsSection";
import FeedbackSection from "@/components/FeedbackSection";
import FaqSection from "@/components/FaqSection";
import CtaBanner from "@/components/CtaBanner";
import Footer from "@/components/Footer";
import FloatingSupport from "@/components/FloatingSupport";
import { getSiteUrl } from "@/lib/siteConfig";

export const metadata = {
  alternates: { canonical: getSiteUrl() },
};

export default function Home() {
  const siteUrl = getSiteUrl();
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebApplication",
        "@id": `${siteUrl}/#webapp`,
        "name": "ZenLove Wedding",
        "url": siteUrl,
        "description": "Nền tảng tạo thiệp cưới online thông minh, mở phong bì sáp hoàng gia, quản lý khách mời RSVP và hộp mừng cưới VietQR.",
        "applicationCategory": "LifestyleApplication",
        "operatingSystem": "All",
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "VND",
        },
      },
      {
        "@type": "Organization",
        "@id": `${siteUrl}/#organization`,
        "name": "ZenLove Wedding",
        "url": siteUrl,
        "logo": `${siteUrl}/assets/logo/logo-6.svg`,
      },
    ],
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-zen-black">
      {/* Schema.org JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />

      {/* Navigation */}
      <Navbar />

      {/* Main Content */}
      <main id="main-content" tabIndex={-1} className="flex-1">
        <HeroSection />
        <BenefitsSection />
        <TemplatesSection />
        <PricingSection />
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
