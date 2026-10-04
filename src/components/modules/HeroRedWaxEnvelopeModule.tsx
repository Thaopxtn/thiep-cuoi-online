"use client";

import React from "react";

export interface HeroRedWaxEnvelopeProps {
  title?: string;
  person1?: string;
  person2?: string;
  date?: string;
  heroPhoto?: string;
  envelopeImage?: string;
  patternBackground?: string;
}

export default function HeroRedWaxEnvelopeModule({
  title = "Thư Mời Cưới",
  person1 = "Văn Sâm",
  person2 = "Mai Lan",
  date = "29.03.2026",
  heroPhoto = "https://content.pancake.vn/1/s520x971/fwebp80/71/8b/6a/0d/b8fd8602c1e52483eecb2a387ab4460d6ddea8809992ae5420fa9592-w:1372-h:2560-l:428692-t:image/jpeg.jpg",
  envelopeImage = "https://content.pancake.vn/1/s779x1484/fwebp80/ee/49/eb/78/c2886b85824c3e2477db01661f5e882a0e590dd1fd5b9f19358cf5bd-w:1313-h:2500-l:310467-t:image/png.png",
  patternBackground = "https://content.pancake.vn/web-media/5a/52/74/74/574a7c4763d40620ff28f78743b60b877bb2496e5c1cd8d94ca90f99-w:1313-h:2500-l:21034-t:image/png.png",
}: HeroRedWaxEnvelopeProps) {
  return (
    <section
      className="relative w-full min-h-[720px] sm:min-h-[780px] flex flex-col items-center pt-8 pb-12 overflow-hidden bg-[#FAF8F5]"
      style={{
        backgroundImage: `url(${patternBackground})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Header Titles */}
      <div className="text-center z-10 px-4">
        {/* Calligraphy Title */}
        <h2 className="font-signature text-3xl sm:text-4xl text-[#1f2937] drop-shadow-sm">
          {title}
        </h2>

        <div className="w-24 h-[1.5px] bg-[#536077]/50 mx-auto my-3" />

        {/* Bride & Groom Red Serif Names */}
        <div className="flex items-center justify-center gap-2.5 my-1">
          <span className="font-serif text-2xl sm:text-3xl text-[#8C1007] font-semibold tracking-wide">
            {person1}
          </span>
          <span className="font-signature text-2xl text-[#1f2937] italic">
            &amp;
          </span>
          <span className="font-serif text-2xl sm:text-3xl text-[#8C1007] font-semibold tracking-wide">
            {person2}
          </span>
        </div>

        {/* Date */}
        <p className="font-serif text-base sm:text-lg text-[#1f2937] tracking-[0.25em] mt-1">
          {date}
        </p>
      </div>

      {/* Interactive 3D Envelope Container */}
      <div className="relative w-full max-w-[360px] sm:max-w-[390px] h-[500px] mt-6 flex items-center justify-center">
        {/* Rising Couple Photo */}
        <div className="absolute top-2 w-[70%] max-w-[250px] aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl z-10 transition-transform duration-500 hover:-translate-y-3">
          <img
            src={heroPhoto}
            alt={`${person1} & ${person2}`}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Red Wax Envelope Body Overlaid */}
        <div className="absolute inset-x-0 bottom-0 h-[380px] pointer-events-none z-20 flex items-end justify-center">
          <img
            src={envelopeImage}
            alt="Bì thư đỏ dập dấu sáp"
            className="w-full h-full object-contain filter drop-shadow-[0_15px_25px_rgba(0,0,0,0.35)]"
          />
        </div>
      </div>
    </section>
  );
}
