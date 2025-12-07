"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Eye, EyeOff, Lock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function ChangePasswordDialog({ open, onClose }: Props) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      toast.error("Vui lòng nhập đầy đủ thông tin");
      return;
    }
    
    if (newPassword.length < 6) {
        toast.error("Mật khẩu mới phải có ít nhất 6 ký tự");
        return;
    }

    setLoading(true);
    try {
      await api.post("/api/auth/change-password", {
        currentPassword,
        newPassword,
      });
      toast.success("Đổi mật khẩu thành công");
      onClose();
      // Reset form
      setCurrentPassword("");
      setNewPassword("");
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || "Đổi mật khẩu thất bại");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;
  if (typeof window === "undefined") return null;

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--card)] shadow-xl animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
          <h3 className="font-semibold text-[var(--foreground)]">Đổi mật khẩu</h3>
          <button onClick={onClose} className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--foreground)]">Mật khẩu hiện tại</label>
            <div className="relative">
              <Input
                type={showCurrent ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Nhập mật khẩu hiện tại"
                className="pr-10"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              >
                {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--foreground)]">Mật khẩu mới</label>
            <div className="relative">
              <Input
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Nhập mật khẩu mới"
                className="pr-10"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              >
                {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-xs text-[var(--muted-foreground)]">Tối thiểu 6 ký tự</p>
          </div>

          <div className="flex justify-end pt-2 gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Huỷ
            </Button>
            <Button type="submit" disabled={loading} className="min-w-[100px]">
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Lock className="mr-2 h-4 w-4" />}
              {loading ? "Đang lưu..." : "Lưu thay đổi"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

