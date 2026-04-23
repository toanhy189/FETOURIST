"use client";

import { useEffect, useState } from "react";
import { updateMyProfile } from "@/apiService/auth";

export default function AccountPasswordTab() {
    const [form, setForm] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        if (!message) return;

        const timer = setTimeout(() => {
            setMessage("");
        }, 2500);

        return () => clearTimeout(timer);
    }, [message]);

    function updateField(field, value) {
        setForm((current) => ({
            ...current,
            [field]: value,
        }));
    }

    async function handleSubmit(event) {
        event.preventDefault();
        setMessage("");
        setError("");

        if (!form.newPassword || !form.confirmPassword) {
            setError("Vui lòng nhập đầy đủ mật khẩu mới.");
            return;
        }

        if (form.newPassword !== form.confirmPassword) {
            setError("Mật khẩu xác nhận không khớp.");
            return;
        }

        if (form.newPassword.length < 6) {
            setError("Mật khẩu mới phải có ít nhất 6 ký tự.");
            return;
        }

        setLoading(true);

        try {
            await updateMyProfile({
                currentPassword: form.currentPassword,
                newPassword: form.newPassword,
            });

            setMessage("Đổi mật khẩu thành công.");
            setForm({
                currentPassword: "",
                newPassword: "",
                confirmPassword: "",
            });
        } catch (submitError) {
            setError(submitError.message || "Không đổi được mật khẩu.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="space-y-5">
            {message ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                    {message}
                </div>
            ) : null}

            {error ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {error}
                </div>
            ) : null}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                    <label className="block">
                        <span className="mb-2 block text-sm font-semibold text-slate-700">
                            Mật khẩu hiện tại
                        </span>
                        <input
                            type="password"
                            value={form.currentPassword}
                            onChange={(event) => updateField("currentPassword", event.target.value)}
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-sky-300 focus:bg-white"
                            placeholder="Nhập mật khẩu hiện tại"
                        />
                    </label>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                    <label className="block">
                        <span className="mb-2 block text-sm font-semibold text-slate-700">
                            Mật khẩu mới
                        </span>
                        <input
                            type="password"
                            value={form.newPassword}
                            onChange={(event) => updateField("newPassword", event.target.value)}
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-sky-300 focus:bg-white"
                            placeholder="Nhập mật khẩu mới"
                            required
                        />
                    </label>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                    <label className="block">
                        <span className="mb-2 block text-sm font-semibold text-slate-700">
                            Xác nhận mật khẩu mới
                        </span>
                        <input
                            type="password"
                            value={form.confirmPassword}
                            onChange={(event) => updateField("confirmPassword", event.target.value)}
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-sky-300 focus:bg-white"
                            placeholder="Nhập lại mật khẩu mới"
                            required
                        />
                    </label>
                </div>

                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={loading}
                        className="rounded-full bg-sky-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-800 disabled:bg-slate-300"
                    >
                        {loading ? "Đang cập nhật..." : "Lưu mật khẩu mới"}
                    </button>
                </div>
            </form>
        </div>
    );
}