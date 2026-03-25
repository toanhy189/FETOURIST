"use client"; // Thêm dòng này nếu bạn đang dùng Next.js App Router
import React, { useState, useEffect } from 'react';
import { getTours } from "@/apiService/tours"; // Đổi lại đường dẫn import file API của bạn cho đúng nhé

export default function SearchForm() {
  const [departureLocations, setDepartureLocations] = useState([]);

  useEffect(() => {
    // Hàm fetch dữ liệu tours và lọc ra các điểm khởi hành
    const fetchLocations = async () => {
      try {
        const response = await getTours();
        if (response && response.tours) {
          // Lấy ra danh sách các điểm khởi hành và loại bỏ các giá trị trùng lặp hoặc null
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

  return (
    
    <section className="container mx-auto px-4 relative z-10 -mt-12 md:-mt-16">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-2 md:p-0 overflow-hidden max-w-[1200px] mx-auto">
        {/* Tabs */}
        <div className="flex overflow-x-auto hide-scrollbar border-b border-slate-100">
          {['Visa', 'Tour trọn gói', 'Khách sạn', 'Vé máy bay', 'Combo', 'Dịch vụ cộng thêm'].map((tab, idx) => (
            <button 
              key={tab} 
              className={`flex-shrink-0 px-6 py-4 text-sm font-semibold transition-colors flex items-center gap-2
                ${idx === 1 ? 'text-sky-600 border-b-2 border-sky-600' : 'text-slate-600 hover:text-sky-600 hover:bg-slate-50'}`}
            >
              {idx === 0 && <span>🛂</span>}
              {idx === 1 && <span>🧳</span>}
              {idx === 2 && <span>🏨</span>}
              {idx === 3 && <span>✈️</span>}
              {idx === 4 && <span>🚗+🏨</span>}
              {idx === 5 && <span>🍱</span>}
              {tab}
            </button>
          ))}
        </div>

        {/* Form Inputs */}
        <form action="/danh-muc" className="flex flex-col md:flex-row items-center justify-between p-4 md:p-6 gap-4">
          
          {/* CỘT MỚI: Khởi hành từ */}
          <div className="flex-1 w-full border-b md:border-b-0 md:border-r border-slate-200 pb-4 md:pb-0 pr-0 md:pr-4">
            <label className="block text-sm font-bold text-slate-800 mb-1">Khởi hành từ</label>
            <select 
              name="departure"
              className="w-full text-slate-600 outline-none text-sm bg-transparent cursor-pointer"
            >
              <option value="">Chọn điểm khởi hành</option>
              {departureLocations.map((location, index) => (
                <option key={index} value={location}>
                  {location}
                </option>
              ))}
            </select>
          </div>

          {/* CỘT 2: Bạn muốn đi đâu */}
          <div className="flex-1 w-full border-b md:border-b-0 md:border-r border-slate-200 pb-4 md:pb-0 px-0 md:px-4">
            <label className="block text-sm font-bold text-slate-800 mb-1">Bạn muốn đi đâu? <span className="text-red-500">*</span></label>
            <input 
              type="text" 
              name="search"
              placeholder="Khám phá cuộc phiêu lưu..." 
              className="w-full text-slate-600 outline-none text-sm placeholder:text-slate-400 bg-transparent"
              required
            />
          </div>

          {/* CỘT 3: Ngày đi */}
          <div className="flex-1 w-full border-b md:border-b-0 md:border-r border-slate-200 pb-4 md:pb-0 px-0 md:px-4">
            <label className="block text-sm font-bold text-slate-800 mb-1">Ngày đi</label>
            <input 
              type="date" 
              name="date"
              className="w-full text-slate-600 outline-none text-sm bg-transparent"
            />
          </div>

          {/* CỘT 4: Ngân sách */}
          <div className="flex-1 w-full pb-4 md:pb-0 px-0 md:px-4">
            <label className="block text-sm font-bold text-slate-800 mb-1">Ngân sách</label>
            <select name="budget" className="w-full text-slate-600 outline-none text-sm bg-transparent cursor-pointer">
              <option value="">Chọn mức giá</option>
              <option value="duoi-5-trieu">Dưới 5 triệu</option>
              <option value="5-10-trieu">5 - 10 triệu</option>
              <option value="tren-10-trieu">Trên 10 triệu</option>
            </select>
          </div>

          {/* NÚT TÌM KIẾM */}
          <button type="submit" className="w-full md:w-auto bg-slate-100 hover:bg-slate-200 text-slate-500 p-4 rounded-xl transition flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
          </button>
        </form>
      </div>
    </section>
  );
}