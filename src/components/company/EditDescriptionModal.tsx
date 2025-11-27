"use client";

import { useState } from "react";
import { Dialog } from "@headlessui/react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import api from "@/lib/api";
import RichTextEditor from "@/components/ui/rich-text-editor";
import { X } from "lucide-react";
import DOMPurify from "dompurify";
import TurndownService from "turndown";
import { marked } from "marked";

const turndown = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
});

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

function htmlToMarkdown(html?: string | null) {
  if (!html) return "";
  try {
    return turndown.turndown(html);
  } catch (error) {
    console.warn("Failed to convert HTML to markdown", error);
    return html;
  }
}

function markdownToHtml(markdown?: string | null) {
  if (!markdown) return "";
  const html = marked.parse(markdown, { breaks: true });
  return typeof html === "string" ? html : "";
}

function sanitizeDescription(markdown: string | undefined | null) {
  if (!markdown) return "";
  const rawHtml = markdownToHtml(markdown);
  const sanitized = DOMPurify.sanitize(rawHtml, DESCRIPTION_SANITIZE_CONFIG);
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
  const [description, setDescription] = useState(htmlToMarkdown(currentDescription) || "");

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const sanitizedDescription = sanitizeDescription(description);
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
      setDescription(htmlToMarkdown(currentDescription) || "");
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
            Viết mô tả chi tiết về công ty. Hỗ trợ Markdown để định dạng văn bản (tiêu đề, danh sách, liên kết...).
          </Dialog.Description>

          <div className="space-y-4">
            <RichTextEditor
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

