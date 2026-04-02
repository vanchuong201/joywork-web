/** Danh sách lĩnh vực hoạt động (theo documents/linh-vuc.md) */

export const COMPANY_INDUSTRY_OPTIONS = [
  "Quản trị kinh doanh / Quản lý điều hành",
  "Bán hàng / Nhân viên kinh doanh",
  "Bán sỉ - Bán lẻ - Quản lý cửa hàng",
  "Thương mại điện tử và bán lẻ trực tuyến",
  "Chăm sóc khách hàng / Tư vấn",
  "Kinh doanh Bất động sản",
  "Marketing / Tiếp thị - Quảng cáo",
  "PR / Quan hệ đối ngoại",
  "Truyền thông, Báo chí và Quảng cáo",
  "Tổ chức sự kiện - Quà tặng",
  "Kế toán",
  "Kiểm toán",
  "Tài chính - Đầu tư - Chứng khoán - Vàng",
  "Ngân hàng",
  "Bảo hiểm",
  "Hành chính - Văn phòng / Thư ký - Trợ lý",
  "Nhân sự / Dịch vụ cung ứng và quản lý nhân lực",
  "Pháp lý - Luật / Tuân thủ",
  "Quản lý dự án / Quản lý tiêu chuẩn và chất lượng",
  "IT Phần mềm / Phát triển phần mềm và dịch vụ CNTT",
  "IT Phần cứng - Mạng / Hệ thống thiết bị CNTT",
  "Viễn thông / Bưu chính viễn thông",
  "Game",
  "Khoa học - Kỹ thuật / Nghiên cứu & Phát triển (R&D)",
  "Kỹ thuật ứng dụng / Công nghệ cao",
  "Tự động hóa / Cơ khí - Chế tạo",
  "Hóa học - Sinh học (Hóa sinh)",
  "Y tế - Dược / Dịch vụ chăm sóc sức khỏe",
  "Sản xuất và phân phối dược phẩm / Thiết bị y tế",
  "Dịch vụ làm đẹp (mỹ phẩm) và chăm sóc cá nhân",
  "Xây dựng / Kỹ thuật xây dựng và cơ sở hạ tầng",
  "Kiến trúc - Thiết kế nội ngoại thất",
  "Sản xuất và kinh doanh vật liệu xây dựng",
  "Bất động sản và dịch vụ cho thuê",
  "Hoạt động sản xuất công nghiệp",
  "Dệt may - Da giày - Thời trang",
  "Sản xuất hàng tiêu dùng nhanh (FMCG) / Hàng gia dụng",
  "Sản xuất bao bì, in ấn và dán nhãn / Xuất bản",
  "Sản xuất nhựa, cao su / Sản xuất thiết bị điện",
  "Vận tải - Lái xe - Giao nhận / Hậu cần (Logistics)",
  "Kho vận - Vật tư / Dịch vụ kho bãi và lưu trữ",
  "Thu mua - Chuỗi cung ứng",
  "Ngoại thương - Xuất nhập khẩu",
  "Hàng hải / Hàng không / Ô tô - Xe máy",
  "Khách sạn - Nhà hàng - Du lịch (Dịch vụ lưu trú)",
  "Thực phẩm - Đồ uống / Công nghệ thực phẩm - Dinh dưỡng",
  "Dịch vụ chung",
  "Giáo dục - Đào tạo",
  "Nông - Lâm - Ngư nghiệp (Nuôi trồng thủy sản)",
  "Chăn nuôi - Thú y / Dịch vụ thú y",
  "Khai thác năng lượng - Khoáng sản - Địa chất / Dầu khí",
  "Sản xuất và phân phối điện, khí đốt và nước",
  "Môi trường - Xử lý chất thải / An toàn lao động",
  "Thiết kế - Sáng tạo nghệ thuật / Thiết kế - Mỹ thuật",
  "Thiết kế đồ hoạ - Web",
  "Nghệ thuật - Điện ảnh / Giải trí",
  "Thủ công mỹ nghệ",
  "Lao động phổ thông / Làm bán thời gian (Part-time) / Sinh viên làm thêm",
  "Thực tập sinh",
  "Phi chính phủ - Phi lợi nhuận (NGO)",
  "An ninh - Bảo vệ",
  "Biên - Phiên dịch",
  "Người giúp việc / NV trông quán Internet",
  "Nghề nghiệp khác / Lĩnh vực hoạt động khác",
] as const;

export type CompanyIndustryOption = (typeof COMPANY_INDUSTRY_OPTIONS)[number];

export const COMPANY_INDUSTRY_SET = new Set<string>(COMPANY_INDUSTRY_OPTIONS);

function normalizeVi(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function searchCompanyIndustries(query: string): string[] {
  const q = normalizeVi(query);
  if (!q) return [...COMPANY_INDUSTRY_OPTIONS];
  return COMPANY_INDUSTRY_OPTIONS.filter((label) => normalizeVi(label).includes(q));
}

export function isKnownCompanyIndustry(value: string | null | undefined): boolean {
  if (!value) return false;
  return COMPANY_INDUSTRY_SET.has(value);
}
