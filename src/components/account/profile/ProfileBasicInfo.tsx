"use client";

import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { uploadProfileAvatar } from "@/lib/uploads";
import Image from "next/image";
import { Loader2, Upload } from "lucide-react";

// Helper for optional URL fields - accepts empty string
const optionalUrl = z
  .string()
  .refine((val) => val === "" || z.string().url().safeParse(val).success, {
    message: "URL không hợp lệ",
  })
  .optional();

const schema = z.object({
  fullName: z.string().max(200, "Họ tên đầy đủ tối đa 200 ký tự").optional(),
  title: z.string().max(150, "Tiêu đề tối đa 150 ký tự").optional(),
  headline: z.string().max(100, "Headline tối đa 100 ký tự").optional(),
  bio: z.string().max(2000, "Giới thiệu tối đa 2000 ký tự").optional(),
  location: z.string().max(100, "Địa điểm tối đa 100 ký tự").optional(),
  website: optionalUrl,
  linkedin: optionalUrl,
  github: optionalUrl,
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

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      // fullName: fallback to profile.name if fullName is not set
      fullName: profile.profile?.fullName || profile.name || "",
      title: profile.profile?.title || "",
      headline: profile.profile?.headline || "",
      bio: profile.profile?.bio || "",
      location: profile.profile?.location || "",
      website: profile.profile?.website || "",
      linkedin: profile.profile?.linkedin || "",
      github: profile.profile?.github || "",
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
      title: profile.profile?.title || "",
      headline: profile.profile?.headline || "",
      bio: profile.profile?.bio || "",
      location: profile.profile?.location || "",
      website: profile.profile?.website || "",
      linkedin: profile.profile?.linkedin || "",
      github: profile.profile?.github || "",
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
      toast.error(error?.response?.data?.error?.message || "Cập nhật thất bại");
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

  const onSubmit = (values: FormValues) => {
    updateProfile.mutate(values);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Thông tin cơ bản</CardTitle>
        <CardDescription>Cập nhật thông tin cá nhân và liên hệ</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
              <Input id="title" {...register("title")} placeholder="Full-stack Developer" />
              {errors.title && <p className="mt-1 text-sm text-red-500">{errors.title.message}</p>}
            </div>
            <div>
              <Label htmlFor="headline">Headline</Label>
              <Input id="headline" {...register("headline")} placeholder="Experienced developer..." />
              {errors.headline && <p className="mt-1 text-sm text-red-500">{errors.headline.message}</p>}
            </div>
          </div>

          {/* Bio */}
          <div>
            <Label htmlFor="bio">Giới thiệu</Label>
            <Textarea id="bio" rows={6} {...register("bio")} placeholder="Giới thiệu về bản thân..." />
            {errors.bio && <p className="mt-1 text-sm text-red-500">{errors.bio.message}</p>}
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

