"use client";

import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { uploadProfileAvatar } from "@/lib/uploads";
import Image from "next/image";
import { Loader2, Upload, Camera } from "lucide-react";
import SocialAccounts from "@/components/profile/SocialAccounts";

const schema = z.object({
  name: z.string().min(2, "Tên cần ít nhất 2 ký tự"),
  slug: z.string().min(2, "Slug cần ít nhất 2 ký tự").regex(/^[a-z0-9-]+$/, "Slug chỉ chứa chữ thường, số và dấu gạch ngang").optional(),
});

type FormValues = z.infer<typeof schema>;

type AccountResponse = {
  id: string;
  email: string;
  emailVerified?: boolean;
  name?: string | null;
  slug?: string | null;
  avatar?: string | null; // Account avatar (User.avatar)
  role: string;
  createdAt: string;
};

const RESEND_VERIFICATION_COOLDOWN_SECONDS = 60;

export default function AccountTab() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [origin, setOrigin] = useState<string>("");
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  const { data, isLoading } = useQuery({
    queryKey: ["account"],
    queryFn: async () => {
      const res = await api.get("/api/users/me");
      return res.data.data.user as AccountResponse;
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      slug: "",
    },
  });

  useEffect(() => {
    if (data) {
      reset({
        name: data.name || "",
        slug: data.slug || "",
      });
      setAvatar(data.avatar || null); // Use User.avatar (account avatar)
    }
  }, [data, reset]);

  const resendVerificationEmail = useMutation({
    mutationFn: async () => {
      const res = await api.post("/api/auth/resend-verification-email");
      return res.data as { data?: { message?: string } };
    },
    onSuccess: (payload) => {
      setCooldownSeconds(RESEND_VERIFICATION_COOLDOWN_SECONDS);
      toast.success(payload?.data?.message || "Đã gửi email xác minh. Vui lòng kiểm tra hộp thư.");
    },
    onError: (error: any) => {
      const retryAfter = Number(error?.response?.headers?.["retry-after"]);
      if (Number.isFinite(retryAfter) && retryAfter > 0) {
        setCooldownSeconds((prev) => Math.max(prev, retryAfter));
      }
      toast.error(error?.response?.data?.error?.message || "Không gửi được email xác minh");
    },
  });

  useEffect(() => {
    if (cooldownSeconds <= 0) return;

    const timer = window.setInterval(() => {
      setCooldownSeconds((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [cooldownSeconds]);

  const updateAccount = useMutation({
    mutationFn: async (values: FormValues) => {
      const payload: any = {
        name: values.name,
        slug: values.slug || null, // Always include slug (even if empty) to allow updating it
      };
      if (avatar) {
        payload.avatar = avatar;
      }
      const res = await api.patch("/api/users/me/profile", payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["account"] });
      queryClient.invalidateQueries({ queryKey: ["own-profile"] });
      toast.success("Cập nhật tài khoản thành công");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error?.message || "Cập nhật thất bại");
    },
  });

  const handleUploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Vui lòng chọn file ảnh");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Kích thước ảnh không được vượt quá 5MB");
      return;
    }

    setUploadingAvatar(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64 = reader.result as string;
        const base64Data = base64.split(",")[1];
        const fileType = file.type;
        const fileName = file.name;

        const result = await uploadProfileAvatar({
          fileName,
          fileType,
          fileData: base64Data,
          previousKey: avatar ? extractS3Key(avatar) : undefined,
          target: 'account', // Upload to User.avatar
        });

        setAvatar(result.assetUrl);
        // Invalidate queries to refresh data from server
        queryClient.invalidateQueries({ queryKey: ["account"] });
        queryClient.invalidateQueries({ queryKey: ["own-profile"] });
        toast.success("Tải ảnh đại diện thành công");
      } catch (error: any) {
        toast.error(error?.response?.data?.error?.message || "Tải ảnh thất bại");
      } finally {
        setUploadingAvatar(false);
      }
    };
    reader.readAsDataURL(file);
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
    updateAccount.mutate(values);
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 bg-slate-200 animate-pulse rounded" />
        <div className="h-96 w-full bg-slate-200 animate-pulse rounded" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-6">
        <h1 className="text-xl font-bold sm:text-2xl">Quản lý tài khoản</h1>
        <p className="text-[var(--muted-foreground)]">Không tải được thông tin tài khoản</p>
      </div>
    );
  }

  const joinedDate = data.createdAt
    ? new Date(data.createdAt).toLocaleDateString("vi-VN")
    : "";

  const avatarUrl = avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.name || data.email || 'User')}&background=random&size=200`;
  const profilePath = `/profile/${data.slug || "your-slug"}`;
  const profileUrl = `${origin || ""}${profilePath}`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold sm:text-2xl">Quản lý tài khoản</h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">Quản lý thông tin tài khoản đăng nhập</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Thông tin tài khoản</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar */}
          <div>
            <Label>Ảnh đại diện</Label>
            <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
              <div className="relative">
                <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-slate-200 relative">
                  <Image
                    src={avatarUrl}
                    alt="Avatar"
                    width={96}
                    height={96}
                    className="w-full h-full object-cover"
                  />
                  {uploadingAvatar && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <Loader2 className="w-6 h-6 text-white animate-spin" />
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="absolute -bottom-1 -right-1 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Camera size={16} />
                </button>
              </div>
              <div className="flex-1">
                <p className="text-sm text-[var(--muted-foreground)]">
                  Ảnh đại diện sẽ hiển thị trong tài khoản và có thể dùng cho hồ sơ ứng tuyển
                </p>
                <p className="mt-1 text-xs text-[var(--muted-foreground)]">JPG, PNG tối đa 5MB</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleUploadAvatar}
                className="hidden"
              />
            </div>
          </div>

          {/* Name */}
          <div>
            <Label htmlFor="name">Tên hiển thị</Label>
            <Input
              id="name"
              {...register("name")}
              placeholder="Ví dụ: Chương Nguyễn"
              className="mt-1"
            />
            {errors.name && (
              <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>
            )}
            <p className="mt-1 text-xs text-[var(--muted-foreground)]">
              Tên này sẽ hiển thị trong giao diện, thông báo và các tương tác
            </p>
          </div>

          {/* Slug */}
          <div>
            <Label htmlFor="slug">Slug (URL profile)</Label>
            <Input
              id="slug"
              {...register("slug")}
              placeholder="vi-du-slug"
              className="mt-1"
            />
            {errors.slug && (
              <p className="mt-1 text-xs text-red-600">{errors.slug.message}</p>
            )}
            <p className="mt-1 break-all text-xs text-[var(--muted-foreground)] sm:break-normal">
              URL profile của bạn:{" "}
              <a
                href={profilePath}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-blue-600 underline hover:text-blue-800"
              >
                {profileUrl}
              </a>
            </p>
          </div>

          {/* Email (read-only) */}
          <div>
            <Label>Email</Label>
            <div className="mt-1 flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-3">
              <Input value={data.email} readOnly className="flex-1" />
              <span
                className={
                  "inline-flex items-center rounded-full px-2 py-0.5 text-xs whitespace-nowrap " +
                  (data.emailVerified
                    ? "bg-green-100 text-green-700"
                    : "bg-yellow-100 text-yellow-700")
                }
              >
                {data.emailVerified ? "Đã xác minh" : "Chưa xác minh"}
              </span>
              {!data.emailVerified && (
                <Button
                  type="button"
                  variant="link"
                  className="h-auto px-0 text-sm font-semibold text-blue-600 underline-offset-4 hover:text-blue-800 hover:underline"
                  disabled={resendVerificationEmail.isPending || cooldownSeconds > 0}
                  onClick={() => {
                    if (cooldownSeconds > 0) return;
                    resendVerificationEmail.mutate();
                  }}
                >
                  {resendVerificationEmail.isPending ? (
                    <>
                      <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                      Đang gửi...
                    </>
                  ) : cooldownSeconds > 0 ? (
                    `Gửi lại sau ${cooldownSeconds}s`
                  ) : (
                    "Xác minh ngay"
                  )}
                </Button>
              )}
            </div>
            <p className="mt-1 text-xs text-[var(--muted-foreground)]">Email đăng nhập, không thể thay đổi</p>
            {!data.emailVerified && (
              <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                Bạn sẽ nhận email giống lúc đăng ký, kèm nút và liên kết xác nhận email.
              </p>
            )}
          </div>


          {/* Joined Date (read-only) */}
          {joinedDate && (
            <div>
              <Label>Tham gia JOYWORK</Label>
              <Input value={joinedDate} readOnly className="mt-1" />
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end pt-4">
            <Button
              onClick={handleSubmit(onSubmit)}
              disabled={!isDirty && !avatar}
              className="w-full sm:w-auto"
            >
              {updateAccount.isPending ? "Đang lưu..." : "Lưu thay đổi"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Social Accounts */}
      <Card>
        <CardHeader>
          <CardTitle>Tài khoản liên kết</CardTitle>
        </CardHeader>
        <CardContent>
          <SocialAccounts />
        </CardContent>
      </Card>
    </div>
  );
}

