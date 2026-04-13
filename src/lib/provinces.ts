export type ProvinceRegion = "north" | "central" | "south";

export interface Province {
  code: string;
  name: string;
  type: string;
  region: ProvinceRegion;
  merged: boolean;
  merged_from: string[];
  merged_from_codes: string[];
}

export const PROVINCES: Province[] = [
  { code: "ha-noi", name: "Hà Nội", type: "thành phố trực thuộc trung ương", region: "north", merged: false, merged_from: ["Hà Nội"], merged_from_codes: ["ha-noi"] },
  { code: "hue", name: "Huế", type: "thành phố trực thuộc trung ương", region: "central", merged: false, merged_from: ["Huế"], merged_from_codes: ["hue"] },
  { code: "cao-bang", name: "Cao Bằng", type: "tỉnh", region: "north", merged: false, merged_from: ["Cao Bằng"], merged_from_codes: ["cao-bang"] },
  { code: "dien-bien", name: "Điện Biên", type: "tỉnh", region: "north", merged: false, merged_from: ["Điện Biên"], merged_from_codes: ["dien-bien"] },
  { code: "lai-chau", name: "Lai Châu", type: "tỉnh", region: "north", merged: false, merged_from: ["Lai Châu"], merged_from_codes: ["lai-chau"] },
  { code: "son-la", name: "Sơn La", type: "tỉnh", region: "north", merged: false, merged_from: ["Sơn La"], merged_from_codes: ["son-la"] },
  { code: "lang-son", name: "Lạng Sơn", type: "tỉnh", region: "north", merged: false, merged_from: ["Lạng Sơn"], merged_from_codes: ["lang-son"] },
  { code: "quang-ninh", name: "Quảng Ninh", type: "tỉnh", region: "north", merged: false, merged_from: ["Quảng Ninh"], merged_from_codes: ["quang-ninh"] },
  { code: "thanh-hoa", name: "Thanh Hóa", type: "tỉnh", region: "north", merged: false, merged_from: ["Thanh Hóa"], merged_from_codes: ["thanh-hoa"] },
  { code: "nghe-an", name: "Nghệ An", type: "tỉnh", region: "north", merged: false, merged_from: ["Nghệ An"], merged_from_codes: ["nghe-an"] },
  { code: "ha-tinh", name: "Hà Tĩnh", type: "tỉnh", region: "north", merged: false, merged_from: ["Hà Tĩnh"], merged_from_codes: ["ha-tinh"] },
  { code: "lao-cai", name: "Lào Cai", type: "tỉnh", region: "north", merged: true, merged_from: ["Lào Cai", "Yên Bái"], merged_from_codes: ["lao-cai", "yen-bai"] },
  { code: "tuyen-quang", name: "Tuyên Quang", type: "tỉnh", region: "north", merged: true, merged_from: ["Tuyên Quang", "Hà Giang"], merged_from_codes: ["tuyen-quang", "ha-giang"] },
  { code: "thai-nguyen", name: "Thái Nguyên", type: "tỉnh", region: "north", merged: true, merged_from: ["Thái Nguyên", "Bắc Kạn"], merged_from_codes: ["thai-nguyen", "bac-kan"] },
  { code: "phu-tho", name: "Phú Thọ", type: "tỉnh", region: "north", merged: true, merged_from: ["Phú Thọ", "Vĩnh Phúc", "Hòa Bình"], merged_from_codes: ["phu-tho", "vinh-phuc", "hoa-binh"] },
  { code: "bac-ninh", name: "Bắc Ninh", type: "tỉnh", region: "north", merged: true, merged_from: ["Bắc Ninh", "Bắc Giang"], merged_from_codes: ["bac-ninh", "bac-giang"] },
  { code: "hung-yen", name: "Hưng Yên", type: "tỉnh", region: "north", merged: true, merged_from: ["Hưng Yên", "Thái Bình"], merged_from_codes: ["hung-yen", "thai-binh"] },
  { code: "hai-phong", name: "Hải Phòng", type: "thành phố trực thuộc trung ương", region: "north", merged: true, merged_from: ["Hải Phòng", "Hải Dương"], merged_from_codes: ["hai-phong", "hai-duong"] },
  { code: "ninh-binh", name: "Ninh Bình", type: "tỉnh", region: "north", merged: true, merged_from: ["Ninh Bình", "Nam Định", "Hà Nam"], merged_from_codes: ["ninh-binh", "nam-dinh", "ha-nam"] },
  { code: "quang-tri", name: "Quảng Trị", type: "tỉnh", region: "central", merged: true, merged_from: ["Quảng Trị", "Quảng Bình"], merged_from_codes: ["quang-tri", "quang-binh"] },
  { code: "da-nang", name: "Đà Nẵng", type: "thành phố trực thuộc trung ương", region: "central", merged: true, merged_from: ["Đà Nẵng", "Quảng Nam"], merged_from_codes: ["da-nang", "quang-nam"] },
  { code: "quang-ngai", name: "Quảng Ngãi", type: "tỉnh", region: "central", merged: true, merged_from: ["Quảng Ngãi", "Kon Tum"], merged_from_codes: ["quang-ngai", "kon-tum"] },
  { code: "gia-lai", name: "Gia Lai", type: "tỉnh", region: "central", merged: true, merged_from: ["Gia Lai", "Bình Định"], merged_from_codes: ["gia-lai", "binh-dinh"] },
  { code: "khanh-hoa", name: "Khánh Hòa", type: "tỉnh", region: "central", merged: true, merged_from: ["Khánh Hòa", "Ninh Thuận"], merged_from_codes: ["khanh-hoa", "ninh-thuan"] },
  { code: "lam-dong", name: "Lâm Đồng", type: "tỉnh", region: "central", merged: true, merged_from: ["Lâm Đồng", "Đắk Nông", "Bình Thuận"], merged_from_codes: ["lam-dong", "dak-nong", "binh-thuan"] },
  { code: "dak-lak", name: "Đắk Lắk", type: "tỉnh", region: "central", merged: true, merged_from: ["Đắk Lắk", "Phú Yên"], merged_from_codes: ["dak-lak", "phu-yen"] },
  { code: "tp-ho-chi-minh", name: "TP. Hồ Chí Minh", type: "thành phố trực thuộc trung ương", region: "south", merged: true, merged_from: ["TP. Hồ Chí Minh", "Bình Dương", "Bà Rịa - Vũng Tàu"], merged_from_codes: ["tp-ho-chi-minh", "binh-duong", "ba-ria-vung-tau"] },
  { code: "dong-nai", name: "Đồng Nai", type: "tỉnh", region: "south", merged: true, merged_from: ["Đồng Nai", "Bình Phước"], merged_from_codes: ["dong-nai", "binh-phuoc"] },
  { code: "tay-ninh", name: "Tây Ninh", type: "tỉnh", region: "south", merged: true, merged_from: ["Tây Ninh", "Long An"], merged_from_codes: ["tay-ninh", "long-an"] },
  { code: "can-tho", name: "Cần Thơ", type: "thành phố trực thuộc trung ương", region: "south", merged: true, merged_from: ["Cần Thơ", "Sóc Trăng", "Hậu Giang"], merged_from_codes: ["can-tho", "soc-trang", "hau-giang"] },
  { code: "vinh-long", name: "Vĩnh Long", type: "tỉnh", region: "south", merged: true, merged_from: ["Vĩnh Long", "Bến Tre", "Trà Vinh"], merged_from_codes: ["vinh-long", "ben-tre", "tra-vinh"] },
  { code: "dong-thap", name: "Đồng Tháp", type: "tỉnh", region: "south", merged: true, merged_from: ["Đồng Tháp", "Tiền Giang"], merged_from_codes: ["dong-thap", "tien-giang"] },
  { code: "ca-mau", name: "Cà Mau", type: "tỉnh", region: "south", merged: true, merged_from: ["Cà Mau", "Bạc Liêu"], merged_from_codes: ["ca-mau", "bac-lieu"] },
  { code: "an-giang", name: "An Giang", type: "tỉnh", region: "south", merged: true, merged_from: ["An Giang", "Kiên Giang"], merged_from_codes: ["an-giang", "kien-giang"] },
];

/** Normalize dấu tiếng Việt để so sánh không phân biệt dấu */
function normalize(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9\s]/g, "")
    .trim();
}

/**
 * Tìm kiếm tỉnh thành theo tên mới hoặc tên tỉnh cũ đã được hợp nhất.
 * Trả về danh sách tỉnh khớp với query (sắp xếp theo mức độ liên quan).
 */
export function searchProvinces(query: string): Province[] {
  if (!query.trim()) return PROVINCES;

  const q = normalize(query);

  const scored = PROVINCES.map((p) => {
    const normalizedName = normalize(p.name);
    const normalizedCode = normalize(p.code);
    const normalizedFromNames = p.merged_from.map(normalize);
    const normalizedFromCodes = p.merged_from_codes.map(normalize);
    if (normalizedCode === q) return { p, score: 95 };
    if (normalizedCode.includes(q)) return { p, score: 65 };
    if (normalizedFromCodes.some((f) => f === q)) return { p, score: 55 };
    if (normalizedFromCodes.some((f) => f.includes(q))) return { p, score: 35 };

    // Tên mới khớp hoàn toàn (ưu tiên cao nhất)
    if (normalizedName === q) return { p, score: 100 };
    // Tên mới bắt đầu bằng query
    if (normalizedName.startsWith(q)) return { p, score: 90 };
    // Tên mới chứa query
    if (normalizedName.includes(q)) return { p, score: 70 };
    // Tên tỉnh cũ (merged_from) khớp hoàn toàn
    if (normalizedFromNames.some((f) => f === q)) return { p, score: 60 };
    // Tên tỉnh cũ bắt đầu bằng query
    if (normalizedFromNames.some((f) => f.startsWith(q))) return { p, score: 50 };
    // Tên tỉnh cũ chứa query
    if (normalizedFromNames.some((f) => f.includes(q))) return { p, score: 30 };

    return { p, score: 0 };
  });

  return scored
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ p }) => p);
}

/**
 * Kiểm tra xem một giá trị location có phải là tên tỉnh hợp lệ không.
 * Trả về tên tỉnh mới nếu tìm thấy, hoặc null nếu không khớp.
 */
export function resolveProvinceName(value: string): string | null {
  if (!value) return null;
  const q = normalize(value);
  const found = PROVINCES.find(
    (p) =>
      normalize(p.name) === q ||
      p.merged_from.some((f) => normalize(f) === q) ||
      normalize(p.code) === q ||
      p.merged_from_codes.some((f) => normalize(f) === q)
  );
  return found ? found.name : null;
}

export function resolveProvinceCode(value: string): string | null {
  if (!value) return null;
  const q = normalize(value);
  const found = PROVINCES.find(
    (p) =>
      normalize(p.code) === q ||
      normalize(p.name) === q ||
      p.merged_from.some((f) => normalize(f) === q) ||
      p.merged_from_codes.some((f) => normalize(f) === q)
  );
  return found ? found.code : null;
}

export function resolveProvinceCodes(values: string[]): string[] {
  const unique = new Set<string>();
  values.forEach((value) => {
    const code = resolveProvinceCode(value);
    if (code) unique.add(code);
  });
  return Array.from(unique);
}

export function getProvinceNameByCode(code: string | null | undefined): string | null {
  if (!code) return null;
  return PROVINCES.find((province) => province.code === code)?.name ?? null;
}

/** Nhãn hiển thị khi API có thể trả slug hoặc tên tỉnh. */
export function getProvinceDisplayLabel(stored: string | null | undefined): string {
  if (!stored) return "";
  const fromCode = getProvinceNameByCode(stored);
  if (fromCode) return fromCode;
  const code = resolveProvinceCode(stored);
  if (code) return getProvinceNameByCode(code) ?? stored;
  return stored;
}

export function getProvinceNamesByCodes(codes: string[] | null | undefined): string[] {
  if (!codes || codes.length === 0) return [];
  return codes.map((code) => getProvinceNameByCode(code)).filter((name): name is string => Boolean(name));
}

/** Danh sách tên tỉnh thành (chỉ lấy tên mới) */
export const PROVINCE_NAMES = PROVINCES.map((p) => p.name);
export const PROVINCE_CODES = PROVINCES.map((p) => p.code);

/** Các lựa chọn quy mô doanh nghiệp */
export const COMPANY_SIZE_OPTIONS = [
  "0-10",
  "10-30",
  "30-50",
  "50-70",
  "70-100",
  "100-150",
  "150-200",
  "200-300",
  "300-500",
  "500-700",
  "700-1000",
  "1000+",
  "2000+",
] as const;

export type CompanySizeOption = (typeof COMPANY_SIZE_OPTIONS)[number];

/** Các khoảng lương phổ biến (VND) */
export const SALARY_RANGES_VND = [
  { min: 0, max: 5_000_000, label: "Dưới 5 triệu" },
  { min: 5_000_000, max: 10_000_000, label: "5 - 10 triệu" },
  { min: 10_000_000, max: 15_000_000, label: "10 - 15 triệu" },
  { min: 15_000_000, max: 20_000_000, label: "15 - 20 triệu" },
  { min: 20_000_000, max: 30_000_000, label: "20 - 30 triệu" },
  { min: 30_000_000, max: 50_000_000, label: "30 - 50 triệu" },
  { min: 50_000_000, max: 70_000_000, label: "50 - 70 triệu" },
  { min: 70_000_000, max: 100_000_000, label: "70 - 100 triệu" },
  { min: 100_000_000, max: null, label: "Trên 100 triệu" },
];

/** Các khoảng lương phổ biến (USD) */
export const SALARY_RANGES_USD = [
  { min: 0, max: 500, label: "Dưới $500" },
  { min: 500, max: 1_000, label: "$500 - $1.000" },
  { min: 1_000, max: 1_500, label: "$1.000 - $1.500" },
  { min: 1_500, max: 2_000, label: "$1.500 - $2.000" },
  { min: 2_000, max: 3_000, label: "$2.000 - $3.000" },
  { min: 3_000, max: 5_000, label: "$3.000 - $5.000" },
  { min: 5_000, max: null, label: "Trên $5.000" },
];

/** Format số tiền theo đơn vị */
export function formatSalary(amount: number, currency: "VND" | "USD"): string {
  if (currency === "VND") {
    if (amount >= 1_000_000) {
      return `${(amount / 1_000_000).toLocaleString("vi-VN")} triệu`;
    }
    return amount.toLocaleString("vi-VN");
  }
  return `$${amount.toLocaleString("en-US")}`;
}

/** Format khoảng lương hiển thị */
export function formatSalaryRange(
  min: number | null | undefined,
  max: number | null | undefined,
  currency: "VND" | "USD" = "VND"
): string {
  if (!min && !max) return "";
  if (min && !max) return `Từ ${formatSalary(min, currency)}`;
  if (!min && max) return `Đến ${formatSalary(max, currency)}`;
  return `${formatSalary(min!, currency)} - ${formatSalary(max!, currency)}`;
}
