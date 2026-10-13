"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { cloneTemplateToNewCard } from "@/lib/weddingCardService";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState("Đang hoàn tất đăng nhập...");
  const [isError, setIsError] = useState(false);

  const redirectAfterAuth = async (profile: any) => {
    try {
      const rawIntent = sessionStorage.getItem("zenlove_pending_intent");
      if (rawIntent) {
        const intent = JSON.parse(rawIntent);
        sessionStorage.removeItem("zenlove_pending_intent");
        if (intent.type === "clone_template" && intent.templateId) {
          setStatus("Đang khởi tạo mẫu thiệp cưới của bạn...");
          try {
            const card = await cloneTemplateToNewCard(
              intent.templateId,
              intent.customGroom,
              intent.customBride,
              profile.id
            );
            router.push(`/design-template/${card.id}?clonedFrom=${intent.templateId}`);
            return;
          } catch {
            router.push(`/design-template/${intent.templateId}`);
            return;
          }
        }
      }
    } catch {}
    router.push("/dashboard");
  };

  useEffect(() => {
    try {
      // 1. Kiểm tra tham số từ URL
      const searchParams = new URLSearchParams(window.location.search);
      const isProviderDisabled = searchParams.get("provider_disabled") === "true";
      const errorMsg = searchParams.get("error_description") || searchParams.get("error");

      if (isProviderDisabled || errorMsg) {
        setIsError(true);
        setStatus("Phương thức Google OAuth chưa được kích hoạt trên hệ thống. Vui lòng đăng nhập bằng Email.");
        setTimeout(() => {
          router.push("/?openLogin=true&mode=email");
        }, 2000);
        return;
      }

      // 2. Phân tích access_token và refresh_token từ URL hash (#access_token=...) hoặc search params (?access_token=...)
      const hash = window.location.hash.substring(1);
      const hashParams = new URLSearchParams(hash);
      const accessToken = hashParams.get("access_token") || searchParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token") || searchParams.get("refresh_token");

      if (accessToken) {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://yeqosgjxjeiitevaquoz.supabase.co";
        const anonKey =
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
          process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
          "sb_publishable_bbEV96r7bgrnpQpHg9B_0A_9Xiloc0j";

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
                avatar:
                  user.user_metadata?.avatar_url ||
                  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&auto=format&fit=crop",
                provider: "google",
                accessToken,
                refreshToken: refreshToken || undefined,
                createdAt: new Date().toISOString(),
              };

              localStorage.setItem("zenlove_auth_user", JSON.stringify(profile));
              setStatus("Đăng nhập thành công! Đang chuyển hướng...");
              setTimeout(() => {
                redirectAfterAuth(profile);
              }, 400);
              return;
            }
            router.push("/dashboard");
          })
          .catch(() => {
            setIsError(true);
            setStatus("Không thể lấy thông tin tài khoản. Vui lòng thử lại.");
            setTimeout(() => router.push("/"), 1500);
          });
      } else {
        router.push("/dashboard");
      }
    } catch {
      router.push("/dashboard");
    }
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#fdfaf8] text-gray-800">
      <div className="bg-white p-8 rounded-3xl shadow-lg border border-gray-100 text-center max-w-sm w-full mx-4">
        {!isError && (
          <div className="w-12 h-12 border-3 border-zen-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        )}
        <h2 className="text-lg font-bold text-gray-900">
          {isError ? "Thông báo xác thực" : "Xác thực Google"}
        </h2>
        <p className={`text-xs mt-2 ${isError ? "text-amber-700 font-medium" : "text-gray-500"}`}>
          {status}
        </p>
      </div>
    </div>
  );
}
