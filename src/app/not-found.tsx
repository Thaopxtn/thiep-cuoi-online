import React from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      <Navbar />
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-16 text-center">
        <h1 className="text-7xl font-bold text-rose-600 mb-4">404</h1>
        <h2 className="text-2xl font-semibold mb-2">Trang không tồn tại</h2>
        <p className="text-slate-600 max-w-md mb-8">
          Địa chỉ bạn đang tìm kiếm không tồn tại hoặc đã được chuyển sang đường dẫn khác.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-rose-600 text-white font-medium hover:bg-rose-700 transition shadow-sm"
        >
          Về trang chủ
        </Link>
      </main>
      <Footer />
    </div>
  );
}
