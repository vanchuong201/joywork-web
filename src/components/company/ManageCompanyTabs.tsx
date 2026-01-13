"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LayoutDashboard, FileText, Briefcase, Users, UserRound, MessageSquareText, Pencil, Copy, Check } from "lucide-react";
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

  // Set full URL after component mounts to avoid hydration mismatch
  useEffect(() => {
    setProfileUrl(`${window.location.origin}/companies/${company.slug}`);
  }, [company.slug]);

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

  return (
    <Tabs value={tab} onValueChange={handleTabChange} className="w-full">
      <div className="flex flex-col md:flex-row items-center justify-between mb-12 border-b border-[var(--border)] bg-[var(--card)]/50 backdrop-blur-sm sticky top-16 z-20 rounded-xl px-4 shadow-sm">
        <TabsList className="bg-transparent h-auto p-0 gap-6 w-full md:w-auto overflow-x-auto flex-nowrap justify-start py-2">
          <TabsTrigger
            value="overview"
            className="data-[state=active]:text-[var(--brand)] data-[state=active]:bg-[var(--brand-light)] text-[var(--muted-foreground)] font-bold text-base px-4 py-3 rounded-lg transition-all hover:text-[var(--foreground)] shadow-none flex items-center gap-2"
          >
            <LayoutDashboard className="w-4 h-4" /> Tổng quan
          </TabsTrigger>
          <TabsTrigger
            value="activity"
            className="data-[state=active]:text-[var(--brand)] data-[state=active]:bg-[var(--brand-light)] text-[var(--muted-foreground)] font-bold text-base px-4 py-3 rounded-lg transition-all hover:text-[var(--foreground)] shadow-none flex items-center gap-2"
          >
            <FileText className="w-4 h-4" /> Hoạt động
          </TabsTrigger>
          <TabsTrigger
            value="jobs"
            className="data-[state=active]:text-[var(--brand)] data-[state=active]:bg-[var(--brand-light)] text-[var(--muted-foreground)] font-bold text-base px-4 py-3 rounded-lg transition-all hover:text-[var(--foreground)] shadow-none flex items-center gap-2"
          >
            <Briefcase className="w-4 h-4" /> Việc làm
          </TabsTrigger>
          <TabsTrigger
            value="applications"
            className="data-[state=active]:text-[var(--brand)] data-[state=active]:bg-[var(--brand-light)] text-[var(--muted-foreground)] font-bold text-base px-4 py-3 rounded-lg transition-all hover:text-[var(--foreground)] shadow-none flex items-center gap-2"
          >
            <Users className="w-4 h-4" /> Ứng tuyển
          </TabsTrigger>
          <TabsTrigger
            value="members"
            className="data-[state=active]:text-[var(--brand)] data-[state=active]:bg-[var(--brand-light)] text-[var(--muted-foreground)] font-bold text-base px-4 py-3 rounded-lg transition-all hover:text-[var(--foreground)] shadow-none flex items-center gap-2"
          >
            <UserRound className="w-4 h-4" /> Thành viên
          </TabsTrigger>
          <TabsTrigger
            value="tickets"
            className="data-[state=active]:text-[var(--brand)] data-[state=active]:bg-[var(--brand-light)] text-[var(--muted-foreground)] font-bold text-base px-4 py-3 rounded-lg transition-all hover:text-[var(--foreground)] shadow-none flex items-center gap-2"
          >
            <MessageSquareText className="w-4 h-4" /> Trao đổi
          </TabsTrigger>
        </TabsList>
      </div>

      {/* TAB: OVERVIEW (Editable Profile) */}
      <TabsContent value="overview" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
        <div className="bg-[var(--brand-light)] border border-[var(--brand)]/30 rounded-lg p-4 mb-8">
          <div className="flex items-center gap-3 text-[var(--brand-dark)] mb-3">
            <div className="bg-[var(--brand)]/10 p-2 rounded-full">
              <Pencil className="w-4 h-4 text-[var(--brand)]" />
            </div>
            <p className="text-sm font-medium">Bạn đang ở chế độ chỉnh sửa. Di chuột vào các mục để chỉnh sửa nội dung.</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap pl-11">
            <span className="text-sm text-[var(--brand-dark)]">Link truy cập công khai dành cho ứng viên:</span>
            <code className="text-sm font-mono bg-white/80 text-[var(--brand)] px-2 py-1 rounded border border-[var(--brand)]/30 font-semibold">
              {profileUrl}
            </code>
            <Button
              variant="ghost"
              size="icon"
              onClick={copyProfileLink}
              className="h-7 w-7 text-[var(--brand-dark)] hover:bg-[var(--brand)]/20 shrink-0"
              title="Sao chép link"
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-600" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setNewSlug(company.slug || "");
                setEditSlugOpen(true);
              }}
              className="h-7 w-7 text-[var(--brand-dark)] hover:bg-[var(--brand)]/20 shrink-0"
              title="Sửa link"
            >
              <Pencil className="w-4 h-4" />
            </Button>
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
                <span className="text-sm text-slate-500 whitespace-nowrap">
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
              <p className="text-xs text-slate-500">
                Chỉ sử dụng chữ thường, số và dấu gạch ngang. Tối thiểu 2 ký tự.
              </p>
              {newSlug && newSlug !== company.slug && (
                <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
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

