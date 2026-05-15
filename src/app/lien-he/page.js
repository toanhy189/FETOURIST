"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { createContactMessage } from "@/apiService/contacts";
import { BrandMark } from "@/components/BrandLogo";
import { useAppContext } from "@/components/providers/AppProvider";

function UserIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 13.5a4.25 4.25 0 1 0 0-8.5 4.25 4.25 0 0 0 0 8.5Z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4.5 19.5a7.5 7.5 0 0 1 15 0"
      />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M5.5 4.5h3l1.5 4-2 1.8a15.8 15.8 0 0 0 5.7 5.7l1.8-2 4 1.5v3a1.5 1.5 0 0 1-1.6 1.5c-7.5-.5-13.4-6.4-13.9-13.9A1.5 1.5 0 0 1 5.5 4.5Z"
      />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 7.5A1.5 1.5 0 0 1 5.5 6h13A1.5 1.5 0 0 1 20 7.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 16.5v-9Z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" d="m5 8 7 5 7-5" />
    </svg>
  );
}

function MessageIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M7 18.5c-1.7 0-3-1.3-3-3v-7c0-1.7 1.3-3 3-3h10c1.7 0 3 1.3 3 3v7c0 1.7-1.3 3-3 3H10l-4 2v-2H7Z"
      />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="currentColor">
      <path d="M3.4 11.2 19.8 4.3a1 1 0 0 1 1.3 1.3l-6.9 16.4a1 1 0 0 1-1.8.1l-2.2-5.5-5.5-2.2a1 1 0 0 1 .1-1.8Z" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-7 w-7"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 3.5 5.5 6v5.8c0 4.2 2.7 8 6.5 9.2 3.8-1.2 6.5-5 6.5-9.2V6L12 3.5Z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" d="m9.5 12 1.7 1.7 3.5-3.7" />
    </svg>
  );
}

function PaperPlaneLineIcon() {
  return (
    <svg
      viewBox="0 0 80 36"
      aria-hidden="true"
      className="h-8 w-20 text-orange-500 max-sm:hidden"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 23c15 8 29 7 42-3" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeDasharray="3 5" d="M46 20c8-6 15-11 25-13" />
      <path strokeLinecap="round" strokeLinejoin="round" d="m62 5 12-2-5 12-2-7-5-3Z" />
    </svg>
  );
}

const initialFormState = {
  fullName: "",
  phoneNumber: "",
  email: "",
  message: "",
};

const galleryItems = [
  {
    src: "/images/bia1.jpg",
    alt: "Du thuyền trên vịnh biển Việt Nam",
    className: "col-span-2 h-[285px] sm:h-[330px] lg:h-[322px]",
    sizes: "(max-width: 1024px) 100vw, 42vw",
    position: "center",
  },
  {
    src: "/images/unnamed.jpg",
    alt: "Cây cầu vàng trên núi",
    className: "h-[285px] sm:h-[350px] lg:h-[364px]",
    sizes: "(max-width: 1024px) 50vw, 21vw",
    position: "center",
  },
  {
    src: "/images/photo-1469854523086-cc02fe5d8800.jpg",
    alt: "Xe du lịch trên cung đường sa mạc",
    className: "h-[285px] sm:h-[350px] lg:h-[364px]",
    sizes: "(max-width: 1024px) 50vw, 21vw",
    position: "center",
  },
];

function Field({
  label,
  required = false,
  icon,
  name,
  value,
  onChange,
  placeholder,
  multiline = false,
  type = "text",
}) {
  // Field dùng chung de form liên hệ giu cung layout icon, label va validate HTML.
  const sharedClasses =
    "w-full rounded-xl border border-slate-200 bg-white/88 pl-[3.3rem] pr-4 text-[15px] text-slate-800 shadow-[0_12px_28px_-25px_rgba(15,23,42,0.5)] outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:ring-4 focus:ring-sky-100";

  return (
    <label className="block">
      <span className="mb-2.5 block text-sm font-semibold text-slate-900">
        {label} {required ? <span className="text-rose-500">*</span> : null}
      </span>

      <span className="relative block">
        <span
          className={`pointer-events-none absolute left-4 text-sky-600 ${
            multiline ? "top-5" : "top-1/2 -translate-y-1/2"
          }`}
        >
          {icon}
        </span>

        {multiline ? (
          <textarea
            name={name}
            value={value}
            onChange={onChange}
            rows={5}
            required={required}
            placeholder={placeholder}
            className={`${sharedClasses} min-h-[122px] resize-none py-4`}
          />
        ) : (
          <input
            name={name}
            value={value}
            onChange={onChange}
            type={type}
            required={required}
            placeholder={placeholder}
            className={`${sharedClasses} h-[52px]`}
          />
        )}
      </span>
    </label>
  );
}

function GalleryImage({ item, priority = false }) {
  // Anh ben phai chi la visual thay the, khong gan nghiep vu submit liên hệ.
  return (
    <div className={`relative min-w-0 overflow-hidden rounded-[1.35rem] border-[7px] border-white shadow-[0_22px_54px_-34px_rgba(15,23,42,0.85)] ${item.className}`}>
      <Image
        src={item.src}
        alt={item.alt}
        fill
        priority={priority}
        className="object-cover"
        sizes={item.sizes}
        style={{ objectPosition: item.position }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/16 via-transparent to-white/5" />
    </div>
  );
}

export default function ContactPage() {
  const { currentUser } = useAppContext();
  const [formData, setFormData] = useState(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    // User da đăng nhập thi dien san thông tin liên hệ nhung van cho sua.
    setFormData((currentState) => ({
      ...currentState,
      fullName: currentState.fullName || currentUser?.fullName || "",
      phoneNumber: currentState.phoneNumber || currentUser?.phoneNumber || "",
      email: currentState.email || currentUser?.email || "",
    }));
  }, [currentUser?.email, currentUser?.fullName, currentUser?.phoneNumber]);

  function handleChange(event) {
    const { name, value } = event.target;
    setFormData((currentState) => ({
      ...currentState,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    // Submit tao contact message public; admin se trả lời bang man liên hệ trong dashboard.
    event.preventDefault();
    setIsSubmitting(true);
    setError("");
    setSuccessMessage("");

    try {
      await createContactMessage(formData);
      setSuccessMessage(
        "Thông tin liên hệ đã được gửi. TRAVELPTIT sẽ phản hồi bạn trong thời gian sớm nhất."
      );
      setFormData((currentState) => ({
        ...initialFormState,
        fullName: currentUser?.fullName || "",
        phoneNumber: currentUser?.phoneNumber || "",
        email: currentUser?.email || "",
      }));
    } catch (submitError) {
      setError(submitError.message || "Không gửi được liên hệ.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section
      className="travel-page-shell px-4 pb-16 pt-10 sm:px-6 lg:px-8"
      style={{ minHeight: "calc(100vh - 76px)" }}
    >
      <div className="travel-content grid min-w-0 gap-8 lg:grid-cols-[minmax(0,0.98fr)_minmax(410px,1.02fr)] lg:items-stretch xl:gap-10">
        <div className="min-w-0 rounded-[1.35rem] border border-slate-200/80 bg-white/86 p-6 shadow-[0_28px_70px_-48px_rgba(15,23,42,0.45)] backdrop-blur sm:p-8 lg:p-9">
          <div className="flex min-w-0 items-center gap-2">
            <p
              className="text-[26px] leading-none text-orange-500"
              style={{ fontFamily: '"Segoe Script", "Brush Script MT", cursive' }}
            >
              Chúng tôi luôn sẵn sàng
            </p>
            <PaperPlaneLineIcon />
          </div>

          <h1 className="mt-3 text-[2.45rem] font-black leading-[1.04] tracking-tight text-slate-900 sm:text-[3rem] lg:whitespace-nowrap xl:text-[3.35rem]">
            Liên hệ với TRAVELPTIT
          </h1>

          <p className="mt-4 max-w-2xl text-[17px] leading-7 text-slate-600">
            Đội ngũ hỗ trợ tận tâm của chúng tôi luôn sẵn sàng lắng nghe và hỗ trợ bạn.
            Đừng ngần ngại kết nối với chúng tôi qua các kênh bên dưới.
          </p>

          {error ? (
            <div className="mt-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          ) : null}

          {successMessage ? (
            <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              {successMessage}
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Field
                label="Họ và tên"
                required
                icon={<UserIcon />}
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="Nhập họ và tên"
              />

              <Field
                label="Số điện thoại"
                required
                icon={<PhoneIcon />}
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                placeholder="Nhập số điện thoại"
                type="tel"
              />
            </div>

            <Field
              label="Địa chỉ Email"
              required
              icon={<MailIcon />}
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Nhập địa chỉ email"
              type="email"
            />

            <Field
              label="Nội dung"
              required
              icon={<MessageIcon />}
              name="message"
              value={formData.message}
              onChange={handleChange}
              placeholder="Nhập nội dung bạn muốn gửi cho chúng tôi..."
              multiline
            />

            <div className="flex flex-col gap-5 pt-1 md:flex-row md:items-center md:justify-between">
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex h-14 w-full items-center justify-center gap-3 rounded-xl bg-[#ff6a00] px-7 text-base font-black text-white shadow-[0_20px_35px_-22px_rgba(249,115,22,0.95)] transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-orange-300 sm:w-[190px]"
              >
                <SendIcon />
                {isSubmitting ? "Đang gửi..." : "Gửi tin nhắn"}
              </button>

              <div className="flex items-start gap-4 text-sm text-slate-600 md:max-w-[380px]">
                <span className="mt-1 text-sky-600">
                  <ShieldIcon />
                </span>

                <div>
                  <p className="font-semibold text-slate-700">
                    Thông tin của bạn được bảo mật tuyệt đối.
                  </p>
                  <p className="mt-1 leading-6 text-slate-500">
                    Chúng tôi cam kết bảo vệ quyền riêng tư của bạn.
                  </p>
                </div>
              </div>
            </div>
          </form>
        </div>

        <aside className="relative min-w-0">
          <div className="grid h-full min-h-[640px] min-w-0 grid-cols-2 gap-5">
            <GalleryImage item={galleryItems[0]} priority />
            <GalleryImage item={galleryItems[1]} />
            <GalleryImage item={galleryItems[2]} />
          </div>

          <div className="pointer-events-none absolute left-1/2 top-[47%] z-10 flex h-[13.2rem] w-[13.2rem] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-[5px] border-sky-100 bg-white/[0.97] shadow-[0_28px_68px_-32px_rgba(15,23,42,0.52)] max-sm:h-[10.5rem] max-sm:w-[10.5rem]">
            <div className="flex h-[11.7rem] w-[11.7rem] flex-col items-center justify-center rounded-full border border-sky-100 bg-[radial-gradient(circle,_rgba(255,255,255,1)_0%,_rgba(241,248,255,1)_100%)] max-sm:h-[9.1rem] max-sm:w-[9.1rem]">
              <BrandMark className="h-[70px] w-[70px] max-sm:h-[54px] max-sm:w-[54px]" />
              <p className="mt-4 text-center text-[1.48rem] font-black uppercase leading-none tracking-normal text-slate-900 max-sm:text-[1rem]">
                TRAVELPTIT
              </p>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
