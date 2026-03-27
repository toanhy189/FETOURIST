"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
// IMPORT API CỦA BẠN VÀO ĐÂY (Chỉnh lại đường dẫn cho đúng)
import { getCategories } from "@/apiService/categories";

export default function Footer() {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchFooterCategories() {
            try {
                const response = await getCategories();
                if (response && response.categories) {
                    setCategories(response.categories);
                }
            } catch (error) {
                console.error("Lỗi khi fetch categories cho Footer:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchFooterCategories();
    }, []);

    // Lọc ra danh mục cha (parentCategory === null)
    const rootCategories = categories.filter((c) => !c.parentCategory);

    return (
        <footer style={{ background: "#0f2744", color: "#c8dff5", fontFamily: "'Segoe UI', sans-serif", fontSize: 13, lineHeight: 1.7, paddingTop: 52, width: "100%", boxSizing: "border-box" }}>
            <div style={{ maxWidth: 1120, margin: "0 auto", padding: "0 32px" }}>

                {/* ===== PHẦN TRÊN ===== */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48, paddingBottom: 40, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>

                    {/* CỘT TRÁI: DANH MỤC ĐỘNG */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "28px 20px" }}>
                        {loading ? (
                            <div style={{ color: "#5a84ad", fontStyle: "italic", gridColumn: "span 2" }}>Đang tải danh mục...</div>
                        ) : rootCategories.length > 0 ? (
                            rootCategories.map((root) => {
                                const children = categories.filter((c) => c.parentCategory?.id === root.id);
                                return (
                                    <div key={root.id}>
                                        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#fff", margin: "0 0 14px" }}>
                                            {root.name}
                                        </p>
                                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                            {children.length > 0 ? (
                                                children.map((child) => (
                                                    <Link key={child.id} href={`/danh-muc/${child.slug}`} style={{ color: "#8ab8e0", textDecoration: "none", fontSize: 13 }}
                                                        onMouseEnter={e => e.target.style.color = "#fff"}
                                                        onMouseLeave={e => e.target.style.color = "#8ab8e0"}>
                                                        {child.name}
                                                    </Link>
                                                ))
                                            ) : (
                                                <span style={{ fontSize: 12, color: "#3d6585" }}>Đang cập nhật...</span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div style={{ color: "#5a84ad", fontStyle: "italic", gridColumn: "span 2" }}>Chưa có danh mục nào.</div>
                        )}
                    </div>

                    {/* CỘT PHẢI: BOOKING, DÒNG TOUR, APP */}
                    <div>
                        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#fff", margin: "0 0 14px" }}>
                            Tra cứu Booking
                        </p>

                        {/* Booking bar */}
                        <div style={{ display: "flex", borderRadius: 8, overflow: "hidden", border: "1px solid rgba(255,255,255,0.12)", marginBottom: 32 }}>
                            <input
                                type="text"
                                placeholder="Nhập mã booking của quý khách"
                                style={{ flex: 1, background: "rgba(255,255,255,0.06)", border: "none", outline: "none", color: "#fff", padding: "10px 14px", fontSize: 13 }}
                            />
                            <button style={{ background: "#1a6db5", border: "none", color: "#fff", fontSize: 13, fontWeight: 600, padding: "10px 20px", cursor: "pointer", whiteSpace: "nowrap" }}>
                                Tìm kiếm
                            </button>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20 }}>

                            {/* Dòng tour */}
                            <div>
                                <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#fff", margin: "0 0 14px" }}>Dòng tour</p>
                                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                    {["Cao cấp", "Tiêu chuẩn", "Tiết kiệm", "Giá tốt"].map((t) => (
                                        <Link key={t} href="#" style={{ color: "#8ab8e0", textDecoration: "none", fontSize: 13 }}
                                            onMouseEnter={e => e.target.style.color = "#fff"}
                                            onMouseLeave={e => e.target.style.color = "#8ab8e0"}>{t}</Link>
                                    ))}
                                </div>
                            </div>

                            {/* Dịch vụ lẻ */}
                            <div>
                                <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#fff", margin: "0 0 14px" }}>Dịch vụ lẻ</p>
                                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                    {["Vé máy bay", "Khách sạn", "Combo du lịch"].map((t) => (
                                        <Link key={t} href="#" style={{ color: "#8ab8e0", textDecoration: "none", fontSize: 13 }}
                                            onMouseEnter={e => e.target.style.color = "#fff"}
                                            onMouseLeave={e => e.target.style.color = "#8ab8e0"}>{t}</Link>
                                    ))}
                                </div>
                            </div>

                            {/* App Store buttons */}
                            <div>
                                <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#fff", margin: "0 0 14px" }}>Ứng dụng</p>
                                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                    {/* Google Play */}
                                    <div style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.13)", borderRadius: 7, display: "flex", alignItems: "center", gap: 8, padding: "7px 12px", color: "#fff", cursor: "pointer", width: 120 }}>
                                        <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M3.609 1.814L13.792 12 3.61 22.186a1.981 1.981 0 01-.61-.921V2.735a1.981 1.981 0 01.609-.921zM14.8 10.39l2.116-1.204 1.84 1.048c1.474.84 1.474 2.208 0 3.048l-1.84 1.047-2.116-1.203V10.39zM4.413 2.01l8.189 7.323-1.37 1.225L4.413 3.83V2.01z" /></svg>
                                        <div>
                                            <div style={{ fontSize: 9, color: "#8ab8e0", lineHeight: 1 }}>GET IT ON</div>
                                            <div style={{ fontSize: 11, fontWeight: 700, lineHeight: 1.2 }}>Google Play</div>
                                        </div>
                                    </div>
                                    {/* App Store */}
                                    <div style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.13)", borderRadius: 7, display: "flex", alignItems: "center", gap: 8, padding: "7px 12px", color: "#fff", cursor: "pointer", width: 120 }}>
                                        <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.17 2.31-.86 3.73-.8 1.98.07 3.37 1.05 4.19 2.45-3.32 1.81-2.61 6.13.62 7.37-.73 1.54-1.74 3.25-3.62 3.15zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.02 4.36-3.74 4.25z" /></svg>
                                        <div>
                                            <div style={{ fontSize: 9, color: "#8ab8e0", lineHeight: 1 }}>Download on the</div>
                                            <div style={{ fontSize: 11, fontWeight: 700, lineHeight: 1.2 }}>App Store</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>

                {/* ===== PHẦN GIỮA ===== */}
                <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr 1fr 1fr", gap: 36, padding: "40px 0", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>

                    {/* Liên hệ */}
                    <div>
                        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#fff", margin: "0 0 16px" }}>Liên hệ</p>
                        <p style={{ color: "#8ab8e0", lineHeight: 1.8, margin: "0 0 8px", fontSize: 13 }}>
                            190 Pasteur, Phường Xuân Hoà,<br />TP. Hồ Chí Minh, Việt Nam
                        </p>
                        <a href="mailto:info@betourist.com" style={{ color: "#4fa3e8", fontSize: 13, marginBottom: 12, display: "block", textDecoration: "none" }}>
                            info@betourist.com
                        </a>
                        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                            {["IG", "FB", "WA", "TT"].map((s) => (
                                <div key={s} style={{ width: 32, height: 32, border: "1px solid rgba(255,255,255,0.18)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#8ab8e0", fontSize: 10, fontWeight: 700, cursor: "pointer" }}>
                                    {s}
                                </div>
                            ))}
                        </div>
                        <div style={{ background: "#c0281a", color: "#fff", fontSize: 17, fontWeight: 800, borderRadius: 7, padding: "9px 16px", display: "inline-flex", alignItems: "center", gap: 8, cursor: "pointer", marginBottom: 6 }}>
                            <svg width="17" height="17" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            1800 646 888
                        </div>
                        <p style={{ fontSize: 12, color: "#5a84ad", margin: 0 }}>Hỗ trợ 8:00 – 23:00 hằng ngày</p>
                    </div>

                    {/* Thông tin */}
                    <div>
                        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#fff", margin: "0 0 16px" }}>Thông tin</p>
                        <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                            {["Khảo sát tỷ lệ đạt visa", "Tạp chí du lịch", "Tin tức", "Sitemap", "Trợ giúp", "Chính sách riêng tư", "Thỏa thuận sử dụng"].map((t) => (
                                <Link key={t} href="#" style={{ color: "#8ab8e0", textDecoration: "none", fontSize: 13 }}
                                    onMouseEnter={e => e.target.style.color = "#fff"}
                                    onMouseLeave={e => e.target.style.color = "#8ab8e0"}>{t}</Link>
                            ))}
                        </div>
                    </div>

                    {/* Chứng nhận */}
                    <div>
                        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#fff", margin: "0 0 16px" }}>Chứng nhận</p>
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                            <div style={{ background: "rgba(26,109,181,0.25)", border: "1px solid rgba(79,163,232,0.3)", borderRadius: 6, padding: "9px 14px", display: "flex", alignItems: "center", gap: 10, width: "fit-content" }}>
                                <div style={{ width: 20, height: 20, background: "#1a6db5", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#fff", flexShrink: 0 }}>✓</div>
                                <div style={{ fontSize: 10, fontWeight: 700, color: "#fff", lineHeight: 1.5, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                    Đã thông báo<br />
                                    <span style={{ fontSize: 9, fontWeight: 400, color: "#8ab8e0", textTransform: "none", letterSpacing: 0 }}>Bộ Công Thương</span>
                                </div>
                            </div>
                            <div style={{ background: "rgba(234,175,40,0.12)", border: "1px solid rgba(234,175,40,0.3)", borderRadius: 6, padding: "7px 14px", display: "inline-flex", alignItems: "center", gap: 6, width: "fit-content" }}>
                                <svg width="12" height="12" fill="#f0c040" viewBox="0 0 24 24"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" /></svg>
                                <span style={{ fontSize: 10, fontWeight: 700, color: "#f0c040", letterSpacing: "0.08em", textTransform: "uppercase" }}>DMCA Protected</span>
                            </div>
                        </div>
                    </div>

                    {/* Thanh toán */}
                    <div>
                        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#fff", margin: "0 0 16px" }}>Thanh toán</p>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                            {[
                                { label: "VISA", color: "#1a1f71", size: 10 },
                                { label: "Master\nCard", color: "#eb001b", size: 8.5 },
                                { label: "VNPAY", color: "#d60000", size: 9 },
                                { label: "Verified\nby VISA", color: "#1a1f71", size: 7.5 },
                                { label: "JCB", color: "#005394", size: 10 },
                                { label: "Shopee\nPay", color: "#ee4d2d", size: 7.5 },
                                { label: "momo", color: "#a0006e", size: 9 },
                            ].map(({ label, color, size }) => (
                                <div key={label} style={{ background: "#fff", borderRadius: 5, width: 54, height: 32, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size, fontWeight: 800, color, textAlign: "center", lineHeight: 1.3, flexShrink: 0, whiteSpace: "pre-line" }}>
                                    {label}
                                </div>
                            ))}
                        </div>
                    </div>

                </div>

                {/* ===== PHẦN DƯỚI (copyright) ===== */}
                <div style={{ padding: "18px 0", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                    <p style={{ fontSize: 12, color: "#3d6585", margin: 0 }}>
                        © 2024 <span style={{ color: "#5a84ad" }}>BeTourist.com</span> — Thành viên của BeTourist Group
                    </p>
                    <p style={{ fontSize: 11, color: "#3d6585", margin: 0 }}>
                        Giấy phép kinh doanh lữ hành quốc tế số: 01-1234/TCDL-GP LHQT
                    </p>
                </div>

            </div>
        </footer>
    );
}