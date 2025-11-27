"use client";

import { useState, useRef, type ChangeEvent } from "react";
import { Dialog } from "@headlessui/react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { uploadCompanyLogo } from "@/lib/uploads";
import api from "@/lib/api";
import Image from "next/image";
import { X } from "lucide-react";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
  companyName: string;
  currentLogoUrl?: string | null;
  onSuccess: (newLogoUrl: string) => void;
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

export default function EditLogoModal({
  isOpen,
  onClose,
  companyId,
  companyName,
  currentLogoUrl,
  onSuccess,
}: Props) {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentLogoUrl ?? null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [logoKey, setLogoKey] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
      if (currentLogoUrl) {
        const match = currentLogoUrl.match(/companies\/[^/]+\/logo\/[^/?]+/);
        if (match) previousKey = match[0];
      }

      // Step 1: Upload file to S3
      const response = await uploadCompanyLogo({
        companyId,
        fileName: selectedFile.name,
        fileType: selectedFile.type,
        fileData: base64,
        previousKey,
      });

      // Step 2: Update company record with new logoUrl
      await api.patch(`/api/companies/${companyId}`, {
        logoUrl: response.assetUrl,
      });

      setLogoKey(response.key);
      toast.success("Tải logo thành công");
      onSuccess(response.assetUrl);
      handleClose();
    } catch (error: any) {
      const message = error instanceof Error ? error.message : "Tải logo thất bại, vui lòng thử lại.";
      toast.error(message);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setPreviewUrl(null);
    setSelectedFile(null);
    setLogoKey(null);
  };

  const handleClose = () => {
    if (!uploading) {
      setPreviewUrl(currentLogoUrl ?? null);
      setSelectedFile(null);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onClose={handleClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto w-full max-w-md rounded-xl bg-[var(--card)] p-6 shadow-xl">
          <div className="mb-4 flex items-center justify-between">
            <Dialog.Title className="text-lg font-semibold text-[var(--foreground)]">
              Cập nhật logo
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
            Tải lên logo mới cho công ty. Logo vuông, kích thước đề xuất 512x512px.
          </Dialog.Description>

          <div className="space-y-4">
            <div className="flex justify-center">
              {previewUrl ? (
                <div className="relative">
                  <Image
                    src={previewUrl}
                    alt="Logo preview"
                    width={160}
                    height={160}
                    className="h-40 w-40 rounded-2xl border border-[var(--border)] object-cover"
                  />
                  {uploading && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/40 text-xs text-white">
                      Đang tải...
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex h-40 w-40 items-center justify-center rounded-2xl border border-dashed border-[var(--border)] bg-[var(--muted)] text-3xl font-semibold text-[var(--muted-foreground)]">
                  {companyName.slice(0, 1).toUpperCase()}
                </div>
              )}
            </div>

            <div className="flex flex-wrap justify-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => inputRef.current?.click()}
                disabled={uploading}
              >
                {previewUrl ? "Chọn ảnh khác" : "Chọn logo"}
              </Button>
              {previewUrl && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleRemove}
                  disabled={uploading}
                >
                  Gỡ logo
                </Button>
              )}
            </div>

            <p className="text-center text-xs text-[var(--muted-foreground)]">
              Hỗ trợ JPG, PNG, WEBP (tối đa 8MB). Logo vuông, kích thước đề xuất 512x512px.
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

