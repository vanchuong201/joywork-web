"use client";

import { useCallback, useState } from "react";
import { Dialog } from "@headlessui/react";
import Cropper, { type Area } from "react-easy-crop";
import { Button } from "@/components/ui/button";
import { getCroppedBlob, blobToFile } from "@/lib/image-crop";
import { toast } from "sonner";
import { X, ZoomIn } from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;
  /** Object URL của file người dùng vừa chọn. */
  imageSrc: string;
  /** Tỷ lệ khung crop: 1 cho avatar/logo, ~3.75 cho cover. */
  aspect: number;
  /** Hình dạng khung crop hiển thị. */
  cropShape?: "round" | "rect";
  /** Chiều rộng ảnh xuất (px), vd 512 logo / 1920 cover. */
  outputWidth?: number;
  title?: string;
  /** Tên + type của file gốc để giữ lại cho file đã crop. */
  fileName: string;
  mimeType: string;
  /** Trả về file ảnh đã crop để caller upload như cũ. */
  onCropComplete: (file: File) => void;
};

export function ImageCropDialog({
  open,
  onClose,
  imageSrc,
  aspect,
  cropShape = "rect",
  outputWidth = 512,
  title = "Cắt ảnh",
  fileName,
  mimeType,
  onCropComplete,
}: Props) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleCropComplete = useCallback((_: Area, areaPixels: Area) => {
    setCroppedAreaPixels(areaPixels);
  }, []);

  const handleConfirm = async () => {
    if (!croppedAreaPixels) return;
    setProcessing(true);
    try {
      const blob = await getCroppedBlob(imageSrc, croppedAreaPixels, outputWidth, mimeType);
      const file = blobToFile(blob, fileName, blob.type || mimeType);
      onCropComplete(file);
      handleClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Cắt ảnh thất bại, vui lòng thử lại.";
      toast.error(message);
    } finally {
      setProcessing(false);
    }
  };

  const handleClose = () => {
    if (processing) return;
    // reset cho lần mở sau
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} className="relative z-[60]">
      <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto w-full max-w-lg rounded-xl bg-[var(--card)] p-6 shadow-xl">
          <div className="mb-4 flex items-center justify-between">
            <Dialog.Title className="text-lg font-semibold text-[var(--foreground)]">
              {title}
            </Dialog.Title>
            <button
              type="button"
              onClick={handleClose}
              disabled={processing}
              className="rounded-full p-1 text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)] disabled:opacity-50"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="relative h-[320px] w-full overflow-hidden rounded-lg bg-black/80">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={aspect}
              cropShape={cropShape}
              showGrid={cropShape === "rect"}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={handleCropComplete}
            />
          </div>

          <div className="mt-4 flex items-center gap-3">
            <ZoomIn className="h-4 w-4 shrink-0 text-[var(--muted-foreground)]" />
            <input
              type="range"
              min={1}
              max={3}
              step={0.01}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              disabled={processing}
              aria-label="Phóng to ảnh"
              className="h-1 w-full cursor-pointer accent-[var(--brand)]"
            />
          </div>

          <p className="mt-3 text-center text-xs text-[var(--muted-foreground)]">
            Kéo để di chuyển, dùng thanh trượt hoặc cuộn chuột để phóng to.
          </p>

          <div className="mt-6 flex items-center justify-end gap-2">
            <Button type="button" variant="outline" onClick={handleClose} disabled={processing}>
              Huỷ
            </Button>
            <Button type="button" onClick={handleConfirm} disabled={!croppedAreaPixels || processing}>
              {processing ? "Đang xử lý..." : "Cắt & lưu"}
            </Button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}

export default ImageCropDialog;
