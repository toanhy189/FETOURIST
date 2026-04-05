"use client";

import ToursPanel from "@/components/admin/ToursPanel";

export default function AdminTourWorkspace({ initialTourView = "form" }) {
  // Workspace này chỉ còn nhiệm vụ nhận tab đầu vào từ sidebar
  // rồi chuyển xuống ToursPanel.
  return <ToursPanel initialView={initialTourView} />;
}
