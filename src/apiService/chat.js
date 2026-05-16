"use client";

import {
  privateRequest,
  publicRequest,
  readStoredSession,
} from "@/apiService/AxiosInstance/AxiosInstance";

function buildChatHeaders(sessionId) {
  // Chat guest dung x-chat-session-id, user da đăng nhập gắn thêm token de BE gan dung profile.
  const headers = {};
  const session = readStoredSession();

  if (sessionId) {
    headers["x-chat-session-id"] = sessionId;
  }

  if (session.accessToken) {
    headers.Authorization = `Bearer ${session.accessToken}`;
  }

  return headers;
}

export async function createChatConversation(payload, sessionId) {
  // Tạo hội thoại rong truoc, sau do FE se gui message dau tien vao hội thoại nay.
  const response = await publicRequest("/api/chats/conversations", {
    method: "POST",
    data: {
      ...payload,
      customerSessionId: sessionId,
    },
    headers: buildChatHeaders(sessionId),
  });

  return response.data;
}

export async function getCustomerConversation(conversationId, sessionId, query = {}) {
  // Lấy lai lịch sử theo session hiện tại de guest khong doc được chat cua guest khac.
  const response = await publicRequest(`/api/chats/conversations/${conversationId}`, {
    method: "GET",
    searchParams: query,
    headers: buildChatHeaders(sessionId),
  });

  return response.data;
}

export async function getLatestCustomerConversation(sessionId, query = {}) {
  // User đã đăng nhập có thể đổi máy, nên FE hỏi BE để lấy hội thoại gần nhất đang lưu trong DB.
  const response = await privateRequest("/api/chats/me/latest", {
    method: "GET",
    searchParams: query,
    headers: buildChatHeaders(sessionId),
  });

  return response.data;
}

export async function sendCustomerChatMessage(conversationId, payload, sessionId) {
  // Gửi cau hoi cua khach; BE se luu customer message va sinh assistant message.
  const response = await publicRequest(
    `/api/chats/conversations/${conversationId}/messages`,
    {
      method: "POST",
      data: payload,
      headers: buildChatHeaders(sessionId),
    }
  );

  return response.data;
}
