import AuthFormCard from "@/components/auth/AuthFormCard";

export const metadata = {
  title: "Dang Nhap | BETOURIST",
  description: "Dang nhap de truy cap booking, payment, favorite va khu vuc quan tri.",
};

export default function LoginPage() {
  return <AuthFormCard mode="login" />;
}
