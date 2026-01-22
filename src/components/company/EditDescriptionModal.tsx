"use client";

import { useState, useEffect } from "react";
import { Dialog } from "@headlessui/react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import api from "@/lib/api";
import TiptapEditor from "@/components/ui/tiptap-editor";
import { X } from "lucide-react";

const DESCRIPTION_SANITIZE_CONFIG = {
  ALLOWED_TAGS: [
    "p",
    "strong",
    "em",
    "u",
    "s",
    "span",
    "a",
    "ul",
    "ol",
    "li",
    "blockquote",
    "code",
    "pre",
    "h1",
    "h2",
    "h3",
    "br",
    "div",
    "img",
    "figure",
    "figcaption",
  ],
  ALLOWED_ATTR: ["href", "target", "rel", "style", "class", "src", "alt", "title", "width", "height", "loading"],
};

// Sanitize HTML directly (TiptapEditor outputs HTML)
function sanitizeHtml(html: string | undefined | null): string {
  if (!html) return "";
  // Dynamic import DOMPurify only on client
  if (typeof window === "undefined") return html;
  const DOMPurify = require("dompurify");
  const sanitized = DOMPurify.sanitize(html, DESCRIPTION_SANITIZE_CONFIG);
  const normalized = sanitized.replace(/(<p><br><\/p>|\s|&nbsp;)+$/gi, "").trim();
  if (!normalized || normalized === "<p></p>") {
    return "";
  }
  return sanitized;
}

type Props = {
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
  currentDescription?: string | null;
  onSuccess: () => void;
};

export default function EditDescriptionModal({
  isOpen,
  onClose,
  companyId,
  currentDescription,
  onSuccess,
}: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [description, setDescription] = useState(currentDescription || "");

  // Sync description when modal opens with new data
  useEffect(() => {
    if (isOpen) {
      setDescription(currentDescription || "");
    }
  }, [isOpen, currentDescription]);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const sanitizedDescription = sanitizeHtml(description);
      await api.patch(`/api/companies/${companyId}`, {
        description: sanitizedDescription || undefined,
      });
      toast.success("Cập nhật mô tả thành công");
      onSuccess();
      handleClose();
    } catch (error: any) {
      const message = error?.response?.data?.error?.message ?? "Cập nhật mô tả thất bại";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setDescription(currentDescription || "");
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onClose={handleClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto w-full max-w-4xl rounded-xl bg-[var(--card)] p-6 shadow-xl">
          <div className="mb-4 flex items-center justify-between">
            <Dialog.Title className="text-lg font-semibold text-[var(--foreground)]">
              Chỉnh sửa mô tả công ty
            </Dialog.Title>
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="rounded-full p-1 text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)] disabled:opacity-50"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <Dialog.Description className="mb-4 text-sm text-[var(--muted-foreground)]">
            Viết mô tả chi tiết về công ty (tiêu đề, danh sách, liên kết...).
          </Dialog.Description>

          <div className="space-y-4">
            <TiptapEditor
              value={description}
              onChange={setDescription}
              placeholder="Nhập mô tả về công ty..."
            />

            <div className="flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Huỷ
              </Button>
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Đang lưu..." : "Lưu thay đổi"}
              </Button>
            </div>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}

