"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
} from "react";
import { useForm, type FieldErrors } from "react-hook-form";
import { ZodError, z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import EmptyState from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { uploadProfileAvatar } from "@/lib/uploads";
import { useAuthStore } from "@/store/useAuth";

type ProfileResponse = {
  id: string;
  email: string;
  emailVerified?: boolean;
  name?: string | null;
  role: string;
  createdAt: string;
  profile?: {
    avatar?: string | null;
    headline?: string | null;
    bio?: string | null;
    skills: string[];
    cvUrl?: string | null;
    location?: string | null;
    website?: string | null;
    github?: string | null;
    linkedin?: string | null;
  } | null;
};

const schema = z.object({
  name: z.string().min(2, "Tên cần ít nhất 2 ký tự"),
  headline: z.string().max(100, "Headline tối đa 100 ký tự").optional().or(z.literal("")),
  bio: z.string().max(500, "Giới thiệu tối đa 500 ký tự").optional().or(z.literal("")),
  location: z.string().max(100, "Địa điểm tối đa 100 ký tự").optional().or(z.literal("")),
  website: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine((val) => !val || /^https?:\/\//i.test(val), {
      message: "Vui lòng nhập URL bắt đầu bằng http:// hoặc https://",
    }),
  github: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine((val) => !val || /^https?:\/\//i.test(val), {
      message: "URL GitHub cần bắt đầu bằng http:// hoặc https://",
    }),
  linkedin: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine((val) => !val || /^https?:\/\//i.test(val), {
      message: "URL LinkedIn cần bắt đầu bằng http:// hoặc https://",
    }),
  cvUrl: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine((val) => !val || /^https?:\/\//i.test(val), {
      message: "URL cần bắt đầu bằng http:// hoặc https://",
    }),
  skills: z.string().optional().or(z.literal("")),
});

type FormValues = z.infer<typeof schema>;
type AvatarValue = { url: string; key: string | null } | null;

function extractS3Key(url: string): string | null {
  try {
    const parsed = new URL(url);
    const pathname = decodeURIComponent(parsed.pathname);
    return pathname.startsWith("/") ? pathname.slice(1) : pathname;
  } catch {
    return null;
  }
}

import SocialAccounts from "@/components/profile/SocialAccounts";

export default function ProfilePage() {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((state) => state.setUser);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const res = await api.get("/api/users/me");
      return res.data.data.user as ProfileResponse;
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
    setError,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      headline: "",
      bio: "",
      location: "",
      website: "",
      github: "",
      linkedin: "",
      cvUrl: "",
      skills: "",
    },
  });

  const handleInvalid = useCallback(
    (error: any) => {
      if (error instanceof ZodError) {
        const first = error.issues.at(0);
        const fieldPath = first?.path?.[0]?.toString();
        if (fieldPath) {
          setError(fieldPath as keyof FormValues, { message: first?.message ?? "Dữ liệu không hợp lệ" });
          toast.error(first?.message ?? "Dữ liệu không hợp lệ");
          (error as any).handled = true;
          return;
        }
        (error as any).handled = true;
      }
      toast.error("Cập nhật hồ sơ thất bại, vui lòng kiểm tra lại thông tin.");
      (error as any).handled = true;
    },
    [setError],
  );

  const handleSubmitError = useCallback(
    (formErrors: FieldErrors<FormValues>) => {
      const firstKey = Object.keys(formErrors)[0] as keyof FormValues | undefined;
      if (!firstKey) {
        toast.error("Vui lòng kiểm tra lại thông tin vừa nhập.");
        return;
      }
      const fieldError = formErrors[firstKey];
      const message =
        (fieldError?.message as string | undefined) ??
        (fieldError?.types ? (Object.values(fieldError.types)[0] as string | undefined) : undefined) ??
        "Vui lòng kiểm tra lại thông tin.";
      toast.error(message);
    },
    [],
  );

  const skipFormResetRef = useRef(false);
  const [savedAvatar, setSavedAvatar] = useState<string | null>(null);
  const [avatar, setAvatar] = useState<AvatarValue>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);

  useEffect(() => {
    if (!data) return;

    const nextAvatar = data.profile?.avatar
      ? {
          url: data.profile.avatar,
          key: extractS3Key(data.profile.avatar),
        }
      : null;

    setSavedAvatar(data.profile?.avatar ?? null);
    setAvatar(nextAvatar);

    if (skipFormResetRef.current) {
      skipFormResetRef.current = false;
      return;
    }

    reset({
      name: data.name ?? "",
      headline: data.profile?.headline ?? "",
      bio: data.profile?.bio ?? "",
      location: data.profile?.location ?? "",
      website: data.profile?.website ?? "",
      github: data.profile?.github ?? "",
      linkedin: data.profile?.linkedin ?? "",
      cvUrl: data.profile?.cvUrl ?? "",
      skills: data.profile?.skills?.join("\n") ?? "",
    });
  }, [data, reset]);

  const updateProfile = useMutation({
    mutationFn: async (payload: {
      form: FormValues;
      skills: string[];
    }) => {
      const { form, skills } = payload;

      const toNullable = (value?: string) => {
        const trimmed = value?.trim();
        return trimmed ? trimmed : null;
      };

      const body = {
        name: form.name.trim(),
        avatar: avatar?.url ?? null,
        headline: toNullable(form.headline),
        bio: toNullable(form.bio),
        location: toNullable(form.location),
        website: toNullable(form.website),
        github: toNullable(form.github),
        linkedin: toNullable(form.linkedin),
        cvUrl: toNullable(form.cvUrl),
        skills,
      };

      const res = await api.patch("/api/users/me", body);
      return res.data.data.user as ProfileResponse;
    },
    onSuccess: (user) => {
      toast.success("Cập nhật hồ sơ thành công");
      queryClient.setQueryData(["profile"], user);
      setSavedAvatar(user.profile?.avatar ?? null);
      setAvatar(
        user.profile?.avatar
          ? {
              url: user.profile.avatar,
              key: extractS3Key(user.profile.avatar),
            }
          : null
      );
      setUser({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.profile?.avatar ?? null,
      });
      reset({
        name: user.name ?? "",
        headline: user.profile?.headline ?? "",
        bio: user.profile?.bio ?? "",
        location: user.profile?.location ?? "",
        website: user.profile?.website ?? "",
        github: user.profile?.github ?? "",
        linkedin: user.profile?.linkedin ?? "",
        cvUrl: user.profile?.cvUrl ?? "",
        skills: user.profile?.skills?.join("\n") ?? "",
      });
    },
    onError: (error: any) => {
      if (error?.response?.data?.error?.issues) {
        try {
          const zodError = new ZodError(error.response.data.error.issues);
          handleInvalid(zodError);
          return;
        } catch {
          // fallthrough
        }
      }
      const message = error?.response?.data?.error?.message ?? "Cập nhật hồ sơ thất bại, vui lòng thử lại.";
      toast.error(message);
      (error as any).handled = true;
    },
  });

  const updateAvatar = useMutation({
    mutationFn: async (avatarUrl: string | null) => {
      const res = await api.patch("/api/users/me", { avatar: avatarUrl });
      return res.data.data.user as ProfileResponse;
    },
    onSuccess: (user) => {
      skipFormResetRef.current = true;
      queryClient.setQueryData(["profile"], user);
      const nextAvatar = user.profile?.avatar
        ? {
            url: user.profile.avatar,
            key: extractS3Key(user.profile.avatar),
          }
        : null;
      setSavedAvatar(user.profile?.avatar ?? null);
      setAvatar(nextAvatar);
      setUser({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.profile?.avatar ?? null,
      });
      toast.success(user.profile?.avatar ? "Ảnh đại diện đã được cập nhật" : "Đã gỡ ảnh đại diện");
    },
    onError: (error: any) => {
      if (error?.response?.data?.error?.issues) {
        try {
          const zodError = new ZodError(error.response.data.error.issues);
          handleInvalid(zodError);
          return;
        } catch {
          // ignore
        }
      }
      const message =
        error?.response?.data?.error?.message ?? "Cập nhật ảnh đại diện thất bại, vui lòng thử lại.";
      toast.error(message);
      (error as any).handled = true;
    },
  });

  const onSubmit = async (values: FormValues) => {
    const skills =
      values.skills
        ?.split(/\r?\n/)
        .map((skill) => skill.trim())
        .filter(Boolean) ?? [];

    if (skills.length > 10) {
      setError("skills", { message: "Tối đa 10 kỹ năng" });
      return;
    }

    try {
      await updateProfile.mutateAsync({ form: values, skills });
    } catch (error: any) {
      if ((error as any)?.handled) return;
      if (error instanceof ZodError) {
        handleInvalid(error);
        return;
      }
      throw error;
    }
  };

  const profile = data?.profile ?? null;
  const handleAvatarChange = useCallback(
    async (next: AvatarValue) => {
      const previous = avatar;
      const nextUrl = next?.url ?? null;

      setAvatar(next);

      if (nextUrl === savedAvatar) {
        return;
      }

      try {
        await updateAvatar.mutateAsync(nextUrl);
      } catch (error) {
        setAvatar(previous);
        const err = error instanceof Error ? error : new Error("Cập nhật ảnh đại diện thất bại");
        (err as any).handled = true;
        throw err;
      }
    },
    [avatar, savedAvatar, updateAvatar],
  );

  const joinedDate = useMemo(() => {
    if (!data?.createdAt) return "";
    try {
      return new Date(data.createdAt).toLocaleDateString("vi-VN");
    } catch {
      return "";
    }
  }, [data?.createdAt]);

  const hasAvatarChanged = (avatar?.url ?? null) !== savedAvatar;
  const isSubmitDisabled =
    avatarUploading || updateProfile.isPending || (!isDirty && !hasAvatarChanged);

  const onFormSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      const handler = handleSubmit(onSubmit, handleSubmitError);
      const maybePromise = handler(event);
      if (maybePromise && typeof (maybePromise as Promise<unknown>).catch === "function") {
        void (maybePromise as Promise<unknown>).catch((error) => {
          if (error instanceof ZodError) {
            handleInvalid(error);
            return;
          }
          // already surfaced via other handlers
        });
      }
    },
    [handleSubmit, handleSubmitError, handleInvalid, onSubmit],
  );

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <Card>
          <CardHeader className="space-y-4">
            <div className="flex items-center gap-4">
              <Skeleton className="h-16 w-16 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-56" />
              </div>
            </div>
            <Skeleton className="h-4 w-32" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <EmptyState
        title="Không tải được hồ sơ"
        subtitle="Vui lòng thử lại hoặc liên hệ đội hỗ trợ nếu lỗi tiếp diễn."
      />
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Card>
        <CardHeader className="space-y-1">
          <h1 className="text-xl font-semibold text-[var(--foreground)]">Hồ sơ cá nhân</h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            Cập nhật ảnh đại diện và thông tin để nhà tuyển dụng hiểu rõ hơn về bạn.
          </p>
          {joinedDate ? (
            <p className="text-xs text-[var(--muted-foreground)]">Tham gia JoyWork: {joinedDate}</p>
          ) : null}
        </CardHeader>
        <CardContent>
          <form className="space-y-6" onSubmit={onFormSubmit}>
            <AvatarUploader
              value={avatar}
              displayName={data.name ?? data.email}
              onChange={handleAvatarChange}
              onUploadingChange={setAvatarUploading}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Họ và tên" error={errors.name?.message}>
                <Input placeholder="Họ và tên của bạn" {...register("name")} />
              </FormField>
              <FormField label="Headline" error={errors.headline?.message}>
                <Input placeholder="Ví dụ: Product Manager @ JoyWork" {...register("headline")} />
              </FormField>
            </div>

            <FormField label="Giới thiệu ngắn" error={errors.bio?.message}>
              <Textarea placeholder="Tóm tắt kinh nghiệm, điểm mạnh của bạn..." rows={4} {...register("bio")} />
            </FormField>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Địa điểm" error={errors.location?.message}>
                <Input placeholder="TP. Hồ Chí Minh, Việt Nam" {...register("location")} />
              </FormField>
              <FormField label="Website" error={errors.website?.message}>
                <Input placeholder="https://your-portfolio.com" {...register("website")} />
              </FormField>
              <FormField label="GitHub" error={errors.github?.message}>
                <Input placeholder="https://github.com/username" {...register("github")} />
              </FormField>
              <FormField label="LinkedIn" error={errors.linkedin?.message}>
                <Input placeholder="https://linkedin.com/in/username" {...register("linkedin")} />
              </FormField>
              <FormField label="CV (đường dẫn)" error={errors.cvUrl?.message}>
                <Input placeholder="https://drive.google.com/..." {...register("cvUrl")} />
              </FormField>
            </div>

            <FormField
              label="Kỹ năng nổi bật"
              error={errors.skills?.message}
              hint="Mỗi dòng một kỹ năng, tối đa 10 kỹ năng."
            >
              <Textarea placeholder={"React\nTypeScript\nUI/UX"} rows={4} {...register("skills")} />
            </FormField>

            <div className="flex flex-wrap gap-3">
              <Button type="submit" disabled={isSubmitDisabled}>
                {updateProfile.isPending ? "Đang lưu..." : "Lưu thay đổi"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                disabled={!isDirty && !hasAvatarChanged}
                onClick={() => {
                  if (!data) return;
                  setAvatar(
                    data.profile?.avatar
                      ? {
                          url: data.profile.avatar,
                          key: extractS3Key(data.profile.avatar),
                        }
                      : null
                  );
                  reset({
                    name: data.name ?? "",
                    headline: data.profile?.headline ?? "",
                    bio: data.profile?.bio ?? "",
                    location: data.profile?.location ?? "",
                    website: data.profile?.website ?? "",
                    github: data.profile?.github ?? "",
                    linkedin: data.profile?.linkedin ?? "",
                    cvUrl: data.profile?.cvUrl ?? "",
                    skills: data.profile?.skills?.join("\n") ?? "",
                  });
                }}
              >
                Hủy
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Email account (read-only) */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-base font-medium text-[var(--foreground)]">Email tài khoản</p>
              <p className="text-xs text-[var(--muted-foreground)]">Địa chỉ email đăng nhập, chỉ đọc</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Input value={data.email} readOnly className="w-80" />
            <span
              className={
                "inline-flex items-center rounded-full px-2 py-0.5 text-xs " +
                (data.emailVerified ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700")
              }
            >
              {data.emailVerified ? "Đã xác minh" : "Chưa xác minh"}
            </span>
          </div>
        </CardContent>
      </Card>

      <SocialAccounts />
    </div>
  );
}

function AvatarUploader({
  value,
  displayName,
  onChange,
  onUploadingChange,
}: {
  value: AvatarValue;
  displayName: string;
  onChange: (value: AvatarValue) => Promise<void> | void;
  onUploadingChange?: (uploading: boolean) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    onUploadingChange?.(uploading);
  }, [uploading, onUploadingChange]);

  const initials = useMemo(() => {
    const parts = displayName.split(/\s+/).filter(Boolean);
    if (!parts.length) {
      return displayName.slice(0, 2).toUpperCase() || "??";
    }
    return parts
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("");
  }, [displayName]);

  const handleSelect = () => {
    inputRef.current?.click();
  };

  const handleUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 4 * 1024 * 1024) {
      toast.error("Ảnh vượt quá giới hạn 4MB.");
      event.target.value = "";
      return;
    }

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Chỉ hỗ trợ JPG, PNG hoặc WEBP.");
      event.target.value = "";
      return;
    }

    setUploading(true);
    try {
      const base64 = await fileToBase64(file);
      const response = await uploadProfileAvatar({
        fileName: file.name,
        fileType: file.type,
        fileData: base64,
        previousKey: value?.key ?? undefined,
      });
      await onChange({ url: response.assetUrl, key: response.key });
    } catch (error: any) {
      if (!(error as any)?.handled) {
        const message =
          error instanceof Error ? error.message : "Tải ảnh đại diện thất bại, vui lòng thử lại.";
        toast.error(message);
      }
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  return (
    <div>
      <div className="flex items-center gap-4">
        <div className="relative h-20 w-20">
          {value?.url ? (
            <img
              src={value.url}
              alt={displayName}
              className="h-20 w-20 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--brand)] text-lg font-semibold uppercase text-white">
              {initials}
            </div>
          )}
          {uploading ? (
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 text-xs font-medium text-white">
              Đang tải...
            </div>
          ) : null}
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={handleSelect} disabled={uploading}>
              Đổi ảnh
            </Button>
            {value?.url ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={async () => {
                  setUploading(true);
                  try {
                    await onChange(null);
                  } catch (error: any) {
                    if (!(error as any)?.handled) {
                      const message =
                        error instanceof Error ? error.message : "Gỡ ảnh đại diện thất bại.";
                      toast.error(message);
                    }
                  } finally {
                    setUploading(false);
                  }
                }}
                disabled={uploading}
              >
                Gỡ ảnh
              </Button>
            ) : null}
          </div>
          <p className="text-xs text-[var(--muted-foreground)]">
            Hỗ trợ JPG, PNG, WEBP (tối đa 4MB). Ảnh rõ nét giúp hồ sơ chuyên nghiệp hơn.
          </p>
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleUpload}
      />
    </div>
  );
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string") {
        reject(new Error("Không thể đọc dữ liệu ảnh"));
        return;
      }
      const base64 = result.includes(",") ? result.split(",")[1] : result;
      resolve(base64);
    };
    reader.onerror = () => reject(new Error("Đọc file thất bại"));
    reader.readAsDataURL(file);
  });
}

function FormField({
  label,
  error,
  hint,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium text-[var(--foreground)]">{label}</span>
      {children}
      {hint ? <span className="text-xs text-[var(--muted-foreground)]">{hint}</span> : null}
      {error ? <span className="text-xs text-red-500">{error}</span> : null}
    </label>
  );
}

