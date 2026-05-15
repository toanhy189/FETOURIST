import { notFound } from "next/navigation";
import AdminConsole from "@/components/admin/AdminConsole";
import { resolveAdminRouteFromSegments } from "@/components/admin/adminNavigation";

export const metadata = {
  title: "Quản Trị | TRAVELPTIT",
  description: "Màn hình admin để quản lý user, category, tour, departure và booking.",
};

export default async function AdminPage({ params }) {
  const { segments = [] } = await params;
  const activeRoute = resolveAdminRouteFromSegments(segments);

  if (!activeRoute) {
    notFound();
  }

  return <AdminConsole />;
}
