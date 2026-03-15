import { privateRequest, publicRequest } from "@/apiService/AxiosInstance/AxiosInstance";
import { fetchApi, toAssetUrl } from "@/apiService/base";

const transportLabels = {
  bus: "Xe du lich",
  plane: "May bay",
  train: "Tau hoa",
  ship: "Tau thuyen",
  car: "Xe rieng",
  mixed: "Linh hoat",
};

function mapDeparture(departure) {
  if (!departure) {
    return null;
  }

  const sellingPrice =
    typeof departure.discountPrice === "number" ? departure.discountPrice : departure.price;

  return {
    id: departure._id,
    departureDate: departure.departureDate,
    returnDate: departure.returnDate,
    meetingPoint: departure.meetingPoint || "",
    status: departure.status,
    price: departure.price,
    discountPrice: departure.discountPrice ?? null,
    displayPrice: sellingPrice,
    remainingSeats: departure.remainingSeats ?? 0,
    seatCapacity: departure.seatCapacity ?? 0,
    seatsBooked: departure.seatsBooked ?? 0,
    note: departure.note || "",
  };
}

function buildTourSummary(tour) {
  if (tour.highlights?.length) {
    return tour.highlights.slice(0, 2).join(" - ");
  }

  return `Khoi hanh tu ${tour.departureLocation} den ${tour.destination}.`;
}

export function mapTour(tour) {
  const displayPrice =
    typeof tour.discountPrice === "number" ? tour.discountPrice : tour.price;

  return {
    id: tour._id,
    slug: tour.slug,
    title: tour.title,
    destination: tour.destination,
    departureLocation: tour.departureLocation,
    category: tour.category
      ? {
          id: tour.category._id,
          name: tour.category.name,
          slug: tour.category.slug,
          isActive: tour.category.isActive ?? true,
        }
      : null,
    createdBy: tour.createdBy
      ? {
          id: tour.createdBy._id,
          fullName: tour.createdBy.fullName,
          email: tour.createdBy.email,
          role: tour.createdBy.role,
        }
      : null,
    durationDays: tour.durationDays,
    durationNights: tour.durationNights,
    transport: tour.transport,
    transportLabel: transportLabels[tour.transport] || "Tour tron goi",
    price: tour.price,
    discountPrice: tour.discountPrice ?? null,
    displayPrice,
    maxGroupSize: tour.maxGroupSize,
    availableSeats: tour.availableSeats,
    status: tour.status,
    ratingAverage: Number(tour.ratingAverage || 0),
    ratingCount: Number(tour.ratingCount || 0),
    startDates: Array.isArray(tour.startDates) ? tour.startDates : [],
    firstStartDate: Array.isArray(tour.startDates) ? tour.startDates[0] : null,
    highlights: Array.isArray(tour.highlights) ? tour.highlights : [],
    itinerary: Array.isArray(tour.itinerary) ? tour.itinerary : [],
    includedServices: Array.isArray(tour.includedServices) ? tour.includedServices : [],
    excludedServices: Array.isArray(tour.excludedServices) ? tour.excludedServices : [],
    imageUrl: toAssetUrl(tour.images?.[0]),
    images: Array.isArray(tour.images) ? tour.images.map(toAssetUrl).filter(Boolean) : [],
    summary: buildTourSummary(tour),
    upcomingDepartures: Array.isArray(tour.upcomingDepartures)
      ? tour.upcomingDepartures.map(mapDeparture).filter(Boolean)
      : [],
    departures: Array.isArray(tour.departures)
      ? tour.departures.map(mapDeparture).filter(Boolean)
      : [],
  };
}

export async function getTours(searchParams = {}) {
  const response = await fetchApi("/api/tours", {
    searchParams,
    next: { revalidate: 60 },
  });

  return {
    tours: Array.isArray(response.data) ? response.data.map(mapTour) : [],
    pagination: response.pagination ?? null,
    message: response.message,
  };
}

export async function getTourDetail(idOrSlug) {
  const response = await fetchApi(`/api/tours/${idOrSlug}`, {
    next: { revalidate: 60 },
  });

  return mapTour(response.data);
}

export async function getTourDepartures(idOrSlug, searchParams = {}) {
  const response = await publicRequest(`/api/tours/${idOrSlug}/departures`, {
    searchParams,
  });

  return {
    departures: Array.isArray(response.data) ? response.data.map(mapDeparture).filter(Boolean) : [],
    pagination: response.pagination ?? null,
    message: response.message,
  };
}

export async function getToursForAdmin(searchParams = {}) {
  const response = await privateRequest("/api/tours/admin/all", {
    searchParams,
  });

  return {
    tours: Array.isArray(response.data) ? response.data.map(mapTour) : [],
    pagination: response.pagination ?? null,
    message: response.message,
  };
}

export async function getTourDetailForAdmin(idOrSlug) {
  const response = await privateRequest(`/api/tours/admin/${idOrSlug}`);
  return mapTour(response.data);
}

export async function createTour(payload) {
  const response = await privateRequest("/api/tours", {
    method: "POST",
    data: payload,
  });

  return mapTour(response.data);
}

export async function updateTour(tourId, payload) {
  const response = await privateRequest(`/api/tours/${tourId}`, {
    method: "PATCH",
    data: payload,
  });

  return mapTour(response.data);
}

export async function deleteTour(tourId) {
  const response = await privateRequest(`/api/tours/${tourId}`, {
    method: "DELETE",
  });

  return response.data;
}

export async function uploadTourImages(tourId, files) {
  const formData = new FormData();
  Array.from(files || []).forEach((file) => formData.append("images", file));

  const response = await privateRequest(`/api/tours/${tourId}/images`, {
    method: "POST",
    data: formData,
  });

  return response.data;
}

export async function getTourDeparturesForAdmin(tourId, searchParams = {}) {
  const response = await privateRequest(`/api/tours/${tourId}/departures/admin`, {
    searchParams,
  });

  return {
    departures: Array.isArray(response.data) ? response.data.map(mapDeparture).filter(Boolean) : [],
    pagination: response.pagination ?? null,
    message: response.message,
  };
}

export async function createTourDeparture(tourId, payload) {
  const response = await privateRequest(`/api/tours/${tourId}/departures`, {
    method: "POST",
    data: payload,
  });

  return mapDeparture(response.data);
}

export async function updateTourDeparture(tourId, departureId, payload) {
  const response = await privateRequest(`/api/tours/${tourId}/departures/${departureId}`, {
    method: "PATCH",
    data: payload,
  });

  return mapDeparture(response.data);
}

export async function deleteTourDeparture(tourId, departureId) {
  const response = await privateRequest(`/api/tours/${tourId}/departures/${departureId}`, {
    method: "DELETE",
  });

  return response.data;
}
