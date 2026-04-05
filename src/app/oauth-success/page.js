"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { saveStoredSession } from "@/apiService/AxiosInstance/AxiosInstance";
import { fetchMe } from "@/apiService/auth.js"; // Điều chỉnh đường dẫn đến hàm fetchMe của bạn

export default function OAuthSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    async function handleGoogleLogin() {
      const accessToken = searchParams.get("accessToken");
      const refreshToken = searchParams.get("refreshToken");

      if (accessToken && refreshToken) {
        // 1. Lưu token (tạm thời chưa có user data đầy đủ, mapUser sẽ bỏ qua nếu null)
        saveStoredSession({
          accessToken,
          refreshToken,
          user: null,
        });

        try {
          // 2. Gọi fetchMe() để đồng bộ thông tin user từ backend về frontend
          await fetchMe();

          // 3. Xong xuôi thì nhảy về trang chủ, trigger useEffect của AuthForm/AppProvider
          // Cập nhật URL cứng hoặc dùng router (khuyến nghị dùng window.location.href để force re-mount AppProvider lấy state mới)
          window.location.href = "/";
        } catch (error) {
          console.error("Lỗi khi đồng bộ thông tin user:", error);
          router.replace("/dang-nhap?error=sync_failed");
        }
      } else {
        router.replace("/dang-nhap?error=missing_tokens");
      }
    }

    handleGoogleLogin();
  }, [searchParams, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-sky-700 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
        <p className="text-slate-600">Đang hoàn tất đăng nhập Google...</p>
      </div>
    </div>
  );
}