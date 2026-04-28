"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getCategoriesForAdmin } from "@/apiService/categories";
import {
  createTour,
  createTourDeparture,
  deleteTour,
  deleteTourDeparture,
  getTourDeparturesForAdmin,
  getTourDetailForAdmin,
  getToursForAdmin,
  updateTour,
  updateTourDeparture,
  uploadTourImages,
} from "@/apiService/tours";
import { cn } from "@/utils/cn";
import { formatDateVi, formatDuration, formatVnd } from "@/utils/format";
import {
  ITINERARY_BLOCK_TYPES,
  createEmptyItineraryBlock,
  extractPlainTextFromBlocks,
  normalizeItinerarySteps,
} from "@/utils/tourItinerary";

const FORM_STEPS = [
  { key: 1, label: "Bước 1", title: "Thông tin tour", description: "Nhập thông tin cơ bản" },
  { key: 2, label: "Bước 2", title: "Thêm hình ảnh", description: "Tải ảnh minh họa" },
  { key: 3, label: "Bước 3", title: "Lộ trình và dịch vụ", description: "Hoàn thiện nội dung" },
];

const TOUR_STATUS_OPTIONS = [
  { value: "draft", label: "Bản nháp" },
  { value: "published", label: "Đang bán" },
  { value: "closed", label: "Ngừng bán" },
];

const DEPARTURE_STATUS_OPTIONS = [
  { value: "scheduled", label: "Sắp khởi hành" },
  { value: "open", label: "Đang mở bán" },
  { value: "closed", label: "Đã đóng" },
  { value: "completed", label: "Đã xong" },
];

const TRANSPORT_OPTIONS = [
  { value: "mixed", label: "Linh hoạt" },
  { value: "bus", label: "Xe du lịch" },
  { value: "plane", label: "Máy bay" },
  { value: "train", label: "Tàu hỏa" },
  { value: "ship", label: "Tàu thuyền" },
  { value: "car", label: "Xe riêng" },
];

const PAGE_SIZE_OPTIONS = [10, 20, 30];
const PENDING_ITINERARY_IMAGE_PREFIX = "__pending_itinerary_image__:";
const TOUR_IMAGE_UPLOAD_MAX_FILES = 20;

const initialTourForm = {
  id: "",
  title: "",
  destination: "",
  departureLocation: "",
  category: "",
  durationDays: 1,
  durationNights: 0,
  transport: "mixed",
  price: 0,
  discountPrice: "",
  singleRoomSupplement: "",
  maxGroupSize: 10,
  availableSeats: 10,
  startDates: "",
  highlights: "",
  itinerary: "[]",
  includedServices: "",
  excludedServices: "",
  status: "draft",
  meetingPoint: "",
  departureNote: "",
};

const initialDepartureForm = {
  id: "",
  departureDate: "",
  returnDate: "",
  seatCapacity: "",
  price: "",
  discountPrice: "",
  meetingPoint: "",
  note: "",
  status: "scheduled",
};

function splitValues(value) {
  return String(value || "")
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeLooseText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function parsePositiveInteger(value) {
  const nextValue = Number(value);
  return Number.isInteger(nextValue) && nextValue > 0 ? nextValue : null;
}

function createTimelineStep(day) {
  return {
    day,
    title: "",
    blocks: [
      createEmptyItineraryBlock(ITINERARY_BLOCK_TYPES.paragraph),
      createEmptyItineraryBlock(ITINERARY_BLOCK_TYPES.image),
      createEmptyItineraryBlock(ITINERARY_BLOCK_TYPES.caption),
    ],
  };
}

// Mỗi timeline luôn giữ đủ 3 block cơ bản để UI nhập liệu nhất quán:
// đoạn văn, ảnh và caption.
function ensureTimelineBlocks(step) {
  const nextBlocks = Array.isArray(step?.blocks) ? step.blocks.map((block) => ({ ...block })) : [];
  const blockTypes = new Set(nextBlocks.map((block) => block?.type));

  if (!blockTypes.has(ITINERARY_BLOCK_TYPES.paragraph)) {
    nextBlocks.unshift(createEmptyItineraryBlock(ITINERARY_BLOCK_TYPES.paragraph));
  }

  if (!blockTypes.has(ITINERARY_BLOCK_TYPES.image)) {
    nextBlocks.push(createEmptyItineraryBlock(ITINERARY_BLOCK_TYPES.image));
  }

  if (!blockTypes.has(ITINERARY_BLOCK_TYPES.caption)) {
    nextBlocks.push(createEmptyItineraryBlock(ITINERARY_BLOCK_TYPES.caption));
  }

  return {
    ...step,
    blocks: nextBlocks,
  };
}

function syncItineraryWithDuration(itinerary, durationDays) {
  const normalized = normalizeItinerarySteps(itinerary);
  const targetCount = parsePositiveInteger(durationDays) || normalized.length || 1;

  return Array.from({ length: targetCount }, (_, index) => normalized[index] || createTimelineStep(index + 1)).map((step, index) =>
    ensureTimelineBlocks({
      ...step,
      day: index + 1,
    })
  );
}

function parseItineraryValue(value) {
  if (!String(value || "").trim()) {
    return [];
  }

  const parsed = JSON.parse(value);

  if (!Array.isArray(parsed)) {
    throw new Error("Itinerary must be an array.");
  }

  return normalizeItinerarySteps(parsed);
}

function stringifyItinerary(itinerary) {
  return JSON.stringify(normalizeItinerarySteps(itinerary), null, 2);
}

function buildItineraryPayload(itinerary) {
  const normalizedSteps = normalizeItinerarySteps(itinerary);
  const hasMultipleDays = normalizedSteps.length > 1;

  return normalizedSteps.map((step, index) => {
    const rawTitle = step.title.trim();
    const isGenericDayTitle = normalizeLooseText(rawTitle) === `ngay ${index + 1}`;
    const nextTitle = hasMultipleDays ? rawTitle || `Ngày ${index + 1}` : isGenericDayTitle ? "" : rawTitle;

    return {
      day: index + 1,
      title: nextTitle,
      description: extractPlainTextFromBlocks(step.blocks),
      blocks: step.blocks
        .map((block) => {
          if (block?.type === ITINERARY_BLOCK_TYPES.image) {
            const url = typeof block?.url === "string" ? block.url.trim() : "";

            if (!url) {
              return null;
            }

            return {
              type: ITINERARY_BLOCK_TYPES.image,
              url,
              alt: typeof block?.alt === "string" ? block.alt.trim() : "",
            };
          }

          const text = typeof block?.text === "string" ? block.text.trim() : "";

          if (!text) {
            return null;
          }

          return {
            type:
              block?.type === ITINERARY_BLOCK_TYPES.caption
                ? ITINERARY_BLOCK_TYPES.caption
                : ITINERARY_BLOCK_TYPES.paragraph,
            text,
          };
        })
        .filter(Boolean),
    };
  });
}

function isPendingItineraryImageUrl(value) {
  return String(value || "").startsWith(PENDING_ITINERARY_IMAGE_PREFIX);
}

function stripPendingItineraryImages(itinerary) {
  return itinerary.map((step) => ({
    ...step,
    blocks: step.blocks.filter(
      (block) => block.type !== ITINERARY_BLOCK_TYPES.image || !isPendingItineraryImageUrl(block.url)
    ),
  }));
}

function resolvePendingItineraryImages(itinerary, uploadedImageMap = {}) {
  return itinerary.map((step) => ({
    ...step,
    blocks: step.blocks
      .map((block) => {
        if (block.type !== ITINERARY_BLOCK_TYPES.image) {
          return block;
        }

        if (!isPendingItineraryImageUrl(block.url)) {
          return block;
        }

        const resolvedUrl = uploadedImageMap[block.url];

        if (!resolvedUrl) {
          return null;
        }

        return {
          ...block,
          url: resolvedUrl,
        };
      })
      .filter(Boolean),
  }));
}

function moveItineraryStep(steps, fromIndex, toIndex) {
  const normalized = [...steps];
  const [moved] = normalized.splice(fromIndex, 1);

  if (!moved) {
    return normalizeItinerarySteps(normalized);
  }

  normalized.splice(toIndex, 0, moved);
  return normalizeItinerarySteps(normalized);
}

function parseStartDateValues(value) {
  const parsed = String(value || "")
    .split(/\n|,/)
    .map((item) => item.trim().slice(0, 10))
    .filter(Boolean);

  return parsed.length ? parsed : [""];
}

function stringifyStartDateValues(values) {
  return (Array.isArray(values) ? values : [])
    .map((item) => String(item || "").trim().slice(0, 10))
    .filter(Boolean)
    .join("\n");
}

function createPendingItineraryImageToken(file, index) {
  return `${PENDING_ITINERARY_IMAGE_PREFIX}${file.name}-${file.size}-${file.lastModified}-${index}`;
}

function normalizeKeyword(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function getStatusPresentation(status) {
  const label =
    TOUR_STATUS_OPTIONS.find((item) => item.value === status)?.label ||
    DEPARTURE_STATUS_OPTIONS.find((item) => item.value === status)?.label ||
    status ||
    "Đang cập nhật";

  if (status === "published" || status === "open" || status === "scheduled") {
    return { label, className: "border border-emerald-200 bg-emerald-50 text-emerald-700" };
  }

  if (status === "closed" || status === "completed") {
    return { label, className: "border border-amber-200 bg-amber-50 text-amber-700" };
  }

  return { label, className: "border border-slate-200 bg-slate-100 text-slate-600" };
}

function getDiscountPercent(price, discountPrice) {
  if (!Number.isFinite(price) || !Number.isFinite(discountPrice) || price <= 0 || discountPrice >= price) {
    return 0;
  }

  return Math.round(((price - discountPrice) / price) * 100);
}

function mapTourToForm(detail) {
  return {
    id: detail.id,
    title: detail.title || "",
    destination: detail.destination || "",
    departureLocation: detail.departureLocation || "",
    category: detail.category?.id || "",
    durationDays: detail.durationDays ?? 1,
    durationNights: detail.durationNights ?? 0,
    transport: detail.transport || "mixed",
    price: detail.price ?? 0,
    discountPrice: detail.discountPrice ?? "",
    singleRoomSupplement: detail.singleRoomSupplement ?? "",
    maxGroupSize: detail.maxGroupSize ?? 10,
    availableSeats: detail.availableSeats ?? 10,
    startDates: Array.isArray(detail.startDates)
      ? detail.startDates.map((date) => String(date || "").slice(0, 10)).filter(Boolean).join("\n")
      : "",
    highlights: Array.isArray(detail.highlights) ? detail.highlights.join("\n") : "",
    itinerary: stringifyItinerary(detail.itinerary),
    includedServices: Array.isArray(detail.includedServices) ? detail.includedServices.join("\n") : "",
    excludedServices: Array.isArray(detail.excludedServices) ? detail.excludedServices.join("\n") : "",
    status: detail.status || "draft",
    meetingPoint: detail.upcomingDepartures?.[0]?.meetingPoint || "",
    departureNote: detail.upcomingDepartures?.[0]?.note || "",
  };
}

function SearchIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true" {...props}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M16 16 21 21" strokeLinecap="round" />
    </svg>
  );
}

function FilterIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true" {...props}>
      <path d="M4 6h16l-6.5 7.4V19l-3 1v-6.6L4 6Z" strokeLinejoin="round" />
    </svg>
  );
}

function PlusIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" {...props}>
      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
    </svg>
  );
}

function EditIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true" {...props}>
      <path
        d="m4 15.5 9.9-9.9a2.1 2.1 0 0 1 3 0l1.5 1.5a2.1 2.1 0 0 1 0 3L8.5 20H4v-4.5Z"
        strokeLinejoin="round"
      />
      <path d="m13.5 6 4.5 4.5" strokeLinecap="round" />
    </svg>
  );
}

function TrashIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true" {...props}>
      <path d="M4 7h16M9 7V5.8c0-.66.54-1.2 1.2-1.2h3.6c.66 0 1.2.54 1.2 1.2V7" strokeLinecap="round" />
      <path d="M7.5 7.5v10.2c0 .94.76 1.7 1.7 1.7h5.6c.94 0 1.7-.76 1.7-1.7V7.5" strokeLinecap="round" />
      <path d="M10 11v5M14 11v5" strokeLinecap="round" />
    </svg>
  );
}

function ImageIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true" {...props}>
      <rect x="3.5" y="4.5" width="17" height="15" rx="2.5" />
      <path d="m7 15 3-3 2.8 2.8 2.4-2.4L19 16" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="9" cy="9" r="1.4" />
    </svg>
  );
}

function Field({ label, hint = "", required = false, children }) {
  return (
    <label className="block space-y-2">
      {label || required ? (
        <span className="text-sm font-medium text-slate-700">
          {label}
          {required ? <span className="text-rose-500"> *</span> : null}
        </span>
      ) : null}
      {children}
      {hint ? <span className="block text-xs text-slate-400">{hint}</span> : null}
    </label>
  );
}

export default function ToursPanel({ initialView = "form" }) {
  const tourFormRef = useRef(null);
  const [categories, setCategories] = useState([]);
  const [tours, setTours] = useState([]);
  const [selectedTour, setSelectedTour] = useState(null);
  const [departures, setDepartures] = useState([]);
  const [tourForm, setTourForm] = useState(initialTourForm);
  const [departureForm, setDepartureForm] = useState(initialDepartureForm);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [pendingImageOptions, setPendingImageOptions] = useState([]);
  const [activeView, setActiveView] = useState(initialView === "list" ? "list" : "form");
  const [currentStep, setCurrentStep] = useState(1);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [transportFilter, setTransportFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0]);
  const [loading, setLoading] = useState(false);
  const [submittingTour, setSubmittingTour] = useState(false);
  const [submittingDeparture, setSubmittingDeparture] = useState(false);
  const [busyTourId, setBusyTourId] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  // Start dates dùng mảng riêng để người dùng thêm/xóa từng input ngày dễ hơn
  // trước khi serialize lại về payload tour.
  const [startDateItems, setStartDateItems] = useState(() => parseStartDateValues(initialTourForm.startDates));
  // Timeline editor thao tác trên state cấu trúc, sau đó đồng bộ lại field itinerary của form.
  const [itinerarySteps, setItinerarySteps] = useState(() =>
    syncItineraryWithDuration(parseItineraryValue(initialTourForm.itinerary), initialTourForm.durationDays)
  );

  const loadBootstrap = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [categoryResult, tourResult] = await Promise.all([
        getCategoriesForAdmin({ limit: 50 }),
        getToursForAdmin({ limit: 50, sortBy: "createdAt", sortOrder: "desc" }),
      ]);

      setCategories(categoryResult.categories);
      setTours(tourResult.tours);
    } catch (loadError) {
      setError(loadError.message || "Không tải được dữ liệu tour.");
    } finally {
      setLoading(false);
    }
  }, []);

  const openTourEditor = useCallback(async (tourIdOrSlug) => {
    setError("");
    setMessage("");
    setBusyTourId(String(tourIdOrSlug));

    try {
      const detail = await getTourDetailForAdmin(tourIdOrSlug);
      const departureResult = await getTourDeparturesForAdmin(detail.id, { limit: 30 });
      setSelectedTour(detail);
      setDepartures(departureResult.departures);
      setTourForm(mapTourToForm(detail));
      setDepartureForm(initialDepartureForm);
      setSelectedFiles([]);
      setCurrentStep(1);
      setActiveView("form");
    } catch (actionError) {
      setError(actionError.message || "Không tải được chi tiết tour.");
    } finally {
      setBusyTourId("");
    }
  }, []);

  function resetTourBuilder() {
    setSelectedTour(null);
    setDepartures([]);
    setTourForm(initialTourForm);
    setDepartureForm(initialDepartureForm);
    setSelectedFiles([]);
    setCurrentStep(1);
  }

  function patchTourForm(field, value) {
    setTourForm((current) => ({ ...current, [field]: value }));
  }

  function patchDepartureForm(field, value) {
    setDepartureForm((current) => ({ ...current, [field]: value }));
  }

  function resetDepartureEditor() {
    setDepartureForm(initialDepartureForm);
  }

  function openCreateTourView() {
    setError("");
    setMessage("");
    resetTourBuilder();
    setActiveView("form");
  }

  function syncStartDates(nextItems) {
    const normalized = Array.isArray(nextItems) && nextItems.length > 0 ? nextItems : [""];
    setStartDateItems(normalized);
    patchTourForm("startDates", stringifyStartDateValues(normalized));
  }

  function syncItinerary(nextSteps) {
    const normalized = syncItineraryWithDuration(nextSteps, Array.isArray(nextSteps) ? nextSteps.length : 0);

    setItinerarySteps(normalized);
    setTourForm((current) => ({
      ...current,
      durationDays: normalized.length,
      itinerary: stringifyItinerary(normalized),
    }));
  }

  function handleDurationDaysChange(event) {
    const nextValue = event.target.value;

    if (nextValue === "") {
      patchTourForm("durationDays", nextValue);
      return;
    }

    const nextCount = parsePositiveInteger(nextValue);

    if (!nextCount) {
      patchTourForm("durationDays", nextValue);
      return;
    }

    const normalized = syncItineraryWithDuration(itinerarySteps, nextCount);
    setItinerarySteps(normalized);
    setTourForm((current) => ({
      ...current,
      durationDays: nextCount,
      itinerary: stringifyItinerary(normalized),
    }));
  }

  function handleStartDateChange(index, value) {
    const nextItems = [...startDateItems];
    nextItems[index] = value;
    syncStartDates(nextItems);
  }

  function handleAddStartDate() {
    syncStartDates([...startDateItems, ""]);
  }

  function handleRemoveStartDate(index) {
    syncStartDates(startDateItems.filter((_, itemIndex) => itemIndex !== index));
  }

  function handleItineraryStepChange(stepIndex, field, value) {
    const nextSteps = itinerarySteps.map((step, index) => (index === stepIndex ? { ...step, [field]: value } : step));

    syncItinerary(nextSteps);
  }

  function handleAddItineraryBlock(stepIndex, type) {
    const nextSteps = itinerarySteps.map((step, index) =>
      index === stepIndex ? { ...step, blocks: [...step.blocks, createEmptyItineraryBlock(type)] } : step
    );

    syncItinerary(nextSteps);
  }

  function handleItineraryBlockChange(stepIndex, blockIndex, field, value) {
    const nextSteps = itinerarySteps.map((step, index) => {
      if (index !== stepIndex) {
        return step;
      }

      const nextBlocks = step.blocks.map((block, currentIndex) =>
        currentIndex === blockIndex ? { ...block, [field]: value } : block
      );

      return { ...step, blocks: nextBlocks };
    });

    syncItinerary(nextSteps);
  }

  function handleSelectItineraryBlockImage(stepIndex, blockIndex, url, alt = "") {
    const nextSteps = itinerarySteps.map((step, index) => {
      if (index !== stepIndex) {
        return step;
      }

      const nextBlocks = step.blocks.map((block, currentIndex) => {
        if (currentIndex !== blockIndex) {
          return block;
        }

        return {
          ...block,
          url,
          alt: block.alt || alt || block.alt,
        };
      });

      return { ...step, blocks: nextBlocks };
    });

    syncItinerary(nextSteps);
  }

  function handleClearItineraryBlockImage(stepIndex, blockIndex) {
    handleItineraryBlockChange(stepIndex, blockIndex, "url", "");
  }

  function appendSelectedFiles(fileList) {
    const nextFiles = Array.from(fileList || []).filter(Boolean);

    if (nextFiles.length === 0) {
      return [];
    }

    if (selectedFiles.length + nextFiles.length > TOUR_IMAGE_UPLOAD_MAX_FILES) {
      setError(`Chỉ có thể tải tối đa ${TOUR_IMAGE_UPLOAD_MAX_FILES} ảnh trong một lần lưu tour.`);
      return [];
    }

    setError("");

    const baseIndex = selectedFiles.length;
    const nextPendingItems = nextFiles.map((file, index) => ({
      token: createPendingItineraryImageToken(file, baseIndex + index),
      name: file.name,
    }));

    setSelectedFiles((current) => [...current, ...nextFiles]);

    return nextPendingItems;
  }

  function handleSelectedFilesChange(event) {
    appendSelectedFiles(event.target.files);
    event.target.value = "";
  }

  function handleItineraryBlockFileChange(stepIndex, blockIndex, event) {
    const [nextImage] = appendSelectedFiles(event.target.files);

    if (nextImage) {
      handleSelectItineraryBlockImage(stepIndex, blockIndex, nextImage.token, nextImage.name.replace(/\.[^.]+$/, ""));
    }

    event.target.value = "";
  }

  function getItineraryImagePreviewUrl(url) {
    if (!isPendingItineraryImageUrl(url)) {
      return url;
    }

    return pendingImageOptions.find((item) => item.token === url)?.previewUrl || "";
  }

  function handleDeleteItineraryBlock(stepIndex, blockIndex) {
    const activeStep = itinerarySteps[stepIndex];

    if (!activeStep) {
      return;
    }

    const nextBlocks = activeStep.blocks.filter((_, currentIndex) => currentIndex !== blockIndex);

    const nextSteps = itinerarySteps.map((step, index) => (index === stepIndex ? { ...step, blocks: nextBlocks } : step));

    syncItinerary(nextSteps);
  }

  function handleMoveItineraryBlock(stepIndex, blockIndex, direction) {
    const activeStep = itinerarySteps[stepIndex];

    if (!activeStep) {
      return;
    }

    const targetIndex = direction === "up" ? blockIndex - 1 : blockIndex + 1;

    if (targetIndex < 0 || targetIndex >= activeStep.blocks.length) {
      return;
    }

    const nextBlocks = [...activeStep.blocks];
    const [movedBlock] = nextBlocks.splice(blockIndex, 1);
    nextBlocks.splice(targetIndex, 0, movedBlock);

    const nextSteps = itinerarySteps.map((step, index) => (index === stepIndex ? { ...step, blocks: nextBlocks } : step));

    syncItinerary(nextSteps);
  }

  function handleAddItineraryStep() {
    syncItinerary([...itinerarySteps, createTimelineStep(itinerarySteps.length + 1)]);
  }

  function handleDeleteItineraryStep(index) {
    if (itinerarySteps.length <= 1) {
      return;
    }

    const nextSteps = itinerarySteps.filter((_, itemIndex) => itemIndex !== index);
    syncItinerary(nextSteps);
  }

  function handleMoveItineraryStep(index, direction) {
    const targetIndex = direction === "up" ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= itinerarySteps.length) {
      return;
    }

    syncItinerary(moveItineraryStep(itinerarySteps, index, targetIndex));
  }

  function populateDepartureForm(departure) {
    setDepartureForm({
      id: departure.id,
      departureDate: departure.departureDate?.slice(0, 10) || "",
      returnDate: departure.returnDate?.slice(0, 10) || "",
      seatCapacity: departure.seatCapacity || "",
      price: departure.price || "",
      discountPrice: departure.discountPrice ?? "",
      meetingPoint: departure.meetingPoint || "",
      note: departure.note || "",
      status: departure.status || "scheduled",
    });
  }

  const normalizedKeyword = normalizeKeyword(searchKeyword);
  const filteredTours = tours.filter((tour) => {
    const matchesKeyword =
      !normalizedKeyword ||
      normalizeKeyword(
        `${tour.title} ${tour.destination} ${tour.departureLocation} ${tour.category?.name} ${tour.transportLabel}`
      ).includes(normalizedKeyword);
    const matchesCategory = categoryFilter === "all" ? true : tour.category?.id === categoryFilter;
    const matchesTransport = transportFilter === "all" ? true : tour.transport === transportFilter;
    const matchesStatus = statusFilter === "all" ? true : tour.status === statusFilter;

    return matchesKeyword && matchesCategory && matchesTransport && matchesStatus;
  });
  const visibleTours = filteredTours.slice(0, pageSize);

  async function handleSubmitTour(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (tourFormRef.current?.reportValidity && !tourFormRef.current.reportValidity()) {
      return;
    }

    if (tourForm.title.trim().length < 5) {
      setError("Tên tour cần ít nhất 5 ký tự.");
      return;
    }

    if (
      tourForm.discountPrice !== "" &&
      Number(tourForm.discountPrice) >= Number(tourForm.price)
    ) {
      setError("Giá khuyến mãi phải nhỏ hơn giá tour.");
      return;
    }

    setSubmittingTour(true);

    // Block ảnh có thể trỏ tới file local tạm thời; khi lưu cần upload ảnh trước
    // rồi thay token tạm bằng URL thật từ backend.
    const itinerary = buildItineraryPayload(itinerarySteps);
    const hasPendingItineraryImages = itinerary.some((step) =>
      step.blocks.some((block) => block.type === ITINERARY_BLOCK_TYPES.image && isPendingItineraryImageUrl(block.url))
    );

    if (hasPendingItineraryImages && pendingImageOptions.length === 0) {
      setSubmittingTour(false);
      setError("Co block anh dang dung anh tam. Vui long chon lai anh o buoc 2 hoac doi anh khac.");
      return;
    }

    function buildUploadedImageMap(uploadResult) {
      const uploadedCount = Number(uploadResult?.uploadedCount || 0);
      const allImages = Array.isArray(uploadResult?.images) ? uploadResult.images : [];
      const uploadedUrls = uploadedCount > 0 ? allImages.slice(-uploadedCount) : [];

      return pendingImageOptions.reduce((result, item, index) => {
        if (uploadedUrls[index]) {
          result[item.token] = uploadedUrls[index];
        }

        return result;
      }, {});
    }

    try {
      const payload = {
        title: tourForm.title,
        destination: tourForm.destination,
        departureLocation: tourForm.departureLocation,
        category: tourForm.category,
        durationDays: Number(tourForm.durationDays),
        durationNights: Number(tourForm.durationNights),
        transport: tourForm.transport,
        price: Number(tourForm.price),
        discountPrice: tourForm.discountPrice === "" ? undefined : Number(tourForm.discountPrice),
        singleRoomSupplement: tourForm.singleRoomSupplement === "" ? undefined : Number(tourForm.singleRoomSupplement),
        maxGroupSize: Number(tourForm.maxGroupSize),
        availableSeats: Number(tourForm.availableSeats),
        highlights: splitValues(tourForm.highlights),
        itinerary,
        includedServices: splitValues(tourForm.includedServices),
        excludedServices: splitValues(tourForm.excludedServices),
        status: tourForm.status,
      };

      if (tourForm.id) {
        let uploadedImageMap = {};

        if (selectedFiles.length > 0 && hasPendingItineraryImages) {
          const uploadResult = await uploadTourImages(tourForm.id, selectedFiles);
          uploadedImageMap = buildUploadedImageMap(uploadResult);
        }

        await updateTour(tourForm.id, {
          ...payload,
          itinerary: hasPendingItineraryImages ? resolvePendingItineraryImages(itinerary, uploadedImageMap) : itinerary,
        });

        if (selectedFiles.length > 0 && !hasPendingItineraryImages) {
          await uploadTourImages(tourForm.id, selectedFiles);
        }

        await loadBootstrap();
        await openTourEditor(tourForm.id);
        setMessage("Đã cập nhật tour.");
      } else {
        const created = await createTour({
          ...payload,
          itinerary: hasPendingItineraryImages ? stripPendingItineraryImages(itinerary) : itinerary,
          startDates: splitValues(stringifyStartDateValues(startDateItems)),
          meetingPoint: tourForm.meetingPoint,
          departureNote: tourForm.departureNote,
        });

        let uploadedImageMap = {};

        if (selectedFiles.length > 0) {
          const uploadResult = await uploadTourImages(created.id, selectedFiles);
          uploadedImageMap = buildUploadedImageMap(uploadResult);
        }

        if (hasPendingItineraryImages) {
          await updateTour(created.id, {
            itinerary: resolvePendingItineraryImages(itinerary, uploadedImageMap),
          });
        }

        await loadBootstrap();
        resetTourBuilder();
        setActiveView("list");
        setMessage("Đã tạo tour mới.");
      }
    } catch (actionError) {
      setError(actionError.message || "Không lưu được tour.");
    } finally {
      setSubmittingTour(false);
    }
  }

  async function handleDeleteTour(tour) {
    if (!tour?.id) {
      return;
    }

    const confirmed = window.confirm(`Bạn có chắc muốn xóa tour ${tour.title}?`);

    if (!confirmed) {
      return;
    }

    setBusyTourId(tour.id);
    setError("");
    setMessage("");

    try {
      await deleteTour(tour.id);
      if (selectedTour?.id === tour.id) {
        resetTourBuilder();
      }
      await loadBootstrap();
      setMessage(`Đã xóa tour ${tour.title}.`);
    } catch (actionError) {
      setError(actionError.message || "Không xóa được tour.");
    } finally {
      setBusyTourId("");
    }
  }

  async function handleSubmitDeparture(event) {
    event.preventDefault();

    if (!selectedTour?.id) {
      return;
    }

    setSubmittingDeparture(true);
    setError("");
    setMessage("");

    try {
      const payload = {
        departureDate: departureForm.departureDate,
        returnDate: departureForm.returnDate || undefined,
        seatCapacity: departureForm.seatCapacity ? Number(departureForm.seatCapacity) : undefined,
        price: departureForm.price ? Number(departureForm.price) : undefined,
        discountPrice: departureForm.discountPrice === "" ? undefined : Number(departureForm.discountPrice),
        meetingPoint: departureForm.meetingPoint,
        note: departureForm.note,
        status: departureForm.status || undefined,
      };

      if (departureForm.id) {
        await updateTourDeparture(selectedTour.id, departureForm.id, payload);
        setMessage("Đã cập nhật đợt khởi hành.");
      } else {
        await createTourDeparture(selectedTour.id, payload);
        setMessage("Đã tạo đợt khởi hành mới.");
      }

      resetDepartureEditor();
      await openTourEditor(selectedTour.id);
      await loadBootstrap();
    } catch (actionError) {
      setError(actionError.message || "Không lưu được đợt khởi hành.");
    } finally {
      setSubmittingDeparture(false);
    }
  }

  async function handleDeleteDeparture(departureId) {
    if (!selectedTour?.id || !departureId) {
      return;
    }

    const confirmed = window.confirm("Bạn có chắc muốn xóa đợt khởi hành này?");

    if (!confirmed) {
      return;
    }

    setError("");
    setMessage("");

    try {
      await deleteTourDeparture(selectedTour.id, departureId);
      await openTourEditor(selectedTour.id);
      setMessage("Đã xóa đợt khởi hành.");
    } catch (actionError) {
      setError(actionError.message || "Không xóa được đợt khởi hành.");
    }
  }

  useEffect(() => {
    setStartDateItems(parseStartDateValues(tourForm.startDates));
  }, [tourForm.id, tourForm.startDates]);

  useEffect(() => {
    if (tourForm.durationDays === "") {
      return;
    }

    try {
      const normalized = syncItineraryWithDuration(parseItineraryValue(tourForm.itinerary), tourForm.durationDays);
      const canonicalValue = stringifyItinerary(normalized);

      setItinerarySteps(normalized);

      if (canonicalValue !== tourForm.itinerary || String(normalized.length) !== String(tourForm.durationDays)) {
        setTourForm((current) => ({
          ...current,
          durationDays: normalized.length,
          itinerary: canonicalValue,
        }));
      }
    } catch {
      const fallback = syncItineraryWithDuration([], tourForm.durationDays);
      const canonicalValue = stringifyItinerary(fallback);

      setItinerarySteps(fallback);
      setTourForm((current) => ({
        ...current,
        durationDays: fallback.length,
        itinerary: canonicalValue,
      }));
    }
  }, [tourForm.durationDays, tourForm.id, tourForm.itinerary]);

  useEffect(() => {
    // Tạo preview cục bộ cho ảnh vừa chọn để block ảnh xem được ngay trước khi upload.
    const nextPendingOptions = selectedFiles.map((file, index) => ({
      token: createPendingItineraryImageToken(file, index),
      name: file.name,
      previewUrl: URL.createObjectURL(file),
    }));

    setPendingImageOptions(nextPendingOptions);

    return () => {
      nextPendingOptions.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    };
  }, [selectedFiles]);

  useEffect(() => {
    void loadBootstrap();
  }, [loadBootstrap]);

  useEffect(() => {
    setActiveView(initialView === "list" ? "list" : "form");
  }, [initialView]);

  const isFirstStep = currentStep === 1;
  const isLastStep = currentStep === FORM_STEPS.length;
  const itineraryImageOptions = Array.isArray(selectedTour?.images) ? selectedTour.images : [];

  function handleNextStep() {
    if (currentStep === 1) {
      const isValid = tourFormRef.current?.reportValidity?.() ?? true;

      if (!isValid) {
        setError("Vui lòng điền đầy đủ thông tin bắt buộc ở bước 1 trước khi sang bước 2.");
        return;
      }
    }

    setError("");
    setCurrentStep((current) => Math.min(FORM_STEPS.length, current + 1));
  }

  return (
    <section className="space-y-6">
      <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
        <div className="px-6 py-5">
          {message ? (
            <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {message}
            </div>
          ) : null}
          {error ? (
            <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          ) : null}
          {loading && !tours.length ? (
            <div className="mb-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              Đang tải dữ liệu tour...
            </div>
          ) : null}

          {activeView === "form" ? (
            <div className="space-y-6">
              <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5">
                <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="mt-2 text-2xl font-semibold text-slate-900">
                      {tourForm.id ? "Cập nhật tour" : "Thêm tour mới"}
                    </h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {tourForm.id ? (
                      <button
                        type="button"
                        onClick={openCreateTourView}
                        className="rounded-2xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-white"
                      >
                        Tạo tour mới
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => setActiveView("list")}
                      className="rounded-2xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-white"
                    >
                      Xem danh sách
                    </button>
                  </div>
                </div>

                <div className="mb-8 grid gap-5 md:grid-cols-3">
                  {FORM_STEPS.map((step) => (
                    <div key={step.key} className="rounded-[1.5rem] border border-slate-200 bg-white px-4 py-5 text-center">
                      <div
                        className={cn(
                          "mx-auto inline-flex h-10 w-10 items-center justify-center rounded-full border text-sm font-semibold",
                          currentStep >= step.key
                            ? "border-slate-900 bg-slate-900 text-white"
                            : "border-slate-200 bg-white text-slate-400"
                        )}
                      >
                        {step.key}
                      </div>
                      <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                        {step.label}
                      </p>
                      <p className="mt-2 text-sm font-semibold text-slate-800">{step.title}</p>
                      <p className="mt-1 text-xs leading-5 text-slate-500">{step.description}</p>
                    </div>
                  ))}
                </div>

                <form ref={tourFormRef} onSubmit={handleSubmitTour} className="space-y-6">
                  {currentStep === 1 ? (
                    <div className="grid gap-4 lg:grid-cols-2">
                      <Field label="Tên tour" required>
                        <input
                          value={tourForm.title}
                          onChange={(event) => patchTourForm("title", event.target.value)}
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-300"
                          minLength={5}
                          maxLength={200}
                          required
                        />
                      </Field>
                      <Field label="Điểm đến" required>
                        <input
                          value={tourForm.destination}
                          onChange={(event) => patchTourForm("destination", event.target.value)}
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-300"
                          required
                        />
                      </Field>
                      <Field label="Nơi khởi hành" required>
                        <input
                          value={tourForm.departureLocation}
                          onChange={(event) => patchTourForm("departureLocation", event.target.value)}
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-300"
                          required
                        />
                      </Field>
                      <Field label="Danh mục" required>
                        <select
                          value={tourForm.category}
                          onChange={(event) => patchTourForm("category", event.target.value)}
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-300"
                          required
                        >
                          <option value="">Chọn danh mục</option>
                          {categories.map((category) => (
                            <option key={category.id} value={category.id}>
                              {category.name}
                            </option>
                          ))}
                        </select>
                      </Field>
                      <Field label="Số ngày" required>
                        <input
                          type="number"
                          min="1"
                          value={tourForm.durationDays}
                          onChange={handleDurationDaysChange}
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-300"
                          required
                        />
                      </Field>
                      <Field label="Số đêm" required>
                        <input
                          type="number"
                          min="0"
                          value={tourForm.durationNights}
                          onChange={(event) => patchTourForm("durationNights", event.target.value)}
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-300"
                          required
                        />
                      </Field>
                      <Field label="Phương tiện" required>
                        <select
                          value={tourForm.transport}
                          onChange={(event) => patchTourForm("transport", event.target.value)}
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-300"
                        >
                          {TRANSPORT_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </Field>
                      <Field label="Trạng thái" required>
                        <select
                          value={tourForm.status}
                          onChange={(event) => patchTourForm("status", event.target.value)}
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-300"
                        >
                          {TOUR_STATUS_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </Field>
                      <Field label="Giá tour" required>
                        <input
                          type="number"
                          min="0"
                          value={tourForm.price}
                          onChange={(event) => patchTourForm("price", event.target.value)}
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-300"
                          required
                        />
                      </Field>
                      <Field label="Giá khuyến mãi">
                        <input
                          type="number"
                          min="0"
                          value={tourForm.discountPrice}
                          onChange={(event) => patchTourForm("discountPrice", event.target.value)}
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-300"
                        />
                      </Field>
                      <Field label="Phụ phí phòng đơn">
                        <input
                          type="number"
                          min="0"
                          value={tourForm.singleRoomSupplement}
                          onChange={(event) => patchTourForm("singleRoomSupplement", event.target.value)}
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-300"
                          placeholder="Chỉ áp dụng khi đoàn có 1 khách"
                        />
                      </Field>
                      <Field label="Số lượng tối đa" required>
                        <input
                          type="number"
                          min="1"
                          value={tourForm.maxGroupSize}
                          onChange={(event) => patchTourForm("maxGroupSize", event.target.value)}
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-300"
                          required
                        />
                      </Field>
                      <Field label="Số chỗ còn lại" required>
                        <input
                          type="number"
                          min="0"
                          value={tourForm.availableSeats}
                          onChange={(event) => patchTourForm("availableSeats", event.target.value)}
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-300"
                          required
                        />
                      </Field>
                      {!tourForm.id ? (
                        <>
                          <div className="space-y-2">
                            <div>
                              <p className="text-sm font-medium text-slate-700">Ngày khởi hành</p>
                            </div>
                            <div className="space-y-3">
                              {startDateItems.map((startDate, index) => (
                                <div
                                  key={`start-date-${index}`}
                                  className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:flex-row md:items-end"
                                >
                                  <div className="flex-1">
                                    <p className="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                                      Lần khởi hành {index + 1}
                                    </p>
                                    <input
                                      type="date"
                                      value={startDate}
                                      onChange={(event) => handleStartDateChange(index, event.target.value)}
                                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-300"
                                    />
                                  </div>
                                  <div className="flex gap-2">
                                    {index === startDateItems.length - 1 ? (
                                      <button
                                        type="button"
                                        onClick={handleAddStartDate}
                                        className="rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-white"
                                      >
                                        Thêm ngày
                                      </button>
                                    ) : null}
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveStartDate(index)}
                                      disabled={startDateItems.length === 1}
                                      className="rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                      Xóa
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                          <Field label="Điểm tập trung mặc định">
                            <input
                              value={tourForm.meetingPoint}
                              onChange={(event) => patchTourForm("meetingPoint", event.target.value)}
                              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-300"
                            />
                          </Field>
                          <div className="lg:col-span-2">
                            <Field label="Ghi chú ">
                              <textarea
                                value={tourForm.departureNote}
                                onChange={(event) => patchTourForm("departureNote", event.target.value)}
                                className="min-h-24 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-300"
                              />
                            </Field>
                          </div>
                        </>
                      ) : null}
                    </div>
                  ) : null}

                  {currentStep === 2 ? (
                    <div className="space-y-5">
                      <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-white px-5 py-8 text-center">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                          <ImageIcon className="h-7 w-7" />
                        </div>
                        <p className="mt-4 text-lg font-semibold text-slate-900">Thêm hình ảnh cho tour</p>
                        <p className="mt-2 text-sm text-slate-500">
                          Chọn nhiều ảnh minh họa. Khi cập nhật, ảnh mới sẽ được upload thêm vào tour hiện tại.
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          Tối đa {TOUR_IMAGE_UPLOAD_MAX_FILES} ảnh mỗi lần upload, mỗi ảnh không quá 5MB.
                        </p>
                        <label className="mt-5 inline-flex cursor-pointer items-center rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700">
                          Chọn ảnh
                          <input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={handleSelectedFilesChange}
                            className="sr-only"
                          />
                        </label>
                      </div>

                      {selectedTour?.images?.length ? (
                        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
                          <p className="text-sm font-semibold text-slate-900">Ảnh hiện có</p>
                          <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                            {selectedTour.images.map((image, index) => (
                              <div key={`${image}-${index}`} className="overflow-hidden rounded-2xl border border-slate-200">
                                <div className="h-28 bg-cover bg-center" style={{ backgroundImage: `url(${image})` }} />
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}

                      {selectedFiles.length > 0 ? (
                        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
                          <p className="text-sm font-semibold text-slate-900">Ảnh đã chọn ({selectedFiles.length})</p>
                          <div className="mt-3 grid gap-3 md:grid-cols-2">
                            {selectedFiles.map((file, index) => (
                              <div
                                key={`${file.name}-${file.size}-${file.lastModified}-${index}`}
                                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                              >
                                <p className="truncate text-sm font-medium text-slate-800">{file.name}</p>
                                <p className="mt-1 text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  ) : null}

                  {currentStep === 3 ? (
                    <div className="grid gap-4 lg:grid-cols-2">
                      <div className="lg:col-span-2">
                        <Field label="Điểm nổi bật" >
                          <textarea
                            value={tourForm.highlights}
                            onChange={(event) => patchTourForm("highlights", event.target.value)}
                            placeholder="Mỗi dòng là một ý. Dấu phẩy sẽ được giữ nguyên trong nội dung."
                            className="min-h-28 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-300"
                          />
                        </Field>
                      </div>

                      <div className="lg:col-span-2 rounded-[1.5rem] border border-slate-200 bg-white p-5">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">Timeline lộ trình</p>

                          </div>
                          <button
                            type="button"
                            onClick={handleAddItineraryStep}
                            className="rounded-2xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700"
                          >
                            Thêm Timeline
                          </button>
                        </div>

                        <div className="mt-5 space-y-4">
                          {itinerarySteps.map((step, stepIndex) => (
                            <div
                              key={`timeline-card-${step.day}-${stepIndex}`}
                              className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-slate-50"
                            >
                              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 bg-white px-5 py-4">
                                <div>
                                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
                                    Ngày {step.day}
                                  </p>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleMoveItineraryStep(stepIndex, "up")}
                                    disabled={stepIndex === 0}
                                    className="rounded-2xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                                  >
                                    Lên
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleMoveItineraryStep(stepIndex, "down")}
                                    disabled={stepIndex === itinerarySteps.length - 1}
                                    className="rounded-2xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                                  >
                                    Xuống
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteItineraryStep(stepIndex)}
                                    disabled={itinerarySteps.length <= 1}
                                    className="rounded-2xl border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-600 disabled:cursor-not-allowed disabled:opacity-40"
                                  >
                                    Xóa timeline
                                  </button>
                                </div>
                              </div>

                              <div className="space-y-4 p-5">
                                <Field label={`Tiêu đề`}>
                                  <input
                                    value={step.title}
                                    onChange={(event) => handleItineraryStepChange(stepIndex, "title", event.target.value)}
                                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-300"
                                    placeholder="Ví dụ: HCM - Côn Đảo"
                                  />
                                </Field>

                                <div className="space-y-3">
                                  {step.blocks.map((block, blockIndex) => {
                                    const selectedPendingImage = pendingImageOptions.find((item) => item.token === block.url);

                                    return (
                                      <div
                                        key={`timeline-card-block-${stepIndex}-${blockIndex}`}
                                        className="rounded-2xl border border-slate-200 bg-white p-4"
                                      >
                                        <div className="flex flex-wrap items-center justify-between gap-3">
                                          <div>
                                            <p className="mt-1 text-sm font-semibold text-slate-900">
                                              {block.type === ITINERARY_BLOCK_TYPES.image
                                                ? "Ảnh"
                                                : block.type === ITINERARY_BLOCK_TYPES.caption
                                                  ? "Caption"
                                                  : "Đoạn văn"}
                                            </p>
                                          </div>
                                          <div className="flex flex-wrap gap-2">
                                            <button
                                              type="button"
                                              onClick={() => handleMoveItineraryBlock(stepIndex, blockIndex, "up")}
                                              disabled={blockIndex === 0}
                                              className="rounded-2xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                                            >
                                              Lên
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => handleMoveItineraryBlock(stepIndex, blockIndex, "down")}
                                              disabled={blockIndex === step.blocks.length - 1}
                                              className="rounded-2xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                                            >
                                              Xuống
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => handleDeleteItineraryBlock(stepIndex, blockIndex)}
                                              disabled={step.blocks.length <= 1}
                                              className="rounded-2xl border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-600 disabled:cursor-not-allowed disabled:opacity-40"
                                            >
                                              Xóa
                                            </button>
                                          </div>
                                        </div>

                                        {block.type === ITINERARY_BLOCK_TYPES.image ? (
                                          <div className="mt-4 space-y-4">
                                            <div className="flex flex-wrap items-center gap-2">
                                              <label className="inline-flex cursor-pointer items-center rounded-2xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800">
                                                Upload ảnh từ máy
                                                <input
                                                  type="file"
                                                  accept="image/*"
                                                  onChange={(event) => handleItineraryBlockFileChange(stepIndex, blockIndex, event)}
                                                  className="sr-only"
                                                />
                                              </label>
                                              <button
                                                type="button"
                                                onClick={() => handleClearItineraryBlockImage(stepIndex, blockIndex)}
                                                disabled={!block.url}
                                                className="rounded-2xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                                              >
                                                Gỡ ảnh
                                              </button>
                                            </div>

                                            {(pendingImageOptions.length > 0 || itineraryImageOptions.length > 0) ? (
                                              <Field label="Chọn ảnh cho timeline">
                                                <select
                                                  value={block.url}
                                                  onChange={(event) => {
                                                    const nextUrl = event.target.value;
                                                    const pendingItem = pendingImageOptions.find((item) => item.token === nextUrl);

                                                    handleSelectItineraryBlockImage(
                                                      stepIndex,
                                                      blockIndex,
                                                      nextUrl,
                                                      pendingItem ? pendingItem.name.replace(/\.[^.]+$/, "") : ""
                                                    );
                                                  }}
                                                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-300"
                                                >
                                                  <option value="">Chọn ảnh</option>
                                                  {pendingImageOptions.length > 0 ? (
                                                    <optgroup label="Ảnh đã chọn từ máy">
                                                      {pendingImageOptions.map((item, imageIndex) => (
                                                        <option key={`${item.token}-${imageIndex}`} value={item.token}>
                                                          {item.name}
                                                        </option>
                                                      ))}
                                                    </optgroup>
                                                  ) : null}
                                                  {itineraryImageOptions.length > 0 ? (
                                                    <optgroup label="Ảnh tour hiện có">
                                                      {itineraryImageOptions.map((imageUrl, imageIndex) => (
                                                        <option key={`${imageUrl}-${imageIndex}`} value={imageUrl}>
                                                          Ảnh tour {imageIndex + 1}
                                                        </option>
                                                      ))}
                                                    </optgroup>
                                                  ) : null}
                                                </select>
                                              </Field>
                                            ) : null}

                                            <Field label="Alt ảnh" hint="Mô tả ngắn cho ảnh">
                                              <input
                                                value={block.alt}
                                                onChange={(event) =>
                                                  handleItineraryBlockChange(stepIndex, blockIndex, "alt", event.target.value)
                                                }
                                                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-300"
                                                placeholder="Ví dụ: Bãi biển Côn Đảo nhìn từ Mũi Lò Vôi"
                                              />
                                            </Field>

                                            {selectedPendingImage ? (
                                              <p className="text-xs text-slate-500">Đang dùng: {selectedPendingImage.name}</p>
                                            ) : null}

                                            {getItineraryImagePreviewUrl(block.url) ? (
                                              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img
                                                  src={getItineraryImagePreviewUrl(block.url)}
                                                  alt={block.alt || step.title || "Itinerary image"}
                                                  className="max-h-80 w-full object-cover"
                                                />
                                              </div>
                                            ) : null}
                                          </div>
                                        ) : (
                                          <Field
                                            label=""
                                            hint={
                                              block.type === ITINERARY_BLOCK_TYPES.caption
                                                ? ""
                                                : "Nhập nội dung chính của timeline"
                                            }
                                          >
                                            <textarea
                                              value={block.text}
                                              onChange={(event) =>
                                                handleItineraryBlockChange(stepIndex, blockIndex, "text", event.target.value)
                                              }
                                              className={cn(
                                                "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-300",
                                                block.type === ITINERARY_BLOCK_TYPES.caption ? "min-h-24" : "min-h-36"
                                              )}
                                              placeholder={
                                                block.type === ITINERARY_BLOCK_TYPES.caption
                                                  ? "Ví dụ: Vẻ đẹp hoang sơ của Mũi Lò Vôi."
                                                  : "Nhập đoạn văn mô tả lịch trình..."
                                              }
                                            />
                                          </Field>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>

                                <div className="flex flex-wrap gap-2 border-t border-dashed border-slate-300 pt-4">
                                  <button
                                    type="button"
                                    onClick={() => handleAddItineraryBlock(stepIndex, ITINERARY_BLOCK_TYPES.paragraph)}
                                    className="rounded-2xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-white"
                                  >
                                    Thêm đoạn văn
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleAddItineraryBlock(stepIndex, ITINERARY_BLOCK_TYPES.image)}
                                    className="rounded-2xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-white"
                                  >
                                    Thêm ảnh
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleAddItineraryBlock(stepIndex, ITINERARY_BLOCK_TYPES.caption)}
                                    className="rounded-2xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-white"
                                  >
                                    Thêm caption
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <Field label="Dịch vụ bao gồm" >
                        <textarea
                          value={tourForm.includedServices}
                          onChange={(event) => patchTourForm("includedServices", event.target.value)}
                          placeholder="Mỗi dòng là một ý. Dấu phẩy sẽ được giữ nguyên trong nội dung."
                          className="min-h-36 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-300"
                        />
                      </Field>
                      <Field label="Dịch vụ không bao gồm" >
                        <textarea
                          value={tourForm.excludedServices}
                          onChange={(event) => patchTourForm("excludedServices", event.target.value)}
                          placeholder="Mỗi dòng là một ý. Dấu phẩy sẽ được giữ nguyên trong nội dung."
                          className="min-h-36 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-300"
                        />
                      </Field>
                    </div>
                  ) : null}

                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-5">
                    <button
                      type="button"
                      onClick={() => setCurrentStep((current) => Math.max(1, current - 1))}
                      disabled={isFirstStep}
                      className="rounded-2xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Quay lại
                    </button>
                    {!isLastStep ? (
                      <button
                        key="tour-next-step"
                        type="button"
                        onClick={handleNextStep}
                        className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
                      >
                        Tiếp tục
                      </button>
                    ) : (
                      <button
                        key="tour-submit"
                        type="submit"
                        disabled={submittingTour}
                        className="rounded-2xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-blue-300"
                      >
                        {submittingTour ? "Đang xử lý..." : tourForm.id ? "Cập nhật tour" : "Tạo tour"}
                      </button>
                    )}
                  </div>
                </form>
              </div>

              {selectedTour?.id ? (
                <div className="grid gap-6 xl:grid-cols-[0.92fr,1.08fr]">
                  <form
                    onSubmit={handleSubmitDeparture}
                    className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-400">
                          Đợt khởi hành
                        </p>
                        <h3 className="mt-2 text-xl font-semibold text-slate-900">
                          {departureForm.id ? "Cập nhật đợt khởi hành" : "Thêm đợt khởi hành"}
                        </h3>
                        <p className="mt-2 text-sm text-slate-500">{selectedTour.title}</p>
                      </div>
                      {departureForm.id ? (
                        <button
                          type="button"
                          onClick={resetDepartureEditor}
                          className="rounded-2xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          Hủy
                        </button>
                      ) : null}
                    </div>

                    <div className="mt-5 grid gap-4 md:grid-cols-2">
                      <Field label="Ngày khởi hành" required>
                        <input
                          type="date"
                          value={departureForm.departureDate}
                          onChange={(event) => patchDepartureForm("departureDate", event.target.value)}
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-300"
                          required
                        />
                      </Field>
                      <Field label="Ngày kết thúc">
                        <input
                          type="date"
                          value={departureForm.returnDate}
                          onChange={(event) => patchDepartureForm("returnDate", event.target.value)}
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-300"
                        />
                      </Field>
                      <Field label="Số ghế">
                        <input
                          type="number"
                          min="0"
                          value={departureForm.seatCapacity}
                          onChange={(event) => patchDepartureForm("seatCapacity", event.target.value)}
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-300"
                        />
                      </Field>
                      <Field label="Trạng thái">
                        <select
                          value={departureForm.status}
                          onChange={(event) => patchDepartureForm("status", event.target.value)}
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-300"
                        >
                          {DEPARTURE_STATUS_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </Field>
                      <Field label="Giá áp dụng">
                        <input
                          type="number"
                          min="0"
                          value={departureForm.price}
                          onChange={(event) => patchDepartureForm("price", event.target.value)}
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-300"
                        />
                      </Field>
                      <Field label="Giá khuyến mãi">
                        <input
                          type="number"
                          min="0"
                          value={departureForm.discountPrice}
                          onChange={(event) => patchDepartureForm("discountPrice", event.target.value)}
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-300"
                        />
                      </Field>
                      <div className="md:col-span-2">
                        <Field label="Điểm tập trung">
                          <input
                            value={departureForm.meetingPoint}
                            onChange={(event) => patchDepartureForm("meetingPoint", event.target.value)}
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-300"
                          />
                        </Field>
                      </div>
                      <div className="md:col-span-2">
                        <Field label="Ghi chú">
                          <textarea
                            value={departureForm.note}
                            onChange={(event) => patchDepartureForm("note", event.target.value)}
                            className="min-h-24 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-300"
                          />
                        </Field>
                      </div>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-3">
                      <button
                        type="submit"
                        disabled={submittingDeparture}
                        className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-blue-300"
                      >
                        {submittingDeparture
                          ? "Đang xử lý..."
                          : departureForm.id
                            ? "Cập nhật đợt khởi hành"
                            : "Thêm đợt khởi hành"}
                      </button>
                      <button
                        type="button"
                        onClick={resetDepartureEditor}
                        className="rounded-2xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        Làm mới
                      </button>
                    </div>
                  </form>

                  <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-400">
                        Danh sách đợt khởi hành
                      </p>
                      <h3 className="mt-2 text-xl font-semibold text-slate-900">{departures.length} đợt khởi hành</h3>
                    </div>

                    <div className="mt-5 space-y-3">
                      {departures.length ? (
                        departures.map((departure) => {
                          const departureStatus = getStatusPresentation(departure.status);

                          return (
                            <article
                              key={departure.id}
                              className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4"
                            >
                              <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                  <span
                                    className={cn(
                                      "inline-flex rounded-full px-3 py-1 text-xs font-semibold",
                                      departureStatus.className
                                    )}
                                  >
                                    {departureStatus.label}
                                  </span>
                                  <p className="mt-3 text-base font-semibold text-slate-900">
                                    {formatDateVi(departure.departureDate)} - {formatDateVi(departure.returnDate)}
                                  </p>
                                  <p className="mt-1 text-sm text-slate-500">
                                    {departure.meetingPoint || "Chưa cập nhật điểm tập trung"}
                                  </p>
                                  <p className="mt-2 text-sm text-slate-600">
                                    Giá: {formatVnd(departure.displayPrice)} | Còn lại {departure.remainingSeats} chỗ
                                  </p>
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    onClick={() => populateDepartureForm(departure)}
                                    className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                                  >
                                    <EditIcon className="h-4 w-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteDeparture(departure.id)}
                                    className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-rose-200 text-rose-600 hover:bg-rose-50"
                                  >
                                    <TrashIcon className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                            </article>
                          );
                        })
                      ) : (
                        <div className="rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                          Tour này chưa có đợt khởi hành nào.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
          {activeView === "list" ? (
            <div className="space-y-5">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div className="grid flex-1 gap-3 md:grid-cols-2 xl:grid-cols-[minmax(0,1.35fr),repeat(3,minmax(0,0.72fr))]">
                  <label className="relative block">
                    <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                    <input
                      value={searchKeyword}
                      onChange={(event) => setSearchKeyword(event.target.value)}
                      placeholder="Tìm tour theo tên, điểm đến, nơi khởi hành"
                      className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-12 pr-4 text-sm outline-none focus:border-blue-300"
                    />
                  </label>

                  <label className="relative block">
                    <FilterIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                    <select
                      value={categoryFilter}
                      onChange={(event) => setCategoryFilter(event.target.value)}
                      className="w-full appearance-none rounded-2xl border border-slate-200 bg-white py-3 pl-12 pr-4 text-sm outline-none focus:border-blue-300"
                    >
                      <option value="all">Tất cả danh mục</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <select
                    value={transportFilter}
                    onChange={(event) => setTransportFilter(event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-300"
                  >
                    <option value="all">Tất cả phương tiện</option>
                    {TRANSPORT_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>

                  <select
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-300"
                  >
                    <option value="all">Tất cả trạng thái</option>
                    {TOUR_STATUS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <select
                    value={pageSize}
                    onChange={(event) => setPageSize(Number(event.target.value))}
                    className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-300"
                  >
                    {PAGE_SIZE_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option} mục
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={openCreateTourView}
                    className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
                  >
                    <PlusIcon className="h-4 w-4" />
                    Thêm tour
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 text-sm text-slate-500">
                <p>
                  Hiện {visibleTours.length} / {filteredTours.length} tour phù hợp bộ lọc.
                </p>
                {loading ? <p>Đang đồng bộ danh sách...</p> : null}
              </div>

              <div className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                  <table className="min-w-[1100px] text-left">
                    <thead className="bg-slate-50 text-sm uppercase tracking-[0.18em] text-slate-500">
                      <tr>
                        <th className="px-6 py-4 font-medium">STT</th>
                        <th className="px-6 py-4 font-medium">Tên tour</th>
                        <th className="px-6 py-4 font-medium">Danh mục</th>
                        <th className="px-6 py-4 font-medium">Lịch trình</th>
                        <th className="px-6 py-4 font-medium">Giá</th>
                        <th className="px-6 py-4 font-medium">Khởi hành</th>
                        <th className="px-6 py-4 font-medium">Trạng thái</th>
                        <th className="px-6 py-4 font-medium text-right">Hành động</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleTours.length ? (
                        visibleTours.map((tour, index) => {
                          const statusMeta = getStatusPresentation(tour.status);
                          const discountPercent = getDiscountPercent(tour.price, tour.discountPrice);
                          const isBusy = busyTourId === tour.id;

                          return (
                            <tr key={tour.id} className="border-t border-slate-200 align-top">
                              <td className="px-6 py-5 text-sm font-semibold text-slate-700">{index + 1}</td>
                              <td className="px-6 py-5">
                                <div className="max-w-[280px]">
                                  <p className="text-base font-semibold text-slate-900">{tour.title}</p>
                                  <p className="mt-1 text-sm text-slate-500">
                                    {tour.destination} | Khởi hành từ {tour.departureLocation}
                                  </p>
                                  <p className="mt-2 text-sm text-slate-400">{tour.summary}</p>
                                </div>
                              </td>
                              <td className="px-6 py-5 text-sm text-slate-600">
                                {tour.category?.name || "Chưa gắn danh mục"}
                              </td>
                              <td className="px-6 py-5 text-sm text-slate-600">
                                <p>{formatDuration(tour.durationDays, tour.durationNights)}</p>
                                <p className="mt-1 text-slate-400">{tour.transportLabel}</p>
                              </td>
                              <td className="px-6 py-5 text-sm text-slate-700">
                                <p className="font-semibold text-slate-900">{formatVnd(tour.displayPrice)}</p>
                                {tour.discountPrice ? (
                                  <p className="mt-1 text-slate-400">
                                    Giá gốc {formatVnd(tour.price)}
                                    {discountPercent > 0 ? ` | Giảm ${discountPercent}%` : ""}
                                  </p>
                                ) : null}
                              </td>
                              <td className="px-6 py-5 text-sm text-slate-600">
                                <p>{tour.firstStartDate ? formatDateVi(tour.firstStartDate) : "Chưa có lịch"}</p>
                                <p className="mt-1 text-slate-400">{tour.startDates.length} đợt khởi hành</p>
                              </td>
                              <td className="px-6 py-5">
                                <span
                                  className={cn(
                                    "inline-flex rounded-full px-3 py-1 text-xs font-semibold",
                                    statusMeta.className
                                  )}
                                >
                                  {statusMeta.label}
                                </span>
                              </td>
                              <td className="px-6 py-5">
                                <div className="flex justify-end gap-2">
                                  <button
                                    type="button"
                                    onClick={() => openTourEditor(tour.id)}
                                    disabled={isBusy}
                                    className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                                  >
                                    <EditIcon className="h-4 w-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteTour(tour)}
                                    disabled={isBusy}
                                    className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-rose-200 text-rose-600 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                                  >
                                    <TrashIcon className="h-4 w-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan="8" className="px-6 py-12 text-center text-sm text-slate-500">
                            Không tìm thấy tour phù hợp với bộ lọc hiện tại.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </section>
    </section>
  );
}
