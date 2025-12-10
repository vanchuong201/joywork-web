"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function SocialCallbackContent() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const success = searchParams.get("success") === "true";
    const message = searchParams.get("message");
    const provider = searchParams.get("provider");
    const action = searchParams.get("action") ?? undefined;

    const messageData = {
      type: "social-login-result",
      success,
      message,
      provider,
      action,
    };

    // 1. Gửi message về window opener (ưu tiên)
    if (window.opener) {
      try {
        window.opener.postMessage(messageData, window.location.origin);
      } catch (e) {
        // ignore cross-origin errors if any
      }
    }

    // 2. Gửi qua BroadcastChannel (backup nếu mất opener)
    try {
      const channel = new BroadcastChannel('social_login_channel');
      channel.postMessage(messageData);
      channel.close();
    } catch (e) {
      // ignore
    }
    
    // Đóng popup
    window.close();
  }, [searchParams]);

  return (
    <div className="flex items-center justify-center h-screen bg-white">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
        <p className="text-sm text-gray-500">Đang hoàn tất đăng nhập...</p>
      </div>
    </div>
  );
}

export default function SocialCallbackPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SocialCallbackContent />
    </Suspense>
  );
}

