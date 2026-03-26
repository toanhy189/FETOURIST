"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAppContext } from "@/components/providers/AppProvider";
import { checkPasswordStrength } from "@/utils/password";

export default function AuthFormCard({ mode }) {
  const router = useRouter();
  const { currentUser, isAuthenticated, login, register } = useAppContext();
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    fullName: "", // Thêm lại Họ và tên
    email: "",
    password: "",
    confirmPassword: "", // Nhập lại mật khẩu
  });

  const isRegister = mode === "register";
  const passwordCheck = checkPasswordStrength(form.password);

  useEffect(() => {
    if (!isAuthenticated) return;
    router.replace(currentUser?.role === "admin" ? "/quan-tri" : "/tai-khoan");
  }, [currentUser?.role, isAuthenticated, router]);

  function updateField(field, value) {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    // Kiểm tra khớp mật khẩu khi đăng ký
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

      <form onSubmit={handleSubmit} className="mt-6 space-y-4" >

        {/* Ô họ tên */}
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
              onInvalid={(e) => e.target.setCustomValidity("Vui lòng nhập trường này.")}
              onInput={(e) => e.target.setCustomValidity("")}
            />
          </label>
        )}

        {/* Ô email */}
        <label className="block text-sm font-medium text-slate-700">
          Email
          <input
            type="email"
            value={form.email}
            onChange={(event) => updateField("email", event.target.value)}
            className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-sky-300 focus:bg-white"
            placeholder="example@gmail.com"
            required

            /* Chèn 2 dòng này vào giữa thẻ input */
            onInvalid={(e) => e.target.setCustomValidity("Vui lòng nhập đúng định dạng email (ví dụ: example@gmail.com).")}
            onInput={(e) => e.target.setCustomValidity("")}
          />
        </label>

        {/* Ô mk */}
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
          {!isRegister && (
            <div className="mt-2 flex justify-end">
              <Link href="/quen-mat-khau" className="text-sm font-semibold text-sky-700 hover:underline">
                Quên mật khẩu?
              </Link>
            </div>
          )}
        </div>

        {/* Nhập lại mk */}
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

        {/* tbao lỗi */}
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
          {isSubmitting ? "Đang xử lý" : isRegister ? "Tạo tài khoản" : "Đăng nhập"}
        </button>
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