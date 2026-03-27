import Link from "next/link";
import { getCategories } from "@/apiService/categories";
import { getTours } from "@/apiService/tours";
import Image from "next/image";
import SearchForm from "@/components/searchForm/searchForm";
export const dynamic = "force-dynamic";

async function loadHomePageData() {
  const [categoryResult, tourResult] = await Promise.allSettled([
    getCategories({ limit: 50 }), 
    getTours({ limit: 6, sortBy: "createdAt", sortOrder: "desc" }),
  ]);

  return {
    categories: categoryResult.status === "fulfilled" ? categoryResult.value.categories : [],
    featuredTours: tourResult.status === "fulfilled" ? tourResult.value.tours : [],
    errors: [categoryResult, tourResult]
      .filter((result) => result.status === "rejected")
      .map((result) => result.reason?.message || "Không thể tải dữ liệu từ server."),
  };
}

const formatPrice = (price) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
};

const formatDate = (dateString) => {
  if (!dateString) return "Đang cập nhật";
  const date = new Date(dateString);
  return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
};

export default async function Home() {
  const { categories, featuredTours, errors } = await loadHomePageData();
  
  const parentCategories = categories.filter((cat) => !cat.parentCategory);

  return (
    <div className="pb-10 bg-slate-50 min-h-screen">
      
      {/* --- BANNER KHU VỰC TRÊN CÙNG --- */}
      <div className="w-[100vw] h-[200px] md:h-[280px] lg:h-[320px] relative left-1/2 -translate-x-1/2">
        <Image 
          src="/sl_260302_top-banner1.webp"
          alt="Banner Khuyến Mãi" 
          fill
          className="object-cover object-center"
          priority
        />
      </div>

      {/* --- 1. KHUNG TÌM KIẾM --- */}
      {/* Dùng relative, z-10 và -mt-16 (hoặc -mt-24) để kéo form đè lên banner */}
      <SearchForm/>

      {/* --- WRAPPER CHỨA CÁC NỘI DUNG BÊN DƯỚI --- */}
      <div className="space-y-12 mt-12">
        {errors.length > 0 && (
          <section className="container mx-auto px-4">
            <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-4 text-sm text-amber-900">
              {errors.map((e, i) => <p key={i}>{e}</p>)}
            </div>
          </section>
        )}

        {/* --- 2. DANH MỤC CHA --- */}
        <section className="container mx-auto px-4 space-y-6 mt-8">
          <h2 className="font-display text-2xl font-bold text-slate-800 uppercase text-center md:text-left">
            Khám Phá Danh Mục Nổi Bật
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {parentCategories.map((category) => (
              <Link
                key={category.id}
                href={`/danh-muc?category=${category.slug}`}
                className="group relative h-64 md:h-80 w-full overflow-hidden rounded-2xl bg-slate-200 block shadow-md"
              >
                <img 
                  src={category.imageUrl || "https://placehold.co/600x400?text=No+Image"} 
                  alt={category.name}
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <h3 className="text-xl font-bold text-white uppercase tracking-wide text-center drop-shadow-lg">
                    {category.name}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="container mx-auto px-4 my-16">
          <div className="relative w-full rounded-[2.5rem] overflow-hidden shadow-xl py-20 px-6 flex flex-col items-center justify-center text-center bg-white border border-slate-100">
            
            {/* Lớp nền sáng với gradient nhẹ nhàng */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-emerald-50/50 to-teal-100/30"></div>
            
            {/* Hiệu ứng ánh sáng trang trí (Glow nhạt) */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-teal-200/40 rounded-full blur-[100px] pointer-events-none"></div>
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-200/40 rounded-full blur-[100px] pointer-events-none"></div>

            {/* Nội dung chính */}
            <div className="relative z-10 flex flex-col items-center gap-6">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight drop-shadow-sm">
                Khám phá muôn nơi cùng <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600 drop-shadow-none">TRAVELPTIT</span>
              </h2>
              
              <div className="flex flex-wrap items-center justify-center gap-3 text-slate-600 text-sm md:text-base font-medium">
                <span>Website có</span>
                
                {/* Badge con số nổi bật (nền xanh nhạt, chữ xanh đậm) */}
                <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 px-5 py-2 rounded-full font-bold shadow-sm">
                  24,080+
                </span>
                
                <span>điểm đến phổ biến nhất mà bạn sẽ nhớ mãi</span>
              </div>
            </div>

          </div>
        </section>

        {/* --- 3. DANH SÁCH TOUR --- */}
        <section className="container mx-auto px-4 space-y-6">
          <h2 className="font-display text-2xl font-bold text-slate-800 uppercase text-center md:text-left">
            Tour nổi bật
          </h2>
          
          {featuredTours.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredTours.map((tour) => (
                <div key={tour.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl transition-shadow overflow-hidden flex flex-col relative group">
                  
                  <div className="relative h-56 w-full">
                    <Link href={`/tours/${tour.slug}`}>
                      <img 
                        src={tour.imageUrl || "https://placehold.co/600x400?text=No+Image"} 
                        alt={tour.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </Link>
                    
                    <button className="absolute top-3 left-3 w-8 h-8 flex items-center justify-center rounded-full bg-black/20 text-white hover:bg-black/40 transition">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
                      </svg>
                    </button>

                    <div className="absolute bottom-0 left-0 right-0 flex border-t-2 border-red-500/20 bg-white items-center text-sm font-semibold">
                      <div className="flex-1 flex items-center justify-center py-1.5 text-sky-700 border-r border-slate-200 gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" /></svg>
                        Giờ chót
                      </div>
                      <div className="flex-1 flex items-center justify-center py-1.5 text-red-600">
                        23:28:11
                      </div>
                    </div>
                  </div>

                  <div className="p-4 flex-1 flex flex-col gap-3">
                    <Link href={`/tours/${tour.slug}`}>
                      <h3 className="font-bold text-slate-800 text-[15px] line-clamp-2 hover:text-sky-600 transition-colors">
                        {tour.title}
                      </h3>
                    </Link>
                    
                    <div className="text-xs text-slate-500 flex items-center gap-1.5">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 0 1 0 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 0 1 0-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375Z" /></svg>
                       <span className="truncate">{tour.slug?.toUpperCase() || tour.id}</span>
                    </div>

                    <div className="text-sm text-slate-600 flex items-center gap-1.5">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-slate-400"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" /></svg>
                      Khởi hành: <span className="text-sky-700 font-medium">{tour.departureLocation}</span>
                    </div>

                    <div className="text-sm text-slate-600 flex items-center gap-1.5">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-slate-400"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" /></svg>
                      Ngày khởi hành: <span>{formatDate(tour.firstStartDate)}</span>
                    </div>

                    <div className="flex justify-between items-center text-sm text-slate-600 mt-2">
                      <div className="flex items-center gap-1.5">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-slate-400"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
                        {tour.durationDays}N{tour.durationNights}Đ
                      </div>
                      <div className="flex items-center gap-1.5">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-slate-400"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" /></svg>
                        Số chỗ còn: <span className="text-red-600 font-bold">{tour.availableSeats}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border-t border-slate-100 flex items-end justify-between">
                    <div>
                      <div className="text-xs text-slate-400 flex gap-1">
                        Giá từ: <span className="line-through">{formatPrice(tour.price)}</span>
                      </div>
                      <div className="text-xl font-bold text-red-600">
                        {formatPrice(tour.displayPrice)}
                      </div>
                    </div>
                    
                    <Link 
                      href={`/tours/${tour.slug}`}
                      className="border border-red-500 text-red-600 px-5 py-2 rounded-md font-semibold text-sm hover:bg-red-50 transition-colors"
                    >
                      Đặt ngay
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
              Chưa có tour published để hiển thị.
            </div>
          )}
        </section>
      </div>

    </div>
  );
}