import AuthFormCard from "@/components/auth/AuthFormCard";

export const metadata = {
  title: "Đăng Nhập | TRAVELPTIT",
  description: "Đăng nhập để truy cập booking, payment, favorite và khu vực quản trị.",
};

export default function LoginPage() {
  return <AuthFormCard mode="login" />;
}
