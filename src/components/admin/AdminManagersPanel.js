"use client";

import { useCallback, useEffect, useState } from "react";
import {
  updateMyProfile,
  uploadMyAvatar,
} from "@/apiService/auth";
import { useAppContext } from "@/components/providers/AppProvider";

const PASSWORD_MASK = "........";

function getInitials(fullName) {
  return String(fullName || "Admin")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
}

function createDraft(admin) {
  // Draft tách riêng khỏi currentUser để form có thể chỉnh sửa nhiều field trước khi bấm lưu.
  return {
    fullName: admin?.fullName || "",
    email: admin?.email || "",
    address: admin?.address || "",
    avatarUrl: admin?.avatarUrl || "",
    password: PASSWORD_MASK,
    passwordDirty: false,
  };
}

function buildFallbackAvatar(fullName) {
  const initials = getInitials(fullName);
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 320">
      <defs>
        <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="#d9ecff" />
          <stop offset="100%" stop-color="#8cc6ff" />
        </linearGradient>
      </defs>
      <rect width="320" height="320" rx="28" fill="url(#bg)" />
      <circle cx="160" cy="118" r="62" fill="#f8fafc" fill-opacity="0.96" />
      <path d="M74 274c19-52 54-79 86-79s67 27 86 79" fill="#f8fafc" fill-opacity="0.96" />
      <text x="160" y="138" text-anchor="middle" font-family="Arial, sans-serif" font-size="52" font-weight="700" fill="#1e293b">${initials}</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function handleAvatarLoad(event) {
  delete event.currentTarget.dataset.fallbackApplied;
}

function handleAvatarError(event, fullName) {
  if (event.currentTarget.dataset.fallbackApplied === "true") {
    return;
  }

  event.currentTarget.dataset.fallbackApplied = "true";
  event.currentTarget.src = buildFallbackAvatar(fullName);
}

function FormRow({ label, children }) {
  return (
    <div className="grid gap-2 md:grid-cols-[140px_minmax(0,1fr)] md:items-center">
      <label className="text-sm font-medium text-slate-500">{label}</label>
      {children}
    </div>
  );
}

export default function AdminManagersPanel({ currentUser }) {
  const { refreshProfile } = useAppContext();
  const [admin, setAdmin] = useState(currentUser || null);
  const [draft, setDraft] = useState(createDraft(currentUser));
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  useEffect(() => {
    setAdmin(currentUser || null);
    setDraft(createDraft(currentUser));
  }, [currentUser]);

  const loadCurrentAdmin = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const nextUser = await refreshProfile();
      setAdmin(nextUser);
      setDraft(createDraft(nextUser));
    } catch (loadError) {
      setError(loadError.message || "Không tải được thông tin admin.");
    } finally {
      setLoading(false);
    }
  }, [refreshProfile]);

  useEffect(() => {
    void loadCurrentAdmin();
  }, [loadCurrentAdmin]);

  function patchDraft(field, value) {
    setDraft((currentDraft) => ({
      ...currentDraft,
      [field]: value,
    }));
  }

  function handlePasswordFocus() {
    // Chỉ bỏ lớp mask khi người dùng thực sự bắt đầu sửa mật khẩu.
    setDraft((currentDraft) => {
      if (currentDraft.passwordDirty) {
        return currentDraft;
      }

      return {
        ...currentDraft,
        password: "",
        passwordDirty: true,
      };
    });
  }

  function handlePasswordChange(event) {
    patchDraft("password", event.target.value);
  }

  function handlePasswordBlur() {
    setDraft((currentDraft) => {
      if (currentDraft.password.trim()) {
        return currentDraft;
      }

      return {
        ...currentDraft,
        password: PASSWORD_MASK,
        passwordDirty: false,
      };
    });
  }

  async function handleAvatarUpload(event) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    setIsUploadingAvatar(true);
    setError("");
    setMessage("");

    try {
      // Upload xong thì gọi lại profile để đồng bộ ảnh mới nhất từ backend/session lưu cục bộ.
      const uploadedUser = await uploadMyAvatar(file);
      const nextUser = await refreshProfile().catch(() => uploadedUser);
      setAdmin(nextUser);
      setDraft(createDraft(nextUser));
      setMessage("Ảnh đại diện đã cập nhật thành công");
    } catch (uploadError) {
      setError(uploadError.message || "Không tải lên được ảnh đại diện");
    } finally {
      setIsUploadingAvatar(false);
    }
  }

  async function handleSave() {
    if (!admin) {
      return;
    }

    setIsSaving(true);
    setError("");
    setMessage("");

    try {
      // Chỉ gửi những field admin đang được phép tự cập nhật từ màn hình hồ sơ.
      const payload = {
        fullName: draft.fullName.trim(),
        email: draft.email.trim(),
        address: draft.address.trim(),
        avatarUrl: draft.avatarUrl || undefined,
      };

      if (draft.passwordDirty && draft.password.trim()) {
        payload.password = draft.password.trim();
      }

      const updatedUser = await updateMyProfile(payload);
      const nextUser = await refreshProfile().catch(() => updatedUser);
      setAdmin(nextUser);
      setDraft(createDraft(nextUser));
      setMessage(
        draft.passwordDirty && draft.password.trim()
          ? "Cập nhật thông tin thành công. Bạn vừa đổi mật khẩu, hãy đăng nhập lại khi phiên hiện tại hết hạn"
          : "Cập nhật thông tin admin thành công"
      );
    } catch (saveError) {
      setError(saveError.message || "Không lưu được thông tin admin");
    } finally {
      setIsSaving(false);
    }
  }

  const avatarPreview =
    draft.avatarUrl ||
    buildFallbackAvatar(admin?.fullName || currentUser?.fullName);

  return (
    <div className="space-y-6">
      <section className="border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-3xl font-semibold text-slate-900">Thông tin admin</h2>
        </div>

        {message ? (
          <div className="mx-6 mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {message}
          </div>
        ) : null}

        {error ? (
          <div className="mx-6 mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        <div className="px-6 py-6">
          {loading && !admin ? (
            <div className="border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center text-sm text-slate-500">
              Đang tải thông tin admin...
            </div>
          ) : !admin ? (
            <div className="border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center text-sm text-slate-500">
              Chưa tìm thấy thông tin admin đăng nhập
            </div>
          ) : (
            <div className="border-t border-slate-200 pt-6">
              <div className="grid items-start gap-10 md:grid-cols-[280px_minmax(0,1fr)]">
                <aside className="space-y-4">
                  <div className="overflow-hidden border border-slate-200 bg-slate-50">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={avatarPreview}
                      alt={admin.fullName}
                      onLoad={handleAvatarLoad}
                      onError={(event) => handleAvatarError(event, admin.fullName)}
                      className="h-[270px] w-full object-cover"
                    />
                  </div>

                  <label className="block cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="sr-only"
                      disabled={isUploadingAvatar}
                    />
                    <span className="flex items-center justify-center bg-teal-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-teal-600">
                      {isUploadingAvatar ? "Đang tải ảnh..." : "Tải ảnh lên"}
                    </span>
                  </label>

                  <div className="space-y-2 pt-2">
                    <h3 className="text-4xl font-semibold text-slate-700">{draft.fullName || "Admin"}</h3>
                    <p className="text-sm text-slate-500">{draft.email || "Chua co email"}</p>
                    <p className="text-sm text-slate-500">
                      {draft.address || "Chưa cập nhật địa chỉ"}
                    </p>
                  </div>
                </aside>

                <div className="border-t border-slate-200 pt-3 md:border-t-0 md:pt-0">
                  <div className="space-y-4">
                    <FormRow label="Tên Admin *">
                      <input
                        value={draft.fullName}
                        onChange={(event) => patchDraft("fullName", event.target.value)}
                        className="w-full border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-sky-300"
                      />
                    </FormRow>

                    <FormRow label="Mật khẩu mới">
                      <input
                        type="password"
                        value={draft.password}
                        onFocus={handlePasswordFocus}
                        onChange={handlePasswordChange}
                        onBlur={handlePasswordBlur}
                        className="w-full border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-sky-300"
                      />
                    </FormRow>

                    <FormRow label="Email">
                      <input
                        type="email"
                        value={draft.email}
                        onChange={(event) => patchDraft("email", event.target.value)}
                        className="w-full border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-sky-300"
                      />
                    </FormRow>

                    <FormRow label="Địa chỉ">
                      <input
                        value={draft.address}
                        onChange={(event) => patchDraft("address", event.target.value)}
                        className="w-full border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-sky-300"
                      />
                    </FormRow>
                  </div>

                  <div className="mt-8 border-t border-slate-200 pt-5">
                    <button
                      type="button"
                      onClick={() => void handleSave()}
                      disabled={isSaving || isUploadingAvatar}
                      className="bg-teal-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-teal-600 disabled:cursor-not-allowed disabled:bg-teal-300"
                    >
                      {isSaving ? "Đang cập nhật..." : "Cập nhật"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
