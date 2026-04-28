"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { saveStoredSession } from "@/apiService/AxiosInstance/AxiosInstance";
import { fetchMe } from "@/apiService/auth";

function OAuthSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    async function handleGoogleLogin() {
      const accessToken = searchParams.get("accessToken");
      const refreshToken = searchParams.get("refreshToken");

      if (!accessToken || !refreshToken) {
        router.replace("/dang-nhap?error=missing_tokens");
        return;
      }

      saveStoredSession({
        accessToken,
        refreshToken,
        user: null,
      });

      try {
        await fetchMe();
        window.location.href = "/";
      } catch (error) {
        console.error("Không thể đồng bộ thông tin người dùng sau OAuth:", error);
        router.replace("/dang-nhap?error=sync_failed");
      }
    }

    void handleGoogleLogin();
  }, [router, searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-sky-700 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
        <p className="text-slate-600">Đang hoàn tất đăng nhập Google...</p>
      </div>
    </div>
  );
}

export default function OAuthSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-sky-700 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
            <p className="text-slate-600">Đang khởi tạo phiên đăng nhập...</p>
          </div>
        </div>
      }
    >
      <OAuthSuccessContent />
    </Suspense>
  );
}
