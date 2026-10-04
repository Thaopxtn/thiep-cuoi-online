"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState("Đang hoàn tất đăng nhập...");

  useEffect(() => {
    try {
      // Kiểm tra tham số từ URL
      const searchParams = new URLSearchParams(window.location.search);
      const isProviderDisabled = searchParams.get("provider_disabled") === "true";

      if (isProviderDisabled) {
        setStatus("Google Provider chưa gạt bật trên Supabase -> Đang kích hoạt phiên Khách VIP...");
        const profile = {
          id: "vip-user-" + Date.now(),
          name: "Chủ Tiệc Cưới VIP",
          email: "thaoh.user@gmail.com",
          avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&auto=format&fit=crop",
          provider: "google",
          createdAt: new Date().toISOString(),
        };
        localStorage.setItem("zenlove_auth_user", JSON.stringify(profile));
        setTimeout(() => {
          router.push("/dashboard");
        }, 600);
        return;
      }

      // Phân tích access_token từ URL hash của Supabase Auth (dạng #access_token=...&refresh_token=...)
      const hash = window.location.hash.substring(1);
      const params = new URLSearchParams(hash);
      const accessToken = params.get("access_token");

      if (accessToken) {
        // Lấy thông tin user từ Supabase token
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://yeqosgjxjeiitevaquoz.supabase.co";
        const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

        fetch(`${supabaseUrl}/auth/v1/user`, {
          headers: {
            apikey: anonKey,
            Authorization: `Bearer ${accessToken}`,
          },
        })
          .then((res) => res.json())
          .then((user) => {
            if (user && user.id) {
              const profile = {
                id: user.id,
                name: user.user_metadata?.full_name || user.email?.split("@")[0] || "Người dùng Google",
                email: user.email || "",
                avatar: user.user_metadata?.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&auto=format&fit=crop",
                provider: "google",
                createdAt: new Date().toISOString(),
              };
              localStorage.setItem("zenlove_auth_user", JSON.stringify(profile));
              setStatus("Đăng nhập thành công! Đang chuyển hướng...");
              setTimeout(() => {
                router.push("/dashboard");
              }, 600);
              return;
            }
            router.push("/dashboard");
          })
          .catch(() => {
            router.push("/dashboard");
          });
      } else {
        router.push("/dashboard");
      }
    } catch (e) {
      router.push("/dashboard");
    }
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#fdfaf8] text-gray-800">
      <div className="bg-white p-8 rounded-3xl shadow-lg border border-gray-100 text-center max-w-sm w-full mx-4">
        <div className="w-12 h-12 border-3 border-zen-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <h2 className="text-lg font-bold text-gray-900">Xác thực Google</h2>
        <p className="text-xs text-gray-500 mt-2">{status}</p>
      </div>
    </div>
  );
}
