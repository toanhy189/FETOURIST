import { getCategories } from "@/apiService/categories";
import { getTours } from "@/apiService/tours";
import TourCard from "@/components/TourCard";
import FilterSidebar from "@/components/tour/FilterSidebar";

export const dynamic = "force-dynamic";

export default async function DanhMucPage({ searchParams }) {
  const params = await searchParams;
  const activeCategory = params?.category || "";
  const keyword = params?.search || "";
  const departure = params?.departure || "";

  // 1. Lấy dữ liệu song song từ Server
  const [categoryResult, tourResult] = await Promise.all([
    getCategories({ limit: 50 }),
    getTours({ 
      category: activeCategory, 
      search: keyword,
      departure: departure,
      limit: 20 
    }),
  ]);

  const categories = categoryResult?.categories || [];
  const tours = tourResult?.tours || [];

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="container mx-auto px-4 py-8">
        
        {/* --- LAYOUT CHÍNH --- */}
        <div className="flex flex-col lg:flex-row items-start gap-8">
          
          {/* 1. SIDEBAR (Cố định 300px trên Desktop) */}
          <aside className="w-full lg:w-[300px] lg:sticky lg:top-24 shrink-0">
            <FilterSidebar categories={categories} />
          </aside>

          {/* 2. NỘI DUNG CHÍNH (Tự giãn hết không gian còn lại) */}
          <main className="flex-1 w-full">
            
            {/* Header thông tin tìm kiếm */}
            <div className="mb-6 rounded-2xl bg-white p-6 shadow-sm border border-slate-100">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-black text-slate-800 tracking-tight">
                    {keyword ? `Kết quả cho: "${keyword}"` : activeCategory ? `Tour ${activeCategory}` : "Tất cả chương trình Tour"}
                  </h1>
                  <p className="text-sm text-slate-500 mt-1 flex items-center gap-2">
                    <span className="inline-block w-2 h-2 rounded-full bg-green-500"></span>
                    Tìm thấy <span className="font-bold text-sky-600">{tours.length}</span> tour phù hợp với yêu cầu của bạn
                  </p>
                </div>
                
                {/* Badge trạng thái lọc nhanh nếu có */}
                {departure && (
                   <div className="bg-sky-50 text-sky-700 px-4 py-2 rounded-xl text-xs font-bold border border-sky-100">
                      📍 Khởi hành từ: {departure}
                   </div>
                )}
              </div>
            </div>

            {/* DANH SÁCH TOUR: Hiển thị 2 cột trên màn hình lớn để lấp đầy khoảng trống */}
            {tours.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3 gap-6">
                {tours.map((tour) => (
                  <TourCard key={tour.id} tour={tour} />
                ))}
              </div>
            ) : (
              <div className="rounded-[2.5rem] bg-white p-24 text-center border-2 border-dashed border-slate-200 shadow-inner">
                <div className="text-6xl mb-6">🔍</div>
                <h3 className="text-xl font-bold text-slate-800">Rất tiếc, không tìm thấy tour!</h3>
                <p className="text-slate-500 mt-2">Bạn hãy thử thay đổi tiêu chí lọc hoặc từ khóa tìm kiếm khác nhé.</p>
              </div>
            )}
          </main>

        </div>
      </div>
    </div>
  );
}