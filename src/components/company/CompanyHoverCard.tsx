"use client";

import * as Popover from "@radix-ui/react-popover";
import { ReactNode, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { CompanySummary } from "@/types/company";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/store/useAuth";
import { useAuthPrompt } from "@/contexts/AuthPromptContext";
import { toast } from "sonner";
import CreateTicketModal from "@/components/tickets/CreateTicketModal";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MessageCircleHeart, Plus, Check } from "lucide-react";

type Props = {
  companyId: string;
  slug: string;
  companyName: string;
  children: ReactNode;
};

export default function CompanyHoverCard({ companyId, slug, companyName, children }: Props) {
  const [open, setOpen] = useState(false);
  const [ticketModalOpen, setTicketModalOpen] = useState(false);
  const closeTimeout = useRef<NodeJS.Timeout | null>(null);
  const user = useAuthStore((s) => s.user);
  const followedCompanies = useAuthStore((s) => s.followedCompanies);
  const addFollowedCompany = useAuthStore((s) => s.addFollowedCompany);
  const removeFollowedCompany = useAuthStore((s) => s.removeFollowedCompany);
  const { openPrompt } = useAuthPrompt();
  const router = useRouter();

  const isFollowing = useMemo(
    () => followedCompanies.some((entry) => entry.companyId === companyId),
    [followedCompanies, companyId],
  );

  const { data, isLoading } = useQuery({
    queryKey: ["company-summary", slug],
    enabled: open,
    queryFn: async () => {
      const res = await api.get(`/api/companies/${slug}/summary`);
      return res.data.data.summary as CompanySummary;
    },
    staleTime: 1000 * 60 * 5,
  });

  const followMutation = useMutation({
    mutationFn: async (next: boolean) => {
      if (next) {
        await api.post(`/api/companies/${companyId}/follow`);
      } else {
        await api.delete(`/api/companies/${companyId}/follow`);
      }
      return next;
    },
    onSuccess: (next) => {
      if (next) {
        addFollowedCompany({ companyId, slug });
        toast.success("Đã theo dõi doanh nghiệp");
      } else {
        removeFollowedCompany(companyId);
        toast.success("Đã huỷ theo dõi");
      }
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error?.message ?? "Không thể cập nhật trạng thái theo dõi";
      toast.error(message);
    },
  });

  const scheduleClose = () => {
    if (closeTimeout.current) clearTimeout(closeTimeout.current);
    closeTimeout.current = setTimeout(() => setOpen(false), 120);
  };

  const cancelClose = () => {
    if (closeTimeout.current) {
      clearTimeout(closeTimeout.current);
      closeTimeout.current = null;
    }
  };

  const handleFollowClick = () => {
    if (!user) {
      openPrompt("follow-company");
      return;
    }
    followMutation.mutate(!isFollowing);
  };

  const handleMessageClick = () => {
    if (!user) {
      openPrompt("message-company");
      return;
    }
    setTicketModalOpen(true);
  };

  return (
    <>
      <Popover.Root open={open} onOpenChange={setOpen}>
        <Popover.Anchor asChild>
          <span
            onMouseEnter={() => {
              cancelClose();
              setOpen(true);
            }}
            onMouseLeave={scheduleClose}
            className="inline-flex"
          >
            {children}
          </span>
        </Popover.Anchor>
        <Popover.Portal>
          <Popover.Content
            sideOffset={8}
            className="w-80 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-2xl outline-none"
            onMouseEnter={cancelClose}
            onMouseLeave={scheduleClose}
          >
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-8 w-full" />
              </div>
            ) : data ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  {data.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={data.logoUrl} alt={data.name} className="h-12 w-12 rounded-lg object-cover" />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[var(--muted)] text-lg font-semibold text-[var(--muted-foreground)]">
                      {data.name.slice(0, 1)}
                    </div>
                  )}
                  <div>
                    <Link href={`/companies/${data.slug}`} className="text-base font-semibold text-[var(--foreground)] hover:underline">
                      {data.name}
                    </Link>
                    {data.tagline ? (
                      <p className="text-sm text-[var(--muted-foreground)]">{data.tagline}</p>
                    ) : null}
                    {data.location ? (
                      <p className="text-xs text-[var(--muted-foreground)]">{data.location}</p>
                    ) : null}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="rounded-lg border border-[var(--border)] p-2">
                    <div className="text-lg font-semibold text-[var(--foreground)]">{data.followersCount}</div>
                    <div className="text-[var(--muted-foreground)]">Follower</div>
                  </div>
                  <div className="rounded-lg border border-[var(--border)] p-2">
                    <div className="text-lg font-semibold text-[var(--foreground)]">{data.postsCount}</div>
                    <div className="text-[var(--muted-foreground)]">Bài viết</div>
                  </div>
                  <div className="rounded-lg border border-[var(--border)] p-2">
                    <div className="text-lg font-semibold text-[var(--foreground)]">{data.jobsActive}</div>
                    <div className="text-[var(--muted-foreground)]">Job mở</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    className="flex-1 gap-2"
                    size="sm"
                    variant={isFollowing ? "default" : "outline"}
                    disabled={followMutation.isPending}
                    onClick={handleFollowClick}
                  >
                    {isFollowing ? (
                      <>
                        <Check className="h-4 w-4" /> Đang theo dõi
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4" /> Theo dõi
                      </>
                    )}
                  </Button>
                  <Button className="flex-1 gap-2" size="sm" onClick={handleMessageClick}>
                    <MessageCircleHeart className="h-4 w-4" /> Nhắn tin
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-[var(--muted-foreground)]">Không thể tải thông tin doanh nghiệp.</p>
            )}
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>

      <CreateTicketModal
        open={ticketModalOpen}
        onOpenChange={setTicketModalOpen}
        companyId={companyId}
        companyName={companyName}
        onCreated={(ticket) => {
          setTicketModalOpen(false);
          toast.success("Đã tạo tin nhắn, chuyển tới trang hội thoại");
          router.push(`/tickets/${ticket.id}`);
        }}
      />
    </>
  );
}

