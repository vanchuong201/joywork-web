"use client";

import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { deleteUploadedObject, uploadCompanyPostImage } from "@/lib/uploads";
import api from "@/lib/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const MAX_IMAGES = 8;
const MAX_FILE_SIZE = 8 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

type MediaItemBase = {
  id: string;
  file: File;
  previewUrl: string;
  status: "uploading" | "uploaded" | "error";
  errorMessage?: string;
};

type MediaItem =
  | (MediaItemBase & { status: "uploading" })
  | (MediaItemBase & {
      status: "uploaded";
      key: string;
      url: string;
      width?: number;
      height?: number;
    })
  | (MediaItemBase & { status: "error"; key?: string; url?: string });

type UploadingPayload = {
  id: string;
  file: File;
  previewUrl: string;
};

type MediaAction =
  | { type: "ADD"; payload: UploadingPayload }
  | { type: "SUCCESS"; payload: { id: string; key: string; url: string; width?: number; height?: number } }
  | { type: "ERROR"; payload: { id: string; message: string } }
  | { type: "REMOVE"; payload: { id: string } }
  | { type: "RESET" };

function mediaReducer(state: MediaItem[], action: MediaAction): MediaItem[] {
  switch (action.type) {
    case "ADD":
      return [
        ...state,
        {
          id: action.payload.id,
          file: action.payload.file,
          previewUrl: action.payload.previewUrl,
          status: "uploading",
        },
      ];
    case "SUCCESS":
      return state.map((item) =>
        item.id === action.payload.id
          ? {
              ...item,
              status: "uploaded",
              key: action.payload.key,
              url: action.payload.url,
              width: action.payload.width,
              height: action.payload.height,
              errorMessage: undefined,
            }
          : item,
      );
    case "ERROR":
      return state.map((item) =>
        item.id === action.payload.id
          ? {
              ...item,
              status: "error",
              errorMessage: action.payload.message,
            }
          : item,
      );
    case "REMOVE":
      return state.filter((item) => item.id !== action.payload.id);
    case "RESET":
      return [];
    default:
      return state;
  }
}

type Props = {
  companyId: string;
  onCreated?: () => void;
};

async function getImageDimensions(src: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve({ width: image.width, height: image.height });
    image.onerror = () => reject(new Error("Không thể đọc kích thước ảnh"));
    image.src = src;
  });
}

async function fileToBase64(file: File): Promise<string> {
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

export default function CompanyPostComposer({ companyId, onCreated }: Props) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [postType, setPostType] = useState<"STORY" | "ANNOUNCEMENT" | "EVENT">("STORY");
  const [visibility, setVisibility] = useState<"PUBLIC" | "PRIVATE">("PUBLIC");
  const [mediaItems, dispatch] = useReducer(mediaReducer, []);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mountedRef = useRef(true);
  const previewUrlsRef = useRef<Set<string>>(new Set());
  const queryClient = useQueryClient();

  useEffect(() => {
    mountedRef.current = true; // ensure true after StrictMode remount in dev
    return () => {
      mountedRef.current = false;
      previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      previewUrlsRef.current.clear();
    };
  }, []);

  const pendingUploads = mediaItems.some((item) => item.status === "uploading");
  const hasErrorMedia = mediaItems.some((item) => item.status === "error");

  function isUploaded(item: MediaItem): item is Extract<MediaItem, { status: "uploaded" }> {
    return item.status === "uploaded";
  }

  const createPost = useMutation({
    mutationFn: async () => {
      const images = mediaItems
        .filter(isUploaded)
        .map((item, index) => ({
          key: item.key,
          url: item.url,
          width: item.width,
          height: item.height,
          order: index,
        }));

      const res = await api.post(`/api/posts/companies/${companyId}/posts`, {
        title,
        content,
        type: postType,
        visibility,
        publishNow: true,
        images,
      });

      return res.data.data.post as { id: string };
    },
    onSuccess: () => {
      toast.success("Đăng bài thành công");
      setTitle("");
      setContent("");
      setPostType("STORY");
      setVisibility("PUBLIC");
      mediaItems.forEach((item) => {
        URL.revokeObjectURL(item.previewUrl);
        previewUrlsRef.current.delete(item.previewUrl);
      });
      dispatch({ type: "RESET" });
      queryClient.invalidateQueries({ queryKey: ["company-posts", companyId] });
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      onCreated?.();
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error?.message ?? "Đăng bài thất bại";
      toast.error(message);
    },
  });

  const handleFiles = async (files?: FileList | null) => {
    if (!files) return;
    const availableSlots = MAX_IMAGES - mediaItems.length;
    if (availableSlots <= 0) {
      toast.info("Bạn đã đạt giới hạn 8 ảnh cho một bài viết");
      return;
    }
    const selected = Array.from(files).slice(0, availableSlots);
    if (selected.length < files.length) {
      toast.info("Một số ảnh bị bỏ qua vì vượt quá giới hạn 8 ảnh.");
    }

    for (const file of selected) {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        toast.error(`Định dạng ${file.type} không được hỗ trợ.`);
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`Ảnh ${file.name} vượt quá giới hạn 8MB.`);
        continue;
      }
      const id = crypto.randomUUID();
      const previewUrl = URL.createObjectURL(file);
      previewUrlsRef.current.add(previewUrl);

      dispatch({ type: "ADD", payload: { id, file, previewUrl } });

      try {
        const uploadResult = await fileToBase64(file).then((base64) =>
          uploadCompanyPostImage({
            companyId,
            fileName: file.name,
            fileType: file.type,
            fileData: base64,
          }),
        );
        if (!mountedRef.current) return;
        dispatch({
          type: "SUCCESS",
          payload: { id, key: uploadResult.key, url: uploadResult.assetUrl },
        });
        // Fetch dimensions in background (best-effort)
        void getImageDimensions(previewUrl)
          .then(({ width, height }) => {
            if (!mountedRef.current) return;
            dispatch({
              type: "SUCCESS",
              payload: { id, key: uploadResult.key, url: uploadResult.assetUrl, width, height },
            });
          })
          .catch(() => {
            // ignore dimension errors
          });
      } catch (error: any) {
        const message = error instanceof Error ? error.message : "Tải ảnh thất bại";
        if (!mountedRef.current) return;
        dispatch({ type: "ERROR", payload: { id, message } });
        toast.error(message);
      }
    }
  };

  const handleRemoveMedia = async (id: string) => {
    const target = mediaItems.find((item) => item.id === id);
    if (!target) return;
    dispatch({ type: "REMOVE", payload: { id } });
    previewUrlsRef.current.delete(target.previewUrl);
    URL.revokeObjectURL(target.previewUrl);
    if (target.status === "uploaded" && target.key) {
      try {
        await deleteUploadedObject(target.key);
      } catch (error) {
        console.error("Failed to delete object from S3", error);
      }
    }
  };

  const canSubmit = useMemo(() => {
    if (!title.trim() || !content.trim()) return false;
    if (pendingUploads || hasErrorMedia) return false;
    return true;
  }, [title, content, pendingUploads, hasErrorMedia]);

  const handleSubmit = () => {
    if (!canSubmit) {
      if (pendingUploads) {
        toast.info("Đang tải ảnh, vui lòng đợi hoàn tất.");
      } else if (hasErrorMedia) {
        toast.error("Vui lòng xóa những ảnh bị lỗi trước khi đăng bài.");
      }
      return;
    }
    createPost.mutate();
  };

  const resetComposer = () => {
    setTitle("");
    setContent("");
    setPostType("STORY");
    setVisibility("PUBLIC");
    mediaItems.forEach((item) => {
      previewUrlsRef.current.delete(item.previewUrl);
      URL.revokeObjectURL(item.previewUrl);
    });
    dispatch({ type: "RESET" });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <Card>
      <CardHeader className="pb-0">
        <div>
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Đăng bài mới</h2>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Chia sẻ câu chuyện, thông báo hoặc sự kiện từ công ty của bạn.
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-[var(--foreground)]" htmlFor="post-title">
            Tiêu đề
          </label>
          <Input
            id="post-title"
            placeholder="Tiêu đề bài viết..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={200}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-[var(--foreground)]" htmlFor="post-content">
            Nội dung
          </label>
          <Textarea
            id="post-content"
            placeholder="Hãy kể câu chuyện của bạn..."
            rows={5}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            maxLength={10000}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--foreground)]" htmlFor="post-type">
              Loại bài viết
            </label>
            <select
              id="post-type"
              value={postType}
              onChange={(e) => setPostType(e.target.value as typeof postType)}
              className="h-10 w-full rounded-md border border-[var(--border)] bg-[var(--input)] px-3 text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
            >
              <option value="STORY">Story</option>
              <option value="ANNOUNCEMENT">Announcement</option>
              <option value="EVENT">Event</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--foreground)]" htmlFor="post-visibility">
              Hiển thị
            </label>
            <select
              id="post-visibility"
              value={visibility}
              onChange={(e) => setVisibility(e.target.value as typeof visibility)}
              className="h-10 w-full rounded-md border border-[var(--border)] bg-[var(--input)] px-3 text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
            >
              <option value="PUBLIC">Công khai</option>
              <option value="PRIVATE">Riêng tư</option>
            </select>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[var(--foreground)]">Thư viện ảnh</p>
              <p className="text-xs text-[var(--muted-foreground)]">
                Tối đa {MAX_IMAGES} ảnh, dung lượng &lt;= 8MB, định dạng JPG/PNG/WebP.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_TYPES.join(",")}
                multiple
                className="hidden"
                onChange={(e) => {
                  void handleFiles(e.target.files);
                  e.target.value = "";
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={mediaItems.length >= MAX_IMAGES || createPost.isPending}
              >
                Thêm ảnh
              </Button>
            </div>
          </div>

          {mediaItems.length > 0 ? (
            <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-4">
              {mediaItems.map((item) => (
                <div key={item.id} className="relative overflow-hidden rounded-md border border-[var(--border)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.previewUrl} alt="preview" className="h-36 w-full object-cover" />
                  <button
                    type="button"
                    className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-sm text-white"
                    onClick={() => void handleRemoveMedia(item.id)}
                    aria-label="Xóa ảnh"
                  >
                    ×
                  </button>
                  {item.status === "uploading" ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-xs text-white">
                      Đang tải...
                    </div>
                  ) : item.status === "error" ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 px-2 text-center text-xs text-white">
                      {item.errorMessage ?? "Lỗi tải ảnh"}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-md border border-dashed border-[var(--border)] bg-[var(--background)] p-6 text-center text-sm text-[var(--muted-foreground)]">
              Chưa có ảnh nào. Bạn có thể thêm tối đa {MAX_IMAGES} ảnh cho bài viết này.
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={resetComposer}
            disabled={createPost.isPending}
          >
            Đặt lại
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={!canSubmit || createPost.isPending}>
            {createPost.isPending ? "Đang đăng..." : "Đăng bài"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

