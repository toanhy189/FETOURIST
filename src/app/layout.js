import "./globals.css";
import SiteShell from "@/components/SiteShell";
import { AppProvider } from "@/components/providers/AppProvider";
// 1. Import font Montserrat hỗ trợ tiếng Việt
import { Montserrat } from "next/font/google";

const montserrat = Montserrat({
  subsets: ["vietnamese"], // Bắt buộc phải có vietnamese
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-montserrat",
});

export const metadata = {
  title: "BETOURIST | Website Du Lịch",
  description: "Giao dien website du lich co ket noi du lieu that tu backend BETOURIST",
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi">
      {/* 2. Áp dụng font vào body thông qua class variable */}
      <body className={`${montserrat.variable} font-sans antialiased`}>
        <AppProvider>
          <SiteShell>{children}</SiteShell>
        </AppProvider>
      </body>
    </html>
  );
}