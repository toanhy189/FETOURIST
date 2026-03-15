"use client";

import { privateRequest } from "@/apiService/AxiosInstance/AxiosInstance";

export async function getMyNotifications(searchParams = {}) {
  const response = await privateRequest("/api/notifications/me", {
    searchParams,
  });

  return {
    notifications: Array.isArray(response.data?.notifications) ? response.data.notifications : [],
    unreadCount: response.data?.unreadCount || 0,
    pagination: response.pagination ?? null,
  };
}

export async function getUnreadNotificationCount() {
  const response = await privateRequest("/api/notifications/me/unread-count");
  return response.data?.unreadCount || 0;
}

export async function markNotificationAsRead(notificationId) {
  const response = await privateRequest(`/api/notifications/${notificationId}/read`, {
    method: "PATCH",
  });

  return response.data;
}

export async function markAllNotificationsAsRead() {
  const response = await privateRequest("/api/notifications/me/read-all", {
    method: "PATCH",
  });

  return response.data;
}
