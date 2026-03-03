"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LayoutDashboard,
  FileText,
  Briefcase,
  Users,
  UserRound,
  MessageSquareText,
  Pencil,
  Copy,
  Check,
  ChevronRight,
} from "lucide-react";
import CompanyProfileContent from "./profile/CompanyProfileContent";
import ManageCompanyPageContent from "./ManageCompanyPageContent";
import { Company } from "@/types/company";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Props = {
  company: Company;
  initialTab: string;
};

export default function ManageCompanyTabs({ company, initialTab }: Props) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const qc = useQueryClient();
  const tab = searchParams.get("tab") || initialTab || "overview";
  
  const [editSlugOpen, setEditSlugOpen] = useState(false);
  const [newSlug, setNewSlug] = useState(company.slug || "");
  const [copied, setCopied] = useState(false);
  const [profileUrl, setProfileUrl] = useState(`/companies/${company.slug}`);
  const tabsScrollRef = useRef<HTMLDivElement>(null);
  const [showTabsScrollHint, setShowTabsScrollHint] = useState(false);

  // Set full URL after component mounts to avoid hydration mismatch
  useEffect(() => {
    setProfileUrl(`${window.location.origin}/companies/${company.slug}`);
  }, [company.slug]);

  useEffect(() => {
    const el = tabsScrollRef.current;
    if (!el) return;

    const updateHint = () => {
      const hasOverflow = el.scrollWidth > el.clientWidth + 1;
      const nearEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 8;
      setShowTabsScrollHint(hasOverflow && !nearEnd);
    };

    updateHint();
    el.addEventListener("scroll", updateHint, { passive: true });
    window.addEventListener("resize", updateHint);

    return () => {
      el.removeEventListener("scroll", updateHint);
      window.removeEventListener("resize", updateHint);
    };
  }, []);

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "overview") {
      params.delete("tab");
    } else {
      params.set("tab", value);
    }
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  const updateSlugMutation = useMutation({
    mutationFn: async (slug: string) => {
      const res = await api.patch(`/api/companies/${company.id}`, { slug });
      return res.data.data.company;
    },
    onSuccess: (updatedCompany) => {
      toast.success("Đã cập nhật link profile thành công");
      setEditSlugOpen(false);
      // Invalidate queries to refresh data
      qc.invalidateQueries({ queryKey: ["company", company.id] });
      qc.invalidateQueries({ queryKey: ["company", company.slug] });
      // Redirect to new slug if changed
      if (updatedCompany.slug !== company.slug) {
        router.push(`/companies/${updatedCompany.slug}/manage`);
      }
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error?.message ?? "Không thể cập nhật link profile";
      toast.error(message);
    },
  });

  const handleSlugChange = () => {
    const normalizedSlug = newSlug.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    if (!normalizedSlug || normalizedSlug.length < 2) {
      toast.error("Link profile phải có ít nhất 2 ký tự và chỉ chứa chữ thường, số và dấu gạch ngang");
      return;
    }
    if (normalizedSlug === company.slug) {
      setEditSlugOpen(false);
      return;
    }
    updateSlugMutation.mutate(normalizedSlug);
  };

  const copyProfileLink = () => {
    navigator.clipboard.writeText(profileUrl);
    setCopied(true);
    toast.success("Đã sao chép link profile");
    setTimeout(() => setCopied(false), 2000);
  };

  const tabItems = [
    { value: "overview", label: "Tổng quan", mobileLabel: "Tổng quan", icon: LayoutDashboard },
    { value: "activity", label: "Hoạt động", mobileLabel: "Hoạt động", icon: FileText },
    { value: "jobs", label: "Việc làm", mobileLabel: "Việc làm", icon: Briefcase },
    { value: "applications", label: "Ứng tuyển", mobileLabel: "Ứng tuyển", icon: Users },
    { value: "members", label: "Thành viên", mobileLabel: "Thành viên", icon: UserRound },
    { value: "tickets", label: "Trao đổi", mobileLabel: "Trao đổi", icon: MessageSquareText },
  ];

  const triggerClass = cn(
    "data-[state=active]:text-[var(--brand)] data-[state=active]:bg-[var(--brand)]/10",
    "inline-flex h-10 items-center gap-1.5 whitespace-nowrap px-3.5 py-0 text-[var(--muted-foreground)] font-semibold text-sm leading-none rounded-lg transition-colors",
    "hover:text-[var(--foreground)] hover:bg-[var(--muted)] shadow-none"
  );

  return (
    <Tabs value={tab} onValueChange={handleTabChange} className="w-full">
      <div className="-mx-2 sticky top-[6.5rem] z-20 mb-5 rounded-xl border border-[var(--border)] bg-[var(--card)]/95 p-1 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-[var(--card)]/80 sm:mx-0 sm:mb-8 sm:p-2">
        <div className="relative">
          <TabsList
            ref={tabsScrollRef}
            aria-label="Điều hướng trang quản trị doanh nghiệp"
            className="flex h-auto w-full justify-start gap-2 overflow-x-auto border-0 bg-transparent p-0 shadow-none"
          >
            {tabItems.map((item) => {
              const Icon = item.icon;
              return (
                <TabsTrigger key={item.value} value={item.value} className={triggerClass}>
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.mobileLabel}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {showTabsScrollHint && (
            <>
              <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-[var(--card)] to-transparent" />
              <div className="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 rounded-full border border-[var(--border)] bg-[var(--card)] p-0.5 text-[var(--muted-foreground)] shadow-sm">
                <ChevronRight className="h-3 w-3" />
              </div>
            </>
          )}
        </div>

        <p className="px-1 pt-1 text-[11px] text-[var(--muted-foreground)] md:hidden">Vuốt ngang để xem thêm tab quản trị</p>
      </div>

      {/* TAB: OVERVIEW (Editable Profile) */}
      <TabsContent value="overview" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
        <div className="mb-5 rounded-xl border border-[var(--brand)]/25 bg-[var(--brand)]/10 p-3 sm:mb-8 sm:p-4">
          <div className="mb-3 flex items-start gap-3 text-[var(--brand)]">
            <div className="rounded-full bg-[var(--brand)]/15 p-2">
              <Pencil className="h-4 w-4" />
            </div>
            <p className="text-sm font-medium">
              Bạn đang ở chế độ chỉnh sửa. Chạm vào các khối nội dung để cập nhật thông tin doanh nghiệp.
            </p>
          </div>
          <div className="flex flex-col gap-2 pl-0 sm:pl-11">
            <span className="text-sm text-[var(--brand)]">Link truy cập công khai dành cho ứng viên:</span>
            <div className="flex flex-wrap items-center gap-2">
              <code className="max-w-full overflow-x-auto rounded border border-[var(--brand)]/30 bg-[var(--card)] px-2 py-1 font-mono text-xs font-semibold text-[var(--brand)] sm:text-sm">
                {profileUrl}
              </code>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={copyProfileLink}
                  className="h-8 w-8 shrink-0 text-[var(--brand)] hover:bg-[var(--brand)]/20"
                  title="Sao chép link"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setNewSlug(company.slug || "");
                    setEditSlugOpen(true);
                  }}
                  className="h-8 w-8 shrink-0 text-[var(--brand)] hover:bg-[var(--brand)]/20"
                  title="Sửa link"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        <CompanyProfileContent company={company} isEditable={true} />
      </TabsContent>

      {/* Edit Slug Dialog */}
      <Dialog open={editSlugOpen} onOpenChange={setEditSlugOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Thay đổi link profile</DialogTitle>
            <DialogDescription>
              Link profile sẽ được thay đổi và có thể ảnh hưởng đến các link đã được chia sẻ trước đó.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="slug">Link profile mới</Label>
              <div className="flex items-center gap-2">
                <span className="whitespace-nowrap text-sm text-[var(--muted-foreground)]">
                  {profileUrl.split('/companies/')[0] || ''}/companies/
                </span>
                <Input
                  id="slug"
                  value={newSlug}
                  onChange={(e) => {
                    const value = e.target.value
                      .toLowerCase()
                      .replace(/\s+/g, "-")
                      .replace(/[^a-z0-9-]/g, "");
                    setNewSlug(value);
                  }}
                  placeholder="ten-cong-ty"
                  className="flex-1"
                  maxLength={50}
                />
              </div>
              <p className="text-xs text-[var(--muted-foreground)]">
                Chỉ sử dụng chữ thường, số và dấu gạch ngang. Tối thiểu 2 ký tự.
              </p>
              {newSlug && newSlug !== company.slug && (
                <div className="rounded border border-[var(--brand)]/20 bg-[var(--brand)]/10 p-2 text-xs text-[var(--brand)]">
                  Link mới: <code className="font-mono">{profileUrl.replace(company.slug, newSlug)}</code>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditSlugOpen(false);
                setNewSlug(company.slug || "");
              }}
              disabled={updateSlugMutation.isPending}
            >
              Hủy
            </Button>
            <Button
              onClick={handleSlugChange}
              disabled={!newSlug || newSlug === company.slug || updateSlugMutation.isPending || newSlug.length < 2}
            >
              {updateSlugMutation.isPending ? "Đang cập nhật..." : "Cập nhật"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reuse existing ManageCompanyPageContent for complex logic of other tabs */}
      <TabsContent value="activity" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
        <ManageCompanyPageContent company={company} />
      </TabsContent>

      <TabsContent value="jobs" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
        <ManageCompanyPageContent company={company} />
      </TabsContent>

      <TabsContent value="applications" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
        <ManageCompanyPageContent company={company} />
      </TabsContent>

      <TabsContent value="members" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
        <ManageCompanyPageContent company={company} />
      </TabsContent>

      <TabsContent value="tickets" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
        <ManageCompanyPageContent company={company} />
      </TabsContent>
    </Tabs>
  );
}

