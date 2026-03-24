"use client";

import { useState } from "react";
import AdminContactsPanel from "@/components/admin/AdminContactsPanel";
import AdminDashboard from "@/components/admin/AdminDashboard";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminTopbar from "@/components/admin/AdminTopbar";
import AdminTourWorkspace from "@/components/admin/AdminTourWorkspace";
import BookingsPanel from "@/components/admin/BookingsPanel";
import UsersPanel from "@/components/admin/UsersPanel";
import { useAppContext } from "@/components/providers/AppProvider";

const navItems = [
  {
    key: "dashboard",
    label: "Dashboard",
    hint: "Tong hop KPI, booking moi va diem den dang no luc.",
    description:
      "Theo doi KPI van hanh, top tours duoc dat va danh sach booking moi nhat trong mot man hinh.",
  },
  {
    key: "admins",
    label: "Quản lý Admin",
    hint: "Kiem soat danh sach tai khoan quan tri va nguoi van hanh.",
    description:
      "Tong hop cac tai khoan role admin de doi chieu quyen truy cap va phan cong van hanh.",
  },
  {
    key: "users",
    label: "Quản lý người dùng",
    hint: "Nhin nhanh toan bo tai khoan user dang ky trong he thong.",
    description:
      "Theo doi thong tin user, thoi diem tao tai khoan va du lieu lien lac phuc vu booking.",
  },
  {
    key: "tours",
    label: "Quản lý tour",
    hint: "Gom tour, departure va danh muc trong cung mot khu vuc.",
    description:
      "Giu nguyen cac field CRUD tour, departure va category nhung sap xep lai theo workspace moi.",
  },
  {
    key: "bookings",
    label: "Quản lý Booking",
    hint: "Cap nhat don dat, giao dich va tinh trang thanh toan.",
    description:
      "Dieu hanh booking, cap nhat transaction va doi soat thong tin lien he cua khach hang.",
  },
  {
    key: "contacts",
    label: "Liên hệ",
    hint: "Tong hop thong tin lien lac tu booking cho doi sales va CSKH.",
    description:
      "Tiep can nhanh danh sach lien he va cac ghi chu booking trong khi chua co module inbox rieng.",
  },
];

export default function AdminConsole() {
  const { currentUser, isAuthenticated, isAdmin } = useAppContext();
  const [activeTab, setActiveTab] = useState("dashboard");
  const activeItem = navItems.find((item) => item.key === activeTab) || navItems[0];

  if (!isAuthenticated || !isAdmin) {
    return (
      <section className="mx-auto mt-12 max-w-3xl rounded-[2rem] border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h1 className="font-display text-4xl text-slate-900">Khu vực quản trị</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Trang này chỉ dành cho tài khoản Admin đã đăng nhập
        </p>
      </section>
    );
  }

  function renderActivePanel() {
    if (activeTab === "dashboard") {
      return <AdminDashboard />;
    }

    if (activeTab === "admins") {
      return (
        <UsersPanel
          roleFilter="admin"
          title="Quan ly Admin"
          description="Danh sach cac tai khoan admin hien co, dung de doi chieu quyen truy cap va phan cong van hanh."
        />
      );
    }

    if (activeTab === "users") {
      return (
        <UsersPanel
          roleFilter="user"
          title="Quan ly nguoi dung"
          description="Tong hop toan bo tai khoan user dang ky, ho tro doi sales va CSKH tra cuu nhanh thong tin khach."
        />
      );
    }

    if (activeTab === "tours") {
      return <AdminTourWorkspace />;
    }

    if (activeTab === "bookings") {
      return <BookingsPanel />;
    }

    return <AdminContactsPanel />;
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="flex min-h-screen flex-col lg:flex-row">
        <AdminSidebar
          items={navItems}
          activeKey={activeTab}
          onSelect={setActiveTab}
          currentUser={currentUser}
        />

        <div className="flex min-w-0 flex-1 flex-col lg:pl-72">
          <AdminTopbar
            title={activeItem.label}
            description={activeItem.description}
            currentUser={currentUser}
          />

          <main className="flex-1 p-4 md:p-6">{renderActivePanel()}</main>
        </div>
      </div>
    </div>
  );
}
