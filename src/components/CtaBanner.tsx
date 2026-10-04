import Link from "next/link";
import { MousePointerClick, Send } from "lucide-react";

export default function CtaBanner() {
  return (
    <section className="mx-auto w-full max-w-5xl px-4 py-10">
      <div className="slide-up relative overflow-hidden rounded-[26px] bg-white px-5 py-8 text-center sm:px-8 border border-rose-100 shadow-sm">
        <div className="pointer-events-none absolute inset-0 opacity-70">
          <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-rose-50 to-transparent"></div>
          <div className="absolute -left-10 top-10 h-28 w-28 rounded-full bg-rose-100/50 blur-2xl"></div>
          <div className="absolute -right-10 bottom-10 h-28 w-28 rounded-full bg-pink-100/50 blur-2xl"></div>
        </div>
        <div className="relative mx-auto max-w-3xl">
          <div className="mx-auto mb-2 inline-flex items-center gap-2 rounded-full border border-rose-100 bg-white px-3 py-1.5 text-xs font-semibold text-[#e54153]">
            <MousePointerClick className="h-3.5 w-3.5" />
            Tạo thiệp cưới chỉ trong vài phút
          </div>
          <h2 className="mx-auto mt-3 max-w-2xl text-2xl text-slate-950 font-heading sm:text-4xl">
            Tạo thiệp cưới online dễ dàng hơn
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-600 sm:text-base">
            Chọn mẫu thiệp đẹp, chỉnh sửa thông tin, gửi lời mời bằng link và lưu giữ lời chúc từ khách mời.
          </p>
          <div className="mt-7">
            <Link
              className="group inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#e54153] px-7 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#d93849] hover:text-white shadow-md hover:shadow-lg"
              href="/templates"
            >
              <span>Bắt đầu tạo thiệp cưới</span>
              <Send className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
