"use client";

import { privateRequest } from "@/apiService/AxiosInstance/AxiosInstance";
import { mapTour } from "@/apiService/tours";

function mapFavorite(favorite) {
  return {
    id: favorite._id,
    note: favorite.note || "",
    createdAt: favorite.createdAt,
    updatedAt: favorite.updatedAt,
    tour: favorite.tour ? mapTour(favorite.tour) : null,
  };
}

export async function getMyFavorites(searchParams = {}) {
  const response = await privateRequest("/api/favorites/me", {
    searchParams,
  });

  return {
    favorites: Array.isArray(response.data) ? response.data.map(mapFavorite) : [],
    pagination: response.pagination ?? null,
  };
}

export async function addFavorite(payload) {
  const response = await privateRequest("/api/favorites", {
    method: "POST",
    data: payload,
  });

  return mapFavorite(response.data);
}

export async function removeFavorite(tourIdOrSlug) {
  const response = await privateRequest(`/api/favorites/${tourIdOrSlug}`, {
    method: "DELETE",
  });

  return response.data;
}
