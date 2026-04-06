# Font Configuration cho JOYWORK

## Font Strategy: Hybrid (Sans-serif + Serif)

### Font Sans-serif: Inter (UI Elements)
**Inter** được dùng cho:
- Buttons, forms, navigation
- Headings, labels
- UI components

**Lý do chọn Inter:**
- ✅ Hỗ trợ tốt tiếng Việt (có subset "vietnamese")
- ✅ Hiện đại, dễ đọc trên màn hình
- ✅ Phù hợp với ứng dụng doanh nghiệp
- ✅ Được tối ưu cho web, load nhanh
- ✅ Có nhiều weight (100-900)
- ✅ Tự động load từ Google Fonts, không phụ thuộc OS

### Font Serif: Noto Serif (Nội dung dài)
**Noto Serif** được dùng cho:
- Mô tả công ty (company description)
- Job descriptions
- Bài viết dài (posts, articles)
- Nội dung văn bản chính thức

**Lý do chọn Noto Serif:**
- ✅ Font có chân, dễ đọc cho văn bản dài
- ✅ Tạo cảm giác chuyên nghiệp, đáng tin cậy
- ✅ Hỗ trợ tốt tiếng Việt
- ✅ Phù hợp với nội dung chính thức

## Cách sử dụng

### Sans-serif (mặc định - UI)
```tsx
<div className="font-sans">Nội dung UI</div>
// Hoặc không cần class vì font-sans là mặc định
<div>Nội dung UI</div>
```

### Serif (nội dung dài)
```tsx
<div className="font-serif">
  Mô tả công ty dài, job description, bài viết...
</div>
```

### Áp dụng trong các component
- **CompanyProfileContent**: Dùng `font-serif` cho mô tả công ty, job descriptions
- **PostCard**: Dùng `font-serif` cho nội dung bài viết
- **CreateJobModal/EditJobModal**: Dùng `font-serif` cho các trường mô tả dài

## Các font Serif alternatives tốt cho tiếng Việt

### 1. **Noto Serif** (Hiện tại đang dùng)
- Font của Google, hỗ trợ rất nhiều ngôn ngữ
- Dễ đọc cho văn bản dài
- Phù hợp cho nội dung chính thức

### 2. **Lora** (Elegant, modern serif)
- Font serif hiện đại, thanh lịch
- Hỗ trợ tốt tiếng Việt
- Phù hợp cho blog, bài viết
- Cách thay đổi:
```typescript
import { Lora } from "next/font/google";

const lora = Lora({
  variable: "--font-serif",
  subsets: ["latin", "vietnamese"],
  display: "swap",
});
```

### 3. **Merriweather** (Classic, readable)
- Font serif cổ điển, dễ đọc
- Hỗ trợ tốt tiếng Việt
- Phù hợp cho nội dung dài
- Cách thay đổi:
```typescript
import { Merriweather } from "next/font/google";

const merriweather = Merriweather({
  variable: "--font-serif",
  subsets: ["latin", "vietnamese"],
  weight: ["300", "400", "700", "900"],
  display: "swap",
});
```

## Các font Sans-serif alternatives tốt cho tiếng Việt

### 1. **Be Vietnam Pro** (Khuyến nghị cho tiếng Việt)
- Được thiết kế đặc biệt cho tiếng Việt
- Rất đẹp và chuyên nghiệp
- Cách thay đổi:
```typescript
import { Be_Vietnam_Pro } from "next/font/google";

const beVietnamPro = Be_Vietnam_Pro({
  variable: "--font-sans",
  subsets: ["latin", "vietnamese"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  display: "swap",
});
```

### 2. **Noto Sans** (Hỗ trợ rất nhiều ngôn ngữ)
- Font của Google, hỗ trợ rộng
- Phù hợp cho ứng dụng đa ngôn ngữ
- Cách thay đổi:
```typescript
import { Noto_Sans } from "next/font/google";

const notoSans = Noto_Sans({
  variable: "--font-sans",
  subsets: ["latin", "vietnamese"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  display: "swap",
});
```

### 3. **Plus Jakarta Sans** (Hiện đại, trẻ trung)
- Font hiện đại, phù hợp với startup
- Hỗ trợ tốt tiếng Việt
- Cách thay đổi:
```typescript
import { Plus_Jakarta_Sans } from "next/font/google";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin", "vietnamese"],
  weight: ["200", "300", "400", "500", "600", "700", "800"],
  display: "swap",
});
```

### 4. **Roboto** (Phổ biến, ổn định)
- Font quen thuộc, ổn định
- Hỗ trợ tốt tiếng Việt
- Cách thay đổi:
```typescript
import { Roboto } from "next/font/google";

const roboto = Roboto({
  variable: "--font-sans",
  subsets: ["latin", "vietnamese"],
  weight: ["100", "300", "400", "500", "700", "900"],
  display: "swap",
});
```

## Cách thay đổi font

1. Mở file `src/app/layout.tsx`
2. Thay thế import và config font
3. Đảm bảo có `subsets: ["latin", "vietnamese"]` để hỗ trợ tiếng Việt
4. Font sẽ tự động load từ Google Fonts khi build

## Lưu ý

- Tất cả font trên đều được load từ Google Fonts, không phụ thuộc vào font trên OS
- Next.js tự động tối ưu font loading (preload, display: swap)
- Font được cache bởi browser để tăng tốc độ load
- Nếu muốn tự host font (không dùng Google Fonts), có thể download font và đặt trong `public/fonts/` rồi dùng `@font-face` trong CSS
