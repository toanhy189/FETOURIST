"use client";

import { useState } from "react";
import BookingsPanel from "@/components/admin/BookingsPanel";
import CategoriesPanel from "@/components/admin/CategoriesPanel";
import ToursPanel from "@/components/admin/ToursPanel";
import UsersPanel from "@/components/admin/UsersPanel";
import { useAppContext } from "@/components/providers/AppProvider";
import { cn } from "@/utils/cn";

const tabs = [
  { key: "users", label: "Users" },
  { key: "categories", label: "Categories" },
  { key: "tours", label: "Tours" },
  { key: "bookings", label: "Bookings" },
];

export default function AdminConsole() {
  const { isAuthenticated, isAdmin } = useAppContext();
  const [activeTab, setActiveTab] = useState("users");

  if (!isAuthenticated || !isAdmin) {
    return (
      <section className="mx-auto max-w-3xl rounded-[2rem] border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h1 className="font-display text-4xl text-slate-900">Khu vuc quan tri</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Trang nay chi danh cho tai khoan admin da dang nhap.
        </p>
      </section>
    );
  }

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-700">
          Admin Console
        </p>
        <h1 className="mt-3 font-display text-4xl text-slate-900">Quan tri BETOURIST</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
          Khu vuc nay gom cac panel goi truc tiep den admin endpoint cua backend:
          users, categories, tours/departures, bookings va cap nhat thanh toan.
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "rounded-full border px-4 py-2 text-sm font-semibold transition",
                activeTab === tab.key
                  ? "border-sky-300 bg-sky-100 text-sky-800"
                  : "border-slate-200 bg-white text-slate-600 hover:border-sky-300 hover:text-sky-800"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </section>

      {activeTab === "users" ? <UsersPanel /> : null}
      {activeTab === "categories" ? <CategoriesPanel /> : null}
      {activeTab === "tours" ? <ToursPanel /> : null}
      {activeTab === "bookings" ? <BookingsPanel /> : null}
    </div>
  );
}
