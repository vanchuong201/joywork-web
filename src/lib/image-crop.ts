/**
 * Tiện ích crop ảnh dùng canvas — dùng chung cho avatar cá nhân, logo & cover DN.
 * Nhận object URL của file người dùng chọn + vùng crop (px) từ react-easy-crop,
 * vẽ lên canvas, scale về chiều rộng mong muốn rồi xuất ra Blob/File.
 */

export type PixelCrop = {
  x: number;
  y: number;
  width: number;
  height: number;
};

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    // object URL cùng origin nên không bị tainted; set sẵn cho an toàn.
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Không thể tải ảnh để cắt"));
    image.src = src;
  });
}

/**
 * Cắt vùng `pixelCrop` từ ảnh và scale về `outputWidth` (giữ tỷ lệ vùng crop).
 * @param mimeType định dạng xuất; canvas hỗ trợ image/jpeg, image/png, image/webp (Chromium).
 */
export async function getCroppedBlob(
  imageSrc: string,
  pixelCrop: PixelCrop,
  outputWidth: number,
  mimeType: string = "image/jpeg",
): Promise<Blob> {
  if (!pixelCrop.width || !pixelCrop.height) {
    throw new Error("Vùng cắt không hợp lệ");
  }

  const image = await loadImage(imageSrc);

  const scale = outputWidth / pixelCrop.width;
  const outputHeight = Math.round(pixelCrop.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = outputWidth;
  canvas.height = outputHeight;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Trình duyệt không hỗ trợ xử lý ảnh");
  }

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    outputWidth,
    outputHeight,
  );

  // canvas.toBlob có thể không hỗ trợ mime lạ → fallback về JPEG.
  const safeMime = ["image/jpeg", "image/png", "image/webp"].includes(mimeType)
    ? mimeType
    : "image/jpeg";

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Không thể tạo ảnh đã cắt"));
      },
      safeMime,
      0.92,
    );
  });
}

/** Đổi tên file gốc để giữ phần đuôi khớp với mime đã xuất. */
function withExtension(fileName: string, mimeType: string): string {
  const extMap: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
  };
  const ext = extMap[mimeType] ?? "jpg";
  const base = fileName.replace(/\.[^./\\]+$/, "");
  return `${base}.${ext}`;
}

/** Gói Blob thành File để upload (giữ pipeline FileReader base64 hiện tại). */
export function blobToFile(blob: Blob, fileName: string, mimeType: string): File {
  return new File([blob], withExtension(fileName, mimeType), { type: mimeType });
}
