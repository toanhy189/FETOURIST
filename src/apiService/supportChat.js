import { readStoredSession } from "@/apiService/AxiosInstance/AxiosInstance";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

const getAuthHeaders = () => {
  const { accessToken } = readStoredSession();

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${accessToken}`,
  };
};

const parseResponse = async (response) => {
  const json = await response.json();

  if (!response.ok || !json.success) {
    throw new Error(json.message || "Có lỗi xảy ra khi gọi API chat.");
  }

  return json.data;
};

export const getMySupportConversation = async () => {
  const response = await fetch(`${API_URL}/api/support-chats/my-conversation`, {
    headers: getAuthHeaders(),
  });

  return parseResponse(response);
};

export const getSupportConversations = async () => {
  const response = await fetch(`${API_URL}/api/support-chats/conversations`, {
    headers: getAuthHeaders(),
  });

  return parseResponse(response);
};

export const getSupportMessages = async (conversationId) => {
  const response = await fetch(
    `${API_URL}/api/support-chats/conversations/${conversationId}/messages`,
    {
      headers: getAuthHeaders(),
    }
  );

  return parseResponse(response);
};

export const markSupportConversationRead = async (conversationId) => {
  const response = await fetch(
    `${API_URL}/api/support-chats/conversations/${conversationId}/read`,
    {
      method: "PATCH",
      headers: getAuthHeaders(),
    }
  );

  return parseResponse(response);
};

export const closeSupportConversation = async (conversationId) => {
  const response = await fetch(
    `${API_URL}/api/support-chats/conversations/${conversationId}/close`,
    {
      method: "PATCH",
      headers: getAuthHeaders(),
    }
  );

  return parseResponse(response);
};