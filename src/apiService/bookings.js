"use client";

import { privateRequest } from "@/apiService/AxiosInstance/AxiosInstance";

export async function calculateBookingPreview(payload) {
  // Preview giup FE tinh tien truoc khi tao booking that.
  const response = await privateRequest("/api/bookings/calculate", {
    method: "POST",
    data: payload,
  });

  return response.data;
}

export async function createBooking(payload) {
  // User booking route: can dang nhap va gui du departure + guests + contactInfo.
  const response = await privateRequest("/api/bookings", {
    method: "POST",
    data: payload,
  });

  return response.data;
}

export async function createBookingForAdmin(payload) {
  // Ban admin tao booking ho user khi chot don offline/tu van truc tiep.
  const response = await privateRequest("/api/bookings/admin", {
    method: "POST",
    data: payload,
  });

  return response.data;
}

export async function getMyBookings(searchParams = {}) {
  // Danh sach booking hien tai cua user dang dang nhap.
  const response = await privateRequest("/api/bookings/me", {
    searchParams,
  });

  return {
    bookings: Array.isArray(response.data) ? response.data : [],
    pagination: response.pagination ?? null,
  };
}

export async function getMyBookingHistory(searchParams = {}) {
  // History route tra them summary de lam dashboard tong quan.
  const response = await privateRequest("/api/bookings/me/history", {
    searchParams,
  });

  return {
    bookings: Array.isArray(response.data?.bookings) ? response.data.bookings : [],
    summary: response.data?.summary || null,
    pagination: response.pagination ?? null,
  };
}

export async function getMyBookingDetail(bookingIdOrCode) {
  // Detail cho user co the goi bang orderCode hoac bookingId.
  const response = await privateRequest(`/api/bookings/me/${bookingIdOrCode}`);
  return response.data;
}

export async function getBookingsForAdmin(searchParams = {}) {
  // Admin list la nguon du lieu cho panel van hanh booking.
  const response = await privateRequest("/api/bookings/admin/all", {
    searchParams,
  });

  return {
    bookings: Array.isArray(response.data?.bookings) ? response.data.bookings : [],
    summary: response.data?.summary || null,
    pagination: response.pagination ?? null,
  };
}

export async function getBookingDetailForAdmin(bookingIdOrCode) {
  // Admin detail tra ve nhieu du lieu hon, ke ca paymentTransactions.
  const response = await privateRequest(`/api/bookings/admin/${bookingIdOrCode}`);
  return response.data;
}

export async function updateBookingForAdmin(bookingIdOrCode, payload) {
  // Route nay sua thong tin booking, khong phai route doi bookingStatus.
  const response = await privateRequest(`/api/bookings/admin/${bookingIdOrCode}`, {
    method: "PATCH",
    data: payload,
  });

  return response.data;
}

export async function updateBookingStatusForAdmin(bookingIdOrCode, payload) {
  // Tach rieng route status de BE kiem soat nghiep vu huy/hoan tat booking.
  const response = await privateRequest(`/api/bookings/admin/${bookingIdOrCode}/status`, {
    method: "PATCH",
    data: payload,
  });

  return response.data;
}

export async function deleteBookingForAdmin(bookingIdOrCode) {
  // Xoa booking chi danh cho admin va con phu thuoc rang buoc ben backend.
  const response = await privateRequest(`/api/bookings/admin/${bookingIdOrCode}`, {
    method: "DELETE",
  });

  return response.data;
}
