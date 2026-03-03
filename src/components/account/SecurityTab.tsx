"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ChangePasswordDialog from "@/components/auth/ChangePasswordDialog";
import { Shield, Lock } from "lucide-react";

export default function SecurityTab() {
  const [showChangePassword, setShowChangePassword] = useState(false);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold sm:text-2xl">Bảo mật</h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">Quản lý mật khẩu và bảo mật tài khoản</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield size={20} />
            Mật khẩu
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-[var(--foreground)]">Mật khẩu tài khoản</p>
              <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                Cập nhật mật khẩu để bảo vệ tài khoản của bạn
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => setShowChangePassword(true)}
              className="flex w-full items-center justify-center gap-2 sm:w-auto"
            >
              <Lock size={16} />
              Đổi mật khẩu
            </Button>
          </div>
        </CardContent>
      </Card>

      <ChangePasswordDialog
        open={showChangePassword}
        onClose={() => setShowChangePassword(false)}
      />
    </div>
  );
}

