"use client";

import { useCallback, useEffect, useState } from "react";
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

const VIEW_TABS = [
  { key: "form", label: "Them tour" },
  { key: "list", label: "Danh sach tour" },
];

const FORM_STEPS = [
  { key: 1, label: "Buoc 1", title: "Thong tin tour", description: "Nhap thong tin co ban" },
  { key: 2, label: "Buoc 2", title: "Them hinh anh", description: "Tai anh minh hoa" },
  { key: 3, label: "Buoc 3", title: "Lo trinh va dich vu", description: "Hoan thien noi dung" },
];

const TOUR_STATUS_OPTIONS = [
  { value: "draft", label: "Ban nhap" },
  { value: "published", label: "Dang ban" },
  { value: "closed", label: "Ngung ban" },
];

const DEPARTURE_STATUS_OPTIONS = [
  { value: "scheduled", label: "Sap khoi hanh" },
  { value: "open", label: "Dang mo ban" },
  { value: "closed", label: "Da dong" },
  { value: "completed", label: "Da xong" },
];

const TRANSPORT_OPTIONS = [
  { value: "mixed", label: "Linh hoat" },
  { value: "bus", label: "Xe du lich" },
  { value: "plane", label: "May bay" },
  { value: "train", label: "Tau hoa" },
  { value: "ship", label: "Tau thuyen" },
  { value: "car", label: "Xe rieng" },
];

const PAGE_SIZE_OPTIONS = [10, 20, 30];

const initialTourForm = {
  id: "",
  title: "",
  destination: "",
  departureLocation: "",
  category: "",
  durationDays: 3,
  durationNights: 2,
  transport: "mixed",
  price: 0,
  discountPrice: "",
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
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function stringifyItinerary(itinerary) {
  return JSON.stringify(itinerary || [], null, 2);
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
    "Dang cap nhat";

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
    durationDays: detail.durationDays ?? 3,
    durationNights: detail.durationNights ?? 2,
    transport: detail.transport || "mixed",
    price: detail.price ?? 0,
    discountPrice: detail.discountPrice ?? "",
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
      <span className="text-sm font-medium text-slate-700">
        {label}
        {required ? <span className="text-rose-500"> *</span> : null}
      </span>
      {children}
      {hint ? <span className="block text-xs text-slate-400">{hint}</span> : null}
    </label>
  );
}

export default function ToursPanel() {
  const [categories, setCategories] = useState([]);
  const [tours, setTours] = useState([]);
  const [selectedTour, setSelectedTour] = useState(null);
  const [departures, setDepartures] = useState([]);
  const [tourForm, setTourForm] = useState(initialTourForm);
  const [departureForm, setDepartureForm] = useState(initialDepartureForm);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [activeView, setActiveView] = useState("form");
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
      setError(loadError.message || "Khong tai duoc du lieu tour.");
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
      setError(actionError.message || "Khong tai duoc chi tiet tour.");
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
    setSubmittingTour(true);
    setError("");
    setMessage("");

    let itinerary;

    try {
      itinerary = JSON.parse(tourForm.itinerary || "[]");
    } catch {
      setSubmittingTour(false);
      setError("Lo trinh phai la JSON hop le.");
      return;
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
        maxGroupSize: Number(tourForm.maxGroupSize),
        availableSeats: Number(tourForm.availableSeats),
        highlights: splitValues(tourForm.highlights),
        itinerary,
        includedServices: splitValues(tourForm.includedServices),
        excludedServices: splitValues(tourForm.excludedServices),
        status: tourForm.status,
      };

      if (tourForm.id) {
        await updateTour(tourForm.id, payload);

        if (selectedFiles.length > 0) {
          await uploadTourImages(tourForm.id, selectedFiles);
        }

        await loadBootstrap();
        await openTourEditor(tourForm.id);
        setMessage("Da cap nhat tour.");
      } else {
        const created = await createTour({
          ...payload,
          startDates: splitValues(tourForm.startDates),
          meetingPoint: tourForm.meetingPoint,
          departureNote: tourForm.departureNote,
        });

        if (selectedFiles.length > 0) {
          await uploadTourImages(created.id, selectedFiles);
        }

        await loadBootstrap();
        resetTourBuilder();
        setActiveView("list");
        setMessage("Da tao tour moi.");
      }
    } catch (actionError) {
      setError(actionError.message || "Khong luu duoc tour.");
    } finally {
      setSubmittingTour(false);
    }
  }

  async function handleDeleteTour(tour) {
    if (!tour?.id) {
      return;
    }

    const confirmed = window.confirm(`Ban co chac muon xoa tour ${tour.title}?`);

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
      setMessage(`Da xoa tour ${tour.title}.`);
    } catch (actionError) {
      setError(actionError.message || "Khong xoa duoc tour.");
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
        setMessage("Da cap nhat dot khoi hanh.");
      } else {
        await createTourDeparture(selectedTour.id, payload);
        setMessage("Da tao dot khoi hanh moi.");
      }

      resetDepartureEditor();
      await openTourEditor(selectedTour.id);
      await loadBootstrap();
    } catch (actionError) {
      setError(actionError.message || "Khong luu duoc dot khoi hanh.");
    } finally {
      setSubmittingDeparture(false);
    }
  }

  async function handleDeleteDeparture(departureId) {
    if (!selectedTour?.id || !departureId) {
      return;
    }

    const confirmed = window.confirm("Ban co chac muon xoa dot khoi hanh nay?");

    if (!confirmed) {
      return;
    }

    setError("");
    setMessage("");

    try {
      await deleteTourDeparture(selectedTour.id, departureId);
      await openTourEditor(selectedTour.id);
      setMessage("Da xoa dot khoi hanh.");
    } catch (actionError) {
      setError(actionError.message || "Khong xoa duoc dot khoi hanh.");
    }
  }

  useEffect(() => {
    void loadBootstrap();
  }, [loadBootstrap]);

  const isFirstStep = currentStep === 1;
  const isLastStep = currentStep === FORM_STEPS.length;

  return (
    <section className="space-y-6">
      <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-3xl text-slate-900">Quan ly tour</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Gom 2 khu vuc chinh: them tour moi va danh sach tour de admin thao tac nhanh.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {VIEW_TABS.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveView(tab.key)}
                  className={cn(
                    "rounded-2xl border px-4 py-2.5 text-sm font-semibold transition",
                    activeView === tab.key
                      ? "border-blue-600 bg-blue-600 text-white"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

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
              Dang tai du lieu tour...
            </div>
          ) : null}

          {activeView === "form" ? (
            <div className="space-y-6">
              <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5">
                <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-400">Form</p>
                    <h3 className="mt-2 text-2xl font-semibold text-slate-900">
                      {tourForm.id ? "Cap nhat tour" : "Them tour moi"}
                    </h3>
                    <p className="mt-2 text-sm text-slate-500">
                      Form nay giu dung cac field CRUD tour va upload anh theo backend hien tai.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {tourForm.id ? (
                      <button
                        type="button"
                        onClick={openCreateTourView}
                        className="rounded-2xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-white"
                      >
                        Tao tour moi
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => setActiveView("list")}
                      className="rounded-2xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-white"
                    >
                      Xem danh sach
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

                <form onSubmit={handleSubmitTour} className="space-y-6">
                  {currentStep === 1 ? (
                    <div className="grid gap-4 lg:grid-cols-2">
                      <Field label="Ten tour" required>
                        <input
                          value={tourForm.title}
                          onChange={(event) => patchTourForm("title", event.target.value)}
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-300"
                          required
                        />
                      </Field>
                      <Field label="Diem den" required>
                        <input
                          value={tourForm.destination}
                          onChange={(event) => patchTourForm("destination", event.target.value)}
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-300"
                          required
                        />
                      </Field>
                      <Field label="Noi khoi hanh" required>
                        <input
                          value={tourForm.departureLocation}
                          onChange={(event) => patchTourForm("departureLocation", event.target.value)}
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-300"
                          required
                        />
                      </Field>
                      <Field label="Danh muc" required>
                        <select
                          value={tourForm.category}
                          onChange={(event) => patchTourForm("category", event.target.value)}
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-300"
                          required
                        >
                          <option value="">Chon danh muc</option>
                          {categories.map((category) => (
                            <option key={category.id} value={category.id}>
                              {category.name}
                            </option>
                          ))}
                        </select>
                      </Field>
                      <Field label="So ngay" required>
                        <input
                          type="number"
                          min="1"
                          value={tourForm.durationDays}
                          onChange={(event) => patchTourForm("durationDays", event.target.value)}
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-300"
                          required
                        />
                      </Field>
                      <Field label="So dem" required>
                        <input
                          type="number"
                          min="0"
                          value={tourForm.durationNights}
                          onChange={(event) => patchTourForm("durationNights", event.target.value)}
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-300"
                          required
                        />
                      </Field>
                      <Field label="Phuong tien" required>
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
                      <Field label="Trang thai" required>
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
                      <Field label="Gia tour" required>
                        <input
                          type="number"
                          min="0"
                          value={tourForm.price}
                          onChange={(event) => patchTourForm("price", event.target.value)}
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-300"
                          required
                        />
                      </Field>
                      <Field label="Gia khuyen mai">
                        <input
                          type="number"
                          min="0"
                          value={tourForm.discountPrice}
                          onChange={(event) => patchTourForm("discountPrice", event.target.value)}
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-300"
                        />
                      </Field>
                      <Field label="So luong toi da" required>
                        <input
                          type="number"
                          min="1"
                          value={tourForm.maxGroupSize}
                          onChange={(event) => patchTourForm("maxGroupSize", event.target.value)}
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-300"
                          required
                        />
                      </Field>
                      <Field label="So cho con lai" required>
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
                          <Field label="Ngay khoi hanh" hint="Moi dong mot ngay theo dinh dang YYYY-MM-DD">
                            <textarea
                              value={tourForm.startDates}
                              onChange={(event) => patchTourForm("startDates", event.target.value)}
                              className="min-h-28 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-300"
                            />
                          </Field>
                          <Field label="Diem tap trung mac dinh">
                            <input
                              value={tourForm.meetingPoint}
                              onChange={(event) => patchTourForm("meetingPoint", event.target.value)}
                              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-300"
                            />
                          </Field>
                          <div className="lg:col-span-2">
                            <Field label="Ghi chu khoi hanh mac dinh">
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
                        <p className="mt-4 text-lg font-semibold text-slate-900">Them hinh anh cho tour</p>
                        <p className="mt-2 text-sm text-slate-500">
                          Chon nhieu anh minh hoa. Khi cap nhat, anh moi se duoc upload them vao tour hien tai.
                        </p>
                        <label className="mt-5 inline-flex cursor-pointer items-center rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700">
                          Chon anh
                          <input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={(event) => setSelectedFiles(Array.from(event.target.files || []))}
                            className="sr-only"
                          />
                        </label>
                      </div>

                      {selectedTour?.images?.length ? (
                        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
                          <p className="text-sm font-semibold text-slate-900">Anh hien co</p>
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
                          <p className="text-sm font-semibold text-slate-900">Anh da chon ({selectedFiles.length})</p>
                          <div className="mt-3 grid gap-3 md:grid-cols-2">
                            {selectedFiles.map((file) => (
                              <div
                                key={`${file.name}-${file.size}`}
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
                        <Field label="Diem noi bat" hint="Moi dong mot muc">
                          <textarea
                            value={tourForm.highlights}
                            onChange={(event) => patchTourForm("highlights", event.target.value)}
                            className="min-h-28 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-300"
                          />
                        </Field>
                      </div>
                      <div className="lg:col-span-2">
                        <Field
                          label="Lo trinh"
                          hint='Nhap JSON, vi du [{"day":1,"title":"Ngay 1","description":"..."}]'
                          required
                        >
                          <textarea
                            value={tourForm.itinerary}
                            onChange={(event) => patchTourForm("itinerary", event.target.value)}
                            className="min-h-48 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 font-mono text-sm outline-none focus:border-blue-300"
                            required
                          />
                        </Field>
                      </div>
                      <Field label="Dich vu bao gom" hint="Moi dong mot muc">
                        <textarea
                          value={tourForm.includedServices}
                          onChange={(event) => patchTourForm("includedServices", event.target.value)}
                          className="min-h-36 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-300"
                        />
                      </Field>
                      <Field label="Dich vu khong bao gom" hint="Moi dong mot muc">
                        <textarea
                          value={tourForm.excludedServices}
                          onChange={(event) => patchTourForm("excludedServices", event.target.value)}
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
                      Quay lai
                    </button>
                    {!isLastStep ? (
                      <button
                        type="button"
                        onClick={() => setCurrentStep((current) => Math.min(FORM_STEPS.length, current + 1))}
                        className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
                      >
                        Tiep tuc
                      </button>
                    ) : (
                      <button
                        type="submit"
                        disabled={submittingTour}
                        className="rounded-2xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-blue-300"
                      >
                        {submittingTour ? "Dang xu ly..." : tourForm.id ? "Cap nhat tour" : "Tao tour"}
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
                          Departure
                        </p>
                        <h3 className="mt-2 text-xl font-semibold text-slate-900">
                          {departureForm.id ? "Cap nhat dot khoi hanh" : "Them dot khoi hanh"}
                        </h3>
                        <p className="mt-2 text-sm text-slate-500">{selectedTour.title}</p>
                      </div>
                      {departureForm.id ? (
                        <button
                          type="button"
                          onClick={resetDepartureEditor}
                          className="rounded-2xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          Huy
                        </button>
                      ) : null}
                    </div>

                    <div className="mt-5 grid gap-4 md:grid-cols-2">
                      <Field label="Ngay khoi hanh" required>
                        <input
                          type="date"
                          value={departureForm.departureDate}
                          onChange={(event) => patchDepartureForm("departureDate", event.target.value)}
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-300"
                          required
                        />
                      </Field>
                      <Field label="Ngay ket thuc">
                        <input
                          type="date"
                          value={departureForm.returnDate}
                          onChange={(event) => patchDepartureForm("returnDate", event.target.value)}
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-300"
                        />
                      </Field>
                      <Field label="So ghe">
                        <input
                          type="number"
                          min="0"
                          value={departureForm.seatCapacity}
                          onChange={(event) => patchDepartureForm("seatCapacity", event.target.value)}
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-300"
                        />
                      </Field>
                      <Field label="Trang thai">
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
                      <Field label="Gia ap dung">
                        <input
                          type="number"
                          min="0"
                          value={departureForm.price}
                          onChange={(event) => patchDepartureForm("price", event.target.value)}
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-300"
                        />
                      </Field>
                      <Field label="Gia khuyen mai">
                        <input
                          type="number"
                          min="0"
                          value={departureForm.discountPrice}
                          onChange={(event) => patchDepartureForm("discountPrice", event.target.value)}
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-300"
                        />
                      </Field>
                      <div className="md:col-span-2">
                        <Field label="Diem tap trung">
                          <input
                            value={departureForm.meetingPoint}
                            onChange={(event) => patchDepartureForm("meetingPoint", event.target.value)}
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-300"
                          />
                        </Field>
                      </div>
                      <div className="md:col-span-2">
                        <Field label="Ghi chu">
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
                          ? "Dang xu ly..."
                          : departureForm.id
                            ? "Cap nhat departure"
                            : "Them departure"}
                      </button>
                      <button
                        type="button"
                        onClick={resetDepartureEditor}
                        className="rounded-2xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        Lam moi
                      </button>
                    </div>
                  </form>

                  <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-400">
                        Danh sach departure
                      </p>
                      <h3 className="mt-2 text-xl font-semibold text-slate-900">{departures.length} dot khoi hanh</h3>
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
                                    {departure.meetingPoint || "Chua cap nhat diem tap trung"}
                                  </p>
                                  <p className="mt-2 text-sm text-slate-600">
                                    Gia: {formatVnd(departure.displayPrice)} | Con lai {departure.remainingSeats} cho
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
                          Tour nay chua co dot khoi hanh nao.
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
                      placeholder="Tim tour theo ten, diem den, noi khoi hanh"
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
                      <option value="all">Tat ca danh muc</option>
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
                    <option value="all">Tat ca phuong tien</option>
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
                    <option value="all">Tat ca trang thai</option>
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
                        {option} muc
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={openCreateTourView}
                    className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
                  >
                    <PlusIcon className="h-4 w-4" />
                    Them tour
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 text-sm text-slate-500">
                <p>
                  Hien {visibleTours.length} / {filteredTours.length} tour phu hop bo loc.
                </p>
                {loading ? <p>Dang dong bo danh sach...</p> : null}
              </div>

              <div className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                  <table className="min-w-[1100px] text-left">
                    <thead className="bg-slate-50 text-sm uppercase tracking-[0.18em] text-slate-500">
                      <tr>
                        <th className="px-6 py-4 font-medium">STT</th>
                        <th className="px-6 py-4 font-medium">Ten tour</th>
                        <th className="px-6 py-4 font-medium">Danh muc</th>
                        <th className="px-6 py-4 font-medium">Lich trinh</th>
                        <th className="px-6 py-4 font-medium">Gia</th>
                        <th className="px-6 py-4 font-medium">Khoi hanh</th>
                        <th className="px-6 py-4 font-medium">Trang thai</th>
                        <th className="px-6 py-4 font-medium text-right">Hanh dong</th>
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
                                    {tour.destination} | Khoi hanh tu {tour.departureLocation}
                                  </p>
                                  <p className="mt-2 text-sm text-slate-400">{tour.summary}</p>
                                </div>
                              </td>
                              <td className="px-6 py-5 text-sm text-slate-600">
                                {tour.category?.name || "Chua gan danh muc"}
                              </td>
                              <td className="px-6 py-5 text-sm text-slate-600">
                                <p>{formatDuration(tour.durationDays, tour.durationNights)}</p>
                                <p className="mt-1 text-slate-400">{tour.transportLabel}</p>
                              </td>
                              <td className="px-6 py-5 text-sm text-slate-700">
                                <p className="font-semibold text-slate-900">{formatVnd(tour.displayPrice)}</p>
                                {tour.discountPrice ? (
                                  <p className="mt-1 text-slate-400">
                                    Gia goc {formatVnd(tour.price)}
                                    {discountPercent > 0 ? ` | Giam ${discountPercent}%` : ""}
                                  </p>
                                ) : null}
                              </td>
                              <td className="px-6 py-5 text-sm text-slate-600">
                                <p>{tour.firstStartDate ? formatDateVi(tour.firstStartDate) : "Chua co lich"}</p>
                                <p className="mt-1 text-slate-400">{tour.upcomingDepartures.length} departure</p>
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
                            Khong tim thay tour phu hop voi bo loc hien tai.
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
