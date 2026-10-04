"use client";

import React, { useState, useRef } from "react";
import { TemplateModule } from "./types";
import HeroEnvelopeModule from "./HeroEnvelopeModule";
import HeroSkyCountdownModule from "./HeroSkyCountdownModule";
import HeroTraditionalRedModule from "./HeroTraditionalRedModule";
import HeroBirthdayModule from "./HeroBirthdayModule";
import HeroModernMinimalModule from "./HeroModernMinimalModule";
import HeroFloralRusticModule from "./HeroFloralRusticModule";
import HeroLuxuryGoldModule from "./HeroLuxuryGoldModule";
import HeroRedWaxEnvelopeModule from "./HeroRedWaxEnvelopeModule";
import ParentsFamilyInvitationModule from "./ParentsFamilyInvitationModule";
import WeddingScheduleCardsModule from "./WeddingScheduleCardsModule";
import RedVelvetRsvpModule from "./RedVelvetRsvpModule";
import RedEnvelopeGiftCardModule from "./RedEnvelopeGiftCardModule";
import PhotoGalleryGridModule from "./PhotoGalleryGridModule";
import CalendarModule from "./CalendarModule";
import StoryQuoteModule from "./StoryQuoteModule";
import PolaroidTapeModule from "./PolaroidTapeModule";
import VenueMapModule from "./VenueMapModule";
import InvitationLetterModule from "./InvitationLetterModule";
import RsvpModule from "./RsvpModule";
import GiftBankModule from "./GiftBankModule";
import WishesStreamModule from "./WishesStreamModule";
import FloatingActionBarModule from "./FloatingActionBarModule";
import {
  FlyingHeartsOverlay,
  HeartParticle,
  WishesDrawer,
  GiftModal,
  RsvpModal,
} from "../invitations/InteractiveDrawers";
import ScrollAnimationWrapper, { TransitionEffect } from "../common/ScrollAnimationWrapper";
import OpeningEnvelopeIntro from "../common/OpeningEnvelopeIntro";
import AutoScrollController from "../common/AutoScrollController";

interface ModuleRendererProps {
  modules: TemplateModule[];
  bankInfo?: {
    bankName: string;
    accountNumber: string;
    accountHolder: string;
    qrImage?: string;
  };
  musicUrl?: string;
  musicTitle?: string;
  initialWishes?: Array<{ id: string; name: string; message: string }>;
  interactive?: boolean;
  showOpeningIntro?: boolean;
}

export default function ModuleRenderer({
  modules,
  bankInfo = {
    bankName: "Techcombank",
    accountNumber: "190345678912",
    accountHolder: "LE MINH QUAN",
  },
  musicUrl = "https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3",
  musicTitle = "Beautiful In White - Shane Filan",
  initialWishes = [],
  interactive = true,
  showOpeningIntro = true,
}: ModuleRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // States for interactive modals
  const [isWishesOpen, setIsWishesOpen] = useState(false);
  const [isGiftOpen, setIsGiftOpen] = useState(false);
  const [isRsvpOpen, setIsRsvpOpen] = useState(false);
  const [likesCount, setLikesCount] = useState(128);
  const [hearts, setHearts] = useState<HeartParticle[]>([]);
  const [wishes, setWishes] = useState(initialWishes);
  const [hasOpenedEnvelope, setHasOpenedEnvelope] = useState(!showOpeningIntro);

  // Shoot heart particle animation
  const handleShootHeart = () => {
    setLikesCount((prev) => prev + 1);
    const newHeart: HeartParticle = {
      id: Date.now() + Math.random(),
      x: 35 + Math.random() * 30, // Random around center
      y: 0,
      size: 24 + Math.random() * 16,
      color: "#ff4d6d",
    };
    setHearts((prev) => [...prev, newHeart]);

    setTimeout(() => {
      setHearts((prev) => prev.filter((h) => h.id !== newHeart.id));
    }, 1800);
  };

  // Add wish
  const handleAddWish = (name: string, message: string) => {
    const newWish = {
      id: String(Date.now()),
      name,
      message,
    };
    setWishes((prev) => [newWish, ...prev]);
  };

  const activeModules = modules.filter((m) => m.enabled);

  // Get hero data for opening intro
  const heroModule = activeModules.find((m) => m.type.startsWith("hero-"));
  const heroProps = (heroModule?.props as any) || {};

  const getModuleEffect = (type: string): { effect: TransitionEffect; duration: number } => {
    switch (type) {
      case "hero-red-wax-envelope":
        return { effect: "fade-in", duration: 1.2 };
      case "parents-family-invitation":
        return { effect: "slide-up", duration: 1.2 };
      case "wedding-schedule-cards":
        return { effect: "scale-in", duration: 1.2 };
      case "red-velvet-rsvp":
        return { effect: "slide-up", duration: 1.2 };
      case "red-envelope-gift-card":
        return { effect: "scale-in", duration: 1.2 };
      case "photo-gallery-grid":
        return { effect: "fade-in", duration: 1.2 };
      case "story-quote":
        return { effect: "scale-in", duration: 1.3 };
      case "calendar":
        return { effect: "slide-up", duration: 1.2 };
      case "polaroid-tape":
        return { effect: "rotate-in", duration: 1.3 };
      case "venue-map":
        return { effect: "slide-up", duration: 1.2 };
      case "rsvp":
        return { effect: "scale-in", duration: 1.2 };
      case "gift-bank":
        return { effect: "slide-up", duration: 1.2 };
      case "invitation-letter":
        return { effect: "fade-in", duration: 1.3 };
      default:
        return { effect: "fade-in", duration: 1.1 };
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full min-h-screen font-sans overflow-y-auto overflow-x-hidden select-none"
    >
      {/* Opening Envelope Intro Overlay */}
      {interactive && showOpeningIntro && !hasOpenedEnvelope && (
        <OpeningEnvelopeIntro
          person1={heroProps.person1 || "Nhân vật chính"}
          person2={heroProps.person2 || undefined}
          eventTitle={heroProps.eventTitle || "Thiệp Mời Online"}
          date={heroProps.date}
          theme={
            heroModule?.type === "hero-traditional-red" ||
            heroModule?.type === "hero-red-wax-envelope"
              ? "red"
              : heroModule?.type === "hero-birthday"
              ? "birthday"
              : heroModule?.type === "hero-sky-countdown"
              ? "sky"
              : heroModule?.type === "hero-luxury-gold"
              ? "gold"
              : "wedding"
          }
          onOpen={() => setHasOpenedEnvelope(true)}
          showSkip={true}
        />
      )}

      {/* Floating Hearts Particles */}
      <FlyingHeartsOverlay hearts={hearts} />

      {/* Auto-Scroll Controller Engine */}
      {interactive && (
        <AutoScrollController
          containerRef={containerRef}
          enabled={true}
          speed={0.7}
          initialDelay={2500}
        />
      )}

      {/* Render Dynamic Modules with Exact Scroll-Triggered Transitions */}
      <div className="flex flex-col">
        {activeModules.map((module) => {
          const { effect, duration } = getModuleEffect(module.type);

          const renderContent = () => {
            switch (module.type) {
              case "hero-envelope":
                return <HeroEnvelopeModule key={module.id} {...(module.props as any)} />;

              case "hero-sky-countdown":
                return (
                  <HeroSkyCountdownModule
                    key={module.id}
                    {...(module.props as any)}
                  />
                );

              case "hero-traditional-red":
                return (
                  <HeroTraditionalRedModule
                    key={module.id}
                    {...(module.props as any)}
                  />
                );

              case "hero-birthday":
                return (
                  <HeroBirthdayModule
                    key={module.id}
                    {...(module.props as any)}
                  />
                );

              case "hero-modern-minimal":
                return (
                  <HeroModernMinimalModule
                    key={module.id}
                    {...(module.props as any)}
                  />
                );

              case "hero-floral-rustic":
                return (
                  <HeroFloralRusticModule
                    key={module.id}
                    {...(module.props as any)}
                  />
                );

              case "hero-luxury-gold":
                return (
                  <HeroLuxuryGoldModule
                    key={module.id}
                    {...(module.props as any)}
                  />
                );

              case "calendar":
                return <CalendarModule key={module.id} {...(module.props as any)} />;

              case "story-quote":
                return <StoryQuoteModule key={module.id} {...(module.props as any)} />;

              case "polaroid-tape":
                return (
                  <PolaroidTapeModule key={module.id} {...(module.props as any)} />
                );

              case "venue-map":
                return <VenueMapModule key={module.id} {...(module.props as any)} />;

              case "invitation-letter":
                return (
                  <InvitationLetterModule
                    key={module.id}
                    {...(module.props as any)}
                  />
                );

              case "rsvp":
                return (
                  <RsvpModule
                    key={module.id}
                    {...(module.props as any)}
                    onSuccess={(name, attending, guests) => {
                      handleAddWish(
                        name,
                        attending
                          ? `Đã xác nhận tham dự (${guests} người) 🎉`
                          : "Rất tiếc không thể đến chung vui 😢"
                      );
                    }}
                  />
                );

              case "hero-red-wax-envelope":
                return (
                  <HeroRedWaxEnvelopeModule
                    key={module.id}
                    {...(module.props as any)}
                  />
                );

              case "parents-family-invitation":
                return (
                  <ParentsFamilyInvitationModule
                    key={module.id}
                    {...(module.props as any)}
                  />
                );

              case "wedding-schedule-cards":
                return (
                  <WeddingScheduleCardsModule
                    key={module.id}
                    {...(module.props as any)}
                  />
                );

              case "red-velvet-rsvp":
                return (
                  <RedVelvetRsvpModule
                    key={module.id}
                    {...(module.props as any)}
                    onSuccess={(name, rel, msg, att) => {
                      handleAddWish(
                        name,
                        att
                          ? `Xác nhận tham dự (${rel || "Khách quý"}) 🎉 ${msg ? ` - ${msg}` : ""}`
                          : `Rất tiếc không thể đến dự 😢 ${msg ? ` - ${msg}` : ""}`
                      );
                    }}
                  />
                );

              case "red-envelope-gift-card":
                return (
                  <RedEnvelopeGiftCardModule
                    key={module.id}
                    {...(module.props as any)}
                  />
                );

              case "photo-gallery-grid":
                return (
                  <PhotoGalleryGridModule
                    key={module.id}
                    {...(module.props as any)}
                  />
                );

              case "gift-bank":
                return <GiftBankModule key={module.id} {...(module.props as any)} />;

              case "wishes-stream":
                return (
                  <WishesStreamModule
                    key={module.id}
                    wishes={wishes}
                    {...(module.props as any)}
                  />
                );

              default:
                return null;
            }
          };

          return (
            <ScrollAnimationWrapper
              key={module.id}
              effectType={effect}
              effectDuration={duration}
              effectEnabled={interactive}
            >
              {renderContent()}
            </ScrollAnimationWrapper>
          );
        })}
      </div>

      {/* Floating Action Controls */}
      {interactive && (
        <FloatingActionBarModule
          likesCount={likesCount}
          onOpenWishes={() => setIsWishesOpen(true)}
          onShootHeart={handleShootHeart}
          onOpenGift={() => setIsGiftOpen(true)}
          onOpenRsvp={() => setIsRsvpOpen(true)}
          showRsvp={activeModules.some((m) => m.type === "rsvp" || m.type === "red-velvet-rsvp")}
          musicUrl={musicUrl}
          musicTitle={musicTitle}
        />
      )}

      {/* Common Modals */}
      {interactive && (
        <>
          <WishesDrawer
            isOpen={isWishesOpen}
            onClose={() => setIsWishesOpen(false)}
            onSubmit={handleAddWish}
          />

          <GiftModal
            isOpen={isGiftOpen}
            onClose={() => setIsGiftOpen(false)}
            bankInfo={bankInfo}
          />

          <RsvpModal
            isOpen={isRsvpOpen}
            onClose={() => setIsRsvpOpen(false)}
            onConfirm={(name, attending, guests) => {
              handleAddWish(
                name,
                attending
                  ? `Đã xác nhận tham dự (${guests} người) 🎉`
                  : "Rất tiếc không thể đến chung vui 😢"
              );
            }}
          />
        </>
      )}
    </div>
  );
}
