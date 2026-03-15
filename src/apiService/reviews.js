"use client";

import { privateRequest, publicRequest } from "@/apiService/AxiosInstance/AxiosInstance";

export async function getTourReviews(tourIdOrSlug, searchParams = {}) {
  const response = await publicRequest(`/api/reviews/tour/${tourIdOrSlug}`, {
    searchParams,
  });

  return {
    tour: response.data?.tour || null,
    reviews: Array.isArray(response.data?.reviews) ? response.data.reviews : [],
    pagination: response.pagination ?? null,
  };
}

export async function upsertMyReview(tourIdOrSlug, payload) {
  const response = await privateRequest(`/api/reviews/tour/${tourIdOrSlug}/me`, {
    method: "POST",
    data: payload,
  });

  return response.data;
}

export async function deleteMyReview(tourIdOrSlug) {
  const response = await privateRequest(`/api/reviews/tour/${tourIdOrSlug}/me`, {
    method: "DELETE",
  });

  return response.data;
}
