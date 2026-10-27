"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";
import {
  ShieldCheck,
  FileText,
  Lock,
  CreditCard,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  Mail,
  Phone,
  Building,
  Sparkles,
  ChevronRight,
} from "lucide-react";

export default function PolicyPage() {
  const [activeSection, setActiveSection] = useState("about");

  const sections = [
    { id: "about", title: "Giới thiệu ZenLove", icon: Sparkles },
    { id: "legal", title: "Thông tin doanh nghiệp", icon: Building },
    { id: "privacy", title: "Chính sách bảo mật", icon: Lock },
    { id: "terms", title: "Điều khoản dịch vụ", icon: FileText },
    { id: "terms-transaction", title: "Điều kiện giao dịch", icon: ShieldCheck },
    { id: "payment", title: "Chính sách thanh toán", icon: CreditCard },
    { id: "refund", title: "Chính sách hoàn tiền", icon: RotateCcw },
    { id: "purchase-process", title: "Quy trình giao dịch", icon: CheckCircle2 },
    { id: "content-policy", title: "Chính sách nội dung", icon: AlertCircle },
  ];

  // Theo dõi hash trên URL
  useEffect(() => {
    if (typeof window !== "undefined") {
      const hash = window.location.hash.replace("#", "");
      if (hash && sections.some((s) => s.id === hash)) {
        setActiveSection(hash);
      }
    }
  }, []);

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fdfaf8] text-zen-black selection:bg-rose-100 selection:text-zen-primary">
      <Navbar />

      {/* Header Banner */}
      <section className="relative pt-32 pb-14 md:pt-40 md:pb-16 bg-gradient-to-b from-rose-50/70 via-amber-50/30 to-[#fdfaf8] border-b border-rose-100/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-100/80 border border-rose-200 text-zen-primary text-xs font-bold tracking-wide uppercase mb-3">
            <ShieldCheck className="w-4 h-4 text-rose-500" />
            <span>TRUNG TÂM PHÁP LÝ & MINH BẠCH ZENLOVE</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-gray-900 tracking-tight">
            Điều Khoản Dịch Vụ & Chính Sách
          </h1>
          <p className="mt-3 text-sm sm:text-base text-gray-600 max-w-2xl mx-auto font-light leading-relaxed">
            Cam kết bảo vệ quyền riêng tư, an toàn thông tin và mang đến trải nghiệm tạo thiệp cưới online minh bạch, chuẩn mực cho mọi cặp đôi Việt Nam.
          </p>
        </div>
      </section>

      {/* Mobile Horizontal Section Scroller */}
      <div className="lg:hidden sticky top-16 z-30 bg-white/95 backdrop-blur-md border-b border-gray-200 px-4 py-2.5 overflow-x-auto no-scrollbar shadow-2xs">
        <div className="flex items-center gap-2 w-max">
          {sections.map((sec) => {
            const Icon = sec.icon;
            const isActive = activeSection === sec.id;
            return (
              <button
                key={sec.id}
                onClick={() => scrollToSection(sec.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? "bg-zen-primary text-white shadow-2xs"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{sec.title}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Layout */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16 flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Desktop Sticky Sidebar */}
          <aside className="hidden lg:block lg:col-span-4 sticky top-24 bg-white rounded-3xl p-6 border border-gray-100 shadow-xs">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 px-3">
              Mục lục chính sách
            </h2>
            <nav className="space-y-1">
              {sections.map((sec) => {
                const Icon = sec.icon;
                const isActive = activeSection === sec.id;
                return (
                  <button
                    key={sec.id}
                    onClick={() => scrollToSection(sec.id)}
                    className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-semibold transition-all cursor-pointer text-left ${
                      isActive
                        ? "bg-rose-50 text-zen-primary font-bold shadow-2xs"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon
                        className={`w-4 h-4 shrink-0 ${
                          isActive ? "text-zen-primary" : "text-gray-400"
                        }`}
                      />
                      <span className="truncate">{sec.title}</span>
                    </div>
                    <ChevronRight
                      className={`w-3.5 h-3.5 transition-transform ${
                        isActive ? "text-zen-primary translate-x-0.5" : "text-gray-300"
                      }`}
                    />
                  </button>
                );
              })}
            </nav>

            <div className="mt-8 pt-6 border-t border-gray-100 bg-rose-50/50 rounded-2xl p-4">
              <p className="text-xs font-bold text-gray-900">Cần hỗ trợ trực tiếp?</p>
              <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
                Đội ngũ chăm sóc khách hàng ZenLove luôn sẵn sàng giải đáp 24/7.
              </p>
              <div className="mt-3 space-y-2 text-xs font-medium text-gray-700">
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-zen-primary" />
                  <span>contact@zenlove.me</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-zen-primary" />
                  <span>0988.888.888</span>
                </div>
              </div>
            </div>
          </aside>

          {/* Legal Documents Content */}
          <div className="lg:col-span-8 space-y-12">
            {/* 1. Về ZenLove */}
            <article
              id="about"
              className="bg-white rounded-3xl p-6 sm:p-10 border border-gray-100 shadow-xs scroll-mt-28"
            >
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 text-zen-primary flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                    1. Về Nền Tảng Thiệp Cưới ZenLove
                  </h2>
                  <p className="text-xs text-gray-500">
                    Sứ mệnh gắn kết & lan tỏa hạnh phúc lứa đôi trong kỷ nguyên số
                  </p>
                </div>
              </div>

              <div className="prose prose-sm max-w-none text-gray-600 space-y-4 text-sm leading-relaxed">
                <p>
                  <strong>ZenLove</strong> (zenlove.me) là nền tảng công nghệ khởi tạo và phát hành thiệp cưới trực tuyến thông minh hàng đầu tại Việt Nam. Chúng tôi cung cấp giải pháp thiết kế thiệp cưới tương tác không cần kỹ năng đồ họa phức tạp, giúp các cặp đôi tiết kiệm đến 80% chi phí in ấn truyền thống và chia sẻ lời mời trang trọng tới bạn bè chỉ với một đường link.
                </p>
                <p>
                  ZenLove tích hợp đầy đủ công nghệ hiện đại: quản lý phản hồi khách mời (RSVP) tức thì, sổ lưu bút chúc phúc tương tác trực tuyến, bản đồ chỉ đường Google Maps chính xác, và mã mừng cưới VietQR chuẩn Napas 24/7 tương thích 54 ngân hàng Việt Nam.
                </p>
              </div>
            </article>

            {/* 2. Thông tin doanh nghiệp */}
            <article
              id="legal"
              className="bg-white rounded-3xl p-6 sm:p-10 border border-gray-100 shadow-xs scroll-mt-28"
            >
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Building className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                    2. Thông Tin Doanh Nghiệp & Pháp Lý
                  </h2>
                  <p className="text-xs text-gray-500">
                    Đơn vị chủ quản và chịu trách nhiệm pháp lý của hệ thống
                  </p>
                </div>
              </div>

              <div className="space-y-3 text-sm text-gray-600 leading-relaxed bg-gray-50 p-5 rounded-2xl border border-gray-200/80">
                <p>
                  <strong className="text-gray-900">Đơn vị chủ quản:</strong> Công Ty Cổ Phần Công Nghệ Cưới ZenLove Việt Nam
                </p>
                <p>
                  <strong className="text-gray-900">Mã số thuế / ĐKKD:</strong> 0109886888 do Sở Kế hoạch và Đầu tư cấp phép
                </p>
                <p>
                  <strong className="text-gray-900">Trụ sở chính:</strong> Tầng 12, Tòa nhà Công Nghệ Số, Cầu Giấy, Hà Nội
                </p>
                <p>
                  <strong className="text-gray-900">Chi nhánh miền Nam:</strong> Quận 1, Thành phố Hồ Chí Minh
                </p>
                <p>
                  <strong className="text-gray-900">Đại diện pháp luật:</strong> Ban Giám Đốc ZenLove
                </p>
                <p>
                  <strong className="text-gray-900">Hotline hỗ trợ:</strong> 0988.888.888 (8h00 - 22h00 các ngày trong tuần)
                </p>
                <p>
                  <strong className="text-gray-900">Hòm thư điện tử:</strong> legal@zenlove.me / contact@zenlove.me
                </p>
              </div>
            </article>

            {/* 3. Chính sách bảo mật */}
            <article
              id="privacy"
              className="bg-white rounded-3xl p-6 sm:p-10 border border-gray-100 shadow-xs scroll-mt-28"
            >
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                    3. Chính Sách Bảo Mật Thông Tin (Privacy Policy)
                  </h2>
                  <p className="text-xs text-gray-500">
                    Bảo vệ tuyệt đối thông tin cá nhân và dữ liệu thiệp cưới của khách hàng
                  </p>
                </div>
              </div>

              <div className="space-y-4 text-sm text-gray-600 leading-relaxed">
                <div>
                  <h3 className="text-base font-bold text-gray-900 mb-1.5">
                    a. Mục đích thu thập thông tin
                  </h3>
                  <p>
                    ZenLove chỉ thu thập các thông tin cần thiết phục vụ việc tạo lập thiệp cưới và vận hành hệ thống, bao gồm: tên cô dâu, tên chú rể, số điện thoại liên hệ, email đăng nhập, ảnh cưới, thông tin lễ cưới, và phản hồi tham dự (RSVP) do khách mời tự nguyện gửi qua thiệp.
                  </p>
                </div>

                <div>
                  <h3 className="text-base font-bold text-gray-900 mb-1.5">
                    b. Cam kết không thương mại hóa dữ liệu
                  </h3>
                  <p>
                    Chúng tôi cam kết không bán, không chuyển nhượng, không chia sẻ danh sách khách mời, số điện thoại hay thông tin cá nhân của bạn cho bất kỳ bên thứ ba nào vì mục đích quảng cáo rác hoặc tiếp thị bất hợp pháp.
                  </p>
                </div>

                <div>
                  <h3 className="text-base font-bold text-gray-900 mb-1.5">
                    c. Tiêu chuẩn mã hóa an toàn kỹ thuật
                  </h3>
                  <p>
                    Mọi dữ liệu trao đổi giữa trình duyệt của bạn và hệ thống ZenLove đều được mã hóa bằng giao thức SSL/TLS 256-bit tiêu chuẩn ngân hàng. Mật khẩu tài khoản được bảo vệ bằng thuật toán băm Bcrypt salt ngẫu nhiên; hệ thống xác thực sử dụng JWT Access & Refresh Token có thời hạn nghiêm ngặt.
                  </p>
                </div>

                <div>
                  <h3 className="text-base font-bold text-gray-900 mb-1.5">
                    d. Quyền kiểm soát dữ liệu của người dùng
                  </h3>
                  <p>
                    Bạn có toàn quyền chỉnh sửa thông tin thiệp, xuất danh sách khách mời sang file Excel, ẩn hoặc xóa thiệp cưới vĩnh viễn khỏi hệ thống bất kỳ lúc nào ngay trong mục Quản trị cá nhân (Dashboard).
                  </p>
                </div>
              </div>
            </article>

            {/* 4. Điều khoản dịch vụ */}
            <article
              id="terms"
              className="bg-white rounded-3xl p-6 sm:p-10 border border-gray-100 shadow-xs scroll-mt-28"
            >
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                    4. Điều Khoản Dịch Vụ (Terms of Service)
                  </h2>
                  <p className="text-xs text-gray-500">
                    Quy định sử dụng dịch vụ giữa người dùng và nền tảng ZenLove
                  </p>
                </div>
              </div>

              <div className="space-y-4 text-sm text-gray-600 leading-relaxed">
                <p>
                  Khi đăng ký tài khoản hoặc sử dụng bất kỳ công cụ nào trên ZenLove, bạn đồng ý tuân thủ toàn bộ các quy định tại văn bản này:
                </p>
                <ul className="list-disc pl-5 space-y-2">
                  <li>
                    <strong>Tài khoản hợp lệ:</strong> Người dùng chịu trách nhiệm bảo quản mật khẩu và tài khoản của mình. Mọi thao tác khởi tạo từ tài khoản được tính là hành động của chủ sở hữu tài khoản.
                  </li>
                  <li>
                    <strong>Nội dung hợp pháp:</strong> Bạn cam kết chỉ sử dụng thiệp mời cho mục đích cưới hỏi, gắn kết gia đình; không sử dụng hệ thống để phát tán nội dung lừa đảo, cờ bạc, nội dung khiêu dâm hoặc xâm phạm quyền lợi của người khác.
                  </li>
                  <li>
                    <strong>Chấm dứt dịch vụ:</strong> ZenLove có quyền đơn phương gỡ bỏ các thiệp cưới hoặc tài khoản có hành vi gian lận, spam lời mời có chủ đích hoặc vi phạm pháp luật hiện hành của Nước Cộng hòa Xã hội Chủ nghĩa Việt Nam.
                  </li>
                  <li>
                    <strong>Tính ổn định kỹ thuật (SLA):</strong> ZenLove nỗ lực duy trì chỉ số sẵn sàng của hệ thống đạt tối thiểu 99.9% để đảm bảo thiệp cưới của bạn luôn hoạt động trơn tru trong suốt mùa cưới.
                  </li>
                </ul>
              </div>
            </article>

            {/* 5. Điều kiện giao dịch chung */}
            <article
              id="terms-transaction"
              className="bg-white rounded-3xl p-6 sm:p-10 border border-gray-100 shadow-xs scroll-mt-28"
            >
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
                <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                    5. Điều Kiện Giao Dịch Chung
                  </h2>
                  <p className="text-xs text-gray-500">
                    Chính sách cung ứng gói dịch vụ Miễn phí & Gói VIP vĩnh viễn
                  </p>
                </div>
              </div>

              <div className="space-y-4 text-sm text-gray-600 leading-relaxed">
                <p>
                  ZenLove cung cấp 2 hình thức sử dụng dịch vụ rõ ràng:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-3">
                  <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200">
                    <p className="text-xs font-bold text-gray-900 uppercase">Gói Miễn Phí (Free Forever)</p>
                    <ul className="text-xs text-gray-600 mt-2 space-y-1 list-disc pl-4">
                      <li>Tạo thiệp và lưu giữ vĩnh viễn không mất phí</li>
                      <li>Toàn quyền truy cập hơn 330+ mẫu thiệp cưới</li>
                      <li>Thu nhận RSVP và Lời chúc mừng không giới hạn</li>
                      <li>Bản đồ chỉ đường & Nhạc nền tự chọn</li>
                    </ul>
                  </div>
                  <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200">
                    <p className="text-xs font-bold text-zen-primary uppercase">Gói VIP Cao Cấp (Vĩnh Viễn)</p>
                    <ul className="text-xs text-zen-black mt-2 space-y-1 list-disc pl-4 font-medium">
                      <li>Gỡ bỏ hoàn toàn logo & watermark ZenLove</li>
                      <li>Được phép tải lên bản nhạc MP3 riêng yêu thích</li>
                      <li>Tải file ảnh thiệp full HD (300 DPI) để in ấn</li>
                      <li>Tải danh sách khách mời định dạng Excel chuyên nghiệp</li>
                    </ul>
                  </div>
                </div>
                <p>
                  Gói VIP được thanh toán một lần duy nhất theo đơn giá niêm yết tại thời điểm nâng cấp, có giá trị vĩnh viễn cho thiệp cưới được kích hoạt.
                </p>
              </div>
            </article>

            {/* 6. Chính sách thanh toán */}
            <article
              id="payment"
              className="bg-white rounded-3xl p-6 sm:p-10 border border-gray-100 shadow-xs scroll-mt-28"
            >
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                    6. Chính Sách Thanh Toán Trực Tuyến
                  </h2>
                  <p className="text-xs text-gray-500">
                    Thanh toán an toàn qua cổng VietQR Napas 24/7 tự động kích hoạt
                  </p>
                </div>
              </div>

              <div className="space-y-4 text-sm text-gray-600 leading-relaxed">
                <p>
                  Hệ thống ZenLove hỗ trợ thanh toán hoàn toàn trực tuyến và tự động hóa 100%:
                </p>
                <ul className="list-disc pl-5 space-y-2">
                  <li>
                    <strong>Mã VietQR động:</strong> Mỗi hóa đơn thanh toán sẽ tạo ra một mã QR Napas 24/7 chứa chính xác số tiền và mã nội dung chuyển khoản độc nhất.
                  </li>
                  <li>
                    <strong>Kích hoạt tức thì:</strong> Nhờ công nghệ Webhook đồng bộ tài khoản ngân hàng, hệ thống sẽ tự động kích hoạt trạng thái VIP cho thiệp của bạn ngay trong vòng 10 đến 30 giây sau khi ngân hàng báo giao dịch thành công.
                  </li>
                  <li>
                    <strong>0đ phụ phí:</strong> Người dùng chỉ trả đúng giá trị gói nâng cấp niêm yết, không phát sinh bất kỳ khoản phí duy trì, phí trung gian hay chi phí ẩn nào khác.
                  </li>
                </ul>
              </div>
            </article>

            {/* 7. Chính sách hoàn tiền */}
            <article
              id="refund"
              className="bg-white rounded-3xl p-6 sm:p-10 border border-gray-100 shadow-xs scroll-mt-28"
            >
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                    7. Chính Sách Cam Kết & Hoàn Tiền (Refund Policy)
                  </h2>
                  <p className="text-xs text-gray-500">
                    Đảm bảo 100% sự hài lòng và quyền lợi của người dùng
                  </p>
                </div>
              </div>

              <div className="space-y-4 text-sm text-gray-600 leading-relaxed">
                <p>
                  Chúng tôi đặt niềm tin và trải nghiệm của bạn lên hàng đầu:
                </p>
                <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl">
                  <p className="text-xs font-bold text-emerald-800">
                    Chính sách hoàn tiền 100% trong 07 ngày:
                  </p>
                  <p className="text-xs text-emerald-700 mt-1 leading-relaxed">
                    Nếu bạn đã nâng cấp gói VIP nhưng gặp lỗi kỹ thuật từ phía hệ thống ZenLove mà đội ngũ kỹ thuật không thể khắc phục trong vòng 24 giờ, bạn được quyền yêu cầu hoàn lại 100% số tiền đã thanh toán.
                  </p>
                </div>
                <p>
                  <strong>Quy trình xử lý hoàn tiền:</strong> Khách hàng chỉ cần gửi email về địa chỉ <code>support@zenlove.me</code> hoặc nhắn tin qua Zale Hotline kèm theo hình ảnh giao dịch. Bộ phận kế toán sẽ đối soát và hoàn tiền vào số tài khoản của bạn trong vòng 24 đến 48 giờ làm việc.
                </p>
              </div>
            </article>

            {/* 8. Quy trình giao dịch */}
            <article
              id="purchase-process"
              className="bg-white rounded-3xl p-6 sm:p-10 border border-gray-100 shadow-xs scroll-mt-28"
            >
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
                <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                    8. Quy Trình Khởi Tạo & Phát Hành Thiệp Cưới
                  </h2>
                  <p className="text-xs text-gray-500">
                    5 bước đơn giản để tạo và gửi thiệp mời trực tuyến tới khách quý
                  </p>
                </div>
              </div>

              <div className="space-y-4 text-sm text-gray-600 leading-relaxed">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                    <span className="text-xs font-bold text-zen-primary">BƯỚC 1</span>
                    <h4 className="text-sm font-bold text-gray-900 mt-1">Chọn mẫu thiệp</h4>
                    <p className="text-xs text-gray-500 mt-1">Khám phá kho 330+ mẫu thiệp đa dạng phong cách từ truyền thống đến hiện đại.</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                    <span className="text-xs font-bold text-zen-primary">BƯỚC 2</span>
                    <h4 className="text-sm font-bold text-gray-900 mt-1">Chỉnh sửa thông tin</h4>
                    <p className="text-xs text-gray-500 mt-1">Điền tên cô dâu chú rể, upload ảnh cưới, bản đồ địa điểm và tài khoản ngân hàng mừng cưới.</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                    <span className="text-xs font-bold text-zen-primary">BƯỚC 3</span>
                    <h4 className="text-sm font-bold text-gray-900 mt-1">Xem trước trực quan</h4>
                    <p className="text-xs text-gray-500 mt-1">Kiểm tra hiển thị mượt mà trên cả điện thoại di động và máy tính.</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                    <span className="text-xs font-bold text-zen-primary">BƯỚC 4</span>
                    <h4 className="text-sm font-bold text-gray-900 mt-1">Xuất bản & Chia sẻ</h4>
                    <p className="text-xs text-gray-500 mt-1">Nhận đường link thiệp riêng kèm tên khách mời để gửi thiệp qua Zalo, Facebook, SMS.</p>
                  </div>
                </div>
              </div>
            </article>

            {/* 9. Chính sách nội dung & Bản quyền */}
            <article
              id="content-policy"
              className="bg-white rounded-3xl p-6 sm:p-10 border border-gray-100 shadow-xs scroll-mt-28"
            >
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                    9. Bản Quyền Hình Ảnh & Tiêu Chuẩn Nội Dung
                  </h2>
                  <p className="text-xs text-gray-500">
                    Quyền sở hữu trí tuệ và nguyên tắc văn hóa cộng đồng
                  </p>
                </div>
              </div>

              <div className="space-y-4 text-sm text-gray-600 leading-relaxed">
                <p>
                  <strong>Quyền sở hữu ảnh của cặp đôi:</strong> Bạn sở hữu toàn bộ bản quyền đối với các hình ảnh cưới cá nhân mà bạn tải lên hệ thống. ZenLove không sử dụng hình ảnh của bạn vào các chiến dịch truyền thông nếu không có sự đồng thuận bằng văn bản của bạn.
                </p>
                <p>
                  <strong>Bản quyền thiết kế mẫu thiệp:</strong> Toàn bộ các họa tiết đồ họa, font chữ Việt hóa, bố cục giao diện và mã nguồn phần mềm trên hệ thống thuộc quyền sở hữu trí tuệ của ZenLove. Người dùng chỉ được cấp quyền sử dụng cho đám cưới cá nhân, nghiêm cấm sao chép, trích xuất mã nguồn hoặc bán lại cho bên thứ ba.
                </p>
              </div>
            </article>

            {/* CTA Help */}
            <div className="p-8 rounded-3xl bg-gradient-to-r from-rose-500 to-zen-primary text-white text-center shadow-lg">
              <h3 className="text-xl sm:text-2xl font-bold">
                Bạn đã sẵn sàng khởi tạo thiệp cưới trong mơ?
              </h3>
              <p className="text-xs sm:text-sm text-rose-100 mt-2 max-w-lg mx-auto">
                Bắt đầu hoàn toàn miễn phí ngay hôm nay. Chỉ mất chưa đầy 5 phút để có thiệp cưới trực tuyến tinh tế và độc đáo.
              </p>
              <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                <Link
                  href="/templates"
                  className="px-6 py-3 rounded-2xl bg-white text-zen-primary text-xs font-bold hover:bg-rose-50 transition-all shadow-md cursor-pointer flex items-center gap-2"
                >
                  <span>Khám phá 330+ Mẫu Thiệp</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/doi-tac-cuoi"
                  className="px-6 py-3 rounded-2xl bg-rose-600/60 hover:bg-rose-600 text-white text-xs font-semibold transition-all border border-white/20"
                >
                  <span>Xem Ưu Đãi Đối Tác</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
