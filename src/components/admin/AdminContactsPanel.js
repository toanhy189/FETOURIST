"use client";

import { useEffect, useMemo, useState } from "react";
import { getBookingsForAdmin } from "@/apiService/bookings";
import { formatDateTimeVi, formatDateVi } from "@/utils/format";

function getContactRecords(bookings) {
  return (bookings || [])
    .map((booking) => ({
      id: booking._id || booking.orderCode,
      orderCode: booking.orderCode,
      fullName:
        booking.contactInfo?.fullName || booking.user?.fullName || "Khach hang chua ro ten",
      email: booking.contactInfo?.email || booking.user?.email || "",
      phoneNumber:
        booking.contactInfo?.phoneNumber || booking.user?.phoneNumber || "Chua cap nhat",
      tourTitle: booking.tour?.title || "Tour chua xac dinh",
      departureDate: booking.departureDate || booking.departure?.departureDate || null,
      bookingStatus: booking.bookingStatus || "pending",
      specialRequest: booking.specialRequest || "",
      note: booking.note || "",
      createdAt: booking.createdAt,
    }))
    .filter((record) => record.email || record.phoneNumber);
}

function getStatusClasses(status) {
  switch (status) {
    case "confirmed":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "completed":
      return "border-sky-200 bg-sky-50 text-sky-700";
    case "cancelled":
      return "border-rose-200 bg-rose-50 text-rose-700";
    default:
      return "border-amber-200 bg-amber-50 text-amber-700";
  }
}

export default function AdminContactsPanel() {
  const [bookings, setBookings] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadContacts() {
      setLoading(true);
      setError("");

      try {
        const result = await getBookingsForAdmin({ limit: 50 });
        if (!isMounted) {
          return;
        }
        setBookings(result.bookings || []);
      } catch (loadError) {
        if (isMounted) {
          setError(loadError.message || "Khong tai duoc du lieu lien he.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    void loadContacts();

    return () => {
      isMounted = false;
    };
  }, []);

  const contacts = useMemo(() => getContactRecords(bookings), [bookings]);
  const uniqueContacts = useMemo(() => {
    return Array.from(
      new Map(
        contacts.map((contact) => [
          `${contact.email || "no-email"}-${contact.phoneNumber || "no-phone"}`,
          contact,
        ])
      ).values()
    );
  }, [contacts]);
  const contactsWithRequest = useMemo(
    () =>
      contacts.filter((contact) => Boolean(contact.specialRequest) || Boolean(contact.note)).length,
    [contacts]
  );

  return (
    <section className="space-y-6">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-700">
              Lien he
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
              Tong hop thong tin khach hang
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
              Hien tai he thong chua co inbox lien he rieng, nen workspace nay tong hop thong tin
              lien he tu cac booking moi nhat de admin de dang goi lai va chot don.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-slate-400">Tong lien he</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">
                {uniqueContacts.length}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-slate-400">Booking gan day</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">{contacts.length}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-slate-400">Can xu ly them</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">{contactsWithRequest}</p>
            </div>
          </div>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[0.9fr,1.1fr]">
        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">Kenh uu tien</h3>
          <div className="mt-4 space-y-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
              <p className="text-xs uppercase tracking-wide text-slate-400">Email dieu hanh</p>
              <p className="mt-2 text-base font-semibold text-slate-900">support@betourist.local</p>
              <p className="mt-2 text-sm text-slate-500">
                Dung lam hop thu tiep nhan yeu cau, xac nhan lich hen va gui lai thong tin chot don.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
              <p className="text-xs uppercase tracking-wide text-slate-400">So hotline</p>
              <p className="mt-2 text-base font-semibold text-slate-900">1900 0000</p>
              <p className="mt-2 text-sm text-slate-500">
                Co the doi thanh thong tin that cua doanh nghiep sau khi bo sung module lien he.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
              <p className="text-xs uppercase tracking-wide text-slate-400">Ghi chu van hanh</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Uu tien lien he cac booking `pending` co special request hoac thong tin bo sung de
                tranh bo lo don moi.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Danh sach lien he gan day</h3>
              <p className="mt-1 text-sm text-slate-500">
                Tong hop tu booking admin de doi sales hoac dieu hanh goi lai nhanh.
              </p>
            </div>
            {loading ? <p className="text-sm text-slate-400">Dang tai...</p> : null}
          </div>

          <div className="mt-5 space-y-3">
            {uniqueContacts.length > 0 ? (
              uniqueContacts.map((contact) => (
                <article
                  key={contact.id}
                  className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-base font-semibold text-slate-900">{contact.fullName}</p>
                        <span
                          className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusClasses(
                            contact.bookingStatus
                          )}`}
                        >
                          {contact.bookingStatus}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600">
                        {contact.email || "Chua co email"} | {contact.phoneNumber}
                      </p>
                      <p className="text-sm text-slate-500">
                        {contact.tourTitle}
                        {contact.departureDate
                          ? ` | Khoi hanh ${formatDateVi(contact.departureDate)}`
                          : ""}
                      </p>
                      {contact.specialRequest || contact.note ? (
                        <p className="text-sm leading-6 text-slate-600">
                          {contact.specialRequest || contact.note}
                        </p>
                      ) : null}
                    </div>

                    <div className="text-right text-xs text-slate-400">
                      <p>{contact.orderCode}</p>
                      <p className="mt-1">
                        {contact.createdAt ? formatDateTimeVi(contact.createdAt) : "Moi tao"}
                      </p>
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                Chua co thong tin lien he nao de tong hop.
              </div>
            )}
          </div>
        </section>
      </div>
    </section>
  );
}
