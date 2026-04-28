import { notFound } from "next/navigation";
import AdminConsole from "@/components/admin/AdminConsole";
import { resolveAdminRouteFromSegments } from "@/components/admin/adminNavigation";

export const metadata = {
  title: "Quan Tri | TRAVELPTIT",
  description: "Man hinh admin de quan ly user, category, tour, departure va booking.",
};

export default async function AdminPage({ params }) {
  const { segments = [] } = await params;
  const activeRoute = resolveAdminRouteFromSegments(segments);

  if (!activeRoute) {
    notFound();
  }

  return <AdminConsole />;
}
