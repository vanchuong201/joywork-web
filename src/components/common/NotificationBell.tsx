"use client";

import { Bell } from "lucide-react";
import * as Popover from "@radix-ui/react-popover";
import { useState } from "react";
import { useUnreadCount, useNotifications, useMarkAsRead, useMarkAllAsRead } from "@/hooks/useNotifications";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCheck } from "lucide-react";
import { useAuthStore } from "@/store/useAuth";
import type { Notification } from "@/types/notification";

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const user = useAuthStore((s) => s.user);
  const { data: unreadCount } = useUnreadCount();
  const { data: notificationsData, isLoading: notificationsLoading } = useNotifications({
    page: 1,
    limit: 10,
    unreadOnly: false,
  });
  const markAsReadMutation = useMarkAsRead();
  const markAllAsReadMutation = useMarkAllAsRead();

  // Don't show if user is not logged in
  if (!user) return null;

  const notifications = notificationsData?.notifications || [];
  const hasUnread = (unreadCount ?? 0) > 0;

  const handleNotificationClick = async (notificationId: string, isRead: boolean) => {
    if (!isRead) {
      await markAsReadMutation.mutateAsync(notificationId);
    }
    setOpen(false);
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsReadMutation.mutateAsync();
  };

  const getNotificationLink = (notification: Notification) => {
    if (typeof notification?.metadata?.targetUrl === "string" && notification.metadata.targetUrl.startsWith("/")) {
      return notification.metadata.targetUrl;
    }

    if (notification.type === "APPLICATION_STATUS" && notification.metadata?.jobId) {
      return `/jobs/${notification.metadata.jobId}`;
    }

    if (notification.type === "CV_FLIP_REQUEST") {
      return "/account?tab=profile";
    }

    if (notification.relatedEntityType === "TICKET" && notification.relatedEntityId) {
      const companySlug = notification.metadata?.companySlug;
      if (companySlug) {
        return `/tickets/${notification.relatedEntityId}?company=${companySlug}`;
      }
      return `/tickets/${notification.relatedEntityId}`;
    }
    // Add more entity types as needed
    return "#";
  };

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          className="relative flex items-center justify-center rounded-md p-2 text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
          aria-label="Thông báo"
        >
          <Bell size={18} />
          {hasUnread && (
            <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--brand)] text-[10px] font-bold text-white">
              {unreadCount && unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          className="z-[9999] w-[380px] rounded-lg border border-[var(--border)] bg-[var(--card)] shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2"
          sideOffset={8}
          align="end"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex max-h-[500px] flex-col">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
              <h3 className="text-sm font-semibold text-[var(--foreground)]">Thông báo</h3>
              {hasUnread && (
                <button
                  className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)] hover:text-[var(--foreground)] disabled:opacity-50"
                  onClick={handleMarkAllAsRead}
                  disabled={markAllAsReadMutation.isPending}
                >
                  <CheckCheck size={14} />
                  Đánh dấu tất cả đã đọc
                </button>
              )}
            </div>

            {/* Notifications List */}
            <div className="overflow-y-auto">
              {notificationsLoading ? (
                <div className="space-y-2 p-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center text-sm text-[var(--muted-foreground)]">
                  Không có thông báo nào
                </div>
              ) : (
                <div className="divide-y divide-[var(--border)]">
                  {notifications.map((notification) => {
                    const link = getNotificationLink(notification);
                    const NotificationContent = (
                      <div
                        className={cn(
                          "flex gap-3 px-4 py-3 transition-colors",
                          !notification.isRead && "bg-[var(--muted)]/50"
                        )}
                      >
                        <div className="flex-1 min-w-0">
                          <p
                            className={cn(
                              "text-sm font-medium text-[var(--foreground)]",
                              !notification.isRead && "font-semibold"
                            )}
                          >
                            {notification.title}
                          </p>
                          <p className="mt-1 text-xs text-[var(--muted-foreground)] line-clamp-2">
                            {notification.content}
                          </p>
                          <p className="mt-1 text-[10px] text-[var(--muted-foreground)]">
                            {formatDistanceToNow(new Date(notification.createdAt), {
                              addSuffix: true,
                              locale: vi,
                            })}
                          </p>
                        </div>
                        {!notification.isRead && (
                          <div className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-[var(--brand)]" />
                        )}
                      </div>
                    );

                    if (link === "#") {
                      return (
                        <div
                          key={notification.id}
                          onClick={() => handleNotificationClick(notification.id, notification.isRead)}
                          className="cursor-pointer hover:bg-[var(--muted)]/30"
                        >
                          {NotificationContent}
                        </div>
                      );
                    }

                    return (
                      <Link
                        key={notification.id}
                        href={link}
                        onClick={() => handleNotificationClick(notification.id, notification.isRead)}
                        className="block hover:bg-[var(--muted)]/30"
                      >
                        {NotificationContent}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="border-t border-[var(--border)] px-4 py-2">
                <Link
                  href="/notifications"
                  className="block text-center text-xs text-[var(--brand)] hover:underline"
                  onClick={() => setOpen(false)}
                >
                  Xem tất cả thông báo
                </Link>
              </div>
            )}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
