"use client";

import React, { useState } from "react";

export interface RsvpModuleProps {
  title?: string;
  subtitle?: string;
  theme?: "wedding" | "sky";
  onSuccess?: (name: string, attending: boolean, guests: number) => void;
}

export default function RsvpModule({
  title = "Xác nhận tham dự",
  subtitle = "Sự hiện diện của bạn là niềm vinh hạnh của chúng mình!",
  theme = "wedding",
  onSuccess,
}: RsvpModuleProps) {
  const [name, setName] = useState("");
  const [attending, setAttending] = useState(true);
  const [guests, setGuests] = useState(1);
  const [submitted, setSubmitted] = useState(false);

  const isSky = theme === "sky";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (onSuccess) onSuccess(name, attending, guests);
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setName("");
    }, 3000);
  };

  return (
    <section className="py-6 px-4 max-w-md mx-auto">
      <div className="bg-white rounded-3xl p-5 shadow-xl border border-stone-200 text-center">
        <h3
          className={`text-xl font-serif font-bold ${
            isSky ? "text-[#1e6091]" : "text-gray-900"
          }`}
        >
          {title}
        </h3>
        <p className="text-xs text-stone-500 mt-1 mb-5">{subtitle}</p>

        {submitted ? (
          <div className="py-6">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-2 text-xl font-bold">
              ✓
            </div>
            <p className="text-sm font-semibold text-gray-800">
              Cảm ơn bạn đã gửi xác nhận tham dự!
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3.5 text-left text-xs">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                Họ và tên của bạn
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nhập họ và tên..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-[#8c6d58]"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                Bạn sẽ tham dự chứ?
              </label>
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 p-2 rounded-xl border border-stone-200 cursor-pointer hover:bg-stone-50">
                  <input
                    type="radio"
                    name="rsvp-attend"
                    checked={attending}
                    onChange={() => setAttending(true)}
                    className="accent-[#8c6d58]"
                  />
                  <span className="font-medium text-gray-800">
                    🎉 Có, tôi sẽ tham dự
                  </span>
                </label>
                <label className="flex items-center gap-2 p-2 rounded-xl border border-stone-200 cursor-pointer hover:bg-stone-50">
                  <input
                    type="radio"
                    name="rsvp-attend"
                    checked={!attending}
                    onChange={() => setAttending(false)}
                    className="accent-[#8c6d58]"
                  />
                  <span className="font-medium text-gray-800">
                    😢 Tôi bận, rất tiếc không thể tham dự
                  </span>
                </label>
              </div>
            </div>

            {attending && (
              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Số lượng người tham dự
                </label>
                <select
                  value={guests}
                  onChange={(e) => setGuests(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-[#8c6d58] bg-white"
                >
                  <option value={1}>1 người (Chỉ mình tôi)</option>
                  <option value={2}>2 người (+ Bạn đồng hành)</option>
                  <option value={3}>3 người (+ Gia đình)</option>
                  <option value={4}>4 người (+ Gia đình)</option>
                </select>
              </div>
            )}

            <button
              type="submit"
              className={`w-full py-2.5 rounded-xl text-white font-semibold text-xs shadow-md transition-colors ${
                isSky
                  ? "bg-sky-600 hover:bg-sky-700"
                  : "bg-[#8c6d58] hover:bg-[#735845]"
              }`}
            >
              Gửi xác nhận
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
