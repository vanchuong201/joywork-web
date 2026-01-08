"use client";

import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { deleteUploadedObject, uploadCompanyPostImage } from "@/lib/uploads";
import api from "@/lib/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ImagePlus, X, Loader2, Briefcase, Check, Eye } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import HashtagInput from "@/components/shared/HashtagInput";
import PostPreviewModal from "@/components/feed/PostPreviewModal";
import { useQuery } from "@tanstack/react-query";

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
  const [content, setContent] = useState("");
  const [mediaItems, dispatch] = useReducer(mediaReducer, []);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mountedRef = useRef(true);
  const previewUrlsRef = useRef<Set<string>>(new Set());
  const queryClient = useQueryClient();
  const [jobs, setJobs] = useState<Array<{ id: string; title: string; location?: string | null; isActive: boolean; employmentType: string }>>(
    [],
  );
  const [jobQuery, setJobQuery] = useState("");
  const [selectedJobIds, setSelectedJobIds] = useState<string[]>([]);
  const [showJobSelector, setShowJobSelector] = useState(false);
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);

  // Fetch company info for preview (companyId might be slug, try by-id endpoint first)
  const { data: company } = useQuery({
    queryKey: ["company-for-preview", companyId],
    queryFn: async () => {
      try {
        // Try by-id endpoint first
        const res = await api.get(`/api/companies/by-id/${companyId}`);
        return res.data.data.company as { id: string; name: string; slug: string; logoUrl?: string | null };
      } catch {
        // Fallback to slug endpoint
        const res = await api.get(`/api/companies/${companyId}`);
        return res.data.data.company as { id: string; name: string; slug: string; logoUrl?: string | null };
      }
    },
    enabled: Boolean(companyId),
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

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

      // Auto generate a simple title if not provided, but UI hides it
      const title = content.slice(0, 50).trim() || "New Post";

      const res = await api.post(`/api/posts/companies/${companyId}/posts`, {
        title,
        content,
        type: "STORY", // Default
        visibility: "PUBLIC", // Default
        publishNow: true,
        images,
        jobIds: selectedJobIds,
        hashtags,
      });

      return res.data.data.post as { id: string };
    },
    onSuccess: () => {
      toast.success("Đăng bài thành công");
      setContent("");
      setSelectedJobIds([]);
      setHashtags([]);
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
    if (!content.trim()) return false;
    if (pendingUploads || hasErrorMedia) return false;
    return true;
  }, [content, pendingUploads, hasErrorMedia]);

  const [jobsLoaded, setJobsLoaded] = useState(false);
  const [isFetchingJobs, setIsFetchingJobs] = useState(false);

  // Lazy load company jobs
  useEffect(() => {
    if (!showJobSelector || jobsLoaded) return;

    let cancelled = false;
    setIsFetchingJobs(true);
    (async () => {
      try {
        const res = await api.get(`/api/jobs`, { params: { companyId, page: 1, limit: 50 } });
        if (!cancelled && mountedRef.current) {
          const items =
            (res.data?.data?.jobs as Array<{ id: string; title: string; location?: string | null; isActive: boolean; employmentType: string }>) ??
            [];
          setJobs(items);
          setJobsLoaded(true);
        }
      } catch {
        // ignore
      } finally {
        if (mountedRef.current) {
          setIsFetchingJobs(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [companyId, showJobSelector, jobsLoaded]);

  const filteredJobs = useMemo(() => {
    const q = jobQuery.trim().toLowerCase();
    if (!q) return jobs;
    return jobs.filter((j) => j.title.toLowerCase().includes(q));
  }, [jobs, jobQuery]);

  const toggleJob = (id: string) => {
    setSelectedJobIds((prev) => {
      if (prev.includes(id)) {
        // Remove job
        return prev.filter((x) => x !== id);
      } else {
        // Add job - check limit
        if (prev.length >= 2) {
          toast.error("Chỉ được gắn tối đa 2 việc làm vào bài viết");
          return prev;
        }
        return [...prev, id];
      }
    });
  };

  const handleSubmit = () => {
    if (!canSubmit) {
      if (pendingUploads) {
        toast.info("Đang tải ảnh, vui lòng đợi hoàn tất.");
      } else if (hasErrorMedia) {
        toast.error("Vui lòng xóa những ảnh bị lỗi trước khi đăng bài.");
      }
      return;
    }
    if (selectedJobIds.length > 2) {
      toast.error("Chỉ được gắn tối đa 2 việc làm vào bài viết");
      return;
    }
    createPost.mutate();
  };

  return (
    <Card className="overflow-hidden border border-[var(--border)] bg-[var(--card)] shadow-sm">
      <CardContent className="p-4">
        <div className="space-y-4">
          <Textarea
            placeholder="Chia sẻ hoạt động mới..."
            rows={3}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            maxLength={5000}
            className="min-h-[80px] resize-none border-none bg-transparent px-0 py-0 text-base focus-visible:ring-0"
          />

          {mediaItems.length > 0 && (
            <div className="grid gap-2 sm:grid-cols-3 md:grid-cols-4">
              {mediaItems.map((item) => (
                <div key={item.id} className="group relative aspect-square overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--muted)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.previewUrl}
                    alt="preview"
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                  />
                  <button
                    type="button"
                    className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition hover:bg-black/80 group-hover:opacity-100"
                    onClick={() => void handleRemoveMedia(item.id)}
                    aria-label="Xóa ảnh"
            >
                    <X className="h-3 w-3" />
                  </button>
                  {item.status === "uploading" && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                      <Loader2 className="h-5 w-5 animate-spin text-white" />
          </div>
                  )}
                  {item.status === "error" && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 p-2 text-center text-[10px] text-white">
                      <span className="mb-1">Lỗi</span>
                      <span className="line-clamp-2">{item.errorMessage}</span>
          </div>
                  )}
        </div>
              ))}
            </div>
          )}

          {/* Hashtags */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-[var(--foreground)]">Chủ đề (Hashtags)</span>
              <span className="text-xs text-[var(--muted-foreground)]">{hashtags.length}/5</span>
            </div>
            <HashtagInput value={hashtags} onChange={setHashtags} />
          </div>

          {/* Selected Jobs Chips */}
          {selectedJobIds.length > 0 && (
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[var(--muted-foreground)]">
                  Việc làm đã chọn: {selectedJobIds.length}/2
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedJobIds.map((id) => {
                  const j = jobs.find((x) => x.id === id);
                  if (!j) return null;
                  return (
                    <span key={id} className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--background)] px-3 py-1 text-xs shadow-sm">
                      <span className="truncate max-w-[220px] font-medium text-[var(--foreground)]">{j.title}</span>
                      <button
                        className="rounded-full hover:bg-[var(--muted)] p-0.5 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                        onClick={() => setSelectedJobIds((prev) => prev.filter((x) => x !== id))}
                        title="Gỡ"
                        type="button"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Job Selector - Improved UI */}
          {showJobSelector && (
            <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] shadow-lg animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
               <div className="flex items-center gap-1 border-b border-[var(--border)] bg-[var(--muted)]/50 p-2">
                  <Input
                    value={jobQuery}
                    onChange={(e) => setJobQuery(e.target.value)}
                    placeholder="Tìm kiếm công việc..."
                    className="h-8 flex-1 border-none bg-transparent focus-visible:ring-0 px-2 shadow-none"
                    autoFocus
                  />
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => setShowJobSelector(false)}
                    className="h-7 px-3 text-xs font-medium hover:bg-[var(--background)] hover:text-[var(--foreground)] text-[var(--muted-foreground)]"
                  >
                    Xong
                  </Button>
               </div>
              <div className="max-h-56 overflow-auto bg-[var(--background)] p-1">
                {isFetchingJobs ? (
                  <div className="flex items-center justify-center py-6 text-[var(--muted-foreground)]">
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    <span className="text-sm">Đang tải danh sách việc làm...</span>
                  </div>
                ) : filteredJobs.length ? (
                  <ul className="space-y-0.5">
                    {filteredJobs.slice(0, 20).map((job) => {
                      const checked = selectedJobIds.includes(job.id);
                      const isDisabled = !checked && selectedJobIds.length >= 2;
                      return (
                        <li
                          key={job.id}
                          className={cn(
                            "group flex cursor-pointer items-center justify-between gap-3 px-3 py-2.5 rounded-md transition-colors text-sm",
                            checked ? "bg-[var(--brand)]/5 text-[var(--brand)]" : "hover:bg-[var(--muted)] text-[var(--foreground)]",
                            isDisabled && "opacity-50 cursor-not-allowed"
                          )}
                          onClick={() => !isDisabled && toggleJob(job.id)}
                        >
                          <div className="flex flex-col min-w-0">
                            <span className="font-medium truncate">{job.title}</span>
                            <div className="flex items-center gap-1.5 text-xs text-[var(--muted-foreground)] group-hover:text-[var(--foreground)]/80">
                               <span className={cn("inline-block w-1.5 h-1.5 rounded-full", job.isActive ? "bg-emerald-500" : "bg-gray-300")} />
                               <span>{job.isActive ? "Đang mở" : "Đã đóng"}</span>
                               <span>·</span>
                               <span>{job.employmentType}</span>
                               {job.location && (
                                <>
                                   <span>·</span>
                                   <span className="truncate">{job.location}</span>
                                </>
                               )}
                            </div>
                          </div>
                          {checked && <Check className="h-4 w-4 shrink-0 text-[var(--brand)]" />}
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <div className="px-3 py-8 text-center text-sm text-[var(--muted-foreground)]">
                    Không tìm thấy công việc phù hợp
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between border-t border-[var(--border)] pt-3">
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
                variant="ghost"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={mediaItems.length >= MAX_IMAGES || createPost.isPending}
                className="h-8 gap-2 px-2 text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
              >
                <ImagePlus className="h-4 w-4" />
                <span className="text-xs font-medium">Thêm ảnh</span>
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowJobSelector((prev) => !prev)}
                disabled={selectedJobIds.length >= 2 && !showJobSelector}
                className={cn(
                  "h-8 gap-2 px-2 text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]",
                  (showJobSelector || selectedJobIds.length > 0) && "text-[var(--brand)] bg-[var(--brand)]/10 hover:bg-[var(--brand)]/20",
                  selectedJobIds.length >= 2 && !showJobSelector && "opacity-50 cursor-not-allowed"
                )}
                title={selectedJobIds.length >= 2 ? "Đã đạt giới hạn tối đa 2 việc làm" : "Gắn việc làm vào bài viết (tối đa 2)"}
              >
                <Briefcase className="h-4 w-4" />
                <span className="text-xs font-medium">
                  Đính kèm Job
                  {selectedJobIds.length > 0 && (
                    <span className="ml-1 text-[var(--brand)]">({selectedJobIds.length}/2)</span>
                  )}
                </span>
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setPreviewModalOpen(true)}
                disabled={!content.trim() && mediaItems.length === 0}
                className="h-8 gap-2 px-2 text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
                title="Xem trước bài đăng"
              >
                <Eye className="h-4 w-4" />
                <span className="text-xs font-medium">Xem trước</span>
              </Button>
        </div>

          <Button
            type="button"
              onClick={handleSubmit} 
              disabled={!canSubmit || createPost.isPending}
              size="sm"
              className="h-8 px-4"
            >
              {createPost.isPending ? (
                <>
                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                  Đang đăng...
                </>
              ) : (
                "Đăng tin"
              )}
          </Button>
          </div>
        </div>
      </CardContent>

      {/* Preview Modal */}
      {company && (
        <PostPreviewModal
          open={previewModalOpen}
          onOpenChange={setPreviewModalOpen}
          previewData={{
            content,
            mediaItems,
            hashtags,
            selectedJobIds,
            jobs,
            company,
          }}
        />
      )}
    </Card>
  );
}
