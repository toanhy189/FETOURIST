"use client";
import React, { useState, useEffect } from 'react';
import { getTours } from "@/apiService/tours"; 
import { useRouter, useSearchParams, usePathname } from "next/navigation";

export default function SearchForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  
  const [departureLocations, setDepartureLocations] = useState([]);
  const isHomePage = pathname === "/"; // Kiểm tra nếu đang ở trang chủ

  // Lấy dữ liệu từ URL để điền vào ô input (Giữ lại dữ liệu tìm kiếm)
  const [formData, setFormData] = useState({
    search: searchParams.get("search") || "",
    startDate: searchParams.get("startDate") || "",
    departure: searchParams.get("departure") || ""
  });

  useEffect(() => {
    // Cập nhật form khi URL thay đổi
    setFormData({
      search: searchParams.get("search") || "",
      startDate: searchParams.get("startDate") || "",
      departure: searchParams.get("departure") || ""
    });
  }, [searchParams]);

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const response = await getTours();
        if (response && response.tours) {
          const locations = response.tours
            .map(tour => tour.departureLocation)
            .filter((value, index, self) => value && self.indexOf(value) === index);
          setDepartureLocations(locations);
        }
      } catch (error) {
        console.error("Lỗi khi tải danh sách điểm khởi hành:", error);
      }
    };
    fetchLocations();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (formData.search) params.set("search", formData.search);
    if (formData.startDate) params.set("startDate", formData.startDate);
    if (formData.departure) params.set("search", formData.departure); 
    
    router.push(`/danh-muc?${params.toString()}`);
  };

  return (
    <section className={`w-full ${isHomePage ? "container mx-auto px-4 relative z-10 -mt-[100px] md:-mt-[130px] lg:-mt-[150px]" : ""}`}>
      <div className={isHomePage ? "max-w-2xl" : "w-full"}>
        
        {/* Chỉ hiện tiêu đề ở trang chủ */}
        {isHomePage && (
          <div className="mb-4 text-black drop-shadow-md px-1">
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-1 tracking-wide leading-tight">
              Hơn 1000+ Tour, Khám Phá Ngay
            </h1>
            <p className="text-sm md:text-base font-light opacity-90">
              - Giá tốt – hỗ trợ 24/7 – khắp nơi .
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-2.5">
          
          {/* Hàng 1: Bạn muốn đi đâu */}
          <div className="flex items-center bg-white rounded-lg px-4 py-3 shadow-md border border-slate-100">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-slate-400 mr-3 shrink-0">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
            <input 
              type="text" 
              name="search"
              value={formData.search}
              onChange={handleInputChange}
              placeholder="Bạn muốn đi đâu?" 
              className="w-full outline-none text-slate-700 bg-transparent placeholder:text-slate-400 text-sm"
            />
          </div>

          {/* Linh hoạt theo Layout */}
          <div className={`flex ${isHomePage ? "flex-row" : "flex-col"} gap-2.5`}>
            
            {/* Cột: Ngày khởi hành */}
            <div className="flex-1 flex items-center bg-white rounded-lg px-4 py-2.5 shadow-md border border-slate-100 min-w-0">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-slate-400 mr-2 shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
              </svg>
              <div className="flex flex-col w-full min-w-0">
                <span className="text-[10px] text-slate-400 leading-none mb-0.5 uppercase font-bold">Ngày đi</span>
                <input 
                  type="date" 
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleInputChange}
                  className="w-full text-slate-700 outline-none text-xs font-semibold bg-transparent cursor-pointer"
                />
              </div>
            </div>

            {/* Cột: Khởi hành từ */}
            <div className="flex-1 flex items-center bg-white rounded-lg px-4 py-2.5 shadow-md border border-slate-100 min-w-0">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-slate-400 mr-2 shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
              </svg>
              <div className="flex flex-col w-full min-w-0">
                <span className="text-[10px] text-slate-400 leading-none mb-0.5 uppercase font-bold">Khởi hành</span>
                <select 
                  name="departure"
                  value={formData.departure}
                  onChange={handleInputChange}
                  className="w-full text-slate-700 outline-none text-xs font-semibold bg-transparent cursor-pointer"
                >
                  <option value="">Tất cả</option>
                  {departureLocations.map((location, index) => (
                    <option key={index} value={location}>{location}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Nút Tìm kiếm */}
            <button 
              type="submit" 
              className={`${isHomePage ? "px-8" : "w-full"} bg-[#ff8900] hover:bg-[#e67b00] text-white font-bold py-3 rounded-lg transition-all shadow-lg text-sm shrink-0 active:scale-95`}
            >
              Tìm
            </button>

          </div>
        </form>
      </div>
    </section>
  );
}