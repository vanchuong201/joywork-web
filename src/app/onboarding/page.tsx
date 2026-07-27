"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2 } from "lucide-react";

import api from "@/lib/api";
import type { OwnUserProfile } from "@/types/user";
import { useAuthStore } from "@/store/useAuth";
import { onboardingApi, type OnboardingMeResponse } from "@/lib/api/onboarding";
import CvGenerateDialog from "@/components/account/profile/CvGenerateDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const activateSchema = z
  .object({
    password: z.string().min(6, "Mật khẩu cần ít nhất 6 ký tự"),
    confirmPassword: z.string().min(6, "Vui lòng xác nhận mật khẩu"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["confirmPassword"],
  });

type ActivateForm = z.infer<typeof activateSchema>;

function extractApiErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === "object") {
    const response = (error as { response?: { data?: { error?: { message?: string } } } }).response;
    const message = response?.data?.error?.message;
    if (message) return message;
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

function toSafeExternalUrl(value: string | null | undefined): string | null {
  const raw = value?.trim();
  if (!raw) return null;
  try {
    const parsed = new URL(raw);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

type OnboardingScreen = "loading" | "activate" | "expired" | "used" | "invalid" | "landing";

function OnboardingPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fetchMe = useAuthStore((state) => state.fetchMe);

  const token = (searchParams.get("token") || "").trim();

  const [screen, setScreen] = useState<OnboardingScreen>("loading");
  const [isCheckingToken, setIsCheckingToken] = useState(true);
  const [isActivating, setIsActivating] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isLoadingLanding, setIsLoadingLanding] = useState(false);
  const [statusName, setStatusName] = useState<string | null>(null);
  const [resendEmail, setResendEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [cvGenerateOpen, setCvGenerateOpen] = useState(false);
  const [ownProfile, setOwnProfile] = useState<OwnUserProfile | null>(null);
  const [onboardingMe, setOnboardingMe] = useState<OnboardingMeResponse | null>(null);
  const [currentCvUrl, setCurrentCvUrl] = useState<string | null>(null);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [title, setTitle] = useState("");

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ActivateForm>({ mode: "onSubmit", reValidateMode: "onChange" });

  const resolveLandingDefaults = useCallback((payload: OnboardingMeResponse) => {
    setFullName(payload.user.profile?.fullName || payload.importRecord?.rawName || payload.user.name || "");
    setPhone(payload.user.profile?.contactPhone || payload.user.phone || payload.importRecord?.rawPhone || "");
    setTitle(payload.user.profile?.title || payload.importRecord?.rawPosition || "");
  }, []);

  const loadLandingData = useCallback(async () => {
    setIsLoadingLanding(true);
    try {
      const [meData, ownProfileRes] = await Promise.all([
        onboardingApi.getMe(),
        api.get("/api/users/me/profile"),
      ]);
      setOnboardingMe(meData);
      resolveLandingDefaults(meData);

      const profile = ownProfileRes?.data?.data?.profile as OwnUserProfile;
      setOwnProfile(profile);
      setCurrentCvUrl(profile?.profile?.cvUrl || null);
    } catch (error) {
      toast.error(extractApiErrorMessage(error, "Không thể tải dữ liệu onboarding"));
    } finally {
      setIsLoadingLanding(false);
    }
  }, [resolveLandingDefaults]);

  useEffect(() => {
    let isMounted = true;

    const checkToken = async () => {
      if (!token) {
        if (isMounted) {
          setScreen("invalid");
          setIsCheckingToken(false);
        }
        return;
      }

      try {
        const status = await onboardingApi.getTokenStatus(token);
        if (!isMounted) return;

        setStatusName(status.user?.name ?? null);
        if (status.status === "VALID") {
          setScreen("activate");
        } else if (status.status === "EXPIRED") {
          setScreen("expired");
        } else if (status.status === "USED") {
          setScreen("used");
        } else {
          setScreen("invalid");
        }
      } catch {
        if (!isMounted) return;
        setScreen("invalid");
      } finally {
        if (isMounted) {
          setIsCheckingToken(false);
        }
      }
    };

    void checkToken();
    return () => {
      isMounted = false;
    };
  }, [token]);

  useEffect(() => {
    if (screen !== "used") return;
    const timeoutId = window.setTimeout(() => {
      router.push("/login");
    }, 1800);
    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [screen, router]);

  const onActivate = async (values: ActivateForm) => {
    if (!token) {
      toast.error("Link kích hoạt không hợp lệ");
      return;
    }

    const parsed = activateSchema.safeParse(values);
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      if (firstIssue?.path[0]) {
        setError(firstIssue.path[0] as keyof ActivateForm, { type: "manual", message: firstIssue.message });
      }
      toast.error(firstIssue?.message || "Dữ liệu không hợp lệ");
      return;
    }

    setIsActivating(true);
    try {
      const response = await onboardingApi.activate({
        token,
        password: parsed.data.password,
      });

      if (typeof window !== "undefined") {
        localStorage.setItem("accessToken", response.accessToken);
      }

      await fetchMe();
      await loadLandingData();
      setScreen("landing");
      toast.success("Kích hoạt tài khoản thành công");
    } catch (error) {
      toast.error(extractApiErrorMessage(error, "Không thể kích hoạt tài khoản"));
    } finally {
      setIsActivating(false);
    }
  };

  const handleResend = async () => {
    const email = resendEmail.trim();
    if (!email) {
      toast.error("Vui lòng nhập email");
      return;
    }
    setIsResending(true);
    try {
      const result = await onboardingApi.resend({ email });
      toast.success(result.message);
    } catch (error) {
      toast.error(extractApiErrorMessage(error, "Không thể gửi lại link kích hoạt"));
    } finally {
      setIsResending(false);
    }
  };

  const handleSaveBasicInfo = async () => {
    setIsSavingProfile(true);
    try {
      await api.patch("/api/users/me/profile", {
        fullName: fullName || null,
        title: title || null,
        phone: phone || null,
        contactPhone: phone || null,
      });
      await loadLandingData();
      toast.success("Đã cập nhật thông tin cơ bản");
    } catch (error) {
      toast.error(extractApiErrorMessage(error, "Không thể cập nhật thông tin"));
    } finally {
      setIsSavingProfile(false);
    }
  };

  const importedLinks = useMemo(() => {
    if (!onboardingMe?.importRecord) return [];
    const links = [
      { label: "Link CV", value: onboardingMe.importRecord.rawCvLink },
      { label: "Link Portfolio", value: onboardingMe.importRecord.rawPortfolioLink },
      { label: "Link Social", value: onboardingMe.importRecord.rawSocialLink },
    ];
    return links
      .map((item) => ({
        label: item.label,
        url: toSafeExternalUrl(item.value),
        raw: item.value?.trim() || null,
      }))
      .filter((item) => Boolean(item.url) || Boolean(item.raw));
  }, [onboardingMe]);

  const cvImportStatus = onboardingMe?.cvImport?.status ?? null;
  const cvImportJobId = onboardingMe?.cvImport?.jobId ?? null;
  const linkAction = onboardingMe?.importRecord?.linkAction ?? null;
  const isAutoLink = linkAction === "AUTO_FETCHABLE";

  useEffect(() => {
    if (screen !== "landing") return;
    const shouldPoll =
      cvImportStatus === "PROCESSING" ||
      cvImportStatus === "PENDING" ||
      cvImportStatus === "READY" ||
      (!cvImportStatus && isAutoLink);
    if (!shouldPoll) return;

    const timer = window.setInterval(() => {
      void loadLandingData();
    }, 3000);

    return () => window.clearInterval(timer);
  }, [screen, cvImportStatus, isAutoLink, loadLandingData]);

  if (isCheckingToken || screen === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4 py-10">
        <div className="w-full max-w-lg rounded-xl border border-[var(--border)] bg-white p-6 text-center">
          <Loader2 className="mx-auto h-6 w-6 animate-spin text-[var(--brand)]" />
          <p className="mt-3 text-sm text-[var(--muted-foreground)]">Đang kiểm tra link onboarding...</p>
        </div>
      </div>
    );
  }

  if (screen === "used") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4 py-10">
        <div className="w-full max-w-lg rounded-xl border border-[var(--border)] bg-white p-6">
          <h1 className="text-lg font-semibold text-[var(--foreground)]">Link đã được sử dụng</h1>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">
            Link kích hoạt này đã được dùng trước đó. Vui lòng đăng nhập để tiếp tục.
          </p>
          <Button className="mt-4 w-full" onClick={() => router.push("/login")}>
            Đi đến trang đăng nhập
          </Button>
        </div>
      </div>
    );
  }

  if (screen === "expired" || screen === "invalid") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4 py-10">
        <div className="w-full max-w-lg rounded-xl border border-[var(--border)] bg-white p-6">
          <h1 className="text-lg font-semibold text-[var(--foreground)]">
            {screen === "expired" ? "Link đã hết hạn" : "Link không hợp lệ"}
          </h1>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">
            Nhập email của bạn để nhận lại link onboarding mới.
          </p>
          <div className="mt-4 space-y-2">
            <Label htmlFor="resend-email">Email</Label>
            <Input
              id="resend-email"
              type="email"
              placeholder="you@example.com"
              value={resendEmail}
              onChange={(event) => setResendEmail(event.target.value)}
            />
          </div>
          <Button className="mt-4 w-full" onClick={handleResend} disabled={isResending}>
            {isResending ? "Đang gửi..." : "Gửi lại link kích hoạt"}
          </Button>
        </div>
      </div>
    );
  }

  if (screen === "landing") {
    return (
      <div className="min-h-screen bg-[var(--background)] px-4 py-8">
        <div className="mx-auto w-full max-w-3xl space-y-6">
          <div className="rounded-xl border border-[var(--border)] bg-white p-6">
            <h1 className="text-xl font-semibold text-[var(--foreground)]">Kích hoạt thành công</h1>
            <p className="mt-2 text-sm text-[var(--muted-foreground)]">
              Bạn đã đăng nhập thành công. Hồ sơ CV có thể đã được tạo sẵn từ lúc import — hãy rà soát thông tin cơ bản
              bên dưới.
            </p>
          </div>

          <div className="rounded-xl border border-[var(--border)] bg-white p-6">
            <h2 className="text-base font-semibold text-[var(--foreground)]">Thông tin cơ bản</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="full-name">Họ tên</Label>
                <Input id="full-name" value={fullName} onChange={(event) => setFullName(event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Số điện thoại</Label>
                <Input id="phone" value={phone} onChange={(event) => setPhone(event.target.value)} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="title">Vị trí mong muốn</Label>
                <Input id="title" value={title} onChange={(event) => setTitle(event.target.value)} />
              </div>
            </div>
            <Button className="mt-4" onClick={handleSaveBasicInfo} disabled={isSavingProfile || isLoadingLanding}>
              {isSavingProfile ? "Đang lưu..." : "Lưu thông tin"}
            </Button>
          </div>

          <div className="rounded-xl border border-[var(--border)] bg-white p-6">
            <h2 className="text-base font-semibold text-[var(--foreground)]">Dữ liệu CV/Portfolio từ file import</h2>

            {cvImportStatus === "PROCESSING" || cvImportStatus === "PENDING" || (!cvImportStatus && isAutoLink) ? (
              <div className="mt-3 flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
                <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin" />
                <p>
                  Hệ thống đang tạo hồ sơ CV từ link của bạn (có thể đã chạy từ lúc import). Quá trình này có thể mất
                  vài phút.
                </p>
              </div>
            ) : null}

            {cvImportStatus === "APPLIED" ? (
              <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
                CV đã được áp dụng vào hồ sơ. Doanh nghiệp có thể tìm thấy bạn. Bạn vẫn có thể chỉnh sửa hoặc tạo lại từ
                file khác.
              </div>
            ) : null}

            {cvImportStatus === "READY" ? (
              <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
                CV nháp đã sẵn sàng và đang được áp dụng vào hồ sơ. Trang sẽ tự cập nhật trong giây lát.
              </div>
            ) : null}

            {cvImportStatus === "FAILED" ? (
              <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                {onboardingMe?.cvImport?.errorMessage ||
                  "Không tải được CV từ link (có thể link chưa mở công khai). Vui lòng tải file PDF/DOCX lên."}
              </div>
            ) : null}

            {!isAutoLink && !cvImportStatus ? (
              <div className="mt-3 rounded-lg border border-[var(--border)] bg-[var(--background)] p-3 text-sm text-[var(--muted-foreground)]">
                Link CV không hỗ trợ tự động tải (Canva, folder, TopCV…). Vui lòng tải file PDF/DOCX lên để tạo hồ sơ.
              </div>
            ) : null}

            {importedLinks.length === 0 ? (
              <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                Không có link CV/Portfolio hợp lệ trong dữ liệu import.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {importedLinks.map((item) => (
                  <div key={item.label}>
                    <p className="text-xs font-medium uppercase text-[var(--muted-foreground)]">{item.label}</p>
                    {item.url ? (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        className="break-all text-sm text-[var(--brand)] underline"
                      >
                        {item.url}
                      </a>
                    ) : (
                      <p className="break-all text-sm text-[var(--muted-foreground)]">
                        {item.raw} <span className="text-xs">(không phải URL http/https)</span>
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4 flex flex-wrap gap-3">
              <Button onClick={() => setCvGenerateOpen(true)} disabled={!ownProfile}>
                {cvImportStatus === "APPLIED"
                  ? "Tạo lại / chỉnh từ file CV"
                  : cvImportStatus === "READY"
                    ? "Xem CV nháp"
                    : "Tạo hồ sơ từ CV"}
              </Button>
              <Button variant="outline" onClick={() => router.push("/account?tab=profile")}>
                {cvImportStatus === "APPLIED" ? "Xem & chỉnh sửa hồ sơ" : "Chỉnh sửa hồ sơ chi tiết"}
              </Button>
            </div>
          </div>
        </div>

        {ownProfile ? (
          <CvGenerateDialog
            open={cvGenerateOpen}
            onOpenChange={setCvGenerateOpen}
            profile={ownProfile}
            currentCvUrl={currentCvUrl}
            onCvUrlChange={(url) => setCurrentCvUrl(url)}
            initialJobId={cvImportStatus === "READY" ? cvImportJobId : null}
          />
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4 py-10">
      <div className="w-full max-w-lg rounded-xl border border-[var(--border)] bg-white p-6">
        <h1 className="text-lg font-semibold text-[var(--foreground)]">Thiết lập mật khẩu lần đầu</h1>
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">
          {statusName ? `Chào ${statusName}, vui lòng tạo mật khẩu để kích hoạt tài khoản.` : "Vui lòng tạo mật khẩu để kích hoạt tài khoản."}
        </p>

        <form onSubmit={handleSubmit(onActivate)} className="mt-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">Mật khẩu</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Ít nhất 6 ký tự"
                {...register("password")}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4"/>}
              </button>
            </div>
            {errors.password ? <p className="text-xs text-red-500">{errors.password.message}</p> : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Nhập lại mật khẩu"
                {...register("confirmPassword")}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((value) => !value)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]"
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.confirmPassword ? (
              <p className="text-xs text-red-500">{errors.confirmPassword.message}</p>
            ) : null}
          </div>

          {errors.root ? <p className="text-xs text-red-500">{errors.root.message}</p> : null}

          <Button type="submit" className="w-full" disabled={isActivating}>
            {isActivating ? "Đang kích hoạt..." : "Kích hoạt tài khoản"}
          </Button>
        </form>
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4 py-10">
          <div className="w-full max-w-lg rounded-xl border border-[var(--border)] bg-white p-6 text-center">
            <Loader2 className="mx-auto h-6 w-6 animate-spin text-[var(--brand)]" />
            <p className="mt-3 text-sm text-[var(--muted-foreground)]">Đang tải onboarding...</p>
          </div>
        </div>
      }
    >
      <OnboardingPageContent />
    </Suspense>
  );
}
