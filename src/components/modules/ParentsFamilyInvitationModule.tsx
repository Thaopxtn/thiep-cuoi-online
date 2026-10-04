"use client";

import React from "react";

export interface ParentsFamilyInvitationProps {
  introTitle?: string;
  groomName?: string;
  brideName?: string;
  groomParents?: { father: string; mother: string };
  brideParents?: { father: string; mother: string };
  saveDateDay?: string;
  saveDateMonth?: string;
  photo1?: string;
  photo2?: string;
  envelopeImage?: string;
  patternBackground?: string;
}

export default function ParentsFamilyInvitationModule({
  introTitle = "THAM DỰ LỄ THÀNH HÔN CỦA GIA ĐÌNH CHÚNG TÔI:",
  groomName = "Nông Văn Sâm",
  brideName = "Ma Thị Mai Lan",
  groomParents = { father: "ÔNG NÔNG VĂN SƠN", mother: "BÀ LÊ THỊ SEN" },
  brideParents = { father: "ÔNG MA PHÚC TỐT", mother: "BÀ MA THỊ HƯƠNG" },
  saveDateDay = "29",
  saveDateMonth = "03",
  photo1 = "https://content.pancake.vn/1/s526x789/fwebp80/cc/e1/b5/09/bd4b4fbddc55863731312442a7c7589ae694033e899cfb77bd70e67e-w:1707-h:2560-l:500758-t:image/jpeg.jpg",
  photo2 = "https://content.pancake.vn/1/s517x776/fwebp80/3c/86/44/c8/927ea690b3c5b2b20efaff0fb788d4c398832994d66daac8198c5334-w:1706-h:2560-l:377608-t:image/jpeg.jpg",
  envelopeImage = "https://content.pancake.vn/1/s779x1484/fwebp80/55/e4/fe/df/0597a255236826aa38abefdafdc73adeed017242ebf759c9a4f08845-w:1313-h:2500-l:241440-t:image/png.png",
  patternBackground = "https://content.pancake.vn/web-media/5a/52/74/74/574a7c4763d40620ff28f78743b60b877bb2496e5c1cd8d94ca90f99-w:1313-h:2500-l:21034-t:image/png.png",
}: ParentsFamilyInvitationProps) {
  return (
    <section
      className="relative w-full py-12 px-5 overflow-hidden bg-[#FAF8F5] text-center"
      style={{
        backgroundImage: `url(${patternBackground})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Introduction Header */}
      <h3 className="text-xs sm:text-sm font-semibold tracking-wider text-gray-800 uppercase max-w-xs mx-auto">
        {introTitle}
      </h3>

      {/* Bride & Groom Cursive Calligraphy */}
      <div className="my-5">
        <p className="font-signature text-3xl sm:text-4xl text-[#8C1007] leading-relaxed">
          {groomName}
        </p>
        <p className="font-signature text-xl text-gray-700 italic my-0.5">and</p>
        <p className="font-signature text-3xl sm:text-4xl text-[#8C1007] leading-relaxed">
          {brideName}
        </p>
      </div>

      {/* Parents Columns */}
      <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto text-xs my-6 pt-2 border-t border-b border-gray-300/60 py-4">
        {/* Nhà Trai */}
        <div className="text-left space-y-1">
          <span className="font-serif italic text-gray-600 text-[13px] block">
            Nhà Trai
          </span>
          <p className="font-bold text-gray-900 tracking-tight">
            {groomParents.father}
          </p>
          <p className="font-bold text-gray-900 tracking-tight">
            {groomParents.mother}
          </p>
        </div>

        {/* Nhà Gái */}
        <div className="text-right space-y-1">
          <span className="font-serif italic text-gray-600 text-[13px] block">
            Nhà Gái
          </span>
          <p className="font-bold text-gray-900 tracking-tight">
            {brideParents.father}
          </p>
          <p className="font-bold text-gray-900 tracking-tight">
            {brideParents.mother}
          </p>
        </div>
      </div>

      {/* Save The Date & Big Typography */}
      <div className="relative max-w-sm mx-auto flex items-center justify-between px-4 mt-8">
        <div className="text-left">
          <p className="font-signature text-3xl text-gray-800">Save The Date</p>
        </div>
        <div className="relative flex items-center text-[#8C1007] font-serif">
          <span className="text-5xl sm:text-6xl font-bold leading-none">
            {saveDateDay}
          </span>
          <span className="text-3xl font-light text-gray-500 mx-1">/</span>
          <span className="text-4xl sm:text-5xl font-bold leading-none">
            {saveDateMonth}
          </span>
        </div>
      </div>

      {/* Second Red Envelope with 2 Tilted Polaroids */}
      <div className="relative w-full max-w-[360px] h-[360px] mx-auto mt-6 flex items-center justify-center">
        {/* Polaroid 1 (Left tilted -5 deg) */}
        <div
          className="absolute z-10 w-[140px] aspect-[3/4] p-2 bg-white rounded-lg shadow-xl"
          style={{
            transform: "rotate(-6deg) translate(-40px, -30px)",
          }}
        >
          <img
            src={photo1}
            alt="Ảnh cưới 1"
            className="w-full h-full object-cover rounded"
          />
        </div>

        {/* Polaroid 2 (Right tilted +12 deg) */}
        <div
          className="absolute z-10 w-[145px] aspect-[3/4] p-2 bg-white rounded-lg shadow-xl"
          style={{
            transform: "rotate(12deg) translate(40px, -20px)",
          }}
        >
          <img
            src={photo2}
            alt="Ảnh cưới 2"
            className="w-full h-full object-cover rounded"
          />
        </div>

        {/* Lower Red Envelope with Gold Seal */}
        <div className="absolute inset-x-0 bottom-0 h-[260px] pointer-events-none z-20 flex items-end justify-center">
          <img
            src={envelopeImage}
            alt="Phong bì sáp đỏ"
            className="w-full h-full object-contain filter drop-shadow-[0_15px_25px_rgba(0,0,0,0.35)]"
          />
        </div>
      </div>
    </section>
  );
}
