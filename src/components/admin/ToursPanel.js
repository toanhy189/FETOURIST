"use client";

import { useEffect, useState } from "react";
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
import { formatDateVi, formatDuration, formatVnd } from "@/utils/format";

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
  status: "",
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

export default function ToursPanel() {
  const [categories, setCategories] = useState([]);
  const [tours, setTours] = useState([]);
  const [selectedTour, setSelectedTour] = useState(null);
  const [departures, setDepartures] = useState([]);
  const [tourForm, setTourForm] = useState(initialTourForm);
  const [departureForm, setDepartureForm] = useState(initialDepartureForm);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function loadTours() {
    const [categoryResult, tourResult] = await Promise.all([
      getCategoriesForAdmin({ limit: 50 }),
      getToursForAdmin({ limit: 20, sortBy: "createdAt", sortOrder: "desc" }),
    ]);

    setCategories(categoryResult.categories);
    setTours(tourResult.tours);
  }

  async function handleSelectTour(tourIdOrSlug) {
    setError("");
    setMessage("");

    try {
      const detail = await getTourDetailForAdmin(tourIdOrSlug);
      const departureResult = await getTourDeparturesForAdmin(detail.id, { limit: 30 });
      setSelectedTour(detail);
      setDepartures(departureResult.departures);
      setTourForm({
        id: detail.id,
        title: detail.title,
        destination: detail.destination,
        departureLocation: detail.departureLocation,
        category: detail.category?.id || "",
        durationDays: detail.durationDays,
        durationNights: detail.durationNights,
        transport: detail.transport,
        price: detail.price,
        discountPrice: detail.discountPrice ?? "",
        maxGroupSize: detail.maxGroupSize,
        availableSeats: detail.availableSeats,
        startDates: detail.startDates.join("\n"),
        highlights: detail.highlights.join("\n"),
        itinerary: stringifyItinerary(detail.itinerary),
        includedServices: detail.includedServices.join("\n"),
        excludedServices: detail.excludedServices.join("\n"),
        status: detail.status,
        meetingPoint: "",
        departureNote: "",
      });
    } catch (actionError) {
      setError(actionError.message || "Khong tai duoc chi tiet tour.");
    }
  }

  async function handleSubmitTour(event) {
    event.preventDefault();
    setError("");
    setMessage("");

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
        itinerary: JSON.parse(tourForm.itinerary || "[]"),
        includedServices: splitValues(tourForm.includedServices),
        excludedServices: splitValues(tourForm.excludedServices),
        status: tourForm.status,
      };

      if (tourForm.id) {
        await updateTour(tourForm.id, payload);
        setMessage("Da cap nhat tour.");
        await handleSelectTour(tourForm.id);
      } else {
        payload.startDates = splitValues(tourForm.startDates);
        payload.meetingPoint = tourForm.meetingPoint;
        payload.departureNote = tourForm.departureNote;
        const created = await createTour(payload);
        setMessage("Da tao tour moi.");
        setTourForm(initialTourForm);
        await loadTours();
        await handleSelectTour(created.id);
      }
    } catch (actionError) {
      setError(actionError.message || "Khong luu duoc tour.");
    }
  }

  async function handleDeleteTour(tourId) {
    try {
      await deleteTour(tourId);
      setMessage("Da xoa tour.");
      setSelectedTour(null);
      setDepartures([]);
      setTourForm(initialTourForm);
      await loadTours();
    } catch (actionError) {
      setError(actionError.message || "Khong xoa duoc tour.");
    }
  }

  async function handleUploadImages() {
    if (!selectedTour?.id || selectedFiles.length === 0) {
      return;
    }

    try {
      await uploadTourImages(selectedTour.id, selectedFiles);
      setMessage("Da upload anh cho tour.");
      setSelectedFiles([]);
      await handleSelectTour(selectedTour.id);
    } catch (actionError) {
      setError(actionError.message || "Khong upload duoc anh.");
    }
  }

  async function handleSubmitDeparture(event) {
    event.preventDefault();
    if (!selectedTour?.id) {
      return;
    }

    try {
      const payload = {
        departureDate: departureForm.departureDate,
        returnDate: departureForm.returnDate || undefined,
        seatCapacity: departureForm.seatCapacity ? Number(departureForm.seatCapacity) : undefined,
        price: departureForm.price ? Number(departureForm.price) : undefined,
        discountPrice:
          departureForm.discountPrice === "" ? undefined : Number(departureForm.discountPrice),
        meetingPoint: departureForm.meetingPoint,
        note: departureForm.note,
        status: departureForm.status || undefined,
      };

      if (departureForm.id) {
        await updateTourDeparture(selectedTour.id, departureForm.id, payload);
        setMessage("Da cap nhat departure.");
      } else {
        await createTourDeparture(selectedTour.id, payload);
        setMessage("Da tao departure.");
      }

      setDepartureForm(initialDepartureForm);
      await handleSelectTour(selectedTour.id);
    } catch (actionError) {
      setError(actionError.message || "Khong luu duoc departure.");
    }
  }

  async function handleDeleteDeparture(departureId) {
    if (!selectedTour?.id) {
      return;
    }

    try {
      await deleteTourDeparture(selectedTour.id, departureId);
      setMessage("Da xoa departure.");
      await handleSelectTour(selectedTour.id);
    } catch (actionError) {
      setError(actionError.message || "Khong xoa duoc departure.");
    }
  }

  useEffect(() => {
    let isMounted = true;

    async function bootstrapTours() {
      try {
        const [categoryResult, tourResult] = await Promise.all([
          getCategoriesForAdmin({ limit: 50 }),
          getToursForAdmin({ limit: 20, sortBy: "createdAt", sortOrder: "desc" }),
        ]);

        if (!isMounted) {
          return;
        }

        setCategories(categoryResult.categories);
        setTours(tourResult.tours);
      } catch (loadError) {
        if (isMounted) {
          setError(loadError.message || "Khong tai duoc du lieu tours.");
        }
      }
    }

    void bootstrapTours();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section className="space-y-6 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
      <div>
        <h2 className="font-display text-3xl text-slate-900">Tour + Departure manager</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Panel nay dung admin list/detail/create/update/delete tour, upload anh va CRUD departure.
        </p>
      </div>

      {message ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div> : null}
      {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

      <div className="grid gap-6 lg:grid-cols-[1fr,1fr]">
        <form onSubmit={handleSubmitTour} className="space-y-3 rounded-3xl border border-slate-200 bg-slate-50 p-5">
          <h3 className="text-lg font-semibold text-slate-900">{tourForm.id ? "Cap nhat tour" : "Tao tour moi"}</h3>
          <input value={tourForm.title} onChange={(event) => setTourForm((current) => ({ ...current, title: event.target.value }))} placeholder="Ten tour" className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm" required />
          <div className="grid gap-3 sm:grid-cols-2">
            <input value={tourForm.destination} onChange={(event) => setTourForm((current) => ({ ...current, destination: event.target.value }))} placeholder="Diem den" className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm" required />
            <input value={tourForm.departureLocation} onChange={(event) => setTourForm((current) => ({ ...current, departureLocation: event.target.value }))} placeholder="Noi khoi hanh" className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm" required />
          </div>
          <select value={tourForm.category} onChange={(event) => setTourForm((current) => ({ ...current, category: event.target.value }))} className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm" required>
            <option value="">Chon category</option>
            {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </select>
          <div className="grid gap-3 sm:grid-cols-3">
            <input value={tourForm.durationDays} onChange={(event) => setTourForm((current) => ({ ...current, durationDays: event.target.value }))} placeholder="So ngay" className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm" />
            <input value={tourForm.durationNights} onChange={(event) => setTourForm((current) => ({ ...current, durationNights: event.target.value }))} placeholder="So dem" className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm" />
            <select value={tourForm.transport} onChange={(event) => setTourForm((current) => ({ ...current, transport: event.target.value }))} className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm">
              <option value="mixed">mixed</option><option value="bus">bus</option><option value="plane">plane</option><option value="train">train</option><option value="ship">ship</option><option value="car">car</option>
            </select>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <input value={tourForm.price} onChange={(event) => setTourForm((current) => ({ ...current, price: event.target.value }))} placeholder="Gia goc" className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm" />
            <input value={tourForm.discountPrice} onChange={(event) => setTourForm((current) => ({ ...current, discountPrice: event.target.value }))} placeholder="Gia giam" className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm" />
            <select value={tourForm.status} onChange={(event) => setTourForm((current) => ({ ...current, status: event.target.value }))} className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm">
              <option value="draft">draft</option><option value="published">published</option><option value="closed">closed</option>
            </select>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <input value={tourForm.maxGroupSize} onChange={(event) => setTourForm((current) => ({ ...current, maxGroupSize: event.target.value }))} placeholder="Max group size" className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm" />
            <input value={tourForm.availableSeats} onChange={(event) => setTourForm((current) => ({ ...current, availableSeats: event.target.value }))} placeholder="Available seats" className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm" />
          </div>
          {!tourForm.id ? (
            <>
              <textarea value={tourForm.startDates} onChange={(event) => setTourForm((current) => ({ ...current, startDates: event.target.value }))} placeholder="Start dates, moi dong 1 ngay ISO" className="min-h-20 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm" />
              <div className="grid gap-3 sm:grid-cols-2">
                <input value={tourForm.meetingPoint} onChange={(event) => setTourForm((current) => ({ ...current, meetingPoint: event.target.value }))} placeholder="Meeting point mac dinh" className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm" />
                <input value={tourForm.departureNote} onChange={(event) => setTourForm((current) => ({ ...current, departureNote: event.target.value }))} placeholder="Departure note mac dinh" className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm" />
              </div>
            </>
          ) : null}
          <textarea value={tourForm.highlights} onChange={(event) => setTourForm((current) => ({ ...current, highlights: event.target.value }))} placeholder="Highlights, moi dong 1 muc" className="min-h-20 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm" />
          <textarea value={tourForm.itinerary} onChange={(event) => setTourForm((current) => ({ ...current, itinerary: event.target.value }))} placeholder='Itinerary JSON, vd [{"day":1,"title":"Ngay 1","description":"..."}]' className="min-h-28 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm" />
          <textarea value={tourForm.includedServices} onChange={(event) => setTourForm((current) => ({ ...current, includedServices: event.target.value }))} placeholder="Included services, moi dong 1 muc" className="min-h-20 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm" />
          <textarea value={tourForm.excludedServices} onChange={(event) => setTourForm((current) => ({ ...current, excludedServices: event.target.value }))} placeholder="Excluded services, moi dong 1 muc" className="min-h-20 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm" />
          <div className="flex flex-wrap gap-2">
            <button type="submit" className="rounded-full bg-sky-700 px-4 py-2 text-sm font-semibold text-white">{tourForm.id ? "Luu tour" : "Tao tour"}</button>
            {tourForm.id ? <button type="button" onClick={() => setTourForm(initialTourForm)} className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">Tao tour moi</button> : null}
          </div>
        </form>

        <div className="space-y-4">
          {tours.map((tour) => (
            <article key={tour.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-sky-700">{tour.status}</p>
                  <h3 className="mt-1 text-lg font-semibold text-slate-900">{tour.title}</h3>
                  <p className="mt-1 text-sm text-slate-500">{tour.destination} • {formatDuration(tour.durationDays, tour.durationNights)}</p>
                  <p className="mt-1 text-sm font-semibold text-sky-800">{formatVnd(tour.displayPrice)}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => handleSelectTour(tour.id)} className="rounded-full border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700">Chi tiet</button>
                  <button type="button" onClick={() => handleDeleteTour(tour.id)} className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-sm font-semibold text-rose-700">Xoa</button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>

      {selectedTour ? (
        <div className="grid gap-6 lg:grid-cols-[1fr,1fr]">
          <div className="space-y-4 rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <h3 className="text-lg font-semibold text-slate-900">Upload anh cho tour</h3>
            <input type="file" multiple onChange={(event) => setSelectedFiles(Array.from(event.target.files || []))} className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm" />
            <button type="button" onClick={handleUploadImages} className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">Upload anh</button>
          </div>

          <form onSubmit={handleSubmitDeparture} className="space-y-3 rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <h3 className="text-lg font-semibold text-slate-900">{departureForm.id ? "Cap nhat departure" : "Tao departure moi"}</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <input value={departureForm.departureDate} onChange={(event) => setDepartureForm((current) => ({ ...current, departureDate: event.target.value }))} placeholder="Departure date ISO" className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm" required />
              <input value={departureForm.returnDate} onChange={(event) => setDepartureForm((current) => ({ ...current, returnDate: event.target.value }))} placeholder="Return date ISO" className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm" />
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <input value={departureForm.seatCapacity} onChange={(event) => setDepartureForm((current) => ({ ...current, seatCapacity: event.target.value }))} placeholder="Seat capacity" className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm" />
              <input value={departureForm.price} onChange={(event) => setDepartureForm((current) => ({ ...current, price: event.target.value }))} placeholder="Price" className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm" />
              <input value={departureForm.discountPrice} onChange={(event) => setDepartureForm((current) => ({ ...current, discountPrice: event.target.value }))} placeholder="Discount" className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm" />
            </div>
            <input value={departureForm.meetingPoint} onChange={(event) => setDepartureForm((current) => ({ ...current, meetingPoint: event.target.value }))} placeholder="Meeting point" className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm" />
            <input value={departureForm.note} onChange={(event) => setDepartureForm((current) => ({ ...current, note: event.target.value }))} placeholder="Note" className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm" />
            <div className="flex flex-wrap gap-2">
              <button type="submit" className="rounded-full bg-sky-700 px-4 py-2 text-sm font-semibold text-white">{departureForm.id ? "Luu departure" : "Tao departure"}</button>
              <button type="button" onClick={() => setDepartureForm(initialDepartureForm)} className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">Reset</button>
            </div>
          </form>
        </div>
      ) : null}

      {selectedTour ? (
        <div className="space-y-3">
          <h3 className="font-display text-2xl text-slate-900">Departures cua {selectedTour.title}</h3>
          {departures.map((departure) => (
            <article key={departure.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-sky-700">{departure.status}</p>
                  <h4 className="mt-1 text-lg font-semibold text-slate-900">
                    {formatDateVi(departure.departureDate)} - {formatDateVi(departure.returnDate)}
                  </h4>
                  <p className="mt-1 text-sm text-slate-500">Con lai {departure.remainingSeats} cho</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => setDepartureForm({
                    id: departure.id,
                    departureDate: departure.departureDate?.slice(0, 10) || "",
                    returnDate: departure.returnDate?.slice(0, 10) || "",
                    seatCapacity: departure.seatCapacity || "",
                    price: departure.price || "",
                    discountPrice: departure.discountPrice ?? "",
                    meetingPoint: departure.meetingPoint || "",
                    note: departure.note || "",
                    status: departure.status || "",
                  })} className="rounded-full border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700">Sua</button>
                  <button type="button" onClick={() => handleDeleteDeparture(departure.id)} className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-sm font-semibold text-rose-700">Xoa</button>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
