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

function getFirstFiniteNumber(...values) {
  for (const value of values) {
    const parsedValue = toNumberOrNull(value);

    if (parsedValue !== null) {
      return parsedValue;
    }
  }

  return null;
}

function normalizeGuestPrices(source, fallbackAdultPrice = 0) {
  const nestedPrices =
    source?.guestPrices ||
    source?.guestPricing ||
    source?.prices ||
    source?.priceByGuestType ||
    {};
  const adultPrice =
    getFirstFiniteNumber(
      source?.adultPrice,
      source?.priceAdult,
      nestedPrices.adults,
      nestedPrices.adult,
      nestedPrices.adultPrice,
      fallbackAdultPrice
    ) ?? 0;
  const childPrice =
    getFirstFiniteNumber(
      source?.childPrice,
      source?.childrenPrice,
      source?.priceChild,
      source?.priceChildren,
      nestedPrices.children,
      nestedPrices.child,
      nestedPrices.childPrice,
      adultPrice
    ) ?? adultPrice;
  const infantPrice =
    getFirstFiniteNumber(
      source?.infantPrice,
      source?.infantsPrice,
      source?.priceInfant,
      source?.priceInfants,
      nestedPrices.infants,
      nestedPrices.infant,
      nestedPrices.infantPrice,
      adultPrice
    ) ?? adultPrice;

  return {
    adults: Math.max(adultPrice, 0),
    children: Math.max(childPrice, 0),
    infants: Math.max(infantPrice, 0),
  };
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

function cleanSearchParams(searchParams = {}) {
  return Object.fromEntries(
    Object.entries(searchParams).filter(([, value]) => value !== undefined && value !== null && value !== "")
  );
}

function mapDeparture(departure, fallbackGuestPrices = null) {
  // Gom lich khởi hành ve shape chung de card/detail/booking dung cung gia.
  if (!departure) return null;

  const normalizedDiscountPrice =
    typeof departure.discountPrice === "number" && departure.discountPrice > 0
      ? departure.discountPrice
      : null;
  const baseAdultPrice =
    getFirstFiniteNumber(departure.adultPrice, departure.price, fallbackGuestPrices?.adults) ?? 0;
  const sellingPrice =
    normalizedDiscountPrice !== null
      ? normalizedDiscountPrice
      : baseAdultPrice;
  const rawGuestPrices = normalizeGuestPrices(departure, sellingPrice);
  const guestPrices = {
    adults: sellingPrice,
    children:
      getFirstFiniteNumber(
        departure.childPrice,
        departure.childrenPrice,
        departure.guestPrices?.children,
        departure.guestPricing?.children,
        departure.prices?.children,
        fallbackGuestPrices?.children,
        rawGuestPrices.children
      ) ?? sellingPrice,
    infants:
      getFirstFiniteNumber(
        departure.infantPrice,
        departure.infantsPrice,
        departure.guestPrices?.infants,
        departure.guestPricing?.infants,
        departure.prices?.infants,
        fallbackGuestPrices?.infants,
        rawGuestPrices.infants
      ) ?? sellingPrice,
  };
  const remainingSeats = resolveDepartureRemainingSeats(departure) ?? 0;

  return {
    id: departure._id || departure.id,
    departureDate: departure.departureDate,
    returnDate: departure.returnDate,
    meetingPoint: departure.meetingPoint || "",
    status: departure.status,
    price: baseAdultPrice,
    discountPrice: normalizedDiscountPrice,
    displayPrice: sellingPrice,
    adultPrice: baseAdultPrice,
    childPrice: Math.max(Number(guestPrices.children || 0), 0),
    infantPrice: Math.max(Number(guestPrices.infants || 0), 0),
    guestPrices: {
      adults: Math.max(Number(guestPrices.adults || 0), 0),
      children: Math.max(Number(guestPrices.children || 0), 0),
      infants: Math.max(Number(guestPrices.infants || 0), 0),
    },
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
  // Anh trong lịch trình can được đổi thanh URL day du de Next Image render được.
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
  // Map document Tour tu BE sang object FE dùng thống nhất tren public va admin.
  if (!tour) return null;

  const normalizedDiscountPrice =
    typeof tour.discountPrice === "number" && tour.discountPrice > 0
      ? tour.discountPrice
      : null;
  const baseAdultPrice = getFirstFiniteNumber(tour.adultPrice, tour.price) ?? 0;
  const displayPrice =
    normalizedDiscountPrice !== null ? normalizedDiscountPrice : baseAdultPrice;
  const rawGuestPrices = normalizeGuestPrices(tour, displayPrice);
  const guestPrices = {
    adults: displayPrice,
    children: rawGuestPrices.children,
    infants: rawGuestPrices.infants,
  };

  const itinerary = normalizeItinerarySteps(tour.itinerary).map(mapItinerary);
  const hasUpcomingDeparturesPayload = Array.isArray(tour.upcomingDepartures);
  const upcomingDepartures = hasUpcomingDeparturesPayload
    ? tour.upcomingDepartures.map((departure) => mapDeparture(departure, guestPrices)).filter(Boolean)
    : [];
  const departures = Array.isArray(tour.departures)
    ? tour.departures.map((departure) => mapDeparture(departure, guestPrices)).filter(Boolean)
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
    price: baseAdultPrice,
    discountPrice: normalizedDiscountPrice,
    adultPrice: baseAdultPrice,
    childPrice: guestPrices.children,
    infantPrice: guestPrices.infants,
    guestPrices,
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
  const response = await fetchApi("/api/tours/search", {
    searchParams: cleanSearchParams(searchParams),
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

export async function deleteTourImage(tourId, imageUrl) {
  const response = await privateRequest(`/api/tours/${tourId}/images`, {
    method: "DELETE",
    data: { imageUrl },
  });
  const data = response.data || {};

  return {
    ...data,
    deletedImage: toAssetUrl(data.deletedImage),
    images: Array.isArray(data.images) ? data.images.map(toAssetUrl).filter(Boolean) : [],
  };
}

export async function getTourDeparturesForAdmin(tourId, searchParams = {}) {
  // Departure la lich khởi hành that cua tour, tach rieng voi template tour.
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
  const response = await fetchApi("/api/tours/featured", {
    searchParams: cleanSearchParams(searchParams),
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
