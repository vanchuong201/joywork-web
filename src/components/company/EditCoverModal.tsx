"use client";

import { useState, useRef, type ChangeEvent, useEffect } from "react";
import { Dialog } from "@headlessui/react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { uploadCompanyCover } from "@/lib/uploads";
import api from "@/lib/api";
import Image from "next/image";
import { X } from "lucide-react";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
  currentCoverUrl?: string | null;
  onSuccess: (newCoverUrl: string) => void;
};

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string") {
        reject(new Error("Không thể đọc dữ liệu ảnh"));
        return;
      }
      const commaIndex = result.indexOf(",");
      const base64 = commaIndex >= 0 ? result.slice(commaIndex + 1) : result;
      resolve(base64);
    };
    reader.onerror = () => reject(new Error("Không thể đọc tệp ảnh"));
    reader.readAsDataURL(file);
  });
}

export default function EditCoverModal({
  isOpen,
  onClose,
  companyId,
  currentCoverUrl,
  onSuccess,
}: Props) {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentCoverUrl ?? null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [coverKey, setCoverKey] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setPreviewUrl(currentCoverUrl ?? null);
      setSelectedFile(null);
      setCoverKey(null);
    }
  }, [isOpen, currentCoverUrl]);

  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      toast.error("Ảnh vượt quá giới hạn 8MB.");
      event.target.value = "";
      return;
    }

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Chỉ hỗ trợ JPG, PNG hoặc WEBP.");
      event.target.value = "";
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    event.target.value = "";
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("Vui lòng chọn ảnh trước khi tải lên.");
      return;
    }

    setUploading(true);
    try {
      const base64 = await fileToBase64(selectedFile);
      
      // Extract existing key from current URL if exists
      let previousKey: string | undefined;
      if (currentCoverUrl) {
        const match = currentCoverUrl.match(/companies\/[^/]+\/cover\/[^/?]+/);
        if (match) previousKey = match[0];
      }

      // Step 1: Upload file to S3
      const response = await uploadCompanyCover({
        companyId,
        fileName: selectedFile.name,
        fileType: selectedFile.type,
        fileData: base64,
        previousKey,
      });

      // Step 2: Update company record with new coverUrl
      await api.patch(`/api/companies/${companyId}`, {
        coverUrl: response.assetUrl,
      });

      setCoverKey(response.key);
      toast.success("Tải ảnh cover thành công");
      onSuccess(response.assetUrl);
      handleClose();
    } catch (error: any) {
      const message = error instanceof Error ? error.message : "Tải ảnh cover thất bại, vui lòng thử lại.";
      toast.error(message);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setPreviewUrl(null);
    setSelectedFile(null);
    setCoverKey(null);
  };

  const handleClose = () => {
    if (!uploading) {
      setPreviewUrl(currentCoverUrl ?? null);
      setSelectedFile(null);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onClose={handleClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto w-full max-w-2xl rounded-xl bg-[var(--card)] p-6 shadow-xl">
          <div className="mb-4 flex items-center justify-between">
            <Dialog.Title className="text-lg font-semibold text-[var(--foreground)]">
              Cập nhật ảnh cover
            </Dialog.Title>
            <button
              onClick={handleClose}
              disabled={uploading}
              className="rounded-full p-1 text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)] disabled:opacity-50"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <Dialog.Description className="mb-4 text-sm text-[var(--muted-foreground)]">
            Tải lên ảnh cover mới cho trang công ty. Ảnh sẽ hiển thị với tỷ lệ khoảng 3.75:1 (panorama).
            <br />
            <strong>Kích thước đề xuất:</strong> 1080x288px hoặc lớn hơn (ví dụ: 1920x512px hoặc 2160x576px).
          </Dialog.Description>

          <div className="space-y-4">
            {previewUrl ? (
              <div className="relative">
                <Image
                  src={previewUrl}
                  alt="Cover preview"
                  width={800}
                  height={400}
                  className="h-64 w-full rounded-lg border border-[var(--border)] object-cover"
                />
                {uploading && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/40 text-sm text-white">
                    Đang tải lên...
                  </div>
                )}
              </div>
            ) : (
              <div className="flex h-64 w-full items-center justify-center rounded-lg border border-dashed border-[var(--border)] bg-[var(--muted)] text-sm text-[var(--muted-foreground)]">
                Chưa có ảnh cover
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => inputRef.current?.click()}
                disabled={uploading}
              >
                {previewUrl ? "Chọn ảnh khác" : "Chọn ảnh"}
              </Button>
              {previewUrl && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleRemove}
                  disabled={uploading}
                >
                  Gỡ ảnh
                </Button>
              )}
            </div>

            <p className="text-xs text-[var(--muted-foreground)]">
              Hỗ trợ JPG, PNG, WEBP (tối đa 8MB). Tỷ lệ ~3.75:1, đề xuất: 1920x512px hoặc 2160x576px.
            </p>

            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>

          <div className="mt-6 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={uploading}
            >
              Huỷ
            </Button>
            <Button
              type="button"
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
            >
              {uploading ? "Đang tải..." : "Lưu thay đổi"}
            </Button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}

