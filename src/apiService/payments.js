"use client";

import { privateRequest } from "@/apiService/AxiosInstance/AxiosInstance";

export async function createPaymentSession(payload) {
  const response = await privateRequest("/api/payments/checkout", {
    method: "POST",
    data: payload,
  });

  return response.data;
}

export async function simulateGatewayCallback(payload) {
  const response = await privateRequest("/api/payments/mock/callback", {
    method: "POST",
    data: payload,
  });

  return response.data;
}

export async function getMyPaymentHistory(searchParams = {}) {
  const response = await privateRequest("/api/payments/me", {
    searchParams,
  });

  return {
    transactions: Array.isArray(response.data?.transactions) ? response.data.transactions : [],
    summary: response.data?.summary || null,
    pagination: response.pagination ?? null,
  };
}

export async function getMyBookingPaymentDetail(bookingIdOrCode) {
  const response = await privateRequest(`/api/payments/me/booking/${bookingIdOrCode}`);
  return response.data;
}

export async function updatePaymentTransactionStatus(transactionId, payload) {
  const response = await privateRequest(`/api/payments/admin/transactions/${transactionId}/status`, {
    method: "PATCH",
    data: payload,
  });

  return response.data;
}

export async function confirmVNPayReturn(searchParams = {}) {
  const response = await privateRequest("/api/payments/vnpay/return", {
    searchParams,
  });

  return response.data;
}
