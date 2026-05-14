"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import AdminContactsPanel from "@/components/admin/AdminContactsPanel";
import CategoriesPanel from "@/components/admin/CategoriesPanel";
import AdminDashboard from "@/components/admin/AdminDashboard";
import AdminManagersPanel from "@/components/admin/AdminManagersPanel";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminTopbar from "@/components/admin/AdminTopbar";
import AdminTourWorkspace from "@/components/admin/AdminTourWorkspace";
import UsersPanel from "@/components/admin/UsersPanel";
import AdminSupportChatPage from "@/components/admin/chat/page.js";
import BookingsPanel from "./bookings/BookingsPanel";
import {
  ADMIN_ROUTE_MAP,
  adminNavItems,
  findActiveAdminItem,
  resolveAdminRouteFromPathname,
} from "@/components/admin/adminNavigation";
import { useAppContext } from "@/components/providers/AppProvider";

export default function AdminConsole() {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, isAuthenticated, isAdmin } = useAppContext();
  const [isSidebarOpen, setIsSidebarOpen] = useState(() =>
    typeof window === "undefined" ? true : window.innerWidth >= 1024
  );
  const activeRoute = useMemo(
    () => resolveAdminRouteFromPathname(pathname) || ADMIN_ROUTE_MAP.dashboard,
    [pathname]
  );
  const activeItem = useMemo(
    () => findActiveAdminItem(adminNavItems, activeRoute.key),
    [activeRoute.key]
  );

  useEffect(() => {
    function handleResize() {
      setIsSidebarOpen(window.innerWidth >= 1024);
    }

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  if (!isAuthenticated || !isAdmin) {
    return (
      <section className="mx-auto mt-12 max-w-3xl rounded-[2rem] border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h1 className="font-display text-4xl text-slate-900">Khu vực quản trị</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Trang này chỉ dành cho tài khoản admin đã đăng nhập.
        </p>
      </section>
    );
  }

  function renderActivePanel() {
    if (activeRoute.key === "dashboard") {
      return <AdminDashboard />;
    }

    if (activeRoute.key === "admins") {
      return <AdminManagersPanel currentUser={currentUser} />;
    }

    if (activeRoute.key === "users") {
      return (
        <UsersPanel
          roleFilter="user"
          title="Quản lý người dùng"
          currentUser={currentUser}
        />
      );
    }

    if (activeRoute.key === "categories") {
      return <CategoriesPanel />;
    }

    if (activeRoute.key === "tour-create") {
      return <AdminTourWorkspace initialTourView="form" />;
    }

    if (activeRoute.key === "tour-list") {
      return <AdminTourWorkspace initialTourView="list" />;
    }

    if (activeRoute.key === "bookings") {
      return <BookingsPanel />;
    }

    if (activeRoute.key === "support-chat") {
      return <AdminSupportChatPage />;
    }

    return <AdminContactsPanel />;
  }

  function handleNavigate(href) {
    if (!href || href === pathname) {
      return;
    }

    router.push(href);
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="flex min-h-screen flex-col lg:flex-row">
        <AdminSidebar
          items={adminNavItems}
          activeKey={activeRoute.key}
          onNavigate={handleNavigate}
          currentUser={currentUser}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        <div className={`flex min-w-0 flex-1 flex-col ${isSidebarOpen ? "lg:pl-72" : "lg:pl-0"}`}>
          <AdminTopbar
            title={activeItem.label}
            description={activeItem.description}
            currentUser={currentUser}
            isSidebarOpen={isSidebarOpen}
            onToggleSidebar={() => setIsSidebarOpen((currentValue) => !currentValue)}
          />

          <main className="flex-1 p-4 md:p-6">{renderActivePanel()}</main>
        </div>
      </div>
    </div>
  );
}
