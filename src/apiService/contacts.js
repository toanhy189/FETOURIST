"use client";

import {
  privateRequest,
  publicRequest,
} from "@/apiService/AxiosInstance/AxiosInstance";

export async function createContactMessage(payload) {
  // Public form lien he tao ticket moi cho admin xu ly.
  const response = await publicRequest("/api/contacts", {
    method: "POST",
    data: payload,
  });

  return response.data;
}

export async function getContactsForAdmin(searchParams = {}) {
  // Admin inbox lay danh sach + summary de hien cot trai va badge "moi".
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
  // Chi tiet lien he gom noi dung goc, trang thai va lich su reply.
  const response = await privateRequest(`/api/contacts/admin/${contactId}`);
  return response.data;
}

export async function replyToContactForAdmin(contactId, payload) {
  // Gui email phan hoi cho khach va luu reply vao contact.
  const response = await privateRequest(`/api/contacts/admin/${contactId}/reply`, {
    method: "POST",
    data: payload,
  });

  return response.data;
}

export async function updateContactStatusForAdmin(contactId, payload) {
  // Doi trang thai inbox khi admin bat dau xu ly, da reply hoac dong ticket.
  const response = await privateRequest(`/api/contacts/admin/${contactId}/status`, {
    method: "PATCH",
    data: payload,
  });

  return response.data;
}
