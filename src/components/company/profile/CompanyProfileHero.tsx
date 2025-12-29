"use client";

import { Company } from "@/types/company";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Globe, MapPin, Users, CheckCircle, MessageCircle, ShieldCheck, Mail, Phone, Pencil, Camera } from "lucide-react";
import CompanyMessageButton from "@/components/company/CompanyMessageButton";
import CompanyFollowButton from "@/components/company/CompanyFollowButton";
import { Badge } from "@/components/ui/badge";
import { useRef, useState } from "react";
import { uploadCompanyCover, uploadCompanyLogo } from "@/lib/uploads";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useMutation } from "@tanstack/react-query";
import api from "@/lib/api";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function CompanyProfileHero({ company, isEditable = false }: { company: Company, isEditable?: boolean }) {
    const router = useRouter();
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [uploadingCover, setUploadingCover] = useState(false);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    
    const coverInputRef = useRef<HTMLInputElement>(null);
    const avatarInputRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState({
        name: company.name,
        legalName: company.legalName || "",
        location: company.location || "",
        website: company.website || "",
        email: company.email || "",
        phone: company.phone || "",
    });

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
        // Chỉ validate trường "name" là required
        if (!formData.name || formData.name.trim() === "") {
            toast.error("Vui lòng nhập tên công ty (Thương hiệu)");
            return;
        }
        
        // Clean data: chuyển empty strings thành null cho các trường optional
        const payload: any = {
            name: formData.name.trim(),
        };
        
        // Gửi tất cả các trường, chuyển empty string thành null
        payload.legalName = formData.legalName?.trim() || null;
        payload.location = formData.location?.trim() || null;
        payload.website = formData.website?.trim() || null;
        payload.email = formData.email?.trim() || null;
        payload.phone = formData.phone?.trim() || null;
        
        mutation.mutate(payload);
    };

    const handleUploadCover = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

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
                } catch (error) {
                    console.error(error);
                    toast.error("Tải ảnh bìa thất bại");
                } finally {
                    setUploadingCover(false);
                }
            };
        } catch (error) {
            console.error(error);
            toast.error("Đã xảy ra lỗi khi xử lý ảnh");
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

    return (
        <section className="relative max-w-7xl mx-auto px-4 sm:px-6 mb-20 pt-8 group/hero">
             <div className="rounded-[2.5rem] overflow-hidden shadow-2xl relative h-[350px] md:h-[450px] group bg-slate-900">
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
                 
                 {isEditable && !uploadingCover && (
                    <div className="absolute top-6 right-6 z-20 opacity-0 group-hover/hero:opacity-100 transition-opacity">
                        <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            ref={coverInputRef}
                            onChange={handleUploadCover}
                        />
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
                    </div>
                 )}
             </div>

             {/* Floating Profile Card */}
             <div className="relative -mt-24 mx-4 md:mx-auto max-w-5xl z-10">
                <div className="bg-[var(--card)] rounded-3xl p-8 md:p-10 shadow-xl flex flex-col md:flex-row items-start gap-8 border border-[var(--border)] relative group/card">
                  
                  {isEditable && (
                      <div className="absolute top-4 right-4 z-20 opacity-0 group-hover/card:opacity-100 transition-opacity">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="hover:bg-[var(--muted)] rounded-full"
                            onClick={() => setEditDialogOpen(true)}
                          >
                              <Pencil className="w-4 h-4 text-[var(--muted-foreground)]" />
                          </Button>
                      </div>
                  )}

                  <div className="relative shrink-0 mx-auto md:mx-0 group/avatar">
                      <div className="w-32 h-32 md:w-40 md:h-40 rounded-full p-1 bg-[var(--muted)] relative overflow-hidden">
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
                            </>
                        )}
                      </div>
                  </div>
                  
                  <div className="text-center md:text-left flex-1 w-full space-y-4">
                      <div>
                        {company.legalName && (
                            <p className="text-xl text-[var(--muted-foreground)] font-bold mb-1">{company.legalName}</p>
                        )}
                        <h2 className="text-3xl font-bold text-[var(--foreground)] flex flex-wrap items-center justify-center md:justify-start gap-3">
                          {company.name}
                          {company.isVerified && (
                              <div className="relative group">
                                <ShieldCheck className="text-[var(--brand)]" size={32} fill="currentColor" fillOpacity={0.2} />
                                <span className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-[var(--foreground)] text-[var(--background)] text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                  Đã xác thực
                                </span>
                              </div>
                          )}
                        </h2>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[var(--muted-foreground)] text-sm font-medium">
                        {company.location && (
                            <div className="flex items-center gap-3 bg-[var(--muted)] p-3 rounded-xl group/item relative">
                              <MapPin className="text-[var(--muted-foreground)] shrink-0" size={20} />
                              <span className="truncate">{company.location}</span>
                            </div>
                        )}
                        {company.website && (
                            <div className="flex items-center gap-3 bg-[var(--muted)] p-3 rounded-xl group/item relative">
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
                            <div className="flex items-center gap-3 bg-[var(--muted)] p-3 rounded-xl group/item relative">
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
                            <div className="flex items-center gap-3 bg-[var(--muted)] p-3 rounded-xl group/item relative">
                              <Phone className="text-[var(--muted-foreground)] shrink-0" size={20} />
                              <span className="truncate">{company.phone}</span>
                            </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-6 pt-4 border-t border-[var(--border)]">
                        <CompanyFollowButton
                            companyId={company.id}
                            companySlug={company.slug}
                            variant="default"
                            size="lg"
                            className="bg-[var(--brand)] hover:bg-[var(--brand-hover)] text-white rounded-full px-6 shadow-lg shadow-[var(--brand)]/20 font-bold transition-all hover:scale-105 active:scale-95 border-0"
                        />
                        <CompanyMessageButton 
                            companyId={company.id} 
                            companyName={company.name}
                            variant="secondary"
                            size="lg"
                            className="rounded-full px-6 font-bold bg-[var(--muted)] text-[var(--foreground)] hover:bg-[var(--muted)]/80 transition-all hover:scale-105 active:scale-95 border-0"
                        >
                            <MessageCircle className="w-5 h-5 mr-2" /> Nhắn tin / Liên hệ
                        </CompanyMessageButton>
                     </div>
                  </div>
                </div>
             </div>

             <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Chỉnh sửa thông tin cơ bản</DialogTitle>
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
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Email công ty</Label>
                            <Input 
                                type="email"
                                value={formData.email} 
                                onChange={(e) => setFormData({...formData, email: e.target.value})} 
                            />
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
                            {mutation.isPending ? "Đang lưu..." : "Lưu thay đổi"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
             </Dialog>
        </section>
    );
}

