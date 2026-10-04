"use client";

import React, { useState } from "react";
import { X } from "lucide-react";

export interface PhotoGalleryGridProps {
  images?: string[];
  fullImage?: string;
  closingTitle?: string;
  groomName?: string;
  brideName?: string;
  date?: string;
  patternBackground?: string;
}

export default function PhotoGalleryGridModule({
  images = [
    "https://content.pancake.vn/web-media/e8/37/0a/ca/ef3c6d1acb24d3f2353677372ca4327aaf1f468aa38e340a94c754b9-w:1366-h:2048-l:160889-t:image/jpeg.jpg",
    "https://content.pancake.vn/web-media/db/15/f2/94/b8db6b41358941a35f79dd94cfb4c498518123c4d9481e5548347a64-w:1365-h:2048-l:157078-t:image/jpeg.jpg",
    "https://content.pancake.vn/web-media/91/32/fe/5f/7b11cadedc88080bbc5bbbd7c3a27686c35c7bf65a879f5796eb92c2-w:1365-h:2048-l:174087-t:image/jpeg.jpg",
    "https://content.pancake.vn/web-media/9e/1b/0f/ce/110962d3a6186246fea38739552dc8a322edaddf1cc2a31a62307350-w:1365-h:2048-l:179603-t:image/jpeg.jpg",
    "https://content.pancake.vn/web-media/99/b2/14/a8/77f28eb9bcd4a811bb982a428e97b1c24702691e18ba26f9c7405aea-w:1365-h:2048-l:143443-t:image/jpeg.jpg",
    "https://content.pancake.vn/web-media/f0/fe/16/4e/b1e19264ac8cda679e235cd57b4e653731eea1300854823b06888a69-w:1091-h:1681-l:107419-t:image/jpeg.jpg",
  ],
  fullImage = "https://content.pancake.vn/web-media/54/a6/01/32/accd0875cccbc8c17bac016975f93026c7beaa5cc60ed379ccb8e77b-w:1365-h:2048-l:266303-t:image/jpeg.jpg",
  closingTitle = "Rất Hân Hạnh Được Đón Tiếp!",
  groomName = "Văn Sâm",
  brideName = "Mai Lan",
  date = "29.03.2026",
  patternBackground = "https://content.pancake.vn/web-media/5a/52/74/74/574a7c4763d40620ff28f78743b60b877bb2496e5c1cd8d94ca90f99-w:1313-h:2500-l:21034-t:image/png.png",
}: PhotoGalleryGridProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  return (
    <section
      className="relative w-full py-10 px-3 sm:px-4 overflow-hidden bg-[#FAF8F5] text-center"
      style={{
        backgroundImage: `url(${patternBackground})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="max-w-md mx-auto">
        {/* 2-Column Photo Grid */}
        <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
          {images.map((img, idx) => (
            <div
              key={idx}
              onClick={() => setSelectedImage(img)}
              className="aspect-[3/4] rounded-xl overflow-hidden shadow-md bg-gray-100 cursor-pointer group relative transition-transform duration-300 hover:scale-[1.02]"
            >
              <img
                src={img}
                alt={`Ảnh cưới ${idx + 1}`}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
          ))}
        </div>

        {/* Full-width Landscape / Statement Photo */}
        {fullImage && (
          <div
            onClick={() => setSelectedImage(fullImage)}
            className="mt-3 aspect-[16/10] rounded-xl overflow-hidden shadow-md bg-gray-100 cursor-pointer group relative"
          >
            <img
              src={fullImage}
              alt="Ảnh cưới toàn cảnh"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          </div>
        )}

        {/* Closing Footer Section */}
        <div className="mt-12 mb-6 px-4">
          <div className="flex items-center justify-center gap-2.5 my-2">
            <span className="font-serif text-2xl sm:text-3xl text-[#8C1007] font-semibold tracking-wide">
              {groomName}
            </span>
            <span className="font-signature text-2xl text-[#1f2937] italic">
              &amp;
            </span>
            <span className="font-serif text-2xl sm:text-3xl text-[#8C1007] font-semibold tracking-wide">
              {brideName}
            </span>
          </div>

          <p className="font-serif text-sm sm:text-base text-gray-800 tracking-[0.25em] my-1">
            {date}
          </p>

          <h3 className="font-signature text-2xl sm:text-3xl text-gray-800 italic mt-6">
            {closingTitle}
          </h3>

          {/* Social icons */}
          <div className="flex items-center justify-center gap-4 mt-6 pt-4 border-t border-gray-300/60">
            <span className="px-2.5 py-1 rounded bg-[#0068FF] text-white text-[11px] font-bold">
              Zalo
            </span>
            <span className="px-2.5 py-1 rounded bg-black text-white text-[11px] font-bold">
              TikTok
            </span>
            <span className="px-2.5 py-1 rounded bg-[#1877F2] text-white text-[11px] font-bold">
              Facebook
            </span>
          </div>
        </div>
      </div>

      {/* Lightbox Preview Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in"
          onClick={() => setSelectedImage(null)}
        >
          <button
            type="button"
            onClick={() => setSelectedImage(null)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-white/40"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={selectedImage}
            alt="Xem ảnh lớn"
            className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl animate-scale-up"
          />
        </div>
      )}
    </section>
  );
}
