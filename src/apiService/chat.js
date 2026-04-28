"use client";

import {
  publicRequest,
  readStoredSession,
} from "@/apiService/AxiosInstance/AxiosInstance";

function buildChatHeaders(sessionId) {
  // Chat guest dung x-chat-session-id, user da dang nhap gan them token de BE gan dung profile.
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
  // Tao hoi thoai rong truoc, sau do FE se gui message dau tien vao hoi thoai nay.
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
  // Lay lai lich su theo session hien tai de guest khong doc duoc chat cua guest khac.
  const response = await publicRequest(`/api/chats/conversations/${conversationId}`, {
    method: "GET",
    searchParams: query,
    headers: buildChatHeaders(sessionId),
  });

  return response.data;
}

export async function sendCustomerChatMessage(conversationId, payload, sessionId) {
  // Gui cau hoi cua khach; BE se luu customer message va sinh assistant message.
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
