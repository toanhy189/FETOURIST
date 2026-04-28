import "./globals.css";
import SiteShell from "@/components/SiteShell";
import { AppProvider } from "@/components/providers/AppProvider";

export const metadata = {
  title: "BETOURIST | Website Du Lich",
  description: "Giao dien website du lich co ket noi du lieu that tu backend BETOURIST.",
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
