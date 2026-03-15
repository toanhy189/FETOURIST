"use client";

import { privateRequest, publicRequest } from "@/apiService/AxiosInstance/AxiosInstance";

export async function getTourComments(tourIdOrSlug, searchParams = {}) {
  const response = await publicRequest(`/api/comments/tour/${tourIdOrSlug}`, {
    searchParams,
  });

  return {
    tour: response.data?.tour || null,
    summary: response.data?.summary || null,
    comments: Array.isArray(response.data?.comments) ? response.data.comments : [],
    pagination: response.pagination ?? null,
  };
}

export async function createComment(tourIdOrSlug, payload) {
  const response = await privateRequest(`/api/comments/tour/${tourIdOrSlug}`, {
    method: "POST",
    data: payload,
  });

  return response.data;
}

export async function updateComment(commentId, payload) {
  const response = await privateRequest(`/api/comments/${commentId}`, {
    method: "PATCH",
    data: payload,
  });

  return response.data;
}

export async function deleteComment(commentId) {
  const response = await privateRequest(`/api/comments/${commentId}`, {
    method: "DELETE",
  });

  return response.data;
}
