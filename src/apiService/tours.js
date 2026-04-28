import { privateRequest, publicRequest } from "@/apiService/AxiosInstance/AxiosInstance";
import { fetchApi, toAssetUrl } from "@/apiService/base";
import { normalizeItinerarySteps } from "@/utils/tourItinerary";

const transportLabels = {
  bus: "Xe du lịch",
  plane: "Máy bay",
  train: "Tàu hỏa",
  ship: "Tàu thuyền",
  car: "Xe riêng",
  mixed: "Linh hoạt",
};

function toNumberOrNull(value) {
  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : null;
}

function resolveDepartureRemainingSeats(departure) {
  if (!departure) return null;

  const explicitRemainingSeats = toNumberOrNull(departure.remainingSeats);
  if (explicitRemainingSeats !== null) {
    return Math.max(explicitRemainingSeats, 0);
  }

  const seatCapacity = toNumberOrNull(departure.seatCapacity);
  const seatsBooked = toNumberOrNull(departure.seatsBooked);

  if (seatCapacity !== null && seatsBooked !== null) {
    return Math.max(seatCapacity - seatsBooked, 0);
  }

  return null;
}

function sumDeparturesRemainingSeats(departures) {
  if (!Array.isArray(departures)) return null;

  return departures.reduce(
    (total, departure) => total + (resolveDepartureRemainingSeats(departure) ?? 0),
    0
  );
}

function mapDeparture(departure) {
  // Gom lich khoi hanh ve shape chung de card/detail/booking dung cung gia.
  if (!departure) return null;

  const normalizedDiscountPrice =
    typeof departure.discountPrice === "number" && departure.discountPrice > 0
      ? departure.discountPrice
      : null;
  const sellingPrice =
    normalizedDiscountPrice !== null
      ? normalizedDiscountPrice
      : departure.price;
  const remainingSeats = resolveDepartureRemainingSeats(departure) ?? 0;

  return {
    id: departure._id,
    departureDate: departure.departureDate,
    returnDate: departure.returnDate,
    meetingPoint: departure.meetingPoint || "",
    status: departure.status,
    price: departure.price,
    discountPrice: normalizedDiscountPrice,
    displayPrice: sellingPrice,
    remainingSeats,
    seatCapacity: departure.seatCapacity ?? 0,
    seatsBooked: departure.seatsBooked ?? 0,
    note: departure.note || "",
  };
}

function buildTourSummary(tour) {
  // Tom tat ngan cho card tour khi backend khong gui summary rieng.
  if (tour.highlights?.length) {
    return tour.highlights.slice(0, 2).join(" - ");
  }
  return `Khởi hành từ ${tour.departureLocation || "nhiều nơi"} đến ${tour.destination || "điểm đến"}.`;
}

function mapItinerary(step) {
  // Anh trong lich trinh can duoc doi thanh URL day du de Next Image render duoc.
  return {
    ...step,
    blocks: Array.isArray(step?.blocks)
      ? step.blocks.map((block) =>
          block?.type === "image"
            ? { ...block, url: toAssetUrl(block.url) }
            : block
        )
      : [],
  };
}

export function mapTour(tour) {
  // Map document Tour tu BE sang object FE dung thong nhat tren public va admin.
  if (!tour) return null;

  const normalizedDiscountPrice =
    typeof tour.discountPrice === "number" && tour.discountPrice > 0
      ? tour.discountPrice
      : null;
  const displayPrice =
    normalizedDiscountPrice !== null ? normalizedDiscountPrice : tour.price;

  const itinerary = normalizeItinerarySteps(tour.itinerary).map(mapItinerary);
  const hasUpcomingDeparturesPayload = Array.isArray(tour.upcomingDepartures);
  const upcomingDepartures = hasUpcomingDeparturesPayload
    ? tour.upcomingDepartures.map(mapDeparture).filter(Boolean)
    : [];
  const departures = Array.isArray(tour.departures)
    ? tour.departures.map(mapDeparture).filter(Boolean)
    : [];
  const firstUpcomingDeparture = upcomingDepartures[0] || null;
  const firstStartDate =
    firstUpcomingDeparture?.departureDate ||
    (!hasUpcomingDeparturesPayload && Array.isArray(tour.startDates)
      ? tour.startDates[0]
      : null);
  const totalRemainingSeats = toNumberOrNull(tour.totalRemainingSeats);
  const availableSeats =
    totalRemainingSeats ??
    (hasUpcomingDeparturesPayload
      ? sumDeparturesRemainingSeats(upcomingDepartures)
      : null) ??
    (hasUpcomingDeparturesPayload ? 0 : toNumberOrNull(tour.availableSeats)) ??
    0;

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
    transportLabel: transportLabels[tour.transport] || "Tour trọn gói",
    price: tour.price,
    discountPrice: normalizedDiscountPrice,
    singleRoomSupplement: tour.singleRoomSupplement ?? 0,
    displayPrice,
    maxGroupSize: tour.maxGroupSize,
    availableSeats,
    totalRemainingSeats: availableSeats,
    status: tour.status,
    ratingAverage: Number(tour.ratingAverage || 0),
    ratingCount: Number(tour.ratingCount || 0),
    startDates: Array.isArray(tour.startDates) ? tour.startDates : [],
    firstStartDate,
    highlights: Array.isArray(tour.highlights) ? tour.highlights : [],
    itinerary,
    includedServices: Array.isArray(tour.includedServices) ? tour.includedServices : [],
    excludedServices: Array.isArray(tour.excludedServices) ? tour.excludedServices : [],
    imageUrl: toAssetUrl(tour.images?.[0]),
    images: Array.isArray(tour.images) ? tour.images.map(toAssetUrl).filter(Boolean) : [],
    summary: buildTourSummary(tour),
    upcomingDepartures,
    departures,
  };
}

export async function getTours(searchParams = {}) {
  // Loại bỏ các trường rỗng/null để tránh gửi query "rác"
  const cleanParams = {};
  Object.keys(searchParams).forEach((key) => {
    if (searchParams[key] !== undefined && searchParams[key] !== null && searchParams[key] !== "") {
      cleanParams[key] = searchParams[key];
    }
  });

  const response = await fetchApi("/api/tours", {
    searchParams: cleanParams,
    next: { revalidate: 0 }, 
  });

  return {
    tours: Array.isArray(response.data) ? response.data.map(mapTour).filter(Boolean) : [],
    pagination: response.pagination ?? null,
    message: response.message,
  };
}

export async function getTourFilterOptions() {
  const response = await fetchApi("/api/tours/filter-options", {
    next: { revalidate: 300 },
  });

  return {
    destinations: Array.isArray(response.data?.destinations)
      ? response.data.destinations
      : [],
    departureLocations: Array.isArray(response.data?.departureLocations)
      ? response.data.departureLocations
      : [],
    durationDays: Array.isArray(response.data?.durationDays)
      ? response.data.durationDays
      : [],
  };
}

export async function getTourDetail(idOrSlug) {
  const response = await fetchApi(`/api/tours/${idOrSlug}`, {
    next: { revalidate: 0 },
  });

  return mapTour(response.data);
}

export async function getRelatedTours(idOrSlug, searchParams = {}) {
  const response = await fetchApi(`/api/tours/${idOrSlug}/related`, {
    searchParams,
    next: { revalidate: 60 },
  });

  return {
    tours: Array.isArray(response.data) ? response.data.map(mapTour).filter(Boolean) : [],
    message: response.message,
  };
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
  // Admin list can token va co the lay ca tour draft/closed.
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
  // Departure la lich khoi hanh that cua tour, tach rieng voi template tour.
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

export async function getFeaturedTours(searchParams = {}) {
  const cleanParams = {};

  Object.keys(searchParams).forEach((key) => {
    if (
      searchParams[key] !== undefined &&
      searchParams[key] !== null &&
      searchParams[key] !== ""
    ) {
      cleanParams[key] = searchParams[key];
    }
  });

  const response = await fetchApi("/api/tours/featured", {
    searchParams: cleanParams,
    next: { revalidate: 0 },
  });

  return {
    tours: Array.isArray(response.data)
      ? response.data.map(mapTour).filter(Boolean)
      : [],
    pagination: response.pagination ?? null,
    message: response.message,
  };
}
