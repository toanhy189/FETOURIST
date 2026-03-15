import AuthFormCard from "@/components/auth/AuthFormCard";

export const metadata = {
  title: "Dang Ky | BETOURIST",
  description: "Tao tai khoan BETOURIST de dat tour, thanh toan va theo doi thong bao.",
};

export default function RegisterPage() {
  // Page nay chi dong vai tro khai bao metadata va bat AuthFormCard
  // vao mode register de tai su dung cung 1 component auth.
  return <AuthFormCard mode="register" />;
}
