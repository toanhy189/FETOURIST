"use client";

import { useState } from "react";
import CategoriesPanel from "@/components/admin/CategoriesPanel";
import ToursPanel from "@/components/admin/ToursPanel";
import { cn } from "@/utils/cn";

const tourTabs = [
  {
    key: "tours",
    label: "Tours va departures",
    description: "Quan ly tour, departure va upload anh theo luong admin hien co.",
  },
  {
    key: "categories",
    label: "Danh muc tour",
    description: "Giu nguyen form CRUD category va sort order trong cung mot khu vuc.",
  },
];

export default function AdminTourWorkspace() {
  const [activeTab, setActiveTab] = useState("tours");

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap gap-3">
          {tourTabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "rounded-2xl border px-4 py-3 text-left transition",
                activeTab === tab.key
                  ? "border-sky-300 bg-sky-50 text-sky-900"
                  : "border-slate-200 bg-white text-slate-600 hover:border-sky-200 hover:text-sky-800"
              )}
            >
              <span className="block text-sm font-semibold">{tab.label}</span>
              <span className="mt-1 block text-xs leading-5 text-slate-500">
                {tab.description}
              </span>
            </button>
          ))}
        </div>
      </section>

      {activeTab === "tours" ? <ToursPanel /> : null}
      {activeTab === "categories" ? <CategoriesPanel /> : null}
    </div>
  );
}
