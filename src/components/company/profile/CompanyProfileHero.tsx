"use client";

import { Company } from "@/types/company";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Globe, MapPin, Users, CheckCircle, MessageCircle, ShieldCheck, Mail, Phone, Pencil, Camera, FileCheck, AlertTriangle, Briefcase } from "lucide-react";
import CompanyMessageButton from "@/components/company/CompanyMessageButton";
import CompanyFollowButton from "@/components/company/CompanyFollowButton";
import { Badge } from "@/components/ui/badge";
import { useEffect, useRef, useState, useMemo } from "react";
import { uploadCompanyCover, uploadCompanyLogo } from "@/lib/uploads";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useMutation } from "@tanstack/react-query";
import api from "@/lib/api";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import IndustrySelect from "@/components/ui/industry-select";

export default function CompanyProfileHero({ company, isEditable = false }: { company: Company, isEditable?: boolean }) {
    const router = useRouter();
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [verificationDialogOpen, setVerificationDialogOpen] = useState(false);
    const [coverPreviewOpen, setCoverPreviewOpen] = useState(false);
    const [uploadingCover, setUploadingCover] = useState(false);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [uploadingVerification, setUploadingVerification] = useState(false);
    const [verificationFile, setVerificationFile] = useState<File | null>(null);
    const [verificationLegalName, setVerificationLegalName] = useState(company.legalName || "");
    const [isMounted, setIsMounted] = useState(false);
    
    const coverInputRef = useRef<HTMLInputElement>(null);
    const avatarInputRef = useRef<HTMLInputElement>(null);
    const verificationInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        if (verificationDialogOpen) {
            setVerificationLegalName(company.legalName || "");
        }
    }, [verificationDialogOpen, company.legalName]);

    // Track original legal name for re-verification detection
    const originalLegalName = useMemo(() => company.legalName || "", [company.legalName]);

    const [formData, setFormData] = useState({
        name: company.name,
        legalName: company.legalName || "",
        location: company.location || "",
        industry: company.industry || "",
        // Let user type domain only; we'll normalize on blur/submit.
        website: (company.website || "").replace(/^https?:\/\//i, ""),
        email: company.email || "",
        phone: company.phone || "",
    });

    const openBasicEditDialog = () => {
        setFormData({
            name: company.name,
            legalName: company.legalName || "",
            location: company.location || "",
            industry: company.industry || "",
            website: (company.website || "").replace(/^https?:\/\//i, ""),
            email: company.email || "",
            phone: company.phone || "",
        });
        setEmailError(null);
        setEditDialogOpen(true);
    };
    const [emailError, setEmailError] = useState<string | null>(null);

    // Get owner email for verification notification
    const ownerMember = useMemo(() => {
        return company.members?.find(m => m.role === "OWNER");
    }, [company.members]);
    const ownerEmail = ownerMember?.user?.email;

    const verificationStatus = company.verificationStatus ?? (company.isVerified ? "VERIFIED" : "UNVERIFIED");
    const verificationLabel =
        verificationStatus === "VERIFIED"
            ? "Đã xác thực"
            : verificationStatus === "PENDING"
            ? "Đang chờ duyệt"
            : verificationStatus === "REJECTED"
            ? "Bị từ chối"
            : "Chưa xác thực";

    const normalizeWebsite = (input?: string | null): string | null => {
        const raw = (input ?? "").trim();
        if (!raw) return null;
        // If already has scheme, keep.
        if (/^https?:\/\//i.test(raw)) return raw;
        // Allow users to paste domain/path (example.com/path) -> prepend https://
        return `https://${raw}`;
    };

    // RFC 5322-ish: local@domain.tld (simplified but covers common cases)
    const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((value ?? "").trim());

    const mutation = useMutation({
        mutationFn: async (data: any) => {
            await api.patch(`/api/companies/${company.id}`, data);
        },
        onSuccess: () => {
            toast.success("Cập nhật thông tin thành công");
            setEditDialogOpen(false);
            router.refresh();
        },
        onError: () => {
            toast.error("Cập nhật thất bại");
        }
    });

    const handleSave = () => {
        // Validate required field
        if (!formData.name || formData.name.trim() === "") {
            toast.error("Vui lòng nhập tên công ty (Thương hiệu)");
            return;
        }

        // Validate email format if provided
        const email = formData.email?.trim();
        if (email && !isValidEmail(email)) {
            setEmailError("Email không đúng định dạng (VD: contact@company.vn)");
            return;
        }
        setEmailError(null);
        
        // Check if legal name changed for verified company
        const legalNameChanged = verificationStatus === "VERIFIED" && 
            formData.legalName.trim() !== originalLegalName.trim() &&
            formData.legalName.trim() !== "";
        
        const payload: any = {
            name: formData.name.trim(),
            legalName: formData.legalName?.trim() || null,
            location: formData.location?.trim() || null,
            industry: formData.industry?.trim() ? formData.industry.trim() : null,
            website: normalizeWebsite(formData.website),
            email: formData.email?.trim() || null,
            phone: formData.phone?.trim() || null,
        };

        // If legal name changed on verified company, trigger re-verification
        if (legalNameChanged) {
            payload.requestReVerification = true;
        }
        
        mutation.mutate(payload);
    };

    const fileToBase64 = (file: File) =>
        new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const result = reader.result?.toString() || "";
                const base64 = result.includes(",") ? result.split(",")[1] : result;
                resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });

    const handleUploadVerification = async () => {
        if (!verificationFile) {
            toast.error("Vui lòng chọn file DKKD");
            return;
        }
        const legalName = verificationLegalName.trim();
        if (!legalName) {
            toast.error("Vui lòng nhập Tên pháp lý đầy đủ trước khi gửi xác thực");
            return;
        }
        setUploadingVerification(true);
        try {
            const currentLegalName = (company.legalName || "").trim();
            if (legalName !== currentLegalName) {
                const payload: any = { legalName };
                const legalNameChangedVerified =
                    verificationStatus === "VERIFIED" && legalName !== originalLegalName.trim();
                if (legalNameChangedVerified) {
                    payload.requestReVerification = true;
                }
                await api.patch(`/api/companies/${company.id}`, payload);
                setFormData((prev) => ({ ...prev, legalName }));
            }

            const fileData = await fileToBase64(verificationFile);
            await api.post("/api/uploads/company/verification-document", {
                companyId: company.id,
                fileName: verificationFile.name,
                fileType: verificationFile.type,
                fileData,
                previousKey: company.verificationFileKey ?? undefined,
            });
            toast.success("Đã gửi hồ sơ xác thực, vui lòng chờ duyệt");
            setVerificationFile(null);
            if (verificationInputRef.current) {
                verificationInputRef.current.value = "";
            }
            setVerificationDialogOpen(false);
            router.refresh();
        } catch (error: any) {
            const message = error?.response?.data?.error?.message ?? "Tải file xác thực thất bại";
            toast.error(message);
        } finally {
            setUploadingVerification(false);
        }
    };

    const openVerificationDownload = async () => {
        try {
            const res = await api.get("/api/uploads/company/verification-document/download", {
                params: { companyId: company.id },
            });
            const url = res.data.data.url as string;
            window.open(url, "_blank", "noopener,noreferrer");
        } catch (error: any) {
            const message = error?.response?.data?.error?.message ?? "Không thể tải hồ sơ xác thực";
            toast.error(message);
        }
    };

    const handleUploadCover = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const MAX_COVER_SIZE = 8 * 1024 * 1024; // 8MB
        const ALLOWED_COVER_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

        // Client-side validation mirrors API rules for faster feedback
        if (!ALLOWED_COVER_TYPES.has(file.type)) {
            toast.error("Định dạng tệp không được hỗ trợ. Chỉ chấp nhận JPG, PNG, WEBP");
            e.target.value = "";
            return;
        }

        if (file.size > MAX_COVER_SIZE) {
            toast.error("Kích thước tệp vượt quá giới hạn 8MB");
            e.target.value = "";
            return;
        }

        setUploadingCover(true);
        try {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = async () => {
                try {
                    const base64 = (reader.result as string).split(',')[1];
                    await uploadCompanyCover({
                        companyId: company.id,
                        fileName: file.name,
                        fileType: file.type,
                        fileData: base64,
                    });
                    toast.success("Cập nhật ảnh bìa thành công");
                    router.refresh();
                } catch (error: any) {
                    console.error(error);
                    const message = error?.response?.data?.error?.message ?? "Tải ảnh bìa thất bại";
                    toast.error(message);
                } finally {
                    setUploadingCover(false);
                }
            };
        } catch (error: any) {
            console.error(error);
            const message = error?.response?.data?.error?.message ?? "Đã xảy ra lỗi khi xử lý ảnh";
            toast.error(message);
            setUploadingCover(false);
        }
    };

    const handleUploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingAvatar(true);
        try {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = async () => {
                try {
                    const base64 = (reader.result as string).split(',')[1];
                    await uploadCompanyLogo({
                        companyId: company.id,
                        fileName: file.name,
                        fileType: file.type,
                        fileData: base64,
                    });
                    toast.success("Cập nhật logo thành công");
                    router.refresh();
                } catch (error) {
                    console.error(error);
                    toast.error("Tải logo thất bại");
                } finally {
                    setUploadingAvatar(false);
                }
            };
        } catch (error) {
            console.error(error);
            toast.error("Đã xảy ra lỗi khi xử lý ảnh");
            setUploadingAvatar(false);
        }
    };

    // Check if legal name changed for verified company (show warning)
    const showReVerificationWarning = verificationStatus === "VERIFIED" && 
        formData.legalName.trim() !== originalLegalName.trim() &&
        formData.legalName.trim() !== "";

    return (
        <section className="relative mx-auto mb-14 max-w-7xl px-2 pt-6 sm:mb-20 sm:px-6 sm:pt-8 group/hero">
             <div className={`relative aspect-[16/8] sm:aspect-[16/7] md:aspect-[16/6] overflow-hidden rounded-[2rem] bg-slate-900 shadow-2xl md:rounded-[2.5rem] group ${company.coverUrl ? "cursor-zoom-in" : ""}`}>
                 {/* Background decoration or Cover Image */}
                 <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                     {company.coverUrl ? (
                         <>
                            <Image 
                                src={company.coverUrl} 
                                alt="Cover" 
                                fill 
                                className="object-cover"
                                priority
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 via-transparent to-transparent"></div>
                         </>
                     ) : (
                         <div className="w-full h-full relative opacity-20">
                             <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-600 rounded-full blur-[120px]"></div>
                             <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-600 rounded-full blur-[120px]"></div>
                         </div>
                     )}
                 </div>
                 
                 {/* Upload Loading Overlay for Cover */}
                 {uploadingCover && (
                    <div className="absolute inset-0 z-30 bg-black/50 flex items-center justify-center backdrop-blur-sm transition-all duration-300">
                        <div className="flex flex-col items-center gap-2">
                            <Loader2 className="w-10 h-10 text-white animate-spin" />
                            <span className="text-white font-medium text-sm">Đang tải ảnh lên...</span>
                        </div>
                    </div>
                 )}
                 
                 {company.coverUrl && !uploadingCover && (
                    <button
                        type="button"
                        className="absolute inset-0 z-10"
                        aria-label="Xem ảnh bìa"
                        onClick={() => setCoverPreviewOpen(true)}
                    />
                 )}

                 {isEditable && !uploadingCover && (
                    <div className="absolute top-6 right-6 z-20 opacity-0 group-hover/hero:opacity-100 transition-opacity">
                        <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            ref={coverInputRef}
                            onChange={handleUploadCover}
                        />
                        <div className="flex flex-col items-end gap-2">
                            <Button 
                                variant="secondary" 
                                size="sm" 
                                className="bg-[var(--card)]/90 hover:bg-[var(--card)] shadow-lg" 
                                onClick={() => coverInputRef.current?.click()}
                                disabled={uploadingCover}
                            >
                                {uploadingCover ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Camera className="w-4 h-4 mr-2" />}
                                Chỉnh sửa ảnh bìa
                            </Button>
                            <div className="bg-black/70 text-white text-xs px-2 py-1 rounded text-right backdrop-blur-sm">
                                Tỷ lệ đề xuất: 21:9 hoặc 16:9
                            </div>
                        </div>
                    </div>
                 )}
             </div>

             {/* Dialog: Xem ảnh bìa */}
             <Dialog open={coverPreviewOpen} onOpenChange={setCoverPreviewOpen}>
                <DialogContent className="max-w-6xl border-none bg-black/95 p-2 text-white [&>button]:text-[#fff] [&>button]:opacity-100 [&>button:hover]:bg-white/10 [&>button:hover]:text-[#fff] sm:p-3">
                    <DialogHeader>
                        <DialogTitle className="text-sm font-medium text-white/90">Ảnh bìa doanh nghiệp</DialogTitle>
                    </DialogHeader>
                    {company.coverUrl && (
                        <div className="overflow-hidden rounded-md">
                            <img
                                src={company.coverUrl}
                                alt={`Ảnh bìa của ${company.name}`}
                                className="max-h-[78vh] w-full object-contain"
                            />
                        </div>
                    )}
                </DialogContent>
             </Dialog>

             {/* Floating Profile Card */}
             <div className="relative z-10 -mt-12 mx-2 max-w-5xl sm:-mt-16 md:mx-auto md:-mt-24">
                <div className="relative flex flex-col items-start gap-5 rounded-3xl border border-[var(--border)] bg-[var(--card)] p-3 sm:gap-6 sm:p-5 md:flex-row md:gap-8 md:p-10 group/card">
                  
                  {isEditable && (
                      <div className="absolute top-4 right-4 z-20 opacity-0 group-hover/card:opacity-100 transition-opacity">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="hover:bg-[var(--muted)] rounded-full"
                            onClick={openBasicEditDialog}
                          >
                              <Pencil className="w-4 h-4 text-[var(--muted-foreground)]" />
                          </Button>
                      </div>
                  )}

                  <div className="relative mx-auto shrink-0 md:mx-0 group/avatar">
                      <div className="relative h-28 w-28 overflow-hidden rounded-full bg-[var(--muted)] p-1 sm:h-32 sm:w-32 md:h-40 md:w-40">
                        {company.logoUrl ? (
                            <Image src={company.logoUrl} alt={company.name} width={160} height={160} className="w-full h-full rounded-full bg-[var(--card)] object-contain border-4 border-[var(--card)]" />
                        ) : (
                            <div className="w-full h-full rounded-full bg-[var(--card)] border-4 border-[var(--card)] flex items-center justify-center text-4xl font-bold text-[var(--foreground)]">
                                {company.name.charAt(0)}
                            </div>
                        )}
                        
                        {isEditable && (
                            <>
                                <input 
                                    type="file" 
                                    accept="image/*" 
                                    className="hidden" 
                                    ref={avatarInputRef}
                                    onChange={handleUploadAvatar}
                                />
                                <div 
                                    className={`absolute inset-0 flex items-center justify-center bg-black/40 transition-opacity rounded-full cursor-pointer z-10 ${
                                        uploadingAvatar ? 'opacity-100' : 'opacity-0 group-hover/avatar:opacity-100'
                                    }`}
                                    onClick={() => !uploadingAvatar && avatarInputRef.current?.click()}
                                >
                                    {uploadingAvatar ? (
                                        <div className="flex flex-col items-center justify-center">
                                            <Loader2 className="w-8 h-8 text-white animate-spin" />
                                        </div>
                                    ) : (
                                        <Camera className="w-8 h-8 text-white" />
                                    )}
                                </div>
                                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-black/70 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover/avatar:opacity-100 transition-opacity pointer-events-none backdrop-blur-sm z-20">
                                    Tỷ lệ đề xuất: 1:1 (vuông)
                                </div>
                            </>
                        )}
                      </div>
                  </div>
                  
                  <div className="w-full flex-1 space-y-4 text-center md:text-left">
                      <div>
                        {company.legalName && (
                            <p className="mb-1 text-sm font-bold text-[var(--muted-foreground)] sm:text-xl">{company.legalName}</p>
                        )}
                        <h2 className="flex flex-wrap items-center justify-center gap-2 text-xl font-bold text-[var(--foreground)] sm:gap-3 sm:text-2xl md:text-3xl md:justify-start">
                          {company.name}
                          {verificationStatus === "VERIFIED" && (
                              <div className="relative group">
                                <ShieldCheck className="text-[var(--brand)]" size={32} fill="currentColor" fillOpacity={0.2} />
                                <span className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-[var(--foreground)] text-[var(--background)] text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                  Đã xác thực
                                </span>
                              </div>
                          )}
                        </h2>
                      </div>

                      {/* Verification Banner - Only show for non-verified companies in edit mode */}
                      {isEditable && verificationStatus !== "VERIFIED" && (
                          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-left text-sm text-amber-900">
                              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                                  <div>
                                      <p className="font-semibold flex items-center gap-2">
                                          <FileCheck className="w-4 h-4" />
                                          Xác thực doanh nghiệp: {verificationLabel}
                                      </p>
                                      <p className="text-xs text-amber-800 mt-1">
                                          Vui lòng tải giấy phép ĐKKD để xác thực doanh nghiệp của bạn.
                                      </p>
                                  </div>
                                  <Button
                                      variant="outline"
                                      size="sm"
                                      className="border-amber-300 text-amber-900 hover:bg-amber-100"
                                      onClick={() => setVerificationDialogOpen(true)}
                                  >
                                      Xác thực ngay
                                  </Button>
                              </div>
                          </div>
                      )}
                      
                      <div className="grid grid-cols-1 gap-2 text-sm font-medium text-[var(--muted-foreground)] md:grid-cols-2 md:gap-4">
                        {company.industry && (
                            <div className="relative flex items-start gap-3 rounded-xl bg-[var(--muted)] p-2.5 sm:p-3 group/item md:col-span-2">
                              <Briefcase className="mt-0.5 text-[var(--muted-foreground)] shrink-0" size={20} />
                              <span className="text-left leading-snug text-[var(--foreground)]">{company.industry}</span>
                            </div>
                        )}
                        {company.location && (
                            <div className="relative flex items-center gap-3 rounded-xl bg-[var(--muted)] p-2.5 sm:p-3 group/item">
                              <MapPin className="text-[var(--muted-foreground)] shrink-0" size={20} />
                              <span className="truncate">{company.location}</span>
                            </div>
                        )}
                        {company.website && (
                            <div className="relative flex items-center gap-3 rounded-xl bg-[var(--muted)] p-2.5 sm:p-3 group/item">
                              <Globe className="text-[var(--muted-foreground)] shrink-0" size={20} />
                              <a
                                href={company.website}
                                target="_blank"
                                rel="noreferrer"
                                className="truncate hover:text-[var(--brand)] hover:underline"
                              >
                                {company.website.replace(/^https?:\/\//, '')}
                              </a>
                            </div>
                        )}
                        {company.email && (
                            <div className="relative flex items-center gap-3 rounded-xl bg-[var(--muted)] p-2.5 sm:p-3 group/item">
                              <Mail className="text-[var(--muted-foreground)] shrink-0" size={20} />
                              <a
                                href={`mailto:${company.email}`}
                                className="truncate hover:text-[var(--brand)] hover:underline"
                              >
                                {company.email}
                              </a>
                            </div>
                        )}
                        {company.phone && (
                            <div className="relative flex items-center gap-3 rounded-xl bg-[var(--muted)] p-2.5 sm:p-3 group/item">
                              <Phone className="text-[var(--muted-foreground)] shrink-0" size={20} />
                              <span className="truncate">{company.phone}</span>
                            </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="mt-5 grid w-full grid-cols-2 gap-2 border-t border-[var(--border)] pt-4 md:mt-6 md:flex md:w-auto md:flex-wrap md:justify-start md:gap-4">
                        {isMounted ? (
                            <>
                                <CompanyFollowButton
                                    companyId={company.id}
                                    companySlug={company.slug}
                                    variant="default"
                                    size="lg"
                                    className="w-full justify-center whitespace-nowrap rounded-full border-0 bg-[var(--brand)] px-3 text-sm font-bold text-white shadow-lg shadow-[var(--brand)]/20 transition-all hover:scale-105 hover:bg-[var(--brand-hover)] active:scale-95 sm:px-6 sm:text-base md:w-auto"
                                />
                                <CompanyMessageButton 
                                    companyId={company.id} 
                                    companyName={company.name}
                                    variant="secondary"
                                    size="lg"
                                    className="w-full justify-center whitespace-nowrap rounded-full border-0 bg-[var(--muted)] px-3 text-sm font-bold text-[var(--foreground)] transition-all hover:scale-105 hover:bg-[var(--muted)]/80 active:scale-95 sm:px-6 sm:text-base md:w-auto"
                                >
                                    <MessageCircle className="mr-1.5 h-4 w-4 sm:mr-2 sm:h-5 sm:w-5" /> Nhắn tin / Liên hệ
                                </CompanyMessageButton>
                            </>
                        ) : (
                            <>
                                <div className="h-11 w-full rounded-full bg-[var(--muted)]/70" />
                                <div className="h-11 w-full rounded-full bg-[var(--muted)]/70" />
                            </>
                        )}
                     </div>
                  </div>
                </div>
             </div>

             {/* Dialog: Chỉnh sửa thông tin cơ bản */}
             <Dialog open={editDialogOpen} onOpenChange={(open) => { setEditDialogOpen(open); if (!open) setEmailError(null); }}>
                <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Chỉnh sửa thông tin cơ bản</DialogTitle>
                        <DialogDescription>Cập nhật thông tin hiển thị của doanh nghiệp</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Tên công ty (Thương hiệu) <span className="text-red-500">*</span></Label>
                            <Input 
                                value={formData.name} 
                                onChange={(e) => setFormData({...formData, name: e.target.value})} 
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Tên pháp lý đầy đủ</Label>
                            <Input 
                                value={formData.legalName} 
                                onChange={(e) => setFormData({...formData, legalName: e.target.value})} 
                                placeholder="VD: Công ty Cổ phần Công nghệ..."
                            />
                            {/* Warning when changing legal name on verified company */}
                            {showReVerificationWarning && (
                                <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs">
                                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-semibold">Lưu ý: Thay đổi tên pháp lý sẽ yêu cầu xác thực lại</p>
                                        <p className="mt-1">Doanh nghiệp của bạn đã được xác thực. Nếu thay đổi tên pháp lý, bạn sẽ cần tải lại hồ sơ ĐKKD để xác thực lại.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label>Lĩnh vực hoạt động</Label>
                            <IndustrySelect
                                value={formData.industry || null}
                                onChange={(v) =>
                                    setFormData({
                                        ...formData,
                                        industry: v ?? "",
                                    })
                                }
                                placeholder="Chọn lĩnh vực theo danh sách chuẩn"
                            />
                            <p className="text-xs text-[var(--muted-foreground)]">
                                Có thể để trống. Giá trị cũ không nằm trong danh sách vẫn hiển thị cho đến khi bạn đổi.
                            </p>
                        </div>
                        <div className="space-y-2">
                            <Label>Địa chỉ trụ sở</Label>
                            <Input 
                                value={formData.location} 
                                onChange={(e) => setFormData({...formData, location: e.target.value})} 
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Website</Label>
                            <Input 
                                value={formData.website} 
                                onChange={(e) => setFormData({...formData, website: e.target.value})} 
                                placeholder="VD: joywork.vn hoặc https://joywork.vn"
                                onBlur={() => {
                                    // Auto-prepend https:// for convenience, but keep input friendly (no scheme) if empty.
                                    const normalized = normalizeWebsite(formData.website);
                                    if (!normalized) return;
                                    // Store without scheme for better UX in input
                                    setFormData((prev) => ({
                                        ...prev,
                                        website: normalized.replace(/^https?:\/\//i, ""),
                                    }));
                                }}
                            />
                            <p className="text-xs text-[var(--muted-foreground)]">
                                Bạn có thể nhập mỗi domain, hệ thống sẽ tự thêm <span className="font-medium">https://</span>.
                            </p>
                        </div>
                        <div className="space-y-2">
                            <Label>Email công ty</Label>
                            <Input 
                                type="email"
                                value={formData.email} 
                                onChange={(e) => {
                                    setFormData({...formData, email: e.target.value});
                                    if (emailError) setEmailError(null);
                                }}
                                onBlur={() => {
                                    const v = formData.email?.trim();
                                    if (v && !isValidEmail(v)) setEmailError("Email không đúng định dạng (VD: contact@company.vn)");
                                    else setEmailError(null);
                                }}
                                placeholder="contact@company.vn"
                                className={emailError ? "border-red-500 focus-visible:ring-red-500" : ""}
                            />
                            {emailError && <p className="text-xs text-red-500">{emailError}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label>Số điện thoại</Label>
                            <Input 
                                value={formData.phone} 
                                onChange={(e) => setFormData({...formData, phone: e.target.value})} 
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Hủy</Button>
                        <Button onClick={handleSave} disabled={mutation.isPending}>
                            {mutation.isPending ? "Đang lưu..." : showReVerificationWarning ? "Lưu & Yêu cầu xác thực lại" : "Lưu thay đổi"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
             </Dialog>

             {/* Dialog: Xác thực doanh nghiệp */}
             <Dialog open={verificationDialogOpen} onOpenChange={setVerificationDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <FileCheck className="w-5 h-5 text-[var(--brand)]" />
                            Xác thực doanh nghiệp
                        </DialogTitle>
                        <DialogDescription>
                            Tải lên giấy phép ĐKKD để xác thực doanh nghiệp của bạn
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        {/* Current verification status */}
                        <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--muted)]">
                            <span className="text-sm font-medium">Trạng thái hiện tại:</span>
                            <span className={`text-sm font-semibold ${
                                verificationStatus === "VERIFIED" ? "text-green-600" :
                                verificationStatus === "PENDING" ? "text-amber-600" :
                                verificationStatus === "REJECTED" ? "text-red-600" :
                                "text-[var(--muted-foreground)]"
                            }`}>
                                {verificationLabel}
                            </span>
                        </div>

                        {/* Rejection reason if applicable */}
                        {verificationStatus === "REJECTED" && company.verificationRejectReason && (
                            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-900 text-sm">
                                <p className="font-semibold mb-1">Lý do từ chối:</p>
                                <p>{company.verificationRejectReason}</p>
                            </div>
                        )}

                        {/* Legal name input */}
                        <div className="space-y-2">
                            <Label>Tên pháp lý đầy đủ</Label>
                            <Input
                                value={verificationLegalName}
                                onChange={(e) => setVerificationLegalName(e.target.value)}
                                placeholder="Nhập tên pháp lý đầy đủ của doanh nghiệp"
                            />
                            {!verificationLegalName.trim() && (
                                <p className="text-xs text-amber-600">
                                    Vui lòng nhập tên pháp lý trước khi xác thực.
                                </p>
                            )}
                        </div>

                        {/* File upload */}
                        <div className="space-y-2">
                            <Label>Hồ sơ ĐKKD</Label>
                            <input
                                ref={verificationInputRef}
                                type="file"
                                accept=".pdf,.doc,.docx,image/jpeg,image/png,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                                onChange={(e) => setVerificationFile(e.target.files?.[0] ?? null)}
                                className="block w-full text-sm text-[var(--muted-foreground)] file:mr-4 file:rounded-md file:border-0 file:bg-[var(--muted)] file:px-4 file:py-2 file:text-sm file:font-medium file:text-[var(--foreground)] hover:file:bg-[var(--muted)]/80"
                            />
                            <p className="text-xs text-[var(--muted-foreground)]">
                                Hỗ trợ PDF/JPG/PNG/DOC/DOCX, tối đa 15MB.
                            </p>
                        </div>

                        {/* Previously uploaded file */}
                        {company.verificationFileUrl && (
                            <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--muted)]">
                                <span className="text-sm">Hồ sơ đã tải:</span>
                                <button
                                    type="button"
                                    onClick={openVerificationDownload}
                                    className="text-sm text-[var(--brand)] hover:underline"
                                >
                                    Xem/Tải xuống
                                </button>
                            </div>
                        )}

                        {/* Email notification info */}
                        <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-900 text-sm">
                            <p className="font-semibold mb-1 flex items-center gap-2">
                                <Mail className="w-4 h-4" />
                                Thông báo kết quả
                            </p>
                            <p>
                                Kết quả xác thực sẽ được gửi về email:{" "}
                                <span className="font-semibold">{ownerEmail || company.email || "N/A"}</span>
                            </p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setVerificationDialogOpen(false)}>Đóng</Button>
                        <Button 
                            onClick={handleUploadVerification} 
                            disabled={uploadingVerification || !verificationFile || !verificationLegalName.trim()}
                        >
                            {uploadingVerification ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Đang gửi...
                                </>
                            ) : (
                                "Gửi hồ sơ xác thực"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
             </Dialog>
        </section>
    );
}
