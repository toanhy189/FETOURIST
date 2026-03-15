"use client";

import {
  clearStoredSession,
  patchStoredUser,
  privateRequest,
  publicRequest,
  saveStoredSession,
} from "@/apiService/AxiosInstance/AxiosInstance";

function mapUser(user) {
  // Chuan hoa user object de FE dung chung 1 shape o moi man hinh.
  if (!user) {
    return null;
  }

  return {
    id: user.id || user._id,
    fullName: user.fullName,
    email: user.email,
    phoneNumber: user.phoneNumber || "",
    avatarUrl: user.avatarUrl || "",
    role: user.role,
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
  // Register trong app nay cung tra ve session, nen FE dang ky xong la dang nhap luon.
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
  // /me duoc goi luc bootstrap app de dong bo user moi nhat tu backend.
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
  }
}

export async function getUsers() {
  // Admin dashboard dung route nay de liet ke user he thong.
  const response = await privateRequest("/api/auth/users");
  return Array.isArray(response.data) ? response.data.map(mapUser) : [];
}
