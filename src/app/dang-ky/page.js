import AuthFormCard from "@/components/auth/AuthFormCard";

export const metadata = {
  title: "Đăng Ký | TRAVELPTIT",
  description: "Tạo tài khoản TRAVELPTIT để đặt tour, thanh toán và theo dõi thông báo.",
};

export default function RegisterPage() {
  // Page nay chi dong vai tro khai bao metadata va bat AuthFormCard
  // vao mode register de tai su dung cung 1 component auth.
  return <AuthFormCard mode="register" />;
}
