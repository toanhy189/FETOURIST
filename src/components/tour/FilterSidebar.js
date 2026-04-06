export default function FilterSidebar() {
  return (
    <div className="space-y-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      {/* 1. Bộ lọc Ngày khởi hành */}
      <div>
        <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-800">Ngày khởi hành</h3>
        <div className="rounded-lg border border-slate-100 p-2 text-center text-sm text-slate-500">
          {/* Ở đây sau này bạn sẽ cài thư viện Calendar */}
          <p>📅 Chọn ngày đi của bạn</p>
        </div>
      </div>

      {/* 2. Bộ lọc Số ngày đi */}
      <div>
        <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-800">Số ngày tour</h3>
        <div className="space-y-2">
          {["1-2 ngày", "3-4 ngày", "5 ngày", "6 ngày trở lên"].map((item) => (
            <label key={item} className="flex items-center gap-3 cursor-pointer group">
              <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500" />
              <span className="text-sm text-slate-600 group-hover:text-sky-600">{item}</span>
            </label>
          ))}
        </div>
      </div>

      {/* 3. Bộ lọc Giá tour */}
      <div>
        <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-800">Giá tour/Khách</h3>
        <div className="space-y-2">
          {["< 3 triệu", "3 triệu - 4 triệu", "4 triệu - 7 triệu", "> 7 triệu"].map((price) => (
            <label key={price} className="flex items-center gap-3 cursor-pointer group">
              <input type="radio" name="price" className="h-4 w-4 border-slate-300 text-sky-600" />
              <span className="text-sm text-slate-600 group-hover:text-sky-600">{price}</span>
            </label>
          ))}
        </div>
      </div>

      <button className="w-full rounded-lg bg-slate-800 py-3 text-sm font-bold text-white transition hover:bg-black">
        Áp dụng bộ lọc
      </button>
    </div>
  );
}