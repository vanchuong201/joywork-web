"use client";

import { useNotifications, useMarkAsRead, useMarkAllAsRead, useDeleteNotification } from "@/hooks/useNotifications";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCheck, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function NotificationsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useNotifications({ page, limit: 20 });
  const markAsReadMutation = useMarkAsRead();
  const markAllAsReadMutation = useMarkAllAsRead();
  const deleteMutation = useDeleteNotification();

  const notifications = data?.notifications || [];
  const pagination = data?.pagination;
  const hasUnread = notifications.some((n) => !n.isRead);

  const handleMarkAsRead = async (notificationId: string) => {
    await markAsReadMutation.mutateAsync(notificationId);
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsReadMutation.mutateAsync();
  };

  const handleDelete = async (notificationId: string) => {
    await deleteMutation.mutateAsync(notificationId);
  };

  const getNotificationLink = (notification: any) => {
    if (notification.relatedEntityType === "TICKET" && notification.relatedEntityId) {
      const companySlug = notification.metadata?.companySlug;
      if (companySlug) {
        return `/tickets/${notification.relatedEntityId}?company=${companySlug}`;
      }
      return `/tickets/${notification.relatedEntityId}`;
    }
    return "#";
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Thông báo</h1>
        {hasUnread && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllAsRead}
            disabled={markAllAsReadMutation.isPending}
            className="flex items-center gap-2"
          >
            <CheckCheck size={16} />
            Đánh dấu tất cả đã đọc
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-12 text-center">
          <p className="text-[var(--muted-foreground)]">Không có thông báo nào</p>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {notifications.map((notification) => {
              const link = getNotificationLink(notification);
              const NotificationContent = (
                <div
                  className={cn(
                    "group relative flex gap-4 rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 transition-colors",
                    !notification.isRead && "bg-[var(--muted)]/30"
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p
                          className={cn(
                            "text-sm font-medium text-[var(--foreground)]",
                            !notification.isRead && "font-semibold"
                          )}
                        >
                          {notification.title}
                        </p>
                        <p className="mt-1 text-sm text-[var(--muted-foreground)]">{notification.content}</p>
                        <p className="mt-2 text-xs text-[var(--muted-foreground)]">
                          {formatDistanceToNow(new Date(notification.createdAt), {
                            addSuffix: true,
                            locale: vi,
                          })}
                        </p>
                      </div>
                      {!notification.isRead && (
                        <div className="h-2 w-2 flex-shrink-0 rounded-full bg-[var(--brand)]" />
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                    {!notification.isRead && (
                      <button
                        onClick={() => handleMarkAsRead(notification.id)}
                        className="rounded-md p-1 text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
                        title="Đánh dấu đã đọc"
                      >
                        <CheckCheck size={16} />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(notification.id)}
                      className="rounded-md p-1 text-[var(--muted-foreground)] hover:bg-[var(--destructive)]/10 hover:text-[var(--destructive)]"
                      title="Xóa"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );

              if (link === "#") {
                return (
                  <div key={notification.id} onClick={() => handleMarkAsRead(notification.id)}>
                    {NotificationContent}
                  </div>
                );
              }

              return (
                <Link
                  key={notification.id}
                  href={link}
                  onClick={() => handleMarkAsRead(notification.id)}
                  className="block"
                >
                  {NotificationContent}
                </Link>
              );
            })}
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Trước
              </Button>
              <span className="text-sm text-[var(--muted-foreground)]">
                Trang {pagination.page} / {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={page === pagination.totalPages}
              >
                Sau
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
