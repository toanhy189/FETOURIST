"use client";

import { useCallback, useEffect, useState } from "react";
import { getUsers } from "@/apiService/auth";

function getInitials(fullName) {
  return String(fullName || "Admin")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
}

function createDraft(admin) {
  return {
    fullName: admin?.fullName || "",
    email: admin?.email || "",
    address: admin?.address || "",
    avatarUrl: admin?.avatarUrl || "",
    previewUrl: admin?.avatarUrl || "",
    passwordMask: "betourist-admin",
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

function FormRow({ label, children }) {
  return (
    <div className="grid gap-2 md:grid-cols-[140px_minmax(0,1fr)] md:items-center">
      <label className="text-sm font-medium text-slate-500">{label}</label>
      {children}
    </div>
  );
}

export default function AdminManagersPanel({ currentUser }) {
  const [users, setUsers] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const loadAdmins = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const allUsers = await getUsers();
      const adminUsers = allUsers.filter((user) => user.role === "admin");

      setUsers(adminUsers);
      setDrafts(
        Object.fromEntries(adminUsers.map((admin) => [admin.id, createDraft(admin)]))
      );
    } catch (loadError) {
      setError(loadError.message || "Không tải được danh sách admin.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAdmins();
  }, [loadAdmins]);

  const selectedAdmin =
    users.find((admin) => admin.id === currentUser?.id) ||
    users[0] ||
    null;
  const activeDraft = selectedAdmin ? drafts[selectedAdmin.id] || createDraft(selectedAdmin) : null;
  const avatarPreview =
    activeDraft?.previewUrl || activeDraft?.avatarUrl || buildFallbackAvatar(selectedAdmin?.fullName);

  function patchDraft(field, value) {
    if (!selectedAdmin) {
      return;
    }

    setDrafts((currentDrafts) => ({
      ...currentDrafts,
      [selectedAdmin.id]: {
        ...(currentDrafts[selectedAdmin.id] || createDraft(selectedAdmin)),
        [field]: value,
      },
    }));
  }

  function handleAvatarUpload(event) {
    const file = event.target.files?.[0];
    if (!file || !selectedAdmin) {
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    patchDraft("previewUrl", objectUrl);
    setMessage("Ảnh đại diện đã được cập nhật ở chế độ xem trước.");
  }

  function handleSave() {
    if (!selectedAdmin || !activeDraft) {
      return;
    }

    setUsers((currentUsers) =>
      currentUsers.map((admin) =>
        admin.id === selectedAdmin.id
          ? {
            ...admin,
            fullName: activeDraft.fullName,
            email: activeDraft.email,
            address: activeDraft.address,
            avatarUrl: activeDraft.previewUrl || activeDraft.avatarUrl,
          }
          : admin
      )
    );

    setMessage(
      "Giao diện admin đã cập nhật trên frontend. Nếu cần lưu thật vào hệ thống, mình sẽ nối thêm API cập nhật admin."
    );
    setError("");
  }

  return (
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
        {loading ? (
          <div className="border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center text-sm text-slate-500">
            Đang tải thông tin admin...
          </div>
        ) : !selectedAdmin || !activeDraft ? (
          <div className="border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center text-sm text-slate-500">
            Chưa có admin nào phù hợp để hiển thị.
          </div>
        ) : (
          <div className="border-t border-slate-200 pt-6">
            <div className="grid items-start gap-10 md:grid-cols-[280px_minmax(0,1fr)]">
              <aside className="space-y-4">
                <div className="overflow-hidden border border-slate-200 bg-slate-50">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={avatarPreview}
                    alt={selectedAdmin.fullName}
                    className="h-[270px] w-full object-cover"
                  />
                </div>

                <label className="block cursor-pointer">
                  <input type="file" accept="image/*" onChange={handleAvatarUpload} className="sr-only" />
                  <span className="flex items-center justify-center bg-teal-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-teal-600">
                    Tải ảnh lên
                  </span>
                </label>

                <div className="space-y-2 pt-2">
                  <h3 className="text-4xl font-semibold text-slate-700">{activeDraft.fullName || "Admin"}</h3>
                  <p className="text-sm text-slate-500">{activeDraft.email || "Chưa có email"}</p>
                  <p className="text-sm text-slate-500">
                    {activeDraft.address || "Chưa cập nhật địa chỉ"}
                  </p>
                </div>
              </aside>

              <div className="border-t border-slate-200 pt-3 md:border-t-0 md:pt-0">
                <div className="space-y-4">
                  <FormRow label="Tên admin *">
                    <input
                      value={activeDraft.fullName}
                      onChange={(event) => patchDraft("fullName", event.target.value)}
                      className="w-full border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-sky-300"
                    />
                  </FormRow>

                  <FormRow label="Mật khẩu *">
                    <input
                      type="password"
                      value={activeDraft.passwordMask}
                      onChange={(event) => patchDraft("passwordMask", event.target.value)}
                      className="w-full border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-sky-300"
                    />
                  </FormRow>

                  <FormRow label="Email">
                    <input
                      type="email"
                      value={activeDraft.email}
                      onChange={(event) => patchDraft("email", event.target.value)}
                      className="w-full border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-sky-300"
                    />
                  </FormRow>

                  <FormRow label="Địa chỉ">
                    <input
                      value={activeDraft.address}
                      onChange={(event) => patchDraft("address", event.target.value)}
                      className="w-full border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-sky-300"
                    />
                  </FormRow>
                </div>

                <div className="mt-8 border-t border-slate-200 pt-5">
                  <button
                    type="button"
                    onClick={handleSave}
                    className="bg-teal-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-teal-600"
                  >
                    Cập nhật
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
