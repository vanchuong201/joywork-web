"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import { toast } from "sonner";
import { Loader2, Check, Plus } from "lucide-react";
import { FcGoogle } from "react-icons/fc";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

type SocialAccount = {
  provider: string;
  email?: string | null;
  createdAt: string;
};

export default function SocialAccounts() {
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAccounts = async () => {
    try {
      const { data } = await api.get("/api/auth/me/social-accounts");
      setAccounts(data.data.accounts);
    } catch (error) {
      console.error("Failed to fetch social accounts", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Chỉ chấp nhận message từ cùng origin (do social-callback page gửi về)
      if (event.origin !== window.location.origin) return;
      
      const data = event.data;
      if (data?.type === "social-login-result" && data.action === "link") {
        if (data.success) {
          toast.success("Liên kết tài khoản thành công");
          fetchAccounts();
        } else {
          toast.error(data.message || "Liên kết thất bại");
        }
      }
    };
    
    // Listen to BroadcastChannel as well
    const channel = new BroadcastChannel('social_login_channel');
    channel.onmessage = (event) => {
        const data = event.data;
        if (data?.type === "social-login-result" && data.action === "link") {
            if (data.success) {
                toast.success("Liên kết tài khoản thành công");
                fetchAccounts();
            } else {
                toast.error(data.message || "Liên kết thất bại");
            }
        }
    };

    window.addEventListener("message", handleMessage);
    return () => {
        window.removeEventListener("message", handleMessage);
        channel.close();
    };
  }, []);

  const linkGoogle = () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
    if (!token) {
        toast.error("Vui lòng đăng nhập lại");
        return;
    }
    
    const width = 500;
    const height = 600;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;
    
    const url = `${API_BASE_URL}/api/auth/google/start?mode=popup&action=link&auth_token=${token}`;
    window.open(url, "link-google", `width=${width},height=${height},left=${left},top=${top}`);
  };

  const isLinked = (provider: string) => accounts.some((a) => a.provider === provider);
  const getAccount = (provider: string) => accounts.find((a) => a.provider === provider);

  if (loading) return <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Đang tải...</div>;

  return (
    <div className="space-y-4 rounded-lg border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
      <h3 className="text-lg font-medium text-[var(--foreground)]">Tài khoản liên kết</h3>
      <p className="text-sm text-[var(--muted-foreground)]">Kết nối tài khoản mạng xã hội để đăng nhập nhanh hơn.</p>
      <div className="mt-4 flex flex-col gap-3">
        {/* Google */}
        <div className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--background)] p-3">
          <div className="flex items-center gap-3">
            <FcGoogle className="h-6 w-6" />
            <div>
              <p className="font-medium text-[var(--foreground)]">Google</p>
              <p className="text-xs text-[var(--muted-foreground)]">
                {isLinked("google") ? "Đã kết nối" : "Chưa kết nối"}
              </p>
              {isLinked("google") && (
                <p className="text-xs text-[var(--muted-foreground)]">
                  Email: {accounts.find((a) => a.provider === "google")?.email ?? "Không có"}
                </p>
              )}
            </div>
          </div>
          {isLinked("google") ? (
            getAccount("google")?.email ? (
            <Button variant="ghost" size="sm" disabled className="gap-2 text-green-600 hover:text-green-700 hover:bg-green-50">
              <Check className="h-4 w-4" /> Đã kết nối
            </Button>
            ) : (
              <Button variant="outline" size="sm" onClick={linkGoogle} className="gap-2">
                <Plus className="h-4 w-4" /> Cập nhật email
              </Button>
            )
          ) : (
            <Button variant="outline" size="sm" onClick={linkGoogle} className="gap-2">
              <Plus className="h-4 w-4" /> Kết nối
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

