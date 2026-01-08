"use client";

import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { deleteUploadedObject, uploadCompanyPostImage } from "@/lib/uploads";
import api from "@/lib/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ImagePlus, X, Loader2, Briefcase, Check, ChevronDown, Building2, Plus, Eye } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import HashtagInput from "@/components/shared/HashtagInput";
import { useAuthStore } from "@/store/useAuth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import PostPreviewModal from "@/components/feed/PostPreviewModal";

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

export default function FeedPostComposer() {
  const user = useAuthStore((s) => s.user);
  const memberships = useAuthStore((s) => s.memberships);
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [mediaItems, dispatch] = useReducer(mediaReducer, []);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mountedRef = useRef(true);
  const previewUrlsRef = useRef<Set<string>>(new Set());
  const queryClient = useQueryClient();
  const [jobs, setJobs] = useState<Array<{ id: string; title: string; location?: string | null; isActive: boolean; employmentType: string }>>([]);
  const [jobQuery, setJobQuery] = useState("");
  const [selectedJobIds, setSelectedJobIds] = useState<string[]>([]);
  const [showJobSelector, setShowJobSelector] = useState(false);
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);

  // Auto-select first company if only one
  useEffect(() => {
    if (memberships.length === 1) {
      setSelectedCompanyId(memberships[0]!.company.id);
    } else if (memberships.length > 1 && !selectedCompanyId) {
      // If multiple companies, select first one by default
      setSelectedCompanyId(memberships[0]!.company.id);
    }
  }, [memberships]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      previewUrlsRef.current.clear();
    };
  }, []);

  const selectedCompany = useMemo(() => {
    if (!selectedCompanyId) return null;
    return memberships.find((m) => m.company.id === selectedCompanyId);
  }, [selectedCompanyId, memberships]);

  const pendingUploads = mediaItems.some((item) => item.status === "uploading");
  const hasErrorMedia = mediaItems.some((item) => item.status === "error");

  function isUploaded(item: MediaItem): item is Extract<MediaItem, { status: "uploaded" }> {
    return item.status === "uploaded";
  }

  const createPost = useMutation({
    mutationFn: async () => {
      if (!selectedCompanyId) {
        throw new Error("Vui lòng chọn công ty");
      }

      const images = mediaItems
        .filter(isUploaded)
        .map((item, index) => ({
          key: item.key,
          url: item.url,
          width: item.width,
          height: item.height,
          order: index,
        }));

      const title = content.slice(0, 50).trim() || "New Post";

      const res = await api.post(`/api/posts/companies/${selectedCompanyId}/posts`, {
        title,
        content,
        type: "STORY",
        visibility: "PUBLIC",
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
      setIsExpanded(false);
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      queryClient.invalidateQueries({ queryKey: ["company-posts"] });
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error?.message ?? error?.message ?? "Đăng bài thất bại";
      toast.error(message);
    },
  });

  const handleFiles = async (files?: FileList | null) => {
    if (!files || !selectedCompanyId) return;
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
            companyId: selectedCompanyId,
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
        void getImageDimensions(previewUrl)
          .then(({ width, height }) => {
            if (!mountedRef.current) return;
            dispatch({
              type: "SUCCESS",
              payload: { id, key: uploadResult.key, url: uploadResult.assetUrl, width, height },
            });
          })
          .catch(() => {});
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
    if (!selectedCompanyId) return false;
    if (pendingUploads || hasErrorMedia) return false;
    return true;
  }, [content, selectedCompanyId, pendingUploads, hasErrorMedia]);

  const [jobsLoaded, setJobsLoaded] = useState(false);
  const [isFetchingJobs, setIsFetchingJobs] = useState(false);

  useEffect(() => {
    if (!showJobSelector || jobsLoaded || !selectedCompanyId) return;

    let cancelled = false;
    setIsFetchingJobs(true);
    (async () => {
      try {
        const res = await api.get(`/api/jobs`, { params: { companyId: selectedCompanyId, page: 1, limit: 50 } });
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
  }, [selectedCompanyId, showJobSelector, jobsLoaded]);

  // Reset jobs when company changes
  useEffect(() => {
    setJobs([]);
    setJobsLoaded(false);
    setSelectedJobIds([]);
    setShowJobSelector(false);
  }, [selectedCompanyId]);

  const filteredJobs = useMemo(() => {
    const q = jobQuery.trim().toLowerCase();
    if (!q) return jobs;
    return jobs.filter((j) => j.title.toLowerCase().includes(q));
  }, [jobs, jobQuery]);

  const toggleJob = (id: string) => {
    setSelectedJobIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((x) => x !== id);
      } else {
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
      if (!selectedCompanyId) {
        toast.error("Vui lòng chọn công ty");
        return;
      }
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

  const handleTextareaFocus = () => {
    if (!user) {
      toast.info("Vui lòng đăng nhập để đăng bài");
      return;
    }
    if (memberships.length === 0) {
      toast.info("Bạn cần tham gia công ty để đăng bài");
      return;
    }
    setIsExpanded(true);
  };

  // Empty state - no companies
  if (!user) {
    return null; // Don't show composer for guests
  }

  if (memberships.length === 0) {
    return (
      <Card className="overflow-hidden border border-[var(--border)] bg-[var(--card)] shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-[var(--muted)] flex items-center justify-center">
              <Building2 className="w-8 h-8 text-[var(--muted-foreground)]" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-[var(--foreground)] mb-1">
                Bạn chưa phải thành viên của công ty nào
              </h3>
              <p className="text-sm text-[var(--muted-foreground)] mb-4">
                Tạo công ty mới để bắt đầu đăng bài và chia sẻ hoạt động của doanh nghiệp.
              </p>
            </div>
            <Button asChild>
              <Link href="/companies/new">
                <Plus className="w-4 h-4 mr-2" />
                Tạo công ty mới
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Collapsed state
  if (!isExpanded) {
    return (
      <Card className="overflow-hidden border border-[var(--border)] bg-[var(--card)] shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            {selectedCompany?.company.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={selectedCompany.company.logoUrl}
                alt={selectedCompany.company.name}
                className="h-10 w-10 rounded-full object-cover border border-[var(--border)]"
              />
            ) : user.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.avatar}
                alt={user.name || "User"}
                className="h-10 w-10 rounded-full object-cover border border-[var(--border)]"
              />
            ) : (
              <div className="h-10 w-10 rounded-full bg-[var(--muted)] flex items-center justify-center text-sm font-semibold text-[var(--muted-foreground)]">
                {(selectedCompany?.company.name || user.name || "U")[0]?.toUpperCase()}
              </div>
            )}
            <button
              type="button"
              onClick={handleTextareaFocus}
              className="flex-1 text-left px-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm text-[var(--muted-foreground)] hover:border-[var(--brand)]/50 hover:bg-[var(--muted)]/30 transition-colors"
            >
              Bạn đang nghĩ gì?
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Expanded state
  return (
    <Card className="overflow-hidden border border-[var(--border)] bg-[var(--card)] shadow-sm">
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Company Selector */}
          {memberships.length > 1 && (
            <div className="flex items-center gap-2 pb-2 border-b border-[var(--border)]">
              <span className="text-xs text-[var(--muted-foreground)]">Đăng với tư cách:</span>
              <DropdownMenu.Root>
                <DropdownMenu.Trigger asChild>
                  <button
                    type="button"
                    className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-[var(--border)] bg-[var(--background)] hover:bg-[var(--muted)] transition-colors text-sm"
                  >
                    {selectedCompany?.company.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={selectedCompany.company.logoUrl}
                        alt={selectedCompany.company.name}
                        className="h-5 w-5 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-5 w-5 rounded-full bg-[var(--muted)] flex items-center justify-center text-[10px] font-semibold">
                        {selectedCompany?.company.name[0]?.toUpperCase()}
                      </div>
                    )}
                    <span className="font-medium">{selectedCompany?.company.name}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded bg-[var(--brand)]/10 text-[var(--brand)]">
                      {selectedCompany?.role}
                    </span>
                    <ChevronDown className="h-4 w-4 text-[var(--muted-foreground)]" />
                  </button>
                </DropdownMenu.Trigger>
                <DropdownMenu.Portal>
                  <DropdownMenu.Content
                    className="min-w-[200px] rounded-lg border border-[var(--border)] bg-[var(--card)] shadow-lg p-1 z-50"
                    align="start"
                  >
                    {memberships.map((membership) => (
                      <DropdownMenu.Item
                        key={membership.company.id}
                        className={cn(
                          "flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer text-sm transition-colors",
                          selectedCompanyId === membership.company.id
                            ? "bg-[var(--brand)]/10 text-[var(--brand)]"
                            : "hover:bg-[var(--muted)] text-[var(--foreground)]"
                        )}
                        onSelect={() => setSelectedCompanyId(membership.company.id)}
                      >
                        {membership.company.logoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={membership.company.logoUrl}
                            alt={membership.company.name}
                            className="h-6 w-6 rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-6 w-6 rounded-full bg-[var(--muted)] flex items-center justify-center text-[10px] font-semibold">
                            {membership.company.name[0]?.toUpperCase()}
                          </div>
                        )}
                        <span className="flex-1 font-medium truncate">{membership.company.name}</span>
                        <span className="text-xs px-1.5 py-0.5 rounded bg-[var(--muted)] text-[var(--muted-foreground)]">
                          {membership.role}
                        </span>
                      </DropdownMenu.Item>
                    ))}
                  </DropdownMenu.Content>
                </DropdownMenu.Portal>
              </DropdownMenu.Root>
            </div>
          )}

          {/* Auto-select if only one company */}
          {memberships.length === 1 && !selectedCompanyId && (
            <div className="text-xs text-[var(--muted-foreground)] pb-2 border-b border-[var(--border)]">
              Đăng với tư cách: <span className="font-medium text-[var(--foreground)]">{memberships[0]!.company.name}</span>
            </div>
          )}

          <Textarea
            placeholder="Chia sẻ hoạt động mới..."
            rows={3}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            maxLength={5000}
            className="min-h-[80px] resize-none border-none bg-transparent px-0 py-0 text-base focus-visible:ring-0"
            autoFocus
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

          {/* Job Selector */}
          {showJobSelector && selectedCompanyId && (
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
                disabled={!selectedCompanyId || mediaItems.length >= MAX_IMAGES || createPost.isPending}
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
                disabled={!selectedCompanyId || (selectedJobIds.length >= 2 && !showJobSelector)}
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
                disabled={!selectedCompanyId || (!content.trim() && mediaItems.length === 0)}
                className="h-8 gap-2 px-2 text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
                title="Xem trước bài đăng"
              >
                <Eye className="h-4 w-4" />
                <span className="text-xs font-medium">Xem trước</span>
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsExpanded(false);
                  setContent("");
                  setSelectedJobIds([]);
                  setHashtags([]);
                  dispatch({ type: "RESET" });
                }}
                className="h-8 px-2 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              >
                Hủy
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
      {selectedCompany && (
        <PostPreviewModal
          open={previewModalOpen}
          onOpenChange={setPreviewModalOpen}
          previewData={{
            content,
            mediaItems,
            hashtags,
            selectedJobIds,
            jobs,
            company: {
              id: selectedCompany.company.id,
              name: selectedCompany.company.name,
              slug: selectedCompany.company.slug,
              logoUrl: selectedCompany.company.logoUrl,
            },
          }}
        />
      )}
    </Card>
  );
}

