"use client";

import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z, ZodError } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { OwnUserProfile, UserStatus } from "@/types/user";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { uploadProfileAvatar, uploadProfileCV } from "@/lib/uploads";
import Image from "next/image";
import { Loader2, Upload, FileText, X } from "lucide-react";

// Helper for optional URL fields - accepts empty string
const optionalUrl = z.union([
  z.literal(""),
  z.string().url({ message: "URL không hợp lệ. Vui lòng nhập URL đầy đủ bắt đầu bằng http:// hoặc https://" })
]).optional();

// Helper for optional email field - accepts empty string
const optionalEmail = z.union([
  z.literal(""),
  z.string().email({ message: "Email không hợp lệ. Vui lòng nhập địa chỉ email đúng định dạng" })
]).optional();

const schema = z.object({
  fullName: z.string().max(200, "Họ tên đầy đủ tối đa 200 ký tự").optional(),
  title: z.string().max(150, "Tiêu đề tối đa 150 ký tự").optional(),
  headline: z.string().max(100, "Headline tối đa 100 ký tự").optional(),
  bio: z.string().max(2000, "Giới thiệu tối đa 2000 ký tự").optional(),
  // CV contact info (independent from account email/phone)
  contactEmail: optionalEmail,
  contactPhone: z.string().max(50, "Số điện thoại tối đa 50 ký tự").optional(),
  location: z.string().max(100, "Địa điểm tối đa 100 ký tự").optional(),
  website: optionalUrl,
  linkedin: optionalUrl,
  github: optionalUrl,
  cvUrl: optionalUrl,
  status: z.enum(["OPEN_TO_WORK", "NOT_AVAILABLE", "LOOKING"]).optional().nullable(),
  isPublic: z.boolean().optional(),
});

type FormValues = z.infer<typeof schema>;

interface ProfileBasicInfoProps {
  profile: OwnUserProfile;
}

const statusLabels: Record<UserStatus, string> = {
  OPEN_TO_WORK: "Đang tìm việc",
  NOT_AVAILABLE: "Không có sẵn",
  LOOKING: "Đang tìm kiếm",
};

export default function ProfileBasicInfo({ profile }: ProfileBasicInfoProps) {
  const queryClient = useQueryClient();
  // Fallback: profile.avatar || user.avatar || null
  const defaultAvatar = profile.profile?.avatar || profile.avatar || null;
  const [avatar, setAvatar] = useState<string | null>(defaultAvatar);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // CV file upload
  const [cvUrl, setCvUrl] = useState<string | null>(profile.profile?.cvUrl || null);
  const [uploadingCV, setUploadingCV] = useState(false);
  const cvFileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    setError,
    formState: { errors, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      // fullName: fallback to profile.name if fullName is not set
      fullName: profile.profile?.fullName || profile.name || "",
      contactEmail: profile.profile?.contactEmail || profile.email || "",
      contactPhone: profile.profile?.contactPhone || profile.phone || "",
      title: profile.profile?.title || "",
      headline: profile.profile?.headline || "",
      bio: profile.profile?.bio || "",
      location: profile.profile?.location || "",
      website: profile.profile?.website || "",
      linkedin: profile.profile?.linkedin || "",
      github: profile.profile?.github || "",
      cvUrl: profile.profile?.cvUrl || "",
      // Default to OPEN_TO_WORK if status is null or LOOKING (migrate old data)
      status: profile.profile?.status === "OPEN_TO_WORK" || profile.profile?.status === "LOOKING" 
        ? "OPEN_TO_WORK" 
        : profile.profile?.status === "NOT_AVAILABLE" 
        ? "NOT_AVAILABLE" 
        : "OPEN_TO_WORK",
      isPublic: profile.profile?.isPublic ?? true,
    },
  });

  const isPublic = watch("isPublic");

  useEffect(() => {
    reset({
      // fullName: fallback to profile.name if fullName is not set
      fullName: profile.profile?.fullName || profile.name || "",
      contactEmail: profile.profile?.contactEmail || profile.email || "",
      contactPhone: profile.profile?.contactPhone || profile.phone || "",
      title: profile.profile?.title || "",
      headline: profile.profile?.headline || "",
      bio: profile.profile?.bio || "",
      location: profile.profile?.location || "",
      website: profile.profile?.website || "",
      linkedin: profile.profile?.linkedin || "",
      github: profile.profile?.github || "",
      cvUrl: profile.profile?.cvUrl || "",
      // Default to OPEN_TO_WORK if status is null or LOOKING (migrate old data)
      status: profile.profile?.status === "OPEN_TO_WORK" || profile.profile?.status === "LOOKING" 
        ? "OPEN_TO_WORK" 
        : profile.profile?.status === "NOT_AVAILABLE" 
        ? "NOT_AVAILABLE" 
        : "OPEN_TO_WORK",
      isPublic: profile.profile?.isPublic ?? true,
    });
    // Fallback: profile.avatar || user.avatar || null
    setAvatar(profile.profile?.avatar || profile.avatar || null);
    setCvUrl(profile.profile?.cvUrl || null);
  }, [profile, reset]);

  const updateProfile = useMutation({
    mutationFn: async (values: FormValues) => {
      // Don't send name and slug - they are managed in account tab
      const { name, slug, ...profileData } = values as any;
      
      // Convert empty strings to null for optional URL fields
      const cleanedData: any = {};
      for (const [key, value] of Object.entries(profileData)) {
        if (value === "") {
          cleanedData[key] = null;
        } else {
          cleanedData[key] = value;
        }
      }
      
      const payload = {
        ...cleanedData,
        avatar,
        cvUrl: cvUrl || cleanedData.cvUrl || null,
      };
      console.log('[ProfileBasicInfo] Submitting payload:', payload);
      await api.patch("/api/users/me/profile", payload);
    },
    onSuccess: () => {
      toast.success("Cập nhật thông tin cơ bản thành công");
      // Invalidate query to trigger refetch - useEffect will handle form reset
      queryClient.invalidateQueries({ queryKey: ["own-profile"] });
    },
    onError: (error: any) => {
      const err = error?.response?.data?.error;
      const errorMessage = err?.message || error?.message || "Cập nhật thất bại";
      const errorDetails = err?.details;
      
      // Show main error message
      toast.error(errorMessage);
      
      // Map server validation errors to form fields
      if (errorDetails && Array.isArray(errorDetails)) {
        let focused = false;
        errorDetails.forEach((detail: any) => {
          const path = Array.isArray(detail?.path) ? detail.path : Array.isArray(detail?.instancePath) ? String(detail.instancePath).split("/").filter(Boolean) : [];
          const field = path[0] || path[path.length - 1];
          const msg = detail?.message || errorMessage;
          
          // Map common field names
          if (field) {
            setError(field as keyof FormValues, { 
              type: "server", 
              message: msg 
            });
            
            // Focus on first error field
            if (!focused) {
              const input = document.querySelector(`input[name="${field}"], textarea[name="${field}"]`) as HTMLInputElement | null;
              input?.focus();
              input?.scrollIntoView({ behavior: 'smooth', block: 'center' });
              focused = true;
            }
          }
        });
      }
    },
  });

  const handleAvatarUpload = async (file: File) => {
    if (file.size > 4 * 1024 * 1024) {
      toast.error("Ảnh vượt quá giới hạn 4MB");
      return;
    }

    setUploadingAvatar(true);
    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const response = await uploadProfileAvatar({
        fileName: file.name,
        fileType: file.type,
        fileData: base64.split(",")[1],
        previousKey: avatar ? extractS3Key(avatar) : undefined,
        target: 'profile', // Upload to UserProfile.avatar
      });

      setAvatar(response.assetUrl);
      // Invalidate queries to refresh data from server
      queryClient.invalidateQueries({ queryKey: ["own-profile"] });
      queryClient.invalidateQueries({ queryKey: ["account"] });
      toast.success("Cập nhật ảnh đại diện thành công");
    } catch (error: any) {
      toast.error(error?.message || "Upload ảnh thất bại");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const extractS3Key = (url: string): string | undefined => {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split("/").filter(Boolean);
      if (pathParts.length >= 3) {
        return pathParts.slice(2).join("/");
      }
    } catch {
      // Invalid URL
    }
    return undefined;
  };

  const handleCVUpload = async (file: File) => {
    // Check file type - allow PDF, DOC, DOCX
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Chỉ chấp nhận file PDF, DOC hoặc DOCX");
      return;
    }

    // Check file size - max 10MB
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File CV vượt quá giới hạn 10MB");
      return;
    }

    setUploadingCV(true);
    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const response = await uploadProfileCV({
        fileName: file.name,
        fileType: file.type,
        fileData: base64.split(",")[1],
        previousKey: cvUrl ? extractS3Key(cvUrl) : undefined,
      });

      setCvUrl(response.assetUrl);
      setValue("cvUrl", response.assetUrl, { shouldDirty: true });
      toast.success("Tải CV thành công");
    } catch (error: any) {
      toast.error(error?.message || "Upload CV thất bại");
    } finally {
      setUploadingCV(false);
    }
  };

  const onSubmit = (values: FormValues) => {
    updateProfile.mutate(values);
  };

  const onInvalid = (errors: any) => {
    // Show toast for each validation error
    const errorMessages: string[] = [];
    
    Object.keys(errors).forEach((fieldName) => {
      const error = errors[fieldName];
      if (error?.message) {
        errorMessages.push(`${getFieldLabel(fieldName)}: ${error.message}`);
      }
    });

    if (errorMessages.length > 0) {
      // Show first error as main toast
      toast.error(errorMessages[0]);
      
      // Show remaining errors if any
      if (errorMessages.length > 1) {
        setTimeout(() => {
          errorMessages.slice(1).forEach((msg) => {
            toast.error(msg);
          });
        }, 100);
      }
    } else {
      toast.error("Vui lòng kiểm tra lại thông tin đã nhập");
    }
  };

  const getFieldLabel = (fieldName: string): string => {
    const labels: Record<string, string> = {
      fullName: "Họ tên đầy đủ",
      title: "Tiêu đề nghề nghiệp",
      headline: "Tiêu đề ngắn",
      bio: "Giới thiệu",
      contactEmail: "Email liên hệ",
      contactPhone: "Số điện thoại",
      location: "Địa điểm",
      website: "Website",
      linkedin: "LinkedIn",
      github: "GitHub",
      cvUrl: "File CV",
    };
    return labels[fieldName] || fieldName;
  };

  // Some resolver versions can throw ZodError (unhandled promise) instead of returning field errors.
  // Wrap submit to ensure user always sees toast errors (bottom-right, same as success).
  const onFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await handleSubmit(onSubmit, onInvalid)(e);
    } catch (err: any) {
      // Catch unhandled ZodError thrown by resolver
      const zodErr: ZodError | null =
        err instanceof ZodError ? err : err?.name === "ZodError" ? err : null;

      if (zodErr) {
        const issues = (zodErr as any).issues || (zodErr as any).errors || [];
        if (Array.isArray(issues) && issues.length > 0) {
          const msgs = issues
            .map((i: any) => {
              const field = Array.isArray(i?.path) ? i.path[0] : undefined;
              const label = field ? getFieldLabel(String(field)) : "Dữ liệu";
              return `${label}: ${i?.message || "Không hợp lệ"}`;
            })
            .filter(Boolean);

          toast.error(msgs[0] || "Vui lòng kiểm tra lại thông tin đã nhập");
          msgs.slice(1).forEach((m: string) => toast.error(m));
          return;
        }
      }

      toast.error("Vui lòng kiểm tra lại thông tin đã nhập");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Thông tin cơ bản</CardTitle>
        <CardDescription>Cập nhật thông tin cá nhân và liên hệ</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onFormSubmit} className="space-y-6">
          {/* Avatar */}
          <div className="flex items-center gap-6">
            <div className="relative">
              {avatar ? (
                <Image
                  src={avatar}
                  alt="Avatar"
                  width={96}
                  height={96}
                  className="h-24 w-24 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-slate-200 text-2xl font-bold">
                  {(profile.profile?.fullName || profile.name)?.[0]?.toUpperCase() || "U"}
                </div>
              )}
              {uploadingAvatar && (
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50">
                  <Loader2 className="h-6 w-6 animate-spin text-white" />
                </div>
              )}
            </div>
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleAvatarUpload(file);
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
              >
                <Upload className="mr-2 h-4 w-4" />
                {uploadingAvatar ? "Đang tải..." : "Tải ảnh đại diện"}
              </Button>
            </div>
          </div>

          {/* Full Name */}
          <div>
            <Label htmlFor="fullName">Họ tên đầy đủ *</Label>
            <Input 
              id="fullName" 
              {...register("fullName")} 
              placeholder={profile.name || "Nguyễn Văn Chương"} 
            />
            {errors.fullName && <p className="mt-1 text-sm text-red-500">{errors.fullName.message}</p>}
            <p className="mt-1 text-xs text-slate-500">
              Tên đầy đủ sẽ được sử dụng trong CV và đơn ứng tuyển. 
              {!profile.profile?.fullName && profile.name && (
                <span className="text-blue-600"> Hiện đang sử dụng: {profile.name}</span>
              )}
            </p>
          </div>

          {/* Title & Headline */}
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="title">Tiêu đề nghề nghiệp</Label>
              <Input id="title" {...register("title")} placeholder="Lập trình viên Full-stack" />
              {errors.title && <p className="mt-1 text-sm text-red-500">{errors.title.message}</p>}
            </div>
            <div>
              <Label htmlFor="headline">Tiêu đề ngắn</Label>
              <Input id="headline" {...register("headline")} placeholder="Lập trình viên giàu kinh nghiệm..." />
              {errors.headline && <p className="mt-1 text-sm text-red-500">{errors.headline.message}</p>}
            </div>
          </div>

          {/* Bio */}
          <div>
            <Label htmlFor="bio">Giới thiệu</Label>
            <Textarea id="bio" rows={6} {...register("bio")} placeholder="Giới thiệu về bản thân..." />
            {errors.bio && <p className="mt-1 text-sm text-red-500">{errors.bio.message}</p>}
          </div>

          {/* CV Email & Phone (independent from account) */}
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="contactEmail">Email liên hệ trên CV</Label>
              <Input
                id="contactEmail"
                {...register("contactEmail")}
                placeholder={profile.email || "example@email.com"}
              />
              {errors.contactEmail && (
                <p className="mt-1 text-sm text-red-500">{errors.contactEmail.message}</p>
              )}
              <p className="mt-1 text-xs text-slate-500">
                Mặc định lấy từ email tài khoản ({profile.email}). Bạn có thể thay đổi email hiển thị trên CV.
              </p>
            </div>
            <div>
              <Label htmlFor="contactPhone">Số điện thoại liên hệ trên CV</Label>
              <Input
                id="contactPhone"
                {...register("contactPhone")}
                placeholder={profile.phone || "0909 123 456"}
              />
              {errors.contactPhone && (
                <p className="mt-1 text-sm text-red-500">{errors.contactPhone.message}</p>
              )}
              <p className="mt-1 text-xs text-slate-500">
                Mặc định lấy từ số điện thoại tài khoản (nếu có). Bạn có thể dùng số khác cho CV.
              </p>
            </div>
          </div>

          {/* Location & Website */}
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="location">Địa điểm</Label>
              <Input id="location" {...register("location")} placeholder="Hồ Chí Minh, Việt Nam" />
              {errors.location && <p className="mt-1 text-sm text-red-500">{errors.location.message}</p>}
            </div>
            <div>
              <Label htmlFor="website">Website</Label>
              <Input id="website" {...register("website")} placeholder="https://your-website.com" />
              {errors.website && <p className="mt-1 text-sm text-red-500">{errors.website.message}</p>}
            </div>
          </div>

          {/* Social Links */}
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="linkedin">LinkedIn</Label>
              <Input id="linkedin" {...register("linkedin")} placeholder="https://linkedin.com/in/username" />
              {errors.linkedin && <p className="mt-1 text-sm text-red-500">{errors.linkedin.message}</p>}
            </div>
            <div>
              <Label htmlFor="github">GitHub</Label>
              <Input id="github" {...register("github")} placeholder="https://github.com/username" />
              {errors.github && <p className="mt-1 text-sm text-red-500">{errors.github.message}</p>}
            </div>
          </div>

          {/* CV File */}
          <div>
            <Label htmlFor="cvUrl">File CV</Label>
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input 
                  id="cvUrl" 
                  {...register("cvUrl")} 
                  placeholder="https://drive.google.com/... hoặc https://your-cv.com/cv.pdf" 
                  className="flex-1"
                />
                <input
                  ref={cvFileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleCVUpload(file);
                    e.target.value = "";
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => cvFileInputRef.current?.click()}
                  disabled={uploadingCV}
                  className="shrink-0"
                >
                  {uploadingCV ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Đang tải...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Tải file CV
                    </>
                  )}
                </Button>
              </div>
              {cvUrl && (
                <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded-md">
                  <FileText className="h-4 w-4 text-green-600" />
                  <a 
                    href={cvUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-green-700 hover:underline flex-1 truncate"
                  >
                    CV đã tải lên
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      setCvUrl(null);
                      setValue("cvUrl", "", { shouldDirty: true });
                    }}
                    className="text-red-600 hover:text-red-700"
                    title="Xóa CV"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
            {errors.cvUrl && <p className="mt-1 text-sm text-red-500">{errors.cvUrl.message}</p>}
            <p className="mt-1 text-xs text-slate-500">
              Bạn có thể tải file CV trực tiếp (PDF, DOC, DOCX - tối đa 10MB) hoặc dán link từ Google Drive, Dropbox, v.v.
            </p>
          </div>

          {/* Status & Privacy */}
          <div>
            <div>
              <div className="flex items-center gap-3">
                <Switch
                  id="status"
                  checked={watch("status") === "OPEN_TO_WORK"}
                  onCheckedChange={(checked) => {
                    setValue("status", checked ? "OPEN_TO_WORK" : "NOT_AVAILABLE", { shouldDirty: true });
                  }}
                />
                <Label htmlFor="status" className="cursor-pointer">
                  {watch("status") === "OPEN_TO_WORK" ? "Đang bật tìm việc" : "Đang tắt tìm việc"}
                </Label>
              </div>
              <p className="mt-2 text-xs text-slate-500">
                {watch("status") === "OPEN_TO_WORK" ? (
                  <span className="text-green-600">
                    ✓ Nhà tuyển dụng sẽ biết bạn đang tích cực tìm việc và sẵn sàng ứng tuyển ngay
                  </span>
                ) : (
                  <span className="text-amber-600">
                    ⚠ Hồ sơ của bạn sẽ ít được nhà tuyển dụng chú ý vì bạn không đang tìm việc
                  </span>
                )}
              </p>
            </div>
            
            {/* TODO: Uncomment khi cần sử dụng tính năng "Công khai hồ sơ" */}
            {/* <div className="mt-4">
              <div className="flex items-center gap-3">
                <Switch
                  id="isPublic"
                  checked={isPublic}
                  onCheckedChange={(checked) => setValue("isPublic", checked, { shouldDirty: true })}
                />
                <Label htmlFor="isPublic" className="cursor-pointer">
                  Công khai hồ sơ
                </Label>
              </div>
              <p className="mt-2 text-xs text-slate-500">
                {isPublic ? (
                  <span className="text-green-600">
                    ✓ Hồ sơ của bạn đang công khai. Mọi người có thể truy cập qua liên kết công khai.
                  </span>
                ) : (
                  <span className="text-amber-600">
                    ⚠ Hồ sơ của bạn đang ở chế độ riêng tư. Bất kỳ ai cũng không thể truy cập vào trang hồ sơ công khai của bạn.
                  </span>
                )}
              </p>
            </div> */}
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => reset()}>
              Hủy
            </Button>
            <Button type="submit" disabled={!isDirty || updateProfile.isPending}>
              {updateProfile.isPending ? "Đang lưu..." : "Lưu thay đổi"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

