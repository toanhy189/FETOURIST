"use client";

import { useEffect, useState } from "react";
import { cn } from "@/utils/cn";
import { formatDateTimeVi, formatDateVi } from "@/utils/format";
import { updateMyProfile, uploadMyAvatar } from "@/apiService/auth";
import { useAppContext } from "@/components/providers/AppProvider";

function getInitials(name = "") {
  const words = String(name).trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "U";
  return words
    .slice(-2)
    .map((word) => word[0]?.toUpperCase())
    .join("");
}

function getGenderLabel(gender) {
  switch (gender) {
    case "male":
      return "Nam";
    case "female":
      return "Nữ";
    case "other":
      return "Khác";
    default:
      return "Chưa cập nhật";
  }
}

function formatDateForInput(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function FieldBlock({ label, children }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
        {label}
      </p>
      <div className="mt-3">{children}</div>
    </div>
  );
}

export default function AccountProfileTab({ currentUser }) {
  const { refreshProfile } = useAppContext();

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState({
    saveProfile: false,
    uploadAvatar: false,
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [profileForm, setProfileForm] = useState({
    fullName: "",
    phoneNumber: "",
    address: "",
    gender: "other",
    birthDate: "",
  });

  useEffect(() => {
    if (!currentUser) return;

    setProfileForm({
      fullName: currentUser.fullName || "",
      phoneNumber: currentUser.phoneNumber || "",
      address: currentUser.address || "",
      gender: currentUser.gender || "other",
      birthDate: formatDateForInput(currentUser.birthDate),
    });
  }, [currentUser]);

  useEffect(() => {
    if (!message) return;

    const timer = setTimeout(() => {
      setMessage("");
    }, 2500);

    return () => clearTimeout(timer);
  }, [message]);

  function patchLoading(key, value) {
    setLoading((current) => ({ ...current, [key]: value }));
  }

  function updateProfileField(field, value) {
    setProfileForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function handleStartEdit() {
    setMessage("");
    setError("");
    setIsEditing(true);
  }

  function handleCancelEdit() {
    setMessage("");
    setError("");
    setIsEditing(false);

    setProfileForm({
      fullName: currentUser?.fullName || "",
      phoneNumber: currentUser?.phoneNumber || "",
      address: currentUser?.address || "",
      gender: currentUser?.gender || "other",
      birthDate: formatDateForInput(currentUser?.birthDate),
    });
  }

  async function handleSaveProfile(event) {
    event.preventDefault();
    patchLoading("saveProfile", true);
    setMessage("");
    setError("");

    try {
      await updateMyProfile({
        fullName: profileForm.fullName,
        phoneNumber: profileForm.phoneNumber || undefined,
        address: profileForm.address || undefined,
        gender: profileForm.gender || "other",
        birthDate: profileForm.birthDate || null,
      });

      await refreshProfile();
      setIsEditing(false);
      setMessage("Cập nhật tài khoản thành công.");
    } catch (actionError) {
      setError(actionError.message || "Không cập nhật được tài khoản.");
    } finally {
      patchLoading("saveProfile", false);
    }
  }

  async function handleAvatarUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    patchLoading("uploadAvatar", true);
    setMessage("");
    setError("");

    try {
      await uploadMyAvatar(file);
      await refreshProfile();
      setMessage("Cập nhật ảnh đại diện thành công.");
    } catch (actionError) {
      setError(actionError.message || "Không tải được ảnh đại diện.");
    } finally {
      patchLoading("uploadAvatar", false);
      event.target.value = "";
    }
  }

  return (
    <div className="space-y-6">
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

      <div className="grid items-start gap-6 xl:grid-cols-[220px_minmax(0,1fr)]">
        <div className="self-start rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
          <div className="flex flex-col items-center text-center">
            <div className="group relative">
              {currentUser?.avatarUrl ? (
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser?.fullName || "Avatar"}
                  className="h-24 w-24 rounded-full object-cover shadow-sm"
                />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-sky-100 text-3xl font-bold text-sky-700 shadow-sm">
                  {getInitials(currentUser?.fullName)}
                </div>
              )}

              {isEditing ? (
                <label className="absolute inset-0 flex cursor-pointer items-center justify-center rounded-full bg-slate-900/55 text-xs font-semibold text-white opacity-0 transition group-hover:opacity-100">
                  {loading.uploadAvatar ? "Đang tải..." : "Đổi ảnh"}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarUpload}
                  />
                </label>
              ) : null}
            </div>

            <h3 className="mt-4 text-2xl font-bold leading-tight text-slate-900">
              {currentUser?.fullName || "Chưa cập nhật"}
            </h3>

            <span
              className={cn(
                "mt-4 inline-flex rounded-full px-3 py-1 text-xs font-semibold",
                currentUser?.isActive
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-rose-100 text-rose-700"
              )}
            >
              {currentUser?.isActive ? "Đang hoạt động" : "Đã khóa"}
            </span>

          </div>
        </div>

        <form id="account-profile-form" onSubmit={handleSaveProfile} className="space-y-3">
          <FieldBlock label="Họ và tên">
            {isEditing ? (
              <input
                type="text"
                value={profileForm.fullName}
                onChange={(event) => updateProfileField("fullName", event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-lg font-semibold text-slate-900 outline-none transition focus:border-sky-300 focus:bg-white"
                required
              />
            ) : (
              <p className="text-lg font-semibold text-slate-900">
                {currentUser?.fullName || "Chưa cập nhật"}
              </p>
            )}
          </FieldBlock>

          <FieldBlock label="Email">
            <p className="break-all text-lg font-semibold text-slate-900">
              {currentUser?.email || "Chưa cập nhật"}
            </p>
          </FieldBlock>

          <FieldBlock label="Số điện thoại">
            {isEditing ? (
              <input
                type="text"
                value={profileForm.phoneNumber}
                onChange={(event) => updateProfileField("phoneNumber", event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-lg font-semibold text-slate-900 outline-none transition focus:border-sky-300 focus:bg-white"
                placeholder="Nhập số điện thoại"
              />
            ) : (
              <p className="text-lg font-semibold text-slate-900">
                {currentUser?.phoneNumber || "Chưa cập nhật"}
              </p>
            )}
          </FieldBlock>

          <FieldBlock label="Giới tính">
            {isEditing ? (
              <select
                value={profileForm.gender}
                onChange={(event) => updateProfileField("gender", event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-lg font-semibold text-slate-900 outline-none transition focus:border-sky-300 focus:bg-white"
              >
                <option value="male">Nam</option>
                <option value="female">Nữ</option>
                <option value="other">Khác</option>
              </select>
            ) : (
              <p className="text-lg font-semibold text-slate-900">
                {getGenderLabel(currentUser?.gender)}
              </p>
            )}
          </FieldBlock>

          <FieldBlock label="Ngày sinh">
            {isEditing ? (
              <input
                type="date"
                value={profileForm.birthDate}
                onChange={(event) => updateProfileField("birthDate", event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-lg font-semibold text-slate-900 outline-none transition focus:border-sky-300 focus:bg-white"
              />
            ) : (
              <p className="text-lg font-semibold text-slate-900">
                {currentUser?.birthDate
                  ? formatDateVi(currentUser.birthDate)
                  : "Chưa cập nhật"}
              </p>
            )}
          </FieldBlock>

          <FieldBlock label="Địa chỉ">
            {isEditing ? (
              <textarea
                value={profileForm.address}
                onChange={(event) => updateProfileField("address", event.target.value)}
                rows={4}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-lg font-semibold text-slate-900 outline-none transition focus:border-sky-300 focus:bg-white"
                placeholder="Nhập địa chỉ của bạn"
              />
            ) : (
              <p className="text-lg font-semibold text-slate-900">
                {currentUser?.address || "Chưa cập nhật"}
              </p>
            )}
          </FieldBlock>

          <FieldBlock label="Ngày tạo tài khoản">
            <p className="text-lg font-semibold text-slate-900">
              {currentUser?.createdAt
                ? formatDateTimeVi(currentUser.createdAt)
                : "Không rõ"}
            </p>
          </FieldBlock>
          <div className="flex justify-end gap-3 pt-2">
            {isEditing ? (
              <>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  Huỷ
                </button>

                <button
                  type="submit"
                  disabled={loading.saveProfile}
                  className="rounded-full bg-sky-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-800 disabled:bg-slate-300"
                >
                  {loading.saveProfile ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleStartEdit}
                className="rounded-full border border-sky-200 bg-sky-50 px-5 py-2.5 text-sm font-semibold text-sky-800 transition hover:bg-sky-100"
              >
                Cập nhật
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}