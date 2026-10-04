"use client";

import React, { useState } from "react";
import { CheckCircle2 } from "lucide-react";

export interface RedVelvetRsvpProps {
  title?: string;
  onSuccess?: (name: string, relationship: string, message: string, attending: boolean) => void;
  patternBackground?: string;
}

export default function RedVelvetRsvpModule({
  title = "Xác Nhận Tham Dự",
  onSuccess,
  patternBackground = "https://content.pancake.vn/web-media/5a/52/74/74/574a7c4763d40620ff28f78743b60b877bb2496e5c1cd8d94ca90f99-w:1313-h:2500-l:21034-t:image/png.png",
}: RedVelvetRsvpProps) {
  const [name, setName] = useState("");
  const [relationship, setRelationship] = useState("");
  const [message, setMessage] = useState("");
  const [attending, setAttending] = useState("yes");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (onSuccess) {
      onSuccess(name, relationship, message, attending === "yes");
    }

    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setName("");
      setRelationship("");
      setMessage("");
    }, 4000);
  };

  return (
    <section
      className="relative w-full py-12 px-5 overflow-hidden bg-[#FAF8F5] text-center"
      style={{
        backgroundImage: `url(${patternBackground})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="max-w-sm mx-auto">
        <h3 className="font-signature text-3xl sm:text-4xl text-gray-800">
          {title}
        </h3>
        <div className="w-16 h-[1.5px] bg-[#536077]/40 mx-auto my-3" />

        {submitted ? (
          <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100 my-4 text-center animate-scale-up">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-2 animate-bounce" />
            <h4 className="font-bold text-gray-900 text-base">Cảm Ơn Quý Khách Đã Phản Hồi!</h4>
            <p className="text-xs text-gray-600 mt-1">
              Rất hân hạnh được đón tiếp bạn cùng gia đình!
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3.5 mt-5">
            <div>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tên của bạn là?"
                className="w-full px-4 py-3 rounded-full border border-[#8C1007]/50 bg-white text-xs sm:text-sm text-gray-800 focus:outline-none focus:border-[#8C1007] focus:ring-1 focus:ring-[#8C1007] shadow-sm"
              />
            </div>

            <div>
              <input
                type="text"
                value={relationship}
                onChange={(e) => setRelationship(e.target.value)}
                placeholder="Bạn là gì của Dâu Rể nhỉ?"
                className="w-full px-4 py-3 rounded-full border border-[#8C1007]/50 bg-white text-xs sm:text-sm text-gray-800 focus:outline-none focus:border-[#8C1007] focus:ring-1 focus:ring-[#8C1007] shadow-sm"
              />
            </div>

            <div>
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Gửi lời chúc đến Dâu Rể nhé!"
                className="w-full px-4 py-3 rounded-full border border-[#8C1007]/50 bg-white text-xs sm:text-sm text-gray-800 focus:outline-none focus:border-[#8C1007] focus:ring-1 focus:ring-[#8C1007] shadow-sm"
              />
            </div>

            <div className="relative">
              <select
                value={attending}
                onChange={(e) => setAttending(e.target.value)}
                className="w-full px-4 py-3 rounded-full border border-[#8C1007]/50 bg-white text-xs sm:text-sm text-gray-800 focus:outline-none focus:border-[#8C1007] appearance-none cursor-pointer shadow-sm"
              >
                <option value="yes">Có Thể Tham Dự</option>
                <option value="no">Không Thể Tham Dự</option>
              </select>
              <span className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 text-xs">
                ▼
              </span>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-full bg-[#700000] hover:bg-[#580000] text-white font-bold text-sm tracking-wider uppercase shadow-lg shadow-[#700000]/30 transition-transform active:scale-95"
            >
              GỬI NGAY
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
