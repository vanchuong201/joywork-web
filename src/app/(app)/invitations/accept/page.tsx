"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, LogOut, CheckCircle, AlertCircle } from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";
import Link from "next/link";

type InvitationData = {
  email: string;
  companyName: string;
  inviterName: string;
  role: string;
};

function AcceptInvitationContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const router = useRouter();
  const { user, signOut, fetchMe } = useAuthStore();
  
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("Token không hợp lệ hoặc bị thiếu.");
      setLoading(false);
      return;
    }

    const fetchInvitation = async () => {
      try {
        const res = await api.get(`/api/companies/invitations?token=${token}`);
        setInvitation(res.data.data.invitation);
      } catch (err: any) {
        console.error(err);
        const code = err?.response?.data?.error?.code;
        if (code === "INVITATION_EXPIRED") {
          setError("Lời mời đã hết hạn.");
        } else if (code === "INVITATION_INVALID") {
          setError("Lời mời không hợp lệ hoặc không tồn tại.");
        } else {
          setError("Không thể tải thông tin lời mời.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchInvitation();
  }, [token]);

  const handleAccept = async () => {
    if (!token) return;
    setAccepting(true);
    try {
      const res = await api.post("/api/companies/invitations/accept", { token });
      await fetchMe();
      const companySlug = res.data.data.companySlug;
      toast.success("Đã chấp nhận lời mời thành công!");
      router.push(`/companies/${companySlug}/manage`);
    } catch (err: any) {
      const message = err?.response?.data?.error?.message || "Có lỗi xảy ra khi chấp nhận lời mời.";
      toast.error(message);
      setError(message);
    } finally {
      setAccepting(false);
    }
  };

  const handleLogout = () => {
    signOut();
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--brand)]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-4">
        <Card className="w-full max-w-md border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <AlertCircle className="h-5 w-5" />
              Lỗi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600">{error}</p>
            <Button className="mt-4 w-full" variant="outline" onClick={() => router.push("/")}>
              Về trang chủ
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!invitation) return null;

  const isEmailMatch = user?.email === invitation.email;

  return (
    <div className="flex min-h-[80vh] items-center justify-center bg-[var(--background)] p-4">
      <Card className="w-full max-w-lg border-[var(--border)] shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-[var(--foreground)]">
            Lời mời tham gia
          </CardTitle>
          <CardDescription className="mt-2 text-base">
            <strong>{invitation.inviterName}</strong> đã mời bạn tham gia vào đội ngũ của{" "}
            <strong>{invitation.companyName}</strong> với vai trò{" "}
            <span className="inline-block rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
              {invitation.role}
            </span>
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6 pt-2">
          {!user ? (
            <div className="space-y-4 rounded-lg bg-[var(--muted)] p-4 text-center">
              <p className="text-sm text-[var(--muted-foreground)]">
                Để chấp nhận lời mời, vui lòng đăng nhập hoặc đăng ký tài khoản với email{" "}
                <strong>{invitation.email}</strong>.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <Button asChild variant="outline" className="w-full">
                  <Link href={`/login?email=${encodeURIComponent(invitation.email)}&redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`}>
                    Đăng nhập
                  </Link>
                </Button>
                <Button asChild className="w-full">
                  <Link href={`/register?email=${encodeURIComponent(invitation.email)}&redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`}>
                    Đăng ký ngay
                  </Link>
                </Button>
              </div>
            </div>
          ) : !isEmailMatch ? (
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
              <div className="mb-2 flex items-start gap-3">
                <AlertCircle className="mt-0.5 h-5 w-5 text-yellow-600" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium">Email không khớp</p>
                  <p className="mt-1">
                    Bạn đang đăng nhập với <strong>{user.email}</strong>, nhưng lời mời này được gửi đến{" "}
                    <strong>{invitation.email}</strong>.
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="mt-2 w-full border-yellow-300 bg-white text-yellow-800 hover:bg-yellow-100"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Đăng xuất để chuyển tài khoản
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-lg bg-green-50 p-4 text-center">
                <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <p className="text-sm font-medium text-green-800">
                  Xin chào <strong>{user.name || user.email}</strong>!
                </p>
                <p className="mt-1 text-xs text-green-700">
                  Bạn có thể chấp nhận lời mời ngay bây giờ.
                </p>
              </div>
              
              <Button 
                className="w-full" 
                size="lg" 
                onClick={handleAccept} 
                disabled={accepting}
              >
                {accepting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  "Chấp nhận lời mời"
                )}
              </Button>
              
              <p className="text-center text-xs text-[var(--muted-foreground)]">
                Bằng việc chấp nhận, bạn đồng ý tham gia vào không gian làm việc của công ty này.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function AcceptInvitationPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
      <AcceptInvitationContent />
    </Suspense>
  );
}

