"use client";
import React, { useState, useEffect } from 'react';
import { getTours } from "@/apiService/tours"; 

export default function SearchForm() {
  const [departureLocations, setDepartureLocations] = useState([]);

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

  return (
    <section className="container mx-auto px-4 relative z-10 -mt-[100px] md:-mt-[130px] lg:-mt-[150px]">
      <div className="max-w-2xl">
        
        {/* --- Tiêu đề nằm trên form --- */}
        <div className="mb-4 text-black drop-shadow-md px-1">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-1 tracking-wide leading-tight">
            Hơn 1000+ Tour, Khám Phá Ngay
          </h1>
          <p className="text-sm md:text-base font-light opacity-90">
            - Giá tốt – hỗ trợ 24/7 – khắp nơi .
          </p>
        </div>

        {/* --- Khung Form --- */}
        <form action="/danh-muc" className="flex flex-col gap-2.5">
          
          {/* Hàng 1: Bạn muốn đi đâu */}
          <div className="flex items-center bg-white rounded-lg px-4 py-3 shadow-xl">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-slate-400 mr-3 shrink-0">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
            <input 
              type="text" 
              name="search"
              placeholder="Bạn muốn đi đâu?" 
              className="w-full outline-none text-slate-700 bg-transparent placeholder:text-slate-400 text-sm"
            />
          </div>

          {/* Hàng 2: Ngày đi - Điểm khởi hành - Nút Tìm */}
          <div className="flex gap-2.5">
            
            {/* Cột: Ngày khởi hành */}
            <div className="flex-1 flex items-center bg-white rounded-lg px-4 py-2.5 shadow-xl min-w-0">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-slate-400 mr-2 shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
              </svg>
              <div className="flex flex-col w-full min-w-0">
                <span className="text-[10px] text-slate-400 leading-none mb-0.5">Ngày khởi hành</span>
                <input 
                  type="date" 
                  name="date"
                  placeholder="Linh hoạt"
                  className="w-full text-slate-700 outline-none text-xs font-semibold bg-transparent cursor-pointer"
                />
              </div>
            </div>

            {/* Cột: Khởi hành từ */}
            <div className="flex-1 flex items-center bg-white rounded-lg px-4 py-2.5 shadow-xl min-w-0">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-slate-400 mr-2 shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
              </svg>
              <div className="flex flex-col w-full min-w-0">
                <span className="text-[10px] text-slate-400 leading-none mb-0.5">Khởi hành từ</span>
                <select 
                  name="departure"
                  className="w-full text-slate-700 outline-none text-xs font-semibold bg-transparent cursor-pointer"
                >
                  <option value="">Tất cả</option>
                  {departureLocations.map((location, index) => (
                    <option key={index} value={location}>
                      {location}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Nút Tìm kiếm */}
            <button 
              type="submit" 
              className="bg-[#ff8900] hover:bg-[#e67b00] active:bg-[#cc6e00] text-white font-bold px-8 py-2.5 rounded-lg transition-colors shadow-xl text-sm shrink-0"
            >
              Tìm
            </button>

          </div>
        </form>
      </div>
    </section>
  );
}