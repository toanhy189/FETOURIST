"use client";

import {
  privateRequest,
  publicRequest,
} from "@/apiService/AxiosInstance/AxiosInstance";

export async function createContactMessage(payload) {
  // Public form liên hệ tao ticket moi cho admin xử lý.
  const response = await publicRequest("/api/contacts", {
    method: "POST",
    data: payload,
  });

  return response.data;
}

export async function getContactsForAdmin(searchParams = {}) {
  // Admin inbox lay danh sách + summary de hiện cột trái va badge "moi".
  const response = await privateRequest("/api/contacts/admin/all", {
    searchParams,
  });

  return {
    contacts: Array.isArray(response.data?.contacts) ? response.data.contacts : [],
    summary: response.data?.summary || null,
    pagination: response.pagination ?? null,
  };
}

export async function getContactDetailForAdmin(contactId) {
  // Chi tiết liên hệ gom nội dung goc, trạng thái va lịch sử reply.
  const response = await privateRequest(`/api/contacts/admin/${contactId}`);
  return response.data;
}

export async function replyToContactForAdmin(contactId, payload) {
  // Gửi email phản hồi cho khach va luu reply vao contact.
  const response = await privateRequest(`/api/contacts/admin/${contactId}/reply`, {
    method: "POST",
    data: payload,
  });

  return response.data;
}

export async function updateContactStatusForAdmin(contactId, payload) {
  // Doi trạng thái inbox khi admin bat dau xử lý, da reply hoặc dong ticket.
  const response = await privateRequest(`/api/contacts/admin/${contactId}/status`, {
    method: "PATCH",
    data: payload,
  });

  return response.data;
}
