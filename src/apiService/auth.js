"use client";

import {
  clearStoredSession,
  patchStoredUser,
  privateRequest,
  publicRequest,
  readStoredSession,
  saveStoredSession,
} from "@/apiService/AxiosInstance/AxiosInstance";
import { toAssetUrl } from "@/apiService/base";
import { disconnectSupportChatSocket } from "@/apiService/supportChatSocket";

function mapUser(user) {
  // Chuẩn hóa user object de FE dùng chung 1 shape o moi màn hình.
  if (!user) {
    return null;
  }

  return {
    id: user.id || user._id,
    fullName: user.fullName,
    email: user.email,
    phoneNumber: user.phoneNumber || "",
    avatarUrl: toAssetUrl(user.avatarUrl) || "",
    address: user.address || "",
    gender: user.gender || "other",
    birthDate: user.birthDate || null,
    role: user.role,
    isGoogleAccount: !!user.isGoogleAccount,
    isActive: user.isActive ?? true,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export async function login(payload) {
  // Login xong se luu luon accessToken/refreshToken/user vao localStorage.
  const response = await publicRequest("/api/auth/login", {
    method: "POST",
    data: payload,
  });

  const session = {
    accessToken: response.data.accessToken,
    refreshToken: response.data.refreshToken,
    user: mapUser(response.data.user),
  };

  saveStoredSession(session);
  return session;
}

export async function register(payload) {
  // Register trong app nay cung trả về session, nen FE đăng ký xong la đăng nhập luon.
  const response = await publicRequest("/api/auth/register", {
    method: "POST",
    data: payload,
  });

  const session = {
    accessToken: response.data.accessToken,
    refreshToken: response.data.refreshToken,
    user: mapUser(response.data.user),
  };

  saveStoredSession(session);
  return session;
}

export async function fetchMe() {
  // /me được gọi luc bootstrap app de đồng bộ user moi nhat tu backend.
  const response = await privateRequest("/api/auth/me");
  const user = mapUser(response.data.user);
  patchStoredUser(user);
  return user;
}

export async function logout() {
  // Du backend co loi hay khong, FE van xoa session local de tranh phien treo.
  try {
    await privateRequest("/api/auth/logout", {
      method: "POST",
    });
  } finally {
    clearStoredSession();
    disconnectSupportChatSocket();
  }
}

export async function getUsers(searchParams = {}) {
  // Admin dashboard va cac màn hình quản trị dùng route nay de liet ke user hệ thống.
  const response = await privateRequest("/api/auth/admin/users", {
    searchParams,
  });
  const rawUsers = Array.isArray(response.data)
    ? response.data
    : Array.isArray(response.data?.users)
      ? response.data.users
      : [];

  return rawUsers.map(mapUser);
}

export async function updateMyProfile(payload) {
  const response = await privateRequest("/api/auth/me", {
    method: "PATCH",
    data: payload,
  });

  const user = mapUser(response.data?.user);
  patchStoredUser(user);
  return user;
}

export async function uploadMyAvatar(file) {
  const formData = new FormData();
  formData.append("avatar", file);

  const response = await privateRequest("/api/auth/me/avatar", {
    method: "POST",
    data: formData,
  });

  const user = mapUser(response.data?.user);
  patchStoredUser(user);
  return user;
}

export async function createUserByAdmin(payload) {
  const response = await privateRequest("/api/auth/admin/users", {
    method: "POST",
    data: payload,
  });

  return mapUser(response.data?.user);
}

export async function updateUserByAdmin(userId, payload) {
  const response = await privateRequest(`/api/auth/admin/users/${userId}`, {
    method: "PATCH",
    data: payload,
  });

  const user = mapUser(response.data?.user);
  const currentUserId = readStoredSession().user?.id;

  if (user?.id && currentUserId && user.id === currentUserId) {
    patchStoredUser(user);
  }

  return user;
}

export async function deleteUserByAdmin(userId) {
  const response = await privateRequest(`/api/auth/admin/users/${userId}`, {
    method: "DELETE",
  });

  return response.data;
}
