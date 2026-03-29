"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAppContext } from "@/components/providers/AppProvider";
import { checkPasswordStrength } from "@/utils/password";

export default function AuthFormCard({ mode }) {
  const router = useRouter();
  const { isAuthenticated, login, register } = useAppContext();
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const isRegister = mode === "register";
  const passwordCheck = checkPasswordStrength(form.password);

  // Xử lý chuyển hướng: Cứ đăng nhập thành công là đẩy thẳng về trang chủ
  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/");
    }
  }, [isAuthenticated, router]);

  function updateField(field, value) {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (isRegister && form.password !== form.confirmPassword) {
      setError("Mật khẩu nhập lại không khớp.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (isRegister) {
        await register({
          fullName: form.fullName,
          email: form.email,
          password: form.password,
        });
      } else {
        await login({
          email: form.email,
          password: form.password,
        });
      }
      // Lưu ý: Không cần router.push ở đây vì useEffect ở trên sẽ tự động bắt thay đổi của isAuthenticated
    } catch (submitError) {
      setError(submitError.message || "Không xử lý được yêu cầu.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl rounded-[2rem] border border-slate-200 bg-white p-6 shadow-lg md:p-8">
      <h1 className="mt-3 text-center font-display text-4xl text-slate-900">
        {isRegister ? "Đăng ký" : "Đăng nhập"}
      </h1>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        {/* ... (Các thẻ input fullName, email, password giữ nguyên như cũ) ... */}
        {isRegister && (
          <label className="block text-sm font-medium text-slate-700">
            Họ và tên
            <input
              type="text"
              value={form.fullName}
              onChange={(event) => updateField("fullName", event.target.value)}
              className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-sky-300 focus:bg-white"
              placeholder="Nhập họ tên của bạn"
              required
            />
          </label>
        )}

        <label className="block text-sm font-medium text-slate-700">
          Email
          <input
            type="email"
            value={form.email}
            onChange={(event) => updateField("email", event.target.value)}
            className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-sky-300 focus:bg-white"
            placeholder="example@gmail.com"
            required
          />
        </label>

        <div>
          <label className="block text-sm font-medium text-slate-700">
            Mật khẩu
            <input
              type="password"
              value={form.password}
              onChange={(event) => updateField("password", event.target.value)}
              className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-sky-300 focus:bg-white"
              required
            />
          </label>
        </div>

        {isRegister && (
          <label className="block text-sm font-medium text-slate-700">
            Nhập lại mật khẩu
            <input
              type="password"
              value={form.confirmPassword}
              onChange={(event) => updateField("confirmPassword", event.target.value)}
              className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-sky-300 focus:bg-white"
              required
            />
          </label>
        )}

        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting || (isRegister && !passwordCheck.valid)}
          className="w-full rounded-2xl bg-sky-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-sky-800 disabled:bg-slate-300"
        >
          {isSubmitting ? "Đang xử lý..." : isRegister ? "Tạo tài khoản" : "Đăng nhập"}
        </button>

        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-slate-200" />
          <span className="text-xs text-slate-400">hoặc</span>
          <div className="h-px flex-1 bg-slate-200" />
        </div>

        {/* Nút đăng nhập Google trỏ thẳng tới API backend */}
        <a
          href="http://localhost:4000/api/auth/google"
          className="flex w-full items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:border-slate-300"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Tiếp tục với Google
        </a>
      </form>

      <p className="mt-6 text-center text-sm text-slate-600">
        {isRegister ? "Đã có tài khoản ?" : "Chưa có tài khoản ?"}{" "}
        <Link href={isRegister ? "/dang-nhap" : "/dang-ky"} className="font-semibold text-sky-800">
          {isRegister ? "Đăng nhập ngay" : "Đăng ký ngay"}
        </Link>
      </p>
    </div>
  );
}