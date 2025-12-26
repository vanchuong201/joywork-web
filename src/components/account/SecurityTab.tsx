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
        <h1 className="text-2xl font-bold">Bảo mật</h1>
        <p className="text-sm text-slate-500 mt-1">Quản lý mật khẩu và bảo mật tài khoản</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield size={20} />
            Mật khẩu
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-700">Mật khẩu tài khoản</p>
              <p className="text-xs text-slate-500 mt-1">
                Cập nhật mật khẩu để bảo vệ tài khoản của bạn
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => setShowChangePassword(true)}
              className="flex items-center gap-2"
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

