"use client";

import { Company } from "@/types/company";
import { cn } from "@/lib/utils";
import { useState, useCallback, useEffect } from "react";
import { 
  Pencil, Save, X, Plus, Trash,
  Building2, Users, TrendingUp, Heart, Globe, Phone, Mail, 
  Target, Award, Zap, GraduationCap, MapPin, 
  Calendar, DollarSign, Star, CheckCircle, ArrowRight,
  Clock, Coffee, Layout, ChevronRight, ChevronLeft, Gem, Rocket, ShieldCheck,
  Loader2, ImagePlus
} from "lucide-react";
import useEmblaCarousel from 'embla-carousel-react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useMutation } from "@tanstack/react-query";
import api from "@/lib/api";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import React from "react";
import { uploadCompanyPostImage } from "@/lib/uploads";

// Icon Mapping
const iconMap: any = {
  TrendingUp, Users, Heart, Zap, DollarSign, Target, Globe, Gem, Star, ShieldCheck, 
  Coffee, Layout, Rocket, GraduationCap, Building2, MapPin, Calendar, CheckCircle, ArrowRight, Clock, ChevronRight
};

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data URL prefix (e.g. "data:image/jpeg;base64,") to get raw base64
      const base64 = result.split(',')[1];
      resolve(base64 || result);
    };
    reader.onerror = (error) => reject(error);
  });
};

const ImageUpload = ({ value, onChange, companyId }: { value: string, onChange: (url: string) => void, companyId: string }) => {
    const [uploading, setUploading] = useState(false);
    const inputRef = React.useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setUploading(true);
            const base64 = await fileToBase64(file);
            const { assetUrl } = await uploadCompanyPostImage({
                companyId,
                fileName: file.name,
                fileType: file.type,
                fileData: base64,
            });
            onChange(assetUrl);
            toast.success("Tải ảnh thành công");
        } catch (error) {
            console.error(error);
            toast.error("Tải ảnh thất bại");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="flex gap-4 items-center">
            {value && (
                <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-slate-200 shrink-0 group/img bg-slate-100">
                    <img src={value} alt="Preview" className="w-full h-full object-cover" />
                    <button 
                        type="button"
                        onClick={() => onChange("")}
                        className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity text-white"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}
            <div className="grow">
                <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    ref={inputRef}
                    onChange={handleFileChange}
                />
                <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    className="w-full border-dashed text-slate-500 hover:text-slate-900"
                    onClick={() => inputRef.current?.click()}
                    disabled={uploading}
                >
                    {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ImagePlus className="w-4 h-4 mr-2" />}
                    {uploading ? "Đang tải..." : (value ? "Thay đổi ảnh" : "Tải ảnh lên")}
                </Button>
            </div>
        </div>
    )
}

interface Props {
  company: Company;
  isEditable?: boolean;
}

const SectionTitle = ({ title, subtitle, align = 'center' }: { title: string, subtitle?: string, align?: 'left' | 'center' }) => (
  <div className={`mb-16 ${align === 'center' ? 'text-center' : 'text-left'}`}>
    <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 uppercase tracking-tight mb-3">
      {title}
    </h2>
    {subtitle && <p className="text-slate-600 text-lg max-w-3xl mx-auto leading-relaxed">{subtitle}</p>}
    <div className={`h-1.5 w-24 bg-blue-600 rounded-full mt-4 ${align === 'center' ? 'mx-auto' : ''}`}></div>
  </div>
);

const Badge = ({ children }: { children?: React.ReactNode }) => {
  return (
    <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-sm font-bold border bg-slate-100 text-slate-700 border-slate-200 mb-4`}>
      {children}
    </span>
  );
};

const SectionCarousel = ({ children, className, itemClassName = "flex-[0_0_auto]" }: { children: React.ReactNode, className?: string, itemClassName?: string }) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    loop: false, 
    align: 'start',
    dragFree: true,
    containScroll: 'trimSnaps'
  });

  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi]);

  const onSelect = useCallback((api: any) => {
    setCanScrollPrev(api.canScrollPrev());
    setCanScrollNext(api.canScrollNext());
  }, []);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect(emblaApi);
    emblaApi.on('reInit', onSelect);
    emblaApi.on('select', onSelect);
  }, [emblaApi, onSelect]);

  return (
    <div className={cn("relative group/slider", className)}>
        {canScrollPrev && (
        <button 
            onClick={scrollPrev} 
            className="absolute left-2 md:-left-4 top-1/2 -translate-y-1/2 z-10 w-8 h-8 md:w-10 md:h-10 bg-white/90 backdrop-blur rounded-full shadow-lg border border-slate-100 flex items-center justify-center text-slate-600 hover:text-blue-600 hover:border-blue-200 transition-all opacity-0 group-hover/slider:opacity-100"
        >
            <ChevronLeft className="w-5 h-5" />
        </button>
        )}
        {canScrollNext && (
        <button 
            onClick={scrollNext} 
            className="absolute right-2 md:-right-4 top-1/2 -translate-y-1/2 z-10 w-8 h-8 md:w-10 md:h-10 bg-white/90 backdrop-blur rounded-full shadow-lg border border-slate-100 flex items-center justify-center text-slate-600 hover:text-blue-600 hover:border-blue-200 transition-all opacity-0 group-hover/slider:opacity-100"
        >
            <ChevronRight className="w-5 h-5" />
        </button>
        )}

        <div className="overflow-hidden cursor-grab active:cursor-grabbing py-4 -mx-4 px-4 md:mx-0 md:px-0" ref={emblaRef}>
            <div className="flex gap-4 md:gap-6 touch-pan-y">
                {React.Children.map(children, (child) => (
                    <div className={itemClassName}>{child}</div>
                ))}
            </div>
        </div>
    </div>
  )
}

export default function CompanyProfileContent({ company, isEditable = false }: Props) {
  const { profile } = company;
  const router = useRouter();
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>({});

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.patch(`/api/companies/${company.id}/profile`, data);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Cập nhật thành công");
      setEditingSection(null);
      router.refresh();
    },
    onError: (err) => {
      toast.error("Cập nhật thất bại");
      console.error(err);
    }
  });

  const handleEdit = (section: string, initialData: any) => {
    setEditingSection(section);
    setFormData(initialData || {});
  };

  const handleSave = () => {
    const payload: any = {};
    const validSections = [
        'stats', 'vision', 'mission', 'coreValues', 'leadershipPhilosophy', 'products', 
        'recruitmentPrinciples', 'benefits', 'hrJourney', 'careerPath', 
        'salaryAndBonus', 'training', 'leaders', 'awards'
    ];
    
    if (validSections.includes(editingSection || '')) {
        payload[editingSection!] = formData[editingSection!];
    }

    // Handle split sections
    if (editingSection === 'culture-typical-day') {
        payload.culture = { ...(profile?.culture as any), typicalDay: formData.culture?.typicalDay };
    }
    if (editingSection === 'culture-testimonials') {
        payload.culture = { ...(profile?.culture as any), testimonials: formData.culture?.testimonials };
    }
    if (editingSection === 'story-founder') {
        payload.story = { ...(profile?.story as any), founderStory: formData.story?.founderStory };
    }
    if (editingSection === 'story-milestones') {
        payload.story = { ...(profile?.story as any), milestones: formData.story?.milestones };
    }

    mutation.mutate(payload);
  };

  // Helper render Edit Button (Currently mainly for Stats/VMV)
  const EditBtn = ({ section, initialData }: { section: string, initialData?: any }) => {
    if (!isEditable) return null;
    return (
      <Button
        size="icon"
        variant="secondary"
        className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity z-20 bg-white/80 backdrop-blur shadow-sm hover:bg-white"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleEdit(section, initialData);
        }}
      >
        <Pencil className="w-4 h-4 text-slate-600" />
      </Button>
    );
  };

  // Default Fallbacks from Seed Data if empty (just in case)
  const stats = profile?.stats as any[] || [];
  const products = profile?.products as any[] || [];
  const recruitmentPrinciples = profile?.recruitmentPrinciples as any[] || [];
  const benefits = profile?.benefits as any || { financial: [], nonFinancial: [] };
  const hrJourney = profile?.hrJourney as any[] || [];
  const careerPath = profile?.careerPath as any[] || [];
  const salaryAndBonus = profile?.salaryAndBonus as any || { salary: [], bonus: [] };
  const training = profile?.training as any || { programs: [] };
  const leaders = profile?.leaders as any[] || [];
  const culture = profile?.culture as any || { typicalDay: [], testimonials: [] };
  const awards = profile?.awards as any[] || [];
  const story = profile?.story as any || { founderStory: {}, milestones: [] };

  return (
     <div className="space-y-32 py-12">
        {/* SECTION 2: STATS */}
        <section className="max-w-7xl mx-auto px-6 animate-fade-in-up relative group/section">
           {isEditable && (
             <div className="absolute top-0 right-6 opacity-0 group-hover/section:opacity-100 transition-opacity z-30">
                <Button onClick={() => handleEdit('stats', { stats })} variant="outline" size="sm" className="bg-white">
                    <Pencil className="w-3 h-3 mr-2" /> Chỉnh sửa số liệu
                </Button>
             </div>
           )}
           <SectionTitle title="NHỮNG CON SỐ BIẾT NÓI" subtitle={`Thành tựu ấn tượng khẳng định vị thế dẫn đầu sau ${new Date().getFullYear() - (company.foundedYear || 2015)} năm phát triển`} />
           
           <SectionCarousel>
              {stats.map((stat: any, idx: number) => {
                 const Icon = iconMap[stat.icon] || TrendingUp;
                 return (
                    <div key={idx} className="bg-white rounded-3xl p-6 shadow-lg border border-slate-100 hover:-translate-y-2 transition-transform duration-300 relative overflow-hidden group min-w-[200px] w-[200px] flex flex-col justify-center items-center text-center select-none">
                      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Icon size={64} className="text-slate-900" />
                      </div>
                      <div className="text-3xl md:text-4xl font-black text-blue-600 mb-2 relative z-10">{stat.value}</div>
                      <div className="text-sm font-bold text-slate-500 uppercase tracking-wider relative z-10">{stat.label}</div>
                    </div>
                 );
              })}
           </SectionCarousel>
        </section>

        {/* SECTION 3: VISION - MISSION - VALUES */}
        <section className="max-w-7xl mx-auto px-6">
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Vision */}
              <div className="bg-white rounded-3xl p-10 shadow-2xl border border-slate-200 relative overflow-hidden border-t-4 border-blue-600 group">
                 <EditBtn section="vision" initialData={{ vision: profile?.vision || "" }} />
                 <Target className="w-16 h-16 mb-6 text-blue-600" />
                 <h3 className="text-3xl font-bold mb-4 text-slate-900">Tầm Nhìn</h3>
                 <p className="text-slate-600 leading-relaxed text-lg whitespace-pre-line">
                    {profile?.vision || "Chưa cập nhật"}
                 </p>
              </div>

              {/* Mission */}
              <div className="bg-white rounded-3xl p-10 shadow-2xl border border-slate-200 relative overflow-hidden border-t-4 border-blue-600 group">
                 <EditBtn section="mission" initialData={{ mission: profile?.mission || "" }} />
                 <Globe className="w-16 h-16 mb-6 text-blue-600" />
                 <h3 className="text-3xl font-bold mb-4 text-slate-900">Sứ Mệnh</h3>
                 <p className="text-slate-600 leading-relaxed text-lg whitespace-pre-line">
                    {profile?.mission || "Chưa cập nhật"}
                 </p>
              </div>

              {/* Core Values */}
              <div className="bg-white rounded-3xl p-10 shadow-2xl border border-slate-200 relative overflow-hidden border-t-4 border-blue-600 group">
                 <EditBtn section="coreValues" initialData={{ coreValues: profile?.coreValues || "" }} />
                 <Gem className="w-16 h-16 mb-6 text-blue-600" />
                 <h3 className="text-3xl font-bold mb-6 text-slate-900">Giá Trị Cốt Lõi</h3>
                 <div className="space-y-4">
                    {/* Parse core values string to list if possible, else display text */}
                    {profile?.coreValues?.split('\n').map((val: string, i: number) => (
                        <div key={i} className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-900 font-bold shrink-0 mt-1">
                            {i+1}
                          </div>
                          <div className="text-slate-700 font-medium leading-relaxed">{val}</div>
                        </div>
                    )) || <p className="text-slate-500">Chưa cập nhật</p>}
                 </div>
              </div>
           </div>
        </section>

        {/* SECTION 4: PHILOSOPHY (Leadership & Management) (MANDATORY) */}
        <section className="max-w-7xl mx-auto px-6 relative group/philosophy">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                {/* Left: Media & Quote */}
                <div className="relative group/leadership">
                    {isEditable && (
                        <div className="absolute top-4 right-4 z-30 opacity-0 group-hover/leadership:opacity-100 transition-opacity">
                             <Button onClick={() => handleEdit('leadershipPhilosophy', { leadershipPhilosophy: profile?.leadershipPhilosophy || {} })} variant="secondary" size="sm" className="bg-white/90 hover:bg-white shadow-sm border">
                                <Pencil className="w-3 h-3 mr-2" /> Chỉnh sửa Lãnh đạo
                            </Button>
                        </div>
                    )}
                    <div className="absolute -inset-4 bg-slate-200 opacity-50 blur-xl rounded-[3rem]"></div>
                    
                    <div className="relative rounded-[2rem] shadow-2xl w-full overflow-hidden z-10 bg-slate-900 aspect-video">
                        {profile?.leadershipPhilosophy?.mediaType === 'video' ? (
                            <video 
                                className="w-full h-full object-cover"
                                controls
                                playsInline
                                poster={profile?.leadershipPhilosophy?.media || "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&q=80&w=1000"}
                            >
                                <source src={profile?.leadershipPhilosophy?.media || "https://videos.pexels.com/video-files/3252757/3252757-hd_1920_1080_25fps.mp4"} type="video/mp4" />
                                Your browser does not support the video tag.
                            </video>
                        ) : (
                            <img 
                                src={profile?.leadershipPhilosophy?.media || "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&q=80&w=1000"} 
                                alt="Leadership Philosophy" 
                                className="w-full h-full object-cover"
                            />
                        )}
                    </div>
                    
                    <div className="absolute -bottom-10 -right-10 z-20 bg-white p-6 rounded-2xl shadow-xl border-l-8 border-slate-800 hidden md:block max-w-sm pointer-events-none">
                        <p className="text-xl font-serif italic text-slate-800">"{profile?.leadershipPhilosophy?.quote || "Lãnh đạo không phải là chức danh, mà là trách nhiệm phụng sự."}"</p>
                    </div>
                </div>

                {/* Right: Management Stats (tạm thời chỉ mô tả, chưa cho chỉnh sửa/lưu số liệu) */}
                <div className="relative">
                      <Badge>TRIẾT LÝ QUẢN TRỊ</Badge>
                      <h2 className="text-4xl font-extrabold text-slate-900 mt-4 mb-6 leading-tight">Cam Kết Được <br/><span className="text-blue-600">Xác Thực Bởi Số Liệu</span></h2>
                      <p className="text-slate-600 text-lg mb-10">Chúng tôi xây dựng niềm tin dựa trên sự minh bạch. Mọi cam kết với nhân viên đều được đo lường và công bố định kỳ.</p>
                      
                      <div className="space-y-8">
                        <div className="text-slate-400 italic">
                          Đang cập nhật số liệu... (phần này sẽ được triển khai sau dưới dạng tính năng xác thực bởi nhân viên)
                        </div>
                      </div>
                </div>
            </div>
        </section>

        {/* SECTION 5: PRODUCTS (MANDATORY) */}
        <section className="bg-slate-900 py-20 overflow-hidden relative rounded-[3rem] mx-6 group/products">
            {isEditable && (
                <div className="absolute top-6 right-6 z-30 opacity-0 group-hover/products:opacity-100 transition-opacity">
                    <Button onClick={() => handleEdit('products', { products })} variant="secondary" size="sm" className="bg-white/90 hover:bg-white text-slate-900 font-medium shadow-lg">
                        <Pencil className="w-3 h-3 mr-2" /> Chỉnh sửa sản phẩm
                    </Button>
                </div>
            )}
            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="text-center mb-12">
                  <h3 className="text-3xl font-bold text-white mb-2">HỆ SINH THÁI CÔNG NGHỆ</h3>
                  <p className="text-slate-400">Các sản phẩm cốt lõi phục vụ hàng triệu người dùng</p>
                </div>
                
                {products.length > 0 ? (
                    <SectionCarousel>
                      {products.map((prod: any, i: number) => (
                          <div key={i} className="group flex flex-col items-center gap-3 p-4 md:p-6 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl hover:bg-white/10 transition-all cursor-pointer w-32 md:w-40 min-w-[140px] md:min-w-[180px]">
                            <div className="w-14 h-14 rounded-xl bg-slate-800 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                <Zap className="text-blue-400" size={28} />
                            </div>
                            <span className="text-white font-semibold tracking-wide text-sm text-center">{prod.name}</span>
                          </div>
                      ))}
                    </SectionCarousel>
                ) : (
                    <div className="text-slate-500 italic text-center border border-dashed border-slate-700 p-8 rounded-xl">
                        {isEditable ? "Chưa có sản phẩm nào. Bấm nút chỉnh sửa để thêm." : "Nội dung đang được cập nhật..."}
                    </div>
                )}
            </div>
        </section>

        {/* SECTION 6: RECRUITMENT PRINCIPLES */}
        {(recruitmentPrinciples.length > 0 || isEditable) && (
            <section className="max-w-7xl mx-auto px-6 relative group/recruit">
                {isEditable && (
                    <div className="absolute top-0 right-6 opacity-0 group-hover/recruit:opacity-100 transition-opacity z-20">
                         <Button onClick={() => handleEdit('recruitmentPrinciples', { recruitmentPrinciples })} variant="outline" size="sm" className="bg-white shadow-sm">
                            <Pencil className="w-3 h-3 mr-2" /> Chỉnh sửa nguyên tắc
                        </Button>
                    </div>
                )}
                <SectionTitle title="NGUYÊN TẮC TUYỂN DỤNG" subtitle="Chúng tôi tìm kiếm những người bạn đồng hành, không chỉ là nhân viên" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {recruitmentPrinciples.map((rule: any, i: number) => {
                    const Icon = iconMap[rule.icon] || Star;
                    return (
                        <div key={i} className="flex gap-6 p-8 bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-lg transition-shadow group">
                            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-slate-900 transition-colors">
                              <Icon className="text-slate-700 group-hover:text-white transition-colors" size={32} />
                            </div>
                            <div>
                              <h4 className="text-xl font-bold text-slate-900 mb-3">{rule.title}</h4>
                              <p className="text-slate-600 leading-relaxed">{rule.desc}</p>
                            </div>
                        </div>
                    );
                  })}
                  {recruitmentPrinciples.length === 0 && isEditable && (
                      <div className="col-span-full text-center text-slate-500 italic border border-dashed p-8 rounded-xl">
                          Chưa có nguyên tắc nào.
                      </div>
                  )}
                </div>
            </section>
        )}

        {/* SECTION 7: BENEFITS */}
        <section className="max-w-7xl mx-auto px-6 relative group/benefits">
            {isEditable && (
                <div className="absolute top-0 right-6 opacity-0 group-hover/benefits:opacity-100 transition-opacity z-20">
                        <Button onClick={() => handleEdit('benefits', { benefits })} variant="outline" size="sm" className="bg-white shadow-sm">
                        <Pencil className="w-3 h-3 mr-2" /> Chỉnh sửa phúc lợi
                    </Button>
                </div>
            )}
            <SectionTitle title="PHÚC LỢI TOÀN DIỆN" subtitle="Chăm sóc tốt nhất để bạn an tâm cống hiến" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {/* Financial */}
                <div className="bg-slate-50 rounded-[2rem] p-10 shadow-sm border border-slate-200">
                  <div className="flex items-center gap-4 mb-8">
                      <div className="p-4 bg-slate-900 text-white rounded-2xl shadow-lg">
                        <DollarSign size={32} />
                      </div>
                      <h3 className="text-2xl font-bold text-slate-900">Tài Chính Vững Chắc</h3>
                  </div>
                  <ul className="space-y-4">
                      {benefits.financial?.length > 0 ? (
                          benefits.financial.map((item: string, i: number) => (
                            <li key={i} className="flex items-start gap-3 text-slate-700 font-medium">
                                <CheckCircle className="text-blue-600 mt-1 shrink-0" size={20} />
                                <span>{item}</span>
                            </li>
                          ))
                      ) : (
                          <li className="text-slate-400 italic">Đang cập nhật...</li>
                      )}
                  </ul>
                </div>

                {/* Non-Financial */}
                <div className="bg-slate-50 rounded-[2rem] p-10 shadow-sm border border-slate-200">
                  <div className="flex items-center gap-4 mb-8">
                      <div className="p-4 bg-slate-200 text-slate-800 rounded-2xl shadow-lg">
                        <Heart size={32} />
                      </div>
                      <h3 className="text-2xl font-bold text-slate-900">Tinh Thần Hạnh Phúc</h3>
                  </div>
                  <ul className="space-y-4">
                      {benefits.nonFinancial?.length > 0 ? (
                          benefits.nonFinancial.map((item: string, i: number) => (
                            <li key={i} className="flex items-start gap-3 text-slate-700 font-medium">
                                <CheckCircle className="text-blue-600 mt-1 shrink-0" size={20} />
                                <span>{item}</span>
                            </li>
                          ))
                      ) : (
                          <li className="text-slate-400 italic">Đang cập nhật...</li>
                      )}
                  </ul>
                </div>
            </div>
        </section>

        {/* SECTION 8: HR JOURNEY */}
        <section className="bg-white py-10 rounded-[3rem] mx-6 shadow-sm border border-slate-100 relative group/hr">
            {isEditable && (
                <div className="absolute top-6 right-6 opacity-0 group-hover/hr:opacity-100 transition-opacity z-20">
                     <Button onClick={() => handleEdit('hrJourney', { hrJourney })} variant="secondary" size="sm" className="bg-white shadow-sm border">
                        <Pencil className="w-3 h-3 mr-2" /> Chỉnh sửa hành trình
                    </Button>
                </div>
            )}
            <div className="max-w-7xl mx-auto px-6">
                <SectionTitle title="HÀNH TRÌNH NHÂN SỰ" />
                <div className="relative">
                  {/* Line */}
                  <div className="hidden md:block absolute top-1/2 left-0 w-full h-1 bg-slate-100 -translate-y-1/2 rounded-full"></div>
                  
                  <div className="relative z-10">
                      <SectionCarousel>
                          {hrJourney.map((item: any, i: number) => (
                            <div key={i} className="bg-white p-8 rounded-3xl shadow-xl border border-slate-50 flex flex-col items-center text-center group hover:-translate-y-2 transition-transform w-[85vw] md:w-[350px] shrink-0">
                              <div className={`w-16 h-16 rounded-2xl ${item.color || 'bg-slate-800'} text-white flex items-center justify-center font-black text-2xl mb-6 shadow-lg rotate-3 group-hover:rotate-0 transition-transform`}>
                                  {item.step}
                              </div>
                              <h4 className="text-xl font-bold text-slate-900 mb-3">{item.title}</h4>
                              <p className="text-slate-500">{item.desc}</p>
                            </div>
                          ))}
                      </SectionCarousel>
                  </div>
                </div>
            </div>
        </section>

        {/* SECTION 15: CAREER PATH */}
        {(careerPath.length > 0 || isEditable) && (
            <section className="max-w-7xl mx-auto px-6 relative group/career">
                {isEditable && (
                    <div className="absolute top-6 right-6 opacity-0 group-hover/career:opacity-100 transition-opacity z-20">
                         <Button onClick={() => handleEdit('careerPath', { careerPath })} variant="secondary" size="sm" className="bg-white/90 hover:bg-white shadow-sm border">
                            <Pencil className="w-3 h-3 mr-2" /> Chỉnh sửa lộ trình
                        </Button>
                    </div>
                )}
                {careerPath.length > 0 ? (
                    <div className="bg-slate-900 text-white rounded-[3rem] p-10 md:p-16 text-center">
                        <h3 className="text-3xl font-bold mb-12">LỘ TRÌNH THĂNG TIẾN KHÔNG GIỚI HẠN</h3>
                        <div className="flex flex-col md:flex-row justify-center items-center gap-2 md:gap-0">
                          {careerPath.map((level: string, i: number) => (
                              <React.Fragment key={i}>
                                <div className="flex flex-col items-center group">
                                    <div className="w-24 h-24 rounded-full border-4 border-slate-700 bg-slate-800 flex items-center justify-center text-sm font-bold group-hover:border-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-all duration-300 shadow-xl z-10 p-2 text-center break-words">
                                      {level}
                                    </div>
                                    <div className="mt-4 text-slate-400 text-sm font-medium">Level {i+1}</div>
                                </div>
                                {i < careerPath.length - 1 && (
                                    <div className="h-8 w-1 md:w-16 md:h-1 bg-slate-700 mx-2"></div>
                                )}
                              </React.Fragment>
                          ))}
                        </div>
                    </div>
                ) : (
                    <div className="text-center text-slate-500 italic border border-dashed p-8 rounded-xl bg-slate-50">
                        Chưa có lộ trình thăng tiến.
                    </div>
                )}
            </section>
        )}

        {/* SECTION 16: SALARY MECHANISM */}
        <section className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-8 relative group/salary">
            {isEditable && (
                <div className="absolute top-0 right-6 opacity-0 group-hover/salary:opacity-100 transition-opacity z-20">
                     <Button onClick={() => handleEdit('salaryAndBonus', { salaryAndBonus })} variant="outline" size="sm" className="bg-white shadow-sm border">
                        <Pencil className="w-3 h-3 mr-2" /> Chỉnh sửa lương thưởng
                    </Button>
                </div>
            )}
            <div className="bg-white p-8 rounded-3xl shadow-lg border-l-8 border-slate-800">
                <h3 className="text-2xl font-bold mb-4 flex items-center gap-3">
                    <div className="p-2 bg-slate-50 rounded-lg"><Layout className="text-slate-800" size={24} /></div>
                    Cơ Chế Lương
                </h3>
                <p className="text-slate-600 mb-4 font-medium">Chi trả xứng đáng dựa trên năng lực (Performance-based), bao gồm:</p>
                <div className="grid grid-cols-2 gap-4">
                    {salaryAndBonus.salary?.length > 0 ? (
                        salaryAndBonus.salary.map((item: string, i: number) => (
                          <div key={i} className="flex items-center gap-2 text-sm text-slate-700"><div className="w-2 h-2 bg-slate-800 rounded-full"></div>{item}</div>
                        ))
                    ) : (
                        <div className="col-span-2 text-sm text-slate-400 italic">Đang cập nhật...</div>
                    )}
                </div>
            </div>
            <div className="bg-white p-8 rounded-3xl shadow-lg border-l-8 border-blue-600">
                <h3 className="text-2xl font-bold mb-4 flex items-center gap-3">
                    <div className="p-2 bg-blue-50 rounded-lg"><Rocket className="text-blue-600" size={24} /></div>
                    Hệ Thống Thưởng
                </h3>
                <p className="text-slate-600 mb-4 font-medium">Không giới hạn mức trần (Uncapped Bonus):</p>
                <div className="grid grid-cols-2 gap-4">
                    {salaryAndBonus.bonus?.length > 0 ? (
                        salaryAndBonus.bonus.map((item: string, i: number) => (
                          <div key={i} className="flex items-center gap-2 text-sm text-slate-700"><div className="w-2 h-2 bg-blue-600 rounded-full"></div>{item}</div>
                        ))
                    ) : (
                        <div className="col-span-2 text-sm text-slate-400 italic">Đang cập nhật...</div>
                    )}
                </div>
            </div>
        </section>

        {/* SECTION 9 & 12: TRAINING */}
        <section className="max-w-7xl mx-auto px-6 space-y-12 relative group/training">
            {isEditable && (
                <div className="absolute top-6 right-6 opacity-0 group-hover/training:opacity-100 transition-opacity z-20">
                     <Button onClick={() => handleEdit('training', { training })} variant="secondary" size="sm" className="bg-white/10 hover:bg-white/20 text-white backdrop-blur shadow-sm border border-white/20">
                        <Pencil className="w-3 h-3 mr-2" /> Chỉnh sửa đào tạo
                    </Button>
                </div>
            )}
            <div className="bg-slate-900 rounded-[3rem] p-8 md:p-16 text-white flex flex-col md:flex-row items-center gap-12 relative overflow-hidden">
                <div className="md:w-1/2 relative z-10 space-y-8">
                  <Badge>LEARNING & DEVELOPMENT</Badge>
                  <h2 className="text-4xl md:text-5xl font-black leading-tight">Văn Hóa <br/><span className="text-blue-500">Học Tập</span></h2>
                  <p className="text-slate-300 text-lg leading-relaxed whitespace-pre-line">
                      {training.description || `Tại ${company.name}, việc học chưa bao giờ dừng lại. Chúng tôi cung cấp tài nguyên học tập không giới hạn và thư viện sách chuyên ngành phong phú.`}
                  </p>
                  {training.budget && (
                      <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/20 flex items-center gap-6">
                          <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center shrink-0 animate-pulse">
                            <GraduationCap size={32} />
                          </div>
                          <div>
                            <p className="text-sm text-slate-300 uppercase font-bold tracking-wider mb-1">Ngân sách đào tạo</p>
                            <p className="text-2xl md:text-3xl font-bold">{training.budget} <span className="text-sm font-normal text-slate-300">/nhân sự/năm</span></p>
                          </div>
                      </div>
                  )}
                </div>
                <div className="md:w-1/2 relative z-10">
                  <img 
                    src={training.image || "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&q=80&w=800"} 
                    alt="Training" 
                    className="rounded-3xl shadow-2xl rotate-3 border-8 border-white/10 grayscale-[50%] object-cover aspect-video w-full" 
                  />
                </div>
            </div>

            <div className="mt-12">
                <div className="mb-6"><h3 className="text-2xl font-bold text-slate-800 border-l-4 border-slate-900 pl-4">Chương Trình Đào Tạo</h3></div>
                <SectionCarousel>
                    {training.programs?.map((prog: any, i: number) => (
                        <div key={i} className="bg-white p-8 rounded-3xl border border-slate-200 hover:shadow-lg transition-shadow w-[85vw] md:w-[350px] shrink-0">
                          <h4 className="text-xl font-bold text-slate-900 mb-3">{prog.title}</h4>
                          <p className="text-slate-600">{prog.desc}</p>
                        </div>
                    ))}
                </SectionCarousel>
            </div>
        </section>

        {/* SECTION 10: LEADERS */}
        {(leaders.length > 0 || isEditable) && (
            <section className="max-w-7xl mx-auto px-6 relative group/leaders">
                {isEditable && (
                    <div className="absolute top-0 right-6 opacity-0 group-hover/leaders:opacity-100 transition-opacity z-20">
                         <Button onClick={() => handleEdit('leaders', { leaders })} variant="outline" size="sm" className="bg-white shadow-sm border">
                            <Pencil className="w-3 h-3 mr-2" /> Chỉnh sửa lãnh đạo
                        </Button>
                    </div>
                )}
                <SectionTitle title="BAN LÃNH ĐẠO" subtitle="Những người thuyền trưởng tài năng và tâm huyết" />
                <div className="mt-20">
                    <SectionCarousel>
                        {leaders.map((leader: any, i: number) => (
                          <div 
                            key={i} 
                            className="bg-white rounded-[2rem] p-8 pt-0 shadow-xl border border-slate-100 text-center relative mt-12 group hover:border-blue-300 transition-all min-w-[300px] md:min-w-[350px]"
                          >
                              <div className="w-32 h-32 mx-auto -mt-16 rounded-full p-1 bg-slate-800 mb-6 relative z-10 group-hover:scale-105 transition-transform">
                                <img src={leader.image} alt={leader.name} className="w-full h-full rounded-full object-cover border-4 border-white grayscale group-hover:grayscale-0 transition-all duration-300" />
                              </div>
                              <div className="absolute top-0 left-0 w-full h-32 bg-slate-50 rounded-t-[2rem] -z-0 group-hover:bg-slate-100 transition-colors"></div>
                              
                              <h4 className="text-xl font-bold text-slate-900 relative z-10">{leader.name}</h4>
                              <span className="text-blue-600 font-bold text-sm uppercase tracking-wider block mb-6 relative z-10">{leader.role}</span>
                              <div className="relative z-10">
                                <span className="text-4xl text-slate-200 font-serif absolute -top-4 left-0">"</span>
                                <p className="text-slate-600 italic px-4">{leader.message}</p>
                              </div>
                          </div>
                        ))}
                    </SectionCarousel>
                </div>
                {leaders.length === 0 && isEditable && (
                  <div className="w-full text-center text-slate-500 italic border border-dashed p-8 rounded-xl mt-8">
                      Chưa có thông tin ban lãnh đạo.
                  </div>
              )}
            </section>
        )}

        {/* SECTION 11: TYPICAL DAY */}
        <section className="bg-slate-50 py-10 rounded-[3rem] mx-6 relative group/culture-day">
            {isEditable && (
                <div className="absolute top-6 right-6 opacity-0 group-hover/culture-day:opacity-100 transition-opacity z-20">
                     <Button onClick={() => handleEdit('culture-typical-day', { culture })} variant="secondary" size="sm" className="bg-white shadow-sm border">
                        <Pencil className="w-3 h-3 mr-2" /> Chỉnh sửa lịch trình
                    </Button>
                </div>
            )}
            <div className="max-w-7xl mx-auto px-6">
                <SectionTitle title={`MỘT NGÀY TẠI ${company.name.toUpperCase()}`} />
                <SectionCarousel>
                  {culture.typicalDay?.map((slot: any, i: number) => {
                      const Icon = iconMap[slot.icon] || Coffee;
                      return (
                          <div key={i} className="bg-white p-6 rounded-3xl border border-slate-100 text-center hover:bg-slate-800 hover:text-white group transition-all duration-300 shadow-md min-w-[200px] md:min-w-[240px]">
                            <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-white/20 transition-colors">
                                <Icon size={20} className="text-slate-700 group-hover:text-white" />
                            </div>
                            <div className="text-2xl font-black mb-1">{slot.time}</div>
                            <div className="font-bold mb-1">{slot.title}</div>
                            <div className="text-sm opacity-60 group-hover:opacity-100">{slot.desc}</div>
                          </div>
                      );
                  })}
                </SectionCarousel>
            </div>
        </section>

        {/* SECTION 14: AWARDS */}
        {(awards.length > 0 || isEditable) && (
            <section className="max-w-7xl mx-auto px-6 relative group/awards">
                {isEditable && (
                    <div className="absolute top-0 right-6 opacity-0 group-hover/awards:opacity-100 transition-opacity z-20">
                         <Button onClick={() => handleEdit('awards', { awards })} variant="outline" size="sm" className="bg-white shadow-sm border">
                            <Pencil className="w-3 h-3 mr-2" /> Chỉnh sửa giải thưởng
                        </Button>
                    </div>
                )}
                <SectionTitle title="GIẢI THƯỞNG & VINH DANH" />
                <SectionCarousel>
                    {awards.map((award: any, i: number) => (
                      <div key={i} className="min-w-[280px] bg-white border border-slate-100 p-6 rounded-2xl flex items-center gap-4 shadow-sm">
                          <div className="w-12 h-12 bg-yellow-50 text-yellow-600 rounded-full flex items-center justify-center shrink-0">
                            <Award size={24} />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-yellow-600">{award.year}</div>
                            <div className="font-bold text-slate-900 leading-tight">{award.name}</div>
                            <div className="text-xs text-slate-500 mt-1">{award.org}</div>
                          </div>
                      </div>
                    ))}
                </SectionCarousel>
                {awards.length === 0 && isEditable && (
                  <div className="w-full text-center text-slate-500 italic border border-dashed p-8 rounded-xl">
                      Chưa có giải thưởng.
                  </div>
              )}
            </section>
        )}

        {/* SECTION 18: FOUNDER STORY */}
        <section className="relative group/founder space-y-20">
             {isEditable && (
                <div className="absolute top-6 right-6 opacity-0 group-hover/founder:opacity-100 transition-opacity z-20">
                     <Button onClick={() => handleEdit('story-founder', { story })} variant="secondary" size="sm" className="bg-white shadow-sm border">
                        <Pencil className="w-3 h-3 mr-2" /> Chỉnh sửa câu chuyện
                    </Button>
                </div>
            )}
            
            {/* Story Content */}
             {(story.founderStory?.title || isEditable) && (
                <section className="max-w-7xl mx-auto px-6">
                    <div className="bg-white rounded-[3rem] p-8 md:p-12 shadow-2xl border border-slate-100">
                        <SectionTitle title="CÂU CHUYỆN KHỞI NGUỒN" align="left" />
                        {story.founderStory?.title ? (
                             <div className="flex flex-col md:flex-row gap-12 items-start">
                                {story.founderStory.image && (
                                    <div className="md:w-1/3 shrink-0">
                                        <img src={story.founderStory.image} alt="Founders" className="rounded-3xl shadow-xl w-full rotate-2 hover:rotate-0 transition-transform duration-500 grayscale" />
                                    </div>
                                )}
                                <div className="md:w-2/3 space-y-6">
                                    <h4 className="text-3xl font-bold text-slate-900">{story.founderStory.title}</h4>
                                    <p className="text-slate-600 text-lg leading-relaxed whitespace-pre-line">
                                        {story.founderStory.content}
                                    </p>
                                    <div className="pt-4">
                                        <p className="text-sm font-bold text-slate-400 mt-2">{story.founderStory.founder}</p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center text-slate-500 italic">Chưa có câu chuyện khởi nguồn.</div>
                        )}
                    </div>
                </section>
            )}
        </section>

        {/* SECTION 19: MILESTONES */}
        <section className="relative group/milestones">
            {isEditable && (
                <div className="absolute top-0 right-6 opacity-0 group-hover/milestones:opacity-100 transition-opacity z-20">
                     <Button onClick={() => handleEdit('story-milestones', { story })} variant="outline" size="sm" className="bg-white shadow-sm border">
                        <Pencil className="w-3 h-3 mr-2" /> Chỉnh sửa cột mốc
                    </Button>
                </div>
            )}

            {/* Milestones Content */}
            {(story.milestones?.length > 0 || isEditable) && (
                <section className="max-w-7xl mx-auto px-6">
                    <SectionTitle title="CỘT MỐC PHÁT TRIỂN" />
                    <div className="relative border-l-4 border-slate-200 ml-4 md:ml-1/2 md:border-l-0">
                        <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-1 bg-slate-200 -translate-x-1/2 rounded-full"></div>
                        
                        <div className="space-y-12">
                          {story.milestones?.map((item: any, i: number) => (
                              <div key={i} className={`flex flex-col md:flex-row items-center ${i % 2 === 0 ? 'md:flex-row-reverse' : ''} relative`}>
                                <div className="w-full md:w-1/2 p-4 md:p-8">
                                    <div className={`bg-white p-6 rounded-2xl shadow-md border border-slate-100 relative ${i % 2 === 0 ? 'md:text-left' : 'md:text-right'} hover:border-slate-300 transition-colors`}>
                                      <div className="text-4xl md:text-5xl font-black text-slate-200 mb-3">
                                        {item.year}
                                      </div>
                                      <h5 className="text-xl font-bold text-slate-900 relative z-10">{item.title}</h5>
                                      <p className="text-slate-600 mt-2 relative z-10">{item.desc}</p>
                                    </div>
                                </div>
                                
                                {/* Center Dot */}
                                <div className="absolute left-[-10px] md:left-1/2 top-8 md:top-1/2 w-6 h-6 bg-slate-900 rounded-full border-4 border-white shadow-md transform md:-translate-x-1/2 md:-translate-y-1/2 z-20"></div>
                                
                                <div className="w-full md:w-1/2"></div>
                              </div>
                          ))}
                           {story.milestones?.length === 0 && (
                                <div className="text-center text-slate-500 italic p-8">Chưa có cột mốc phát triển.</div>
                           )}
                        </div>
                    </div>
                </section>
            )}
        </section>

        {/* SECTION 20: TESTIMONIALS */}
        <section className="max-w-7xl mx-auto px-6 pb-20 relative group/testimonials">
             {isEditable && (
                <div className="absolute top-0 right-6 opacity-0 group-hover/testimonials:opacity-100 transition-opacity z-20">
                     <Button onClick={() => handleEdit('culture-testimonials', { culture })} variant="outline" size="sm" className="bg-white shadow-sm border">
                        <Pencil className="w-3 h-3 mr-2" /> Chỉnh sửa đánh giá
                    </Button>
                </div>
            )}
            
            {(culture.testimonials?.length > 0 || isEditable) && (
                <>
                    <SectionTitle title="NGƯỜI TRONG CUỘC NÓI GÌ?" subtitle={`Những chia sẻ chân thật từ chính các thành viên ${company.name}`} />
                    <SectionCarousel>
                        {culture.testimonials?.map((t: any, i: number) => (
                          <div key={i} className="bg-white rounded-3xl p-8 shadow-xl border border-slate-50 relative mt-10 w-[85vw] md:w-[350px] shrink-0">
                              <div className="absolute -top-10 left-8">
                                <img src={t.image} alt={t.name} className="w-20 h-20 rounded-2xl object-cover border-4 border-white shadow-lg grayscale" />
                              </div>
                              <div className="mt-8">
                                <div className="text-6xl font-serif text-slate-200 absolute top-4 right-6 opacity-50">”</div>
                                <p className="text-slate-600 italic leading-relaxed mb-6 relative z-10">"{t.quote}"</p>
                                <div className="border-t border-slate-100 pt-4">
                                    <div className="font-bold text-lg text-slate-900">{t.name}</div>
                                    <div className="text-sm font-semibold text-blue-600">{t.role}</div>
                                </div>
                              </div>
                          </div>
                        ))}
                    </SectionCarousel>
                     {culture.testimonials?.length === 0 && (
                         <div className="text-center text-slate-500 italic mt-8">Chưa có đánh giá nào.</div>
                     )}
                </>
            )}
        </section>

        {/* Edit Dialogs (Only basic text for now to keep file size manageable) */}
        <Dialog open={!!editingSection} onOpenChange={(open) => !open && setEditingSection(null)}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>
                        {editingSection === 'vision' && "Chỉnh sửa Tầm nhìn"}
                        {editingSection === 'mission' && "Chỉnh sửa Sứ mệnh"}
                        {editingSection === 'coreValues' && "Chỉnh sửa Giá trị cốt lõi"}
                        {editingSection === 'leadershipPhilosophy' && "Chỉnh sửa Triết lý lãnh đạo"}
                        {editingSection === 'stats' && "Chỉnh sửa Số liệu"}
                        {editingSection === 'products' && "Chỉnh sửa Hệ sinh thái sản phẩm"}
                        {editingSection === 'recruitmentPrinciples' && "Chỉnh sửa Nguyên tắc tuyển dụng"}
                        {editingSection === 'benefits' && "Chỉnh sửa Phúc lợi"}
                        {editingSection === 'hrJourney' && "Chỉnh sửa Hành trình nhân sự"}
                        {editingSection === 'careerPath' && "Chỉnh sửa Lộ trình thăng tiến"}
                        {editingSection === 'salaryAndBonus' && "Chỉnh sửa Lương & Thưởng"}
                        {editingSection === 'training' && "Chỉnh sửa Đào tạo & Phát triển"}
                        {editingSection === 'leaders' && "Chỉnh sửa Ban lãnh đạo"}
                        {editingSection === 'culture-typical-day' && "Chỉnh sửa Một ngày làm việc"}
                        {editingSection === 'culture-testimonials' && "Chỉnh sửa Người trong cuộc nói gì"}
                        {editingSection === 'awards' && "Chỉnh sửa Giải thưởng"}
                        {editingSection === 'story-founder' && "Chỉnh sửa Câu chuyện khởi nguồn"}
                        {editingSection === 'story-milestones' && "Chỉnh sửa Cột mốc phát triển"}
                    </DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                    {editingSection === 'vision' && (
                        <div className="space-y-2">
                            <Label>Nội dung Tầm nhìn</Label>
                            <Textarea 
                                value={formData.vision || ''} 
                                onChange={e => setFormData({...formData, vision: e.target.value})}
                                rows={5}
                                placeholder="Nhập tầm nhìn..."
                            />
                        </div>
                    )}
                    
                    {editingSection === 'mission' && (
                        <div className="space-y-2">
                            <Label>Nội dung Sứ mệnh</Label>
                            <Textarea 
                                value={formData.mission || ''} 
                                onChange={e => setFormData({...formData, mission: e.target.value})}
                                rows={5}
                                placeholder="Nhập sứ mệnh..."
                            />
                        </div>
                    )}
                    
                    {editingSection === 'coreValues' && (
                        <div className="space-y-2">
                            <Label>Nội dung Giá trị cốt lõi</Label>
                            <Textarea 
                                value={formData.coreValues || ''} 
                                onChange={e => setFormData({...formData, coreValues: e.target.value})}
                                rows={8}
                                placeholder="Nhập giá trị cốt lõi..."
                            />
                        </div>
                    )}

                    {editingSection === 'leadershipPhilosophy' && (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Câu trích dẫn triết lý</Label>
                                <Textarea 
                                    value={formData.leadershipPhilosophy?.quote || ''} 
                                    onChange={e => setFormData({...formData, leadershipPhilosophy: {...formData.leadershipPhilosophy, quote: e.target.value}})}
                                    rows={3}
                                    placeholder="Lãnh đạo không phải là chức danh..."
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Loại Media</Label>
                                <select 
                                    className="w-full border rounded-md p-2 bg-white"
                                    value={formData.leadershipPhilosophy?.mediaType || 'image'}
                                    onChange={e => setFormData({...formData, leadershipPhilosophy: {...formData.leadershipPhilosophy, mediaType: e.target.value as any}})}
                                >
                                    <option value="image">Hình ảnh</option>
                                    <option value="video">Video (URL)</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label>Media {formData.leadershipPhilosophy?.mediaType === 'video' ? '(Video URL)' : '(Ảnh)'}</Label>
                                {formData.leadershipPhilosophy?.mediaType === 'image' || !formData.leadershipPhilosophy?.mediaType ? (
                                    <ImageUpload 
                                        value={formData.leadershipPhilosophy?.media || ''} 
                                        companyId={company.id}
                                        onChange={url => setFormData({...formData, leadershipPhilosophy: {...formData.leadershipPhilosophy, media: url}})}
                                    />
                                ) : (
                                    <Input 
                                        value={formData.leadershipPhilosophy?.media || ''} 
                                        onChange={e => setFormData({...formData, leadershipPhilosophy: {...formData.leadershipPhilosophy, media: e.target.value}})}
                                        placeholder="https://..." 
                                    />
                                )}
                            </div>
                        </div>
                    )}

                    {/* managementPhilosophy: tạm thời chưa cho chỉnh sửa, sẽ triển khai sau */}
                    
                    {editingSection === 'stats' && (
                        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                            {formData.stats?.map((stat: any, idx: number) => (
                                <div key={idx} className="grid grid-cols-2 gap-4 items-start border p-3 rounded-lg relative group">
                                    <div className="space-y-2">
                                        <Label>Con số (Value)</Label>
                                        <Input 
                                            value={stat.value} 
                                            onChange={e => {
                                                const newStats = [...formData.stats];
                                                newStats[idx].value = e.target.value;
                                                setFormData({...formData, stats: newStats});
                                            }}
                                            placeholder="VD: 10+"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Tiêu đề (Label)</Label>
                                        <Input 
                                            value={stat.label} 
                                            onChange={e => {
                                                const newStats = [...formData.stats];
                                                newStats[idx].label = e.target.value;
                                                setFormData({...formData, stats: newStats});
                                            }}
                                            placeholder="VD: Năm kinh nghiệm"
                                        />
                                    </div>
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="absolute top-1 right-1 h-6 w-6 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100"
                                        onClick={() => {
                                            const newStats = formData.stats.filter((_: any, i: number) => i !== idx);
                                            setFormData({...formData, stats: newStats});
                                        }}
                                    >
                                        <X className="w-3 h-3" />
                                    </Button>
                                </div>
                            ))}
                            <Button 
                                type="button" 
                                variant="outline" 
                                className="w-full"
                                onClick={() => {
                                    setFormData({
                                        ...formData, 
                                        stats: [...(formData.stats || []), { value: "", label: "" }]
                                    });
                                }}
                            >
                                <Plus className="w-4 h-4 mr-2" /> Thêm số liệu
                            </Button>
                        </div>
                    )}

                    {editingSection === 'products' && (
                        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                            {formData.products?.map((prod: any, idx: number) => (
                                <div key={idx} className="flex gap-3 items-center border p-3 rounded-lg relative group bg-slate-50">
                                    <div className="w-10 h-10 bg-slate-200 rounded-lg flex items-center justify-center shrink-0">
                                        <Zap className="w-5 h-5 text-slate-500" />
                                    </div>
                                    <div className="grow space-y-1">
                                        <Label className="text-xs text-slate-500">Tên sản phẩm</Label>
                                        <Input 
                                            value={prod.name} 
                                            onChange={e => {
                                                const newProds = [...formData.products];
                                                newProds[idx].name = e.target.value;
                                                setFormData({...formData, products: newProds});
                                            }}
                                            placeholder="VD: TechCloud"
                                            className="bg-white h-9"
                                        />
                                    </div>
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50 ml-1"
                                        onClick={() => {
                                            const newProds = formData.products.filter((_: any, i: number) => i !== idx);
                                            setFormData({...formData, products: newProds});
                                        }}
                                    >
                                        <X className="w-4 h-4" />
                                    </Button>
                                </div>
                            ))}
                            <Button 
                                type="button" 
                                variant="outline" 
                                className="w-full border-dashed text-slate-600"
                                onClick={() => {
                                    setFormData({
                                        ...formData, 
                                        products: [...(formData.products || []), { name: "", icon: "Zap" }]
                                    });
                                }}
                            >
                                <Plus className="w-4 h-4 mr-2" /> Thêm sản phẩm
                            </Button>
                        </div>
                    )}

                    {editingSection === 'recruitmentPrinciples' && (
                        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                            {formData.recruitmentPrinciples?.map((item: any, idx: number) => (
                                <div key={idx} className="border p-4 rounded-lg space-y-3 relative bg-slate-50">
                                    <div className="grid grid-cols-1 gap-3">
                                        <div>
                                            <Label>Tiêu đề</Label>
                                            <Input 
                                                value={item.title} 
                                                onChange={e => {
                                                    const newArr = [...formData.recruitmentPrinciples];
                                                    newArr[idx].title = e.target.value;
                                                    setFormData({...formData, recruitmentPrinciples: newArr});
                                                }}
                                                className="bg-white"
                                            />
                                        </div>
                                        <div>
                                            <Label>Mô tả</Label>
                                            <Textarea 
                                                value={item.desc} 
                                                onChange={e => {
                                                    const newArr = [...formData.recruitmentPrinciples];
                                                    newArr[idx].desc = e.target.value;
                                                    setFormData({...formData, recruitmentPrinciples: newArr});
                                                }}
                                                className="bg-white"
                                            />
                                        </div>
                                    </div>
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="absolute top-2 right-2 text-red-400 hover:text-red-600"
                                        onClick={() => {
                                            const newArr = formData.recruitmentPrinciples.filter((_: any, i: number) => i !== idx);
                                            setFormData({...formData, recruitmentPrinciples: newArr});
                                        }}
                                    >
                                        <X className="w-4 h-4" />
                                    </Button>
                                </div>
                            ))}
                            <Button 
                                variant="outline" 
                                className="w-full"
                                onClick={() => setFormData({...formData, recruitmentPrinciples: [...(formData.recruitmentPrinciples || []), { title: "", desc: "", icon: "Star" }]})}
                            >
                                <Plus className="w-4 h-4 mr-2" /> Thêm nguyên tắc
                            </Button>
                        </div>
                    )}

                    {editingSection === 'benefits' && (
                        <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
                            <div className="space-y-3">
                                <h4 className="font-bold border-b pb-2">Tài chính vững chắc</h4>
                                {formData.benefits?.financial?.map((item: string, idx: number) => (
                                    <div key={idx} className="flex gap-2">
                                        <Input 
                                            value={item} 
                                            onChange={e => {
                                                const newFin = [...formData.benefits.financial];
                                                newFin[idx] = e.target.value;
                                                setFormData({...formData, benefits: {...formData.benefits, financial: newFin}});
                                            }}
                                        />
                                        <Button 
                                            variant="ghost" 
                                            size="icon"
                                            onClick={() => {
                                                const newFin = formData.benefits.financial.filter((_: any, i: number) => i !== idx);
                                                setFormData({...formData, benefits: {...formData.benefits, financial: newFin}});
                                            }}
                                        >
                                            <X className="w-4 h-4 text-red-400" />
                                        </Button>
                                    </div>
                                ))}
                                <Button 
                                    variant="outline" size="sm" 
                                    onClick={() => setFormData({...formData, benefits: {...formData.benefits, financial: [...(formData.benefits?.financial || []), ""]}})}
                                >
                                    <Plus className="w-3 h-3 mr-2" /> Thêm mục
                                </Button>
                            </div>

                            <div className="space-y-3">
                                <h4 className="font-bold border-b pb-2">Tinh thần hạnh phúc</h4>
                                {formData.benefits?.nonFinancial?.map((item: string, idx: number) => (
                                    <div key={idx} className="flex gap-2">
                                        <Input 
                                            value={item} 
                                            onChange={e => {
                                                const newNon = [...formData.benefits.nonFinancial];
                                                newNon[idx] = e.target.value;
                                                setFormData({...formData, benefits: {...formData.benefits, nonFinancial: newNon}});
                                            }}
                                        />
                                        <Button 
                                            variant="ghost" 
                                            size="icon"
                                            onClick={() => {
                                                const newNon = formData.benefits.nonFinancial.filter((_: any, i: number) => i !== idx);
                                                setFormData({...formData, benefits: {...formData.benefits, nonFinancial: newNon}});
                                            }}
                                        >
                                            <X className="w-4 h-4 text-red-400" />
                                        </Button>
                                    </div>
                                ))}
                                <Button 
                                    variant="outline" size="sm" 
                                    onClick={() => setFormData({...formData, benefits: {...formData.benefits, nonFinancial: [...(formData.benefits?.nonFinancial || []), ""]}})}
                                >
                                    <Plus className="w-3 h-3 mr-2" /> Thêm mục
                                </Button>
                            </div>
                        </div>
                    )}

                    {editingSection === 'hrJourney' && (
                        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                            {formData.hrJourney?.map((item: any, idx: number) => (
                                <div key={idx} className="border p-4 rounded-lg space-y-3 relative bg-slate-50">
                                    <div className="grid grid-cols-1 gap-3">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-8 h-8 rounded-lg ${item.color || 'bg-slate-800'} text-white flex items-center justify-center font-bold text-sm`}>
                                                {idx + 1}
                                            </div>
                                            <span className="text-sm text-slate-500 font-medium">Bước {idx + 1}</span>
                                        </div>
                                        <div>
                                            <Label>Tiêu đề</Label>
                                            <Input 
                                                value={item.title} 
                                                onChange={e => {
                                                    const newArr = [...formData.hrJourney];
                                                    newArr[idx].title = e.target.value;
                                                    setFormData({...formData, hrJourney: newArr});
                                                }}
                                                className="bg-white"
                                            />
                                        </div>
                                        <div>
                                            <Label>Mô tả</Label>
                                            <Textarea 
                                                value={item.desc} 
                                                onChange={e => {
                                                    const newArr = [...formData.hrJourney];
                                                    newArr[idx].desc = e.target.value;
                                                    setFormData({...formData, hrJourney: newArr});
                                                }}
                                                className="bg-white"
                                            />
                                        </div>
                                    </div>
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="absolute top-2 right-2 text-red-400 hover:text-red-600"
                                        onClick={() => {
                                            const newArr = formData.hrJourney.filter((_: any, i: number) => i !== idx);
                                            setFormData({...formData, hrJourney: newArr});
                                        }}
                                    >
                                        <X className="w-4 h-4" />
                                    </Button>
                                </div>
                            ))}
                            <Button 
                                variant="outline" 
                                className="w-full"
                                onClick={() => {
                                    const nextStep = (formData.hrJourney?.length || 0) + 1;
                                    const colors = ['bg-slate-800', 'bg-blue-600', 'bg-slate-900'];
                                    const nextColor = colors[(nextStep - 1) % colors.length];
                                    
                                    setFormData({
                                        ...formData, 
                                        hrJourney: [
                                            ...(formData.hrJourney || []), 
                                            { 
                                                step: nextStep.toString().padStart(2, '0'), 
                                                title: "", 
                                                desc: "", 
                                                color: nextColor 
                                            }
                                        ]
                                    })
                                }}
                            >
                                <Plus className="w-4 h-4 mr-2" /> Thêm bước
                            </Button>
                        </div>
                    )}

                    {editingSection === 'careerPath' && (
                        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                            <div className="flex flex-col gap-3">
                                {formData.careerPath?.map((level: string, idx: number) => (
                                    <div key={idx} className="flex gap-2">
                                        <div className="grow">
                                            <Label className="text-xs mb-1 block">Level {idx + 1}</Label>
                                            <Input 
                                                value={level} 
                                                onChange={e => {
                                                    const newArr = [...formData.careerPath];
                                                    newArr[idx] = e.target.value;
                                                    setFormData({...formData, careerPath: newArr});
                                                }}
                                            />
                                        </div>
                                        <Button 
                                            variant="ghost" 
                                            size="icon"
                                            className="mt-6"
                                            onClick={() => {
                                                const newArr = formData.careerPath.filter((_: any, i: number) => i !== idx);
                                                setFormData({...formData, careerPath: newArr});
                                            }}
                                        >
                                            <X className="w-4 h-4 text-red-400" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                            <Button 
                                variant="outline" 
                                className="w-full"
                                onClick={() => setFormData({...formData, careerPath: [...(formData.careerPath || []), ""]})}
                            >
                                <Plus className="w-4 h-4 mr-2" /> Thêm Level
                            </Button>
                        </div>
                    )}

                    {editingSection === 'salaryAndBonus' && (
                        <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
                             <div className="space-y-3">
                                <h4 className="font-bold border-b pb-2">Cơ chế lương</h4>
                                {formData.salaryAndBonus?.salary?.map((item: string, idx: number) => (
                                    <div key={idx} className="flex gap-2">
                                        <Input 
                                            value={item} 
                                            onChange={e => {
                                                const newArr = [...formData.salaryAndBonus.salary];
                                                newArr[idx] = e.target.value;
                                                setFormData({...formData, salaryAndBonus: {...formData.salaryAndBonus, salary: newArr}});
                                            }}
                                        />
                                        <Button 
                                            variant="ghost" 
                                            size="icon"
                                            onClick={() => {
                                                const newArr = formData.salaryAndBonus.salary.filter((_: any, i: number) => i !== idx);
                                                setFormData({...formData, salaryAndBonus: {...formData.salaryAndBonus, salary: newArr}});
                                            }}
                                        >
                                            <X className="w-4 h-4 text-red-400" />
                                        </Button>
                                    </div>
                                ))}
                                <Button 
                                    variant="outline" size="sm" 
                                    onClick={() => setFormData({...formData, salaryAndBonus: {...formData.salaryAndBonus, salary: [...(formData.salaryAndBonus?.salary || []), ""]}})}
                                >
                                    <Plus className="w-3 h-3 mr-2" /> Thêm mục
                                </Button>
                             </div>

                             <div className="space-y-3">
                                <h4 className="font-bold border-b pb-2">Hệ thống thưởng</h4>
                                {formData.salaryAndBonus?.bonus?.map((item: string, idx: number) => (
                                    <div key={idx} className="flex gap-2">
                                        <Input 
                                            value={item} 
                                            onChange={e => {
                                                const newArr = [...formData.salaryAndBonus.bonus];
                                                newArr[idx] = e.target.value;
                                                setFormData({...formData, salaryAndBonus: {...formData.salaryAndBonus, bonus: newArr}});
                                            }}
                                        />
                                        <Button 
                                            variant="ghost" 
                                            size="icon"
                                            onClick={() => {
                                                const newArr = formData.salaryAndBonus.bonus.filter((_: any, i: number) => i !== idx);
                                                setFormData({...formData, salaryAndBonus: {...formData.salaryAndBonus, bonus: newArr}});
                                            }}
                                        >
                                            <X className="w-4 h-4 text-red-400" />
                                        </Button>
                                    </div>
                                ))}
                                <Button 
                                    variant="outline" size="sm" 
                                    onClick={() => setFormData({...formData, salaryAndBonus: {...formData.salaryAndBonus, bonus: [...(formData.salaryAndBonus?.bonus || []), ""]}})}
                                >
                                    <Plus className="w-3 h-3 mr-2" /> Thêm mục
                                </Button>
                             </div>
                        </div>
                    )}

                    {editingSection === 'training' && (
                        <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
                            <div className="space-y-3">
                                <Label>Mô tả văn hóa học tập</Label>
                                <Textarea 
                                    value={formData.training?.description || ''} 
                                    onChange={e => setFormData({...formData, training: {...formData.training, description: e.target.value}})}
                                    placeholder="Mô tả về văn hóa học tập..."
                                    rows={4}
                                />
                            </div>
                            
                            <div className="space-y-3">
                                <Label>Ảnh minh họa</Label>
                                <ImageUpload 
                                    value={formData.training?.image || ''} 
                                    companyId={company.id}
                                    onChange={url => setFormData({...formData, training: {...formData.training, image: url}})}
                                />
                            </div>

                            <div>
                                <Label>Ngân sách đào tạo (/nhân sự/năm)</Label>
                                <Input 
                                    value={formData.training?.budget || ''} 
                                    onChange={e => setFormData({...formData, training: {...formData.training, budget: e.target.value}})}
                                    placeholder="VD: $500"
                                />
                            </div>
                            <div className="space-y-3">
                                <h4 className="font-bold border-b pb-2">Chương trình đào tạo</h4>
                                {formData.training?.programs?.map((prog: any, idx: number) => (
                                    <div key={idx} className="border p-3 rounded-lg space-y-2 relative bg-slate-50">
                                        <Input 
                                            value={prog.title} 
                                            onChange={e => {
                                                const newProgs = [...formData.training.programs];
                                                newProgs[idx].title = e.target.value;
                                                setFormData({...formData, training: {...formData.training, programs: newProgs}});
                                            }}
                                            placeholder="Tên chương trình"
                                            className="bg-white"
                                        />
                                        <Textarea 
                                            value={prog.desc} 
                                            onChange={e => {
                                                const newProgs = [...formData.training.programs];
                                                newProgs[idx].desc = e.target.value;
                                                setFormData({...formData, training: {...formData.training, programs: newProgs}});
                                            }}
                                            placeholder="Mô tả"
                                            className="bg-white"
                                        />
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="absolute top-1 right-1 h-6 w-6 text-red-400 hover:text-red-600"
                                            onClick={() => {
                                                const newProgs = formData.training.programs.filter((_: any, i: number) => i !== idx);
                                                setFormData({...formData, training: {...formData.training, programs: newProgs}});
                                            }}
                                        >
                                            <X className="w-3 h-3" />
                                        </Button>
                                    </div>
                                ))}
                                <Button 
                                    variant="outline" 
                                    className="w-full"
                                    onClick={() => setFormData({...formData, training: {...formData.training, programs: [...(formData.training?.programs || []), { title: "", desc: "" }]}})}
                                >
                                    <Plus className="w-4 h-4 mr-2" /> Thêm chương trình
                                </Button>
                            </div>
                        </div>
                    )}

                    {editingSection === 'leaders' && (
                        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                             {formData.leaders?.map((leader: any, idx: number) => (
                                <div key={idx} className="border p-4 rounded-lg space-y-3 relative bg-slate-50">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <Label>Tên</Label>
                                            <Input 
                                                value={leader.name} 
                                                onChange={e => {
                                                    const newArr = [...formData.leaders];
                                                    newArr[idx].name = e.target.value;
                                                    setFormData({...formData, leaders: newArr});
                                                }}
                                                className="bg-white" 
                                            />
                                        </div>
                                        <div>
                                            <Label>Chức vụ</Label>
                                            <Input 
                                                value={leader.role} 
                                                onChange={e => {
                                                    const newArr = [...formData.leaders];
                                                    newArr[idx].role = e.target.value;
                                                    setFormData({...formData, leaders: newArr});
                                                }}
                                                className="bg-white" 
                                            />
                                        </div>
                                        <div className="col-span-2">
                                            <Label>Ảnh đại diện</Label>
                                            <ImageUpload 
                                                value={leader.image} 
                                                companyId={company.id}
                                                onChange={url => {
                                                    const newArr = [...formData.leaders];
                                                    newArr[idx].image = url;
                                                    setFormData({...formData, leaders: newArr});
                                                }}
                                            />
                                        </div>
                                        <div className="col-span-2">
                                            <Label>Thông điệp</Label>
                                            <Textarea 
                                                value={leader.message} 
                                                onChange={e => {
                                                    const newArr = [...formData.leaders];
                                                    newArr[idx].message = e.target.value;
                                                    setFormData({...formData, leaders: newArr});
                                                }}
                                                className="bg-white" 
                                            />
                                        </div>
                                    </div>
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="absolute top-2 right-2 text-red-400 hover:text-red-600"
                                        onClick={() => {
                                            const newArr = formData.leaders.filter((_: any, i: number) => i !== idx);
                                            setFormData({...formData, leaders: newArr});
                                        }}
                                    >
                                        <X className="w-4 h-4" />
                                    </Button>
                                </div>
                             ))}
                             <Button 
                                variant="outline" 
                                className="w-full" 
                                onClick={() => setFormData({...formData, leaders: [...(formData.leaders || []), { name: "", role: "", message: "", image: "" }]})}
                             >
                                <Plus className="w-4 h-4 mr-2" /> Thêm lãnh đạo
                            </Button>
                        </div>
                    )}

                    {editingSection === 'culture-typical-day' && (
                        <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
                             <div className="space-y-3">
                                {formData.culture?.typicalDay?.map((item: any, idx: number) => (
                                    <div key={idx} className="border p-3 rounded-lg space-y-2 bg-slate-50">
                                        <div className="flex justify-between items-center border-b border-slate-200 pb-2 mb-2">
                                            <span className="text-xs font-bold text-slate-400 uppercase">Hoạt động {idx + 1}</span>
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="text-red-400 hover:text-red-600 h-6 w-6"
                                                onClick={() => {
                                                    const newArr = formData.culture.typicalDay.filter((_: any, i: number) => i !== idx);
                                                    setFormData({...formData, culture: {...formData.culture, typicalDay: newArr}});
                                                }}
                                            >
                                                <X className="w-4 h-4" />
                                            </Button>
                                        </div>
                                        <div className="flex gap-2">
                                            <Input 
                                                value={item.time} 
                                                onChange={e => {
                                                    const newArr = [...formData.culture.typicalDay];
                                                    newArr[idx].time = e.target.value;
                                                    setFormData({...formData, culture: {...formData.culture, typicalDay: newArr}});
                                                }}
                                                placeholder="08:00" 
                                                className="w-24 bg-white" 
                                            />
                                            <Input 
                                                value={item.title} 
                                                onChange={e => {
                                                    const newArr = [...formData.culture.typicalDay];
                                                    newArr[idx].title = e.target.value;
                                                    setFormData({...formData, culture: {...formData.culture, typicalDay: newArr}});
                                                }}
                                                placeholder="Hoạt động" 
                                                className="grow bg-white" 
                                            />
                                        </div>
                                        <Input 
                                            value={item.desc} 
                                            onChange={e => {
                                                const newArr = [...formData.culture.typicalDay];
                                                newArr[idx].desc = e.target.value;
                                                setFormData({...formData, culture: {...formData.culture, typicalDay: newArr}});
                                            }}
                                            placeholder="Mô tả ngắn" 
                                            className="bg-white" 
                                        />
                                    </div>
                                ))}
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => setFormData({...formData, culture: {...formData.culture, typicalDay: [...(formData.culture?.typicalDay || []), { time: "09:00", title: "", desc: "", icon: "Coffee" }]}})}
                                >
                                    <Plus className="w-3 h-3 mr-2" /> Thêm hoạt động
                                </Button>
                             </div>
                        </div>
                    )}

                    {editingSection === 'culture-testimonials' && (
                        <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
                             <div className="space-y-3">
                                {formData.culture?.testimonials?.map((t: any, idx: number) => (
                                    <div key={idx} className="border p-4 rounded-lg space-y-3 bg-slate-50">
                                        <div className="flex justify-between items-center border-b border-slate-200 pb-2 mb-2">
                                            <span className="text-xs font-bold text-slate-400 uppercase">Đánh giá {idx + 1}</span>
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="text-red-400 hover:text-red-600 h-6 w-6"
                                                onClick={() => {
                                                    const newArr = formData.culture.testimonials.filter((_: any, i: number) => i !== idx);
                                                    setFormData({...formData, culture: {...formData.culture, testimonials: newArr}});
                                                }}
                                            >
                                                <X className="w-4 h-4" />
                                            </Button>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <Input 
                                                value={t.name} 
                                                onChange={e => {
                                                    const newArr = [...formData.culture.testimonials];
                                                    newArr[idx].name = e.target.value;
                                                    setFormData({...formData, culture: {...formData.culture, testimonials: newArr}});
                                                }}
                                                placeholder="Tên" 
                                                className="bg-white" 
                                            />
                                            <Input 
                                                value={t.role} 
                                                onChange={e => {
                                                    const newArr = [...formData.culture.testimonials];
                                                    newArr[idx].role = e.target.value;
                                                    setFormData({...formData, culture: {...formData.culture, testimonials: newArr}});
                                                }}
                                                placeholder="Chức vụ" 
                                                className="bg-white" 
                                            />
                                            <div className="col-span-2">
                                                <Label className="mb-1 block text-xs text-slate-500">Ảnh đại diện</Label>
                                                <ImageUpload 
                                                    value={t.image} 
                                                    companyId={company.id}
                                                    onChange={url => {
                                                        const newArr = [...formData.culture.testimonials];
                                                        newArr[idx].image = url;
                                                        setFormData({...formData, culture: {...formData.culture, testimonials: newArr}});
                                                    }}
                                                />
                                            </div>
                                            <Textarea 
                                                value={t.quote} 
                                                onChange={e => {
                                                    const newArr = [...formData.culture.testimonials];
                                                    newArr[idx].quote = e.target.value;
                                                    setFormData({...formData, culture: {...formData.culture, testimonials: newArr}});
                                                }}
                                                placeholder="Trích dẫn" 
                                                className="col-span-2 bg-white" 
                                            />
                                        </div>
                                    </div>
                                ))}
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => setFormData({...formData, culture: {...formData.culture, testimonials: [...(formData.culture?.testimonials || []), { name: "", role: "", quote: "", image: "" }]}})}
                                >
                                    <Plus className="w-3 h-3 mr-2" /> Thêm Testimonial
                                </Button>
                             </div>
                        </div>
                    )}

                    {editingSection === 'awards' && (
                        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                            {formData.awards?.map((award: any, idx: number) => (
                                <div key={idx} className="border p-4 rounded-lg space-y-3 relative bg-slate-50">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="col-span-2">
                                            <Label>Tên giải thưởng</Label>
                                            <Input 
                                                value={award.name} 
                                                onChange={e => {
                                                    const newArr = [...formData.awards];
                                                    newArr[idx].name = e.target.value;
                                                    setFormData({...formData, awards: newArr});
                                                }}
                                                className="bg-white" 
                                            />
                                        </div>
                                        <div>
                                            <Label>Tổ chức</Label>
                                            <Input 
                                                value={award.org} 
                                                onChange={e => {
                                                    const newArr = [...formData.awards];
                                                    newArr[idx].org = e.target.value;
                                                    setFormData({...formData, awards: newArr});
                                                }}
                                                className="bg-white" 
                                            />
                                        </div>
                                        <div>
                                            <Label>Năm</Label>
                                            <Input 
                                                value={award.year} 
                                                onChange={e => {
                                                    const newArr = [...formData.awards];
                                                    newArr[idx].year = e.target.value;
                                                    setFormData({...formData, awards: newArr});
                                                }}
                                                className="bg-white" 
                                            />
                                        </div>
                                    </div>
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="absolute top-2 right-2 text-red-400 hover:text-red-600"
                                        onClick={() => {
                                            const newArr = formData.awards.filter((_: any, i: number) => i !== idx);
                                            setFormData({...formData, awards: newArr});
                                        }}
                                    >
                                        <X className="w-4 h-4" />
                                    </Button>
                                </div>
                            ))}
                            <Button 
                                variant="outline" 
                                className="w-full" 
                                onClick={() => setFormData({...formData, awards: [...(formData.awards || []), { name: "", org: "", year: "" }]})}
                            >
                                <Plus className="w-4 h-4 mr-2" /> Thêm giải thưởng
                            </Button>
                        </div>
                    )}

                    {editingSection === 'story-founder' && (
                        <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
                            <div className="space-y-3">
                                <h4 className="font-bold border-b pb-2">Câu chuyện khởi nguồn</h4>
                                <div className="space-y-2">
                                    <Label>Tiêu đề</Label>
                                    <Input 
                                        value={formData.story?.founderStory?.title || ''} 
                                        onChange={e => setFormData({...formData, story: {...formData.story, founderStory: {...formData.story?.founderStory, title: e.target.value}}})} 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Nội dung</Label>
                                    <Textarea 
                                        rows={6} 
                                        value={formData.story?.founderStory?.content || ''} 
                                        onChange={e => setFormData({...formData, story: {...formData.story, founderStory: {...formData.story?.founderStory, content: e.target.value}}})} 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Người sáng lập (Founder)</Label>
                                    <Input 
                                        value={formData.story?.founderStory?.founder || ''} 
                                        onChange={e => setFormData({...formData, story: {...formData.story, founderStory: {...formData.story?.founderStory, founder: e.target.value}}})} 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Ảnh minh họa</Label>
                                    <ImageUpload 
                                        value={formData.story?.founderStory?.image || ''} 
                                        companyId={company.id}
                                        onChange={url => setFormData({...formData, story: {...formData.story, founderStory: {...formData.story?.founderStory, image: url}}})} 
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {editingSection === 'story-milestones' && (
                        <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
                            <div className="space-y-3">
                                <h4 className="font-bold border-b pb-2">Cột mốc phát triển</h4>
                                {formData.story?.milestones?.map((item: any, idx: number) => (
                                    <div key={idx} className="border p-4 rounded-lg space-y-3 bg-slate-50">
                                        <div className="flex justify-between items-center border-b border-slate-200 pb-2 mb-2">
                                            <span className="text-xs font-bold text-slate-400 uppercase">Cột mốc {idx + 1}</span>
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="text-red-400 hover:text-red-600 h-6 w-6"
                                                onClick={() => {
                                                    const newArr = formData.story.milestones.filter((_: any, i: number) => i !== idx);
                                                    setFormData({...formData, story: {...formData.story, milestones: newArr}});
                                                }}
                                            >
                                                <X className="w-4 h-4" />
                                            </Button>
                                        </div>
                                        <div className="grid grid-cols-1 gap-3">
                                            <div className="flex gap-3">
                                                <div className="w-24">
                                                    <Label>Năm</Label>
                                                    <Input 
                                                        value={item.year} 
                                                        onChange={e => {
                                                            const newArr = [...formData.story.milestones];
                                                            newArr[idx].year = e.target.value;
                                                            setFormData({...formData, story: {...formData.story, milestones: newArr}});
                                                        }}
                                                        className="bg-white" 
                                                    />
                                                </div>
                                                <div className="grow">
                                                    <Label>Tiêu đề</Label>
                                                    <Input 
                                                        value={item.title} 
                                                        onChange={e => {
                                                            const newArr = [...formData.story.milestones];
                                                            newArr[idx].title = e.target.value;
                                                            setFormData({...formData, story: {...formData.story, milestones: newArr}});
                                                        }}
                                                        className="bg-white" 
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <Label>Mô tả</Label>
                                                <Textarea 
                                                    value={item.desc} 
                                                    onChange={e => {
                                                        const newArr = [...formData.story.milestones];
                                                        newArr[idx].desc = e.target.value;
                                                        setFormData({...formData, story: {...formData.story, milestones: newArr}});
                                                    }}
                                                    className="bg-white" 
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                <Button 
                                    variant="outline" 
                                    className="w-full" 
                                    onClick={() => setFormData({...formData, story: {...formData.story, milestones: [...(formData.story?.milestones || []), { year: "", title: "", desc: "" }]}})}
                                >
                                    <Plus className="w-4 h-4 mr-2" /> Thêm cột mốc
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
                
                <DialogFooter>
                    <Button variant="outline" onClick={() => setEditingSection(null)}>Hủy</Button>
                    <Button onClick={handleSave} disabled={mutation.isPending}>
                        {mutation.isPending ? "Đang lưu..." : "Lưu thay đổi"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
     </div>
  );
}
