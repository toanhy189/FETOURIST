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
    fullName: "",
    email: "",
    phoneNumber: "",
    avatarUrl: "",
    password: "",
  });

  const isRegister = mode === "register";
  const passwordCheck = checkPasswordStrength(form.password);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

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
    setIsSubmitting(true);

    try {
      if (isRegister) {
        await register({
          fullName: form.fullName,
          email: form.email,
          phoneNumber: form.phoneNumber,
          avatarUrl: form.avatarUrl,
          password: form.password,
        });
      } else {
        await login({
          email: form.email,
          password: form.password,
        });
      }
    } catch (submitError) {
      setError(submitError.message || "Khong xu ly duoc yeu cau dang nhap.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl rounded-[2rem] border border-slate-200 bg-white p-6 shadow-lg md:p-8">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-700">
        {isRegister ? "Dang ky tai khoan" : "Dang nhap he thong"}
      </p>
      <h1 className="mt-3 font-display text-4xl text-slate-900">
        {isRegister ? "Bat dau voi BETOURIST" : "Chao mung quay tro lai"}
      </h1>
      <p className="mt-3 text-sm leading-6 text-slate-600">
        {isRegister
          ? "Sau khi dang ky, ban co the dat tour, theo doi booking, thanh toan va nhan thong bao."
          : "Dang nhap de su dung booking preview, yeu thich, review, comment va khu vuc quan ly tai khoan."}
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        {isRegister ? (
          <label className="block text-sm font-medium text-slate-700">
            Ho va ten
            <input
              value={form.fullName}
              onChange={(event) => updateField("fullName", event.target.value)}
              className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-sky-300 focus:bg-white"
              placeholder="Nguyen Van A"
              required
            />
          </label>
        ) : null}

        <label className="block text-sm font-medium text-slate-700">
          Email
          <input
            type="email"
            value={form.email}
            onChange={(event) => updateField("email", event.target.value)}
            className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-sky-300 focus:bg-white"
            placeholder="you@example.com"
            required
          />
        </label>

        {isRegister ? (
          <>
            <label className="block text-sm font-medium text-slate-700">
              So dien thoai
              <input
                value={form.phoneNumber}
                onChange={(event) => updateField("phoneNumber", event.target.value)}
                className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-sky-300 focus:bg-white"
                placeholder="09xx xxx xxx"
              />
            </label>

            <label className="block text-sm font-medium text-slate-700">
              Avatar URL
              <input
                value={form.avatarUrl}
                onChange={(event) => updateField("avatarUrl", event.target.value)}
                className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-sky-300 focus:bg-white"
                placeholder="https://..."
              />
            </label>
          </>
        ) : null}

        <label className="block text-sm font-medium text-slate-700">
          Mat khau
          <input
            type="password"
            value={form.password}
            onChange={(event) => updateField("password", event.target.value)}
            className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-sky-300 focus:bg-white"
            placeholder="Nhap mat khau"
            required
          />
        </label>

        {isRegister ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            <p className="font-semibold text-slate-900">Kiem tra mat khau</p>
            <p className="mt-1">
              {passwordCheck.valid
                ? "Mat khau dat dieu kien co ban."
                : passwordCheck.issues.join(" - ")}
            </p>
          </div>
        ) : null}

        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting || (isRegister && !passwordCheck.valid)}
          className="w-full rounded-2xl bg-sky-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-sky-800 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {isSubmitting
            ? "Dang xu ly..."
            : isRegister
              ? "Tao tai khoan"
              : "Dang nhap"}
        </button>
      </form>

      <p className="mt-6 text-sm text-slate-600">
        {isRegister ? "Da co tai khoan?" : "Chua co tai khoan?"}{" "}
        <Link
          href={isRegister ? "/dang-nhap" : "/dang-ky"}
          className="font-semibold text-sky-800"
        >
          {isRegister ? "Dang nhap ngay" : "Dang ky ngay"}
        </Link>
      </p>
    </div>
  );
}
