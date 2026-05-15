import "./globals.css";
import SiteShell from "@/components/SiteShell";
import { AppProvider } from "@/components/providers/AppProvider";

export const metadata = {
  title: "TRAVELPTIT | Website Du Lịch",
  description: "Giao diện website du lịch có kết nối dữ liệu thật từ backend TRAVELPTIT.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi">
      <body className="antialiased">
        <AppProvider>
          <SiteShell>{children}</SiteShell>
        </AppProvider>
      </body>
    </html>
  );
}
