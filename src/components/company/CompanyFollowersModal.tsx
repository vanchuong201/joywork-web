"use client";

import { Dialog } from "@headlessui/react";
import { X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

type FollowerItem = {
  followedAt: string;
  user: {
    id: string;
    email: string;
    name: string | null;
    avatar: string | null;
  };
};

type FollowersResponse = {
  followers: FollowerItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
};

export default function CompanyFollowersModal({
  isOpen,
  onClose,
  companyId,
}: {
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
}) {
  const { data, isLoading, isFetching, refetch } = useQuery({
    enabled: isOpen && Boolean(companyId),
    queryKey: ["company-followers", companyId],
    queryFn: async () => {
      const res = await api.get(`/api/companies/${companyId}/followers`, { params: { page: 1, limit: 50 } });
      return res.data.data as FollowersResponse;
    },
    staleTime: 60_000,
  });

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto flex w-full max-w-2xl max-h-[80vh] flex-col rounded-xl bg-[var(--card)] p-6 shadow-xl">
          <div className="mb-4 flex items-center justify-between">
            <Dialog.Title className="text-lg font-semibold text-[var(--foreground)]">
              Người theo dõi doanh nghiệp
            </Dialog.Title>
            <button
              onClick={onClose}
              className="rounded-full p-1 text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
              aria-label="Đóng"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <Dialog.Description className="mb-3 text-sm text-[var(--muted-foreground)]">
            Danh sách những người dùng đã theo dõi doanh nghiệp của bạn.
          </Dialog.Description>

          <div className="flex-1 overflow-y-auto pr-1">
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 6 }).map((_, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-3 w-1/3" />
                      <Skeleton className="h-3 w-1/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : data && data.followers.length > 0 ? (
              <div className="space-y-3">
                {data.followers.map((item) => (
                  <div key={item.user.id + item.followedAt} className="flex items-center gap-3">
                    {item.user.avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.user.avatar}
                        alt={item.user.name ?? item.user.email}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--muted)] text-xs font-semibold text-[var(--muted-foreground)]">
                        {(item.user.name ?? item.user.email).slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-[var(--foreground)]">
                        {item.user.name ?? item.user.email}
                      </div>
                      <div className="text-xs text-[var(--muted-foreground)]">
                        Theo dõi {formatDistanceToNow(new Date(item.followedAt), { addSuffix: true, locale: vi })}
                      </div>
                    </div>
                  </div>
                ))}
                {data.pagination.hasMore ? (
                  <div className="pt-2">
                    <Button variant="outline" size="sm" disabled>
                      Tải thêm (đang phát triển)
                    </Button>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="rounded-md border border-[var(--border)] bg-[var(--background)] p-6 text-center text-sm text-[var(--muted-foreground)]">
                Chưa có người theo dõi nào.
              </div>
            )}
          </div>

          <div className="mt-4 flex items-center justify-end gap-2">
            <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
              {isFetching ? "Đang tải..." : "Làm mới"}
            </Button>
            <Button onClick={onClose}>Đóng</Button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}


