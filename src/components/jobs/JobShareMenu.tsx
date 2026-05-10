"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Button } from "@/components/ui/button";
import { Share2, Link2, Facebook, Linkedin, Send } from "lucide-react";
import { toast } from "sonner";

function getShareUrl(): string {
  if (typeof window === "undefined") {
    return "";
  }
  return window.location.href;
}

export default function JobShareMenu() {
  const sharePageUrl = () => getShareUrl();

  const handleCopy = async () => {
    const url = sharePageUrl();
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Đã sao chép liên kết");
    } catch {
      toast.error("Không thể sao chép liên kết");
    }
  };

  const handleNativeShare = async () => {
    const url = sharePageUrl();
    if (!url || !navigator.share) return;
    try {
      await navigator.share({ url, title: document.title });
    } catch (e) {
      if ((e as Error)?.name === "AbortError") return;
      toast.error("Không thể mở chia sẻ");
    }
  };

  const openFacebook = () => {
    const url = encodeURIComponent(sharePageUrl());
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, "_blank", "noopener,noreferrer");
  };

  const openLinkedIn = () => {
    const url = encodeURIComponent(sharePageUrl());
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-9 gap-1.5 border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] hover:bg-[var(--muted)]"
        >
          <Share2 className="h-4 w-4" />
          <span className="hidden sm:inline">Chia sẻ</span>
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={6}
          className="z-[60] min-w-[200px] rounded-lg border border-[var(--border)] bg-[var(--card)] p-1 shadow-lg"
        >
          <DropdownMenu.Item
            className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-[var(--foreground)] outline-none hover:bg-[var(--muted)]"
            onSelect={() => {
              void handleCopy();
            }}
          >
            <Link2 className="h-4 w-4 shrink-0" />
            Sao chép liên kết
          </DropdownMenu.Item>
          {typeof navigator !== "undefined" && typeof navigator.share === "function" ? (
            <DropdownMenu.Item
              className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-[var(--foreground)] outline-none hover:bg-[var(--muted)]"
              onSelect={() => {
                void handleNativeShare();
              }}
            >
              <Send className="h-4 w-4 shrink-0" />
              Chia sẻ nhanh
            </DropdownMenu.Item>
          ) : null}
          <DropdownMenu.Item
            className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-[var(--foreground)] outline-none hover:bg-[var(--muted)]"
            onSelect={() => {
              openFacebook();
            }}
          >
            <Facebook className="h-4 w-4 shrink-0" />
            Facebook
          </DropdownMenu.Item>
          <DropdownMenu.Item
            className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-[var(--foreground)] outline-none hover:bg-[var(--muted)]"
            onSelect={() => {
              openLinkedIn();
            }}
          >
            <Linkedin className="h-4 w-4 shrink-0" />
            LinkedIn
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
