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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useMutation } from "@tanstack/react-query";
import api from "@/lib/api";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import React from "react";
import { uploadCompanyPostImage } from "@/lib/uploads";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Icon Mapping
const iconMap: any = {
  TrendingUp, Users, Heart, Zap, DollarSign, Target, Globe, Gem, Star, ShieldCheck, 
  Coffee, Layout, Rocket, GraduationCap, Building2, MapPin, Calendar, CheckCircle, ArrowRight, Clock, ChevronRight
};

// Sample data from template-profile/App.tsx, used as demo content in manage mode
const SAMPLE_STATS = [
  { label: 'Tăng trưởng năm', value: '125%', trend: '+15%', icon: 'TrendingUp' },
  { label: 'Nhân sự toàn cầu', value: '500+', icon: 'Users' },
  { label: 'Tỷ lệ giữ chân', value: '96%', icon: 'Heart' },
  { label: 'Tăng lương/năm', value: '15%', icon: 'Zap' },
  { label: 'Tỷ lệ Nam/Nữ', value: '45/55', icon: 'Users' },
  { label: 'Thu nhập TB', value: '$2,500', icon: 'DollarSign' },
];

const SAMPLE_PRODUCTS = [
  'TechCloud', 'SmartAI', 'FinSafe', 'EduMate',
  'HealthLink', 'AutoLog', 'CyberShield', 'GreenEnergy',
].map((name) => ({ name }));

const SAMPLE_RECRUITMENT_PRINCIPLES = [
  {
    title: 'Thái Độ > Trình Độ',
    desc: 'Kỹ năng có thể đào tạo, nhưng thái độ và tư duy tích cực là tố chất sẵn có.',
    icon: 'Star',
  },
  {
    title: 'Phù Hợp Văn Hóa',
    desc: 'Tìm kiếm mảnh ghép phù hợp với giá trị cốt lõi và sứ mệnh của tổ chức.',
    icon: 'Heart',
  },
  {
    title: 'Minh Bạch Quy Trình',
    desc: 'Mọi ứng viên đều được tôn trọng và thông báo kết quả rõ ràng, nhanh chóng.',
    icon: 'ShieldCheck',
  },
  {
    title: 'Đa Dạng & Bao Trùm',
    desc: 'Tôn trọng sự khác biệt, không phân biệt giới tính, vùng miền hay xuất phát điểm.',
    icon: 'Globe',
  },
];

const SAMPLE_BENEFITS = {
  financial: [
    'Mức lương cạnh tranh Top thị trường (P75)',
    'Thưởng tháng 13 cam kết + Thưởng hiệu quả (2-6 tháng lương)',
    'Đánh giá tăng lương định kỳ 2 lần/năm',
    'Gói bảo hiểm sức khỏe Premium cho bản thân và gia đình',
    'Phụ cấp cơm trưa, xăng xe, điện thoại, trang phục',
  ],
  nonFinancial: [
    'Happy Hour thứ 6 hàng tuần, Teabreak mỗi ngày',
    'Company Trip & Team Building chuẩn 5 sao hàng năm',
    'CLB Thể thao (Bóng đá, Yoga, Running) có HLV riêng',
    'Khu vực Pantry, Gaming, Gym ngay tại văn phòng',
    'Chế độ nghỉ phép linh hoạt & Hybrid working',
  ],
};

const SAMPLE_HR_JOURNEY = [
  {
    step: '01',
    title: 'Hội Nhập (Onboarding)',
    desc: '2 tuần đầu tiên: Tìm hiểu văn hóa, quy trình và nhận Mentor hướng dẫn 1-1.',
    color: 'bg-slate-700',
  },
  {
    step: '02',
    title: 'Thử Thách (Probation)',
    desc: '2 tháng thử việc: Tham gia dự án thực tế, thể hiện năng lực và tiềm năng.',
    color: 'bg-slate-800',
  },
  {
    step: '03',
    title: 'Phát Triển (Review)',
    desc: 'Định kỳ 6 tháng: Đánh giá hiệu suất (KPIs/OKRs) và hoạch định lộ trình thăng tiến.',
    color: 'bg-slate-900',
  },
];

const SAMPLE_CAREER_PATH = ['Fresher', 'Junior', 'Senior', 'Team Lead', 'Manager', 'Director'];

const SAMPLE_SALARY_AND_BONUS = {
  salary: ['Lương cứng (Fixed)', 'Phụ cấp (Allowance)', 'Lương tháng 13', 'OT pay (nếu có)'],
  bonus: ['Thưởng dự án (Project)', 'Thưởng nóng (Spot)', 'Thưởng kinh doanh', 'ESOP (Cổ phần)'],
};

const SAMPLE_TRAINING = {
  description:
    'Tại TechCorp, việc học chưa bao giờ dừng lại. Chúng tôi cung cấp tài khoản Udemy, Coursera Business không giới hạn và thư viện sách chuyên ngành phong phú.',
  budget: '20.000.000 VNĐ',
  image: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&q=80&w=800',
  programs: [
    {
      title: 'Workshop Nội Bộ',
      desc: 'Chia sẻ kiến thức chuyên môn (Tech Talk) chiều thứ 6 hàng tuần từ các chuyên gia.',
    },
    {
      title: 'Hệ Thống Mentor',
      desc: 'Chương trình Buddy & Mentor 1-1 giúp định hướng phát triển nghề nghiệp rõ ràng.',
    },
    {
      title: 'Chứng Chỉ Quốc Tế',
      desc: 'Tài trợ 100% lệ phí thi các chứng chỉ AWS, Google, PMP, IELTS...',
    },
  ],
};

const SAMPLE_LEADERS = [
  {
    name: 'Nguyễn Văn Hùng',
    role: 'Chủ tịch HĐQT (Founder & Chairman)',
    image:
      'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=400',
    location: 'Hồ Chí Minh, Việt Nam',
    message: 'Chúng tôi không chỉ xây dựng sản phẩm, chúng tôi kiến tạo di sản.',
  },
  {
    name: 'Trần Thu Hà',
    role: 'Tổng Giám Đốc (CEO)',
    image:
      'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400',
    location: 'Hà Nội, Việt Nam',
    message: 'Con người là tài sản vô giá và là trung tâm của mọi sự phát triển.',
  },
  {
    name: 'Lê Minh Tuấn',
    role: 'Giám đốc Công nghệ (CTO)',
    image:
      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=400',
    location: 'Đà Nẵng, Việt Nam',
    message: 'Đổi mới sáng tạo là DNA của TechCorp.',
  },
];

const SAMPLE_TYPICAL_DAY = [
  { time: '08:30', title: 'Khởi động', desc: 'Check-in & Coffee sáng', icon: 'Coffee' },
  { time: '09:00', title: 'Đồng bộ', desc: 'Daily Standup Meeting', icon: 'Users' },
  { time: '12:00', title: 'Tái tạo', desc: 'Ăn trưa & Nghỉ ngơi', icon: 'Heart' },
  { time: '16:00', title: 'Tập trung', desc: 'Deep Work / Focus Time', icon: 'Zap' },
];

const SAMPLE_AWARDS = [
  { year: '2023', name: 'Nơi làm việc tốt nhất Châu Á', org: 'HR Asia Award' },
  { year: '2022', name: 'Sao Khuê 5 Sao (Phần mềm)', org: 'VINASA' },
  { year: '2021', name: 'Top 50 Doanh Nghiệp CNTT', org: 'VNR500' },
  { year: '2020', name: 'Sản phẩm đổi mới sáng tạo', org: 'Better Choice Award' },
];

const SAMPLE_FOUNDER_STORY = {
  title: '"Từ Garage Nhỏ Đến Giấc Mơ Toàn Cầu"',
  content:
    'Vào một ngày mưa năm 2015, ba kỹ sư trẻ ngồi lại với nhau tại một căn phòng trọ nhỏ ở Sài Gòn. Họ trăn trở về việc làm sao để sản phẩm công nghệ Việt Nam có thể cạnh tranh sòng phẳng trên bản đồ thế giới.\n\nVới số vốn ít ỏi nhưng hoài bão lớn, TechCorp ra đời. Chúng tôi không chỉ xây dựng doanh nghiệp, chúng tôi xây dựng một cộng đồng những người dám nghĩ, dám làm và dám thất bại.',
  founder: 'Nguyễn Văn Hùng - Founder',
};

const SAMPLE_MILESTONES = [
  { year: '2015', title: 'Thành Lập', desc: 'Khởi đầu hành trình từ garage nhỏ với 5 kỹ sư tâm huyết.' },
  { year: '2018', title: 'Vươn Ra Biển Lớn', desc: 'Khai trương văn phòng đại diện tại Singapore và Tokyo.' },
  {
    year: '2020',
    title: 'Vòng Vốn Series B',
    desc: 'Huy động thành công 20 triệu USD từ các quỹ đầu tư uy tín.',
  },
  {
    year: '2023',
    title: 'Top 10 Sao Khuê',
    desc: 'Vinh danh Top 10 Doanh nghiệp Công nghệ xuất sắc nhất.',
  },
];

const SAMPLE_TESTIMONIALS = [
  {
    name: 'Mai Phương Anh',
    role: 'Senior Developer',
    quote:
      'Môi trường làm việc đẳng cấp, sếp luôn lắng nghe và trao quyền cho nhân viên.',
    image:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
  },
  {
    name: 'Nguyễn Quốc Bảo',
    role: 'Product Manager',
    quote:
      'Lộ trình thăng tiến cực kỳ rõ ràng, văn hóa đào tạo bài bản chuẩn quốc tế.',
    image:
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=200',
  },
  {
    name: 'Lê Hương Ly',
    role: 'UI/UX Designer',
    quote:
      'TechCorp giống như ngôi nhà thứ hai, nơi sự sáng tạo không bao giờ bị giới hạn.',
    image:
      'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&q=80&w=200',
  },
];

const SAMPLE_VISION =
  'Trở thành tập đoàn công nghệ số 1 khu vực, tiên phong kiến tạo hệ sinh thái số thông minh phục vụ 100 triệu người dùng.';

const SAMPLE_MISSION =
  'Dùng công nghệ để giải quyết các bài toán xã hội, nâng cao chất lượng cuộc sống và tối ưu hóa năng suất lao động.';

const SAMPLE_CORE_VALUES = [
  'Tận Tâm - Khách hàng là trọng tâm',
  'Sáng Tạo - Đổi mới không ngừng nghỉ',
  'Chính Trực - Minh bạch trong mọi hành động',
  'Hợp Tác - Sức mạnh của sự đoàn kết',
].join('\n');

const SAMPLE_NOTE = 'Đây là dữ liệu mẫu, sẽ được thay thế khi bạn cập nhật dữ liệu chính thức.';

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

const SectionTitle = ({
  title,
  subtitle,
  align = 'center',
}: {
  title: string;
  subtitle?: string;
  align?: 'left' | 'center';
}) => (
  <div className={`mb-10 md:mb-14 ${align === 'center' ? 'text-center' : 'text-left'}`}>
    <h2 className="text-3xl md:text-4xl font-extrabold text-[var(--foreground)] uppercase tracking-tight mb-3">
      {title}
    </h2>
    {subtitle && (
      <p className="text-[var(--muted-foreground)] text-base md:text-lg max-w-3xl mx-auto leading-relaxed">
        {subtitle}
      </p>
    )}
    <div
      className={`h-1.5 w-24 bg-[var(--brand)] rounded-full mt-4 ${align === 'center' ? 'mx-auto' : ''}`}
    ></div>
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
            className="absolute left-2 md:-left-4 top-1/2 -translate-y-1/2 z-10 w-8 h-8 md:w-10 md:h-10 bg-[var(--card)]/90 backdrop-blur rounded-full shadow-lg border border-[var(--border)] flex items-center justify-center text-[var(--muted-foreground)] hover:text-[var(--brand)] hover:border-[var(--brand)]/40 transition-all opacity-0 group-hover/slider:opacity-100"
        >
            <ChevronLeft className="w-5 h-5" />
        </button>
        )}
        {canScrollNext && (
        <button 
            onClick={scrollNext} 
            className="absolute right-2 md:-right-4 top-1/2 -translate-y-1/2 z-10 w-8 h-8 md:w-10 md:h-10 bg-[var(--card)]/90 backdrop-blur rounded-full shadow-lg border border-[var(--border)] flex items-center justify-center text-[var(--muted-foreground)] hover:text-[var(--brand)] hover:border-[var(--brand)]/40 transition-all opacity-0 group-hover/slider:opacity-100"
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

const SortableStatementItem = ({ id, statement, toggleStatementPublic }: { id: string, statement: any, toggleStatementPublic: (s: any, checked: boolean) => void }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 999 : 'auto',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
          "flex items-center justify-between p-3 rounded-lg border bg-white transition-all touch-none select-none",
          isDragging ? "border-blue-500 shadow-lg scale-[1.02]" : "border-slate-200 hover:border-slate-300"
      )}
    >
        <div className="flex items-center gap-3 flex-1 min-w-0">
             <div {...attributes} {...listeners} className="cursor-grab text-slate-400 hover:text-slate-600 flex-shrink-0 p-1 hover:bg-slate-100 rounded active:cursor-grabbing">
                 <Layout className="w-4 h-4" /> 
             </div>
             <div className="space-y-1 flex-1 min-w-0">
                <div className="font-medium text-sm text-slate-900 line-clamp-2">{statement.title}</div>
                <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span>{statement.percentYes ?? 0}% xác thực</span>
                    <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                    <span>{statement.status === 'ACTIVE' ? 'Đang hoạt động' : 'Đã kết thúc'}</span>
                </div>
            </div>
        </div>
        
        <div className="flex items-center gap-2 pl-4 flex-shrink-0">
            <span className={cn("text-xs font-medium", statement.isPublic ? "text-blue-600" : "text-slate-400")}>
                {statement.isPublic ? "Công khai" : "Ẩn"}
            </span>
            <input
                type="checkbox"
                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                checked={!!statement.isPublic}
                onChange={(e) => toggleStatementPublic(statement, e.target.checked)}
            />
        </div>
    </div>
  );
};

export default function CompanyProfileContent({ company, isEditable = false }: Props) {
  const { profile } = company;
  const router = useRouter();
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>({});

  // Company statements (Triết lý quản trị) & verification lists
  const [statements, setStatements] = useState<any[] | null>(null);
  const [statementsLoading, setStatementsLoading] = useState(false);
  const [statementsError, setStatementsError] = useState<string | null>(null);

  const [verificationLists, setVerificationLists] = useState<any[]>([]);
  const [listsLoading, setListsLoading] = useState(false);
  const [selectedListId, setSelectedListId] = useState<string>("");
  
  // State for new statements (array)
  const [newStatements, setNewStatements] = useState<
    Array<{ title: string; description: string; isPublic: boolean }>
  >([{ title: "", description: "", isPublic: true }]);
  
  const [sendingStatement, setSendingStatement] = useState(false);
  const [uploadingCsvList, setUploadingCsvList] = useState(false);
  const [manageStatementsOpen, setManageStatementsOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setStatements((items) => {
        if (!items) return items;
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        
        const newItems = arrayMove(items, oldIndex, newIndex);
        
        // Call API to save order
        const orders = newItems.map((item, index) => ({
            id: item.id,
            order: index
        }));
        
        api.put(`/api/companies/${company.id}/statements/reorder`, { orders })
           .catch(err => {
               console.error("Failed to reorder statements", err);
               toast.error("Không thể lưu thứ tự sắp xếp");
           });

        return newItems;
      });
    }
  };

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

  // Load statements stats cho "Triết lý quản trị"
  useEffect(() => {
    let cancelled = false;
    async function loadStatements() {
      try {
        setStatementsLoading(true);
        setStatementsError(null);

        const url = isEditable
          ? `/api/companies/${company.id}/statements`
          : `/api/companies/public/${company.slug}/statements`;

        const res = await api.get(url);
        const items = res.data?.data?.statements ?? [];
        if (!cancelled) {
          setStatements(items);
        }
      } catch (error: any) {
        const status = error?.response?.status;
        if (!cancelled) {
          // Nếu là lỗi 403 ở chế độ edit: user không có quyền ADMIN/OWNER
          // => không log lỗi và không hiển thị thông báo, chỉ để dữ liệu rỗng
          if (status === 403 && isEditable) {
            setStatements([]);
            setStatementsError(null);
          } else {
            console.error("Failed to load company statements", error);
            setStatementsError("Không thể tải số liệu xác thực cam kết.");
          }
        }
      } finally {
        if (!cancelled) {
          setStatementsLoading(false);
        }
      }
    }

    loadStatements();
    return () => {
      cancelled = true;
    };
  }, [company.id, company.slug, isEditable]);

  // Load danh sách file CSV "verification contacts" (chỉ ở chế độ edit)
  useEffect(() => {
    if (!isEditable) return;
    let cancelled = false;

    async function loadLists() {
      try {
        setListsLoading(true);
        const res = await api.get(`/api/companies/${company.id}/verification-contacts/lists`);
        const lists = res.data?.data?.lists ?? [];
        if (!cancelled) {
          setVerificationLists(lists);
          if (!selectedListId && lists.length > 0) {
            setSelectedListId(lists[0].id);
          }
        }
      } catch (error: any) {
        const status = error?.response?.status;
        // Nếu là lỗi 403: user không có quyền ADMIN/OWNER → im lặng, không log AxiosError
        if (status === 403) {
          if (!cancelled) {
            setVerificationLists([]);
          }
        } else {
          console.error("Failed to load verification contact lists", error);
        }
      } finally {
        if (!cancelled) {
          setListsLoading(false);
        }
      }
    }

    loadLists();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [company.id, isEditable]);

  const handleUploadCsvList = async (file: File) => {
    try {
      setUploadingCsvList(true);
      const base64 = await fileToBase64(file);
      await api.post(`/api/companies/${company.id}/verification-contacts/upload-csv`, {
        fileName: file.name,
        fileType: file.type || "text/csv",
        fileData: base64,
      });
      toast.success("Tải danh sách email thành công");

      // Reload lists
      try {
        setListsLoading(true);
        const res = await api.get(`/api/companies/${company.id}/verification-contacts/lists`);
        const lists = res.data?.data?.lists ?? [];
        setVerificationLists(lists);
        if (!selectedListId && lists.length > 0) {
          setSelectedListId(lists[0].id);
        }
      } finally {
        setListsLoading(false);
      }
    } catch (error) {
      console.error(error);
      toast.error("Tải danh sách email thất bại");
    } finally {
      setUploadingCsvList(false);
    }
  };

  const handleSendStatement = async () => {
    if (!selectedListId) {
      toast.error("Vui lòng chọn danh sách email nhân viên.");
      return;
    }

    // Filter out empty statements
    const validStatements = newStatements
      .map(s => ({ ...s, title: s.title.trim(), description: s.description.trim() }))
      .filter(s => s.title.length > 0);

    if (validStatements.length === 0) {
      toast.error("Vui lòng nhập ít nhất một tuyên bố.");
      return;
    }

    try {
      setSendingStatement(true);
      await api.post(`/api/companies/${company.id}/statements/send`, {
        listId: selectedListId,
        statements: validStatements.map(s => ({
            title: s.title,
            description: s.description || undefined,
            isPublic: s.isPublic
        })),
      });
      toast.success("Đã gửi tuyên bố cho nhân viên xác thực");
      
      // Reset form
      setNewStatements([{ title: "", description: "", isPublic: true }]);
      setManageStatementsOpen(false);

      // Reload statements stats
      try {
        setStatementsLoading(true);
        const res = await api.get(`/api/companies/${company.id}/statements`);
        const items = res.data?.data?.statements ?? [];
        setStatements(items);
      } finally {
        setStatementsLoading(false);
      }
    } catch (error) {
      console.error(error);
      toast.error("Gửi tuyên bố thất bại. Vui lòng thử lại.");
    } finally {
      setSendingStatement(false);
    }
  };

  const toggleStatementPublic = async (statement: any, newStatus: boolean) => {
    try {
      // Optimistic update
      setStatements((prev) =>
        (prev || []).map((s: any) =>
          s.id === statement.id ? { ...s, isPublic: newStatus } : s
        )
      );

      await api.patch(
        `/api/companies/${company.id}/statements/${statement.id}`,
        { isPublic: newStatus }
      );
      toast.success("Đã cập nhật trạng thái hiển thị");
    } catch (error) {
      console.error(error);
      toast.error("Cập nhật thất bại.");
      // Revert on error
      setStatements((prev) =>
        (prev || []).map((s: any) =>
          s.id === statement.id ? { ...s, isPublic: !newStatus } : s
        )
      );
    }
  };

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
  const stats = (profile?.stats as any[]) || [];
  const products = (profile?.products as any[]) || [];
  const recruitmentPrinciples = (profile?.recruitmentPrinciples as any[]) || [];
  const benefits = (profile?.benefits as any) || { financial: [], nonFinancial: [] };
  const hrJourney = (profile?.hrJourney as any[]) || [];
  const careerPath = (profile?.careerPath as any[]) || [];
  const salaryAndBonus = (profile?.salaryAndBonus as any) || { salary: [], bonus: [] };
  const training = (profile?.training as any) || { programs: [] };
  const leaders = (profile?.leaders as any[]) || [];
  const culture = (profile?.culture as any) || { typicalDay: [], testimonials: [] };
  const awards = (profile?.awards as any[]) || [];
  const story = (profile?.story as any) || { founderStory: {}, milestones: [] };

  // Flags & merged data to decide when to use sample template content (only in manage mode)
  const usingSampleStats = isEditable && stats.length === 0;
  const statsToRender = !isEditable || stats.length > 0 ? stats : SAMPLE_STATS;

  const usingSampleProducts = isEditable && products.length === 0;
  const productsToRender = !isEditable || products.length > 0 ? products : SAMPLE_PRODUCTS;

  const usingSampleRecruitmentPrinciples = isEditable && recruitmentPrinciples.length === 0;
  const recruitmentPrinciplesToRender =
    !isEditable || recruitmentPrinciples.length > 0
      ? recruitmentPrinciples
      : SAMPLE_RECRUITMENT_PRINCIPLES;

  const usingSampleBenefits =
    isEditable &&
    (!benefits?.financial || benefits.financial.length === 0) &&
    (!benefits?.nonFinancial || benefits.nonFinancial.length === 0);
  const benefitsFinancialToRender =
    !isEditable || (benefits.financial && benefits.financial.length > 0)
      ? benefits.financial || []
      : SAMPLE_BENEFITS.financial;
  const benefitsNonFinancialToRender =
    !isEditable || (benefits.nonFinancial && benefits.nonFinancial.length > 0)
      ? benefits.nonFinancial || []
      : SAMPLE_BENEFITS.nonFinancial;

  const usingSampleHrJourney = isEditable && hrJourney.length === 0;
  const hrJourneyToRender =
    !isEditable || hrJourney.length > 0 ? hrJourney : SAMPLE_HR_JOURNEY;

  const usingSampleCareerPath = isEditable && careerPath.length === 0;
  const careerPathToRender =
    !isEditable || careerPath.length > 0 ? careerPath : SAMPLE_CAREER_PATH;

  const usingSampleSalaryAndBonus =
    isEditable &&
    (!salaryAndBonus?.salary || salaryAndBonus.salary.length === 0) &&
    (!salaryAndBonus?.bonus || salaryAndBonus.bonus.length === 0);
  const salaryItemsToRender =
    !isEditable || (salaryAndBonus.salary && salaryAndBonus.salary.length > 0)
      ? salaryAndBonus.salary || []
      : SAMPLE_SALARY_AND_BONUS.salary;
  const bonusItemsToRender =
    !isEditable || (salaryAndBonus.bonus && salaryAndBonus.bonus.length > 0)
      ? salaryAndBonus.bonus || []
      : SAMPLE_SALARY_AND_BONUS.bonus;

  const usingSampleTraining =
    isEditable &&
    !profile?.training &&
    !(training.description || training.budget || (training.programs || []).length > 0);
  const trainingDescriptionToRender =
    training.description || (usingSampleTraining ? SAMPLE_TRAINING.description : '');
  const trainingBudgetToRender =
    training.budget || (usingSampleTraining ? SAMPLE_TRAINING.budget : undefined);
  const trainingImageToRender =
    training.image || SAMPLE_TRAINING.image;
  const trainingProgramsToRender =
    (training.programs?.length || 0) > 0 || !isEditable
      ? training.programs || []
      : SAMPLE_TRAINING.programs;

  const usingSampleLeaders = isEditable && leaders.length === 0;
  const leadersToRender = !isEditable || leaders.length > 0 ? leaders : SAMPLE_LEADERS;

  const usingSampleTypicalDay =
    isEditable && (!culture.typicalDay || culture.typicalDay.length === 0);
  const typicalDayToRender =
    !isEditable || (culture.typicalDay && culture.typicalDay.length > 0)
      ? culture.typicalDay || []
      : SAMPLE_TYPICAL_DAY;

  const usingSampleAwards = isEditable && awards.length === 0;
  const awardsToRender = !isEditable || awards.length > 0 ? awards : SAMPLE_AWARDS;

  const usingSampleFounderStory =
    isEditable && !story.founderStory?.title;
  const founderStoryToRender =
    story.founderStory && story.founderStory.title
      ? story.founderStory
      : usingSampleFounderStory
      ? SAMPLE_FOUNDER_STORY
      : null;

  const usingSampleMilestones =
    isEditable && (!story.milestones || story.milestones.length === 0);
  const milestonesToRender =
    !isEditable || (story.milestones && story.milestones.length > 0)
      ? story.milestones || []
      : SAMPLE_MILESTONES;

  const usingSampleTestimonials =
    isEditable && (!culture.testimonials || culture.testimonials.length === 0);
  const testimonialsToRender =
    !isEditable || (culture.testimonials && culture.testimonials.length > 0)
      ? culture.testimonials || []
      : SAMPLE_TESTIMONIALS;

  const usingSampleVision = isEditable && !profile?.vision;
  const usingSampleMission = isEditable && !profile?.mission;
  const usingSampleCoreValues = isEditable && !profile?.coreValues;

  return (
     <div className="space-y-32 py-12">
        {/* SECTION 2: STATS */}
        <section className="max-w-7xl mx-auto px-6 animate-fade-in-up relative group/section">
          <div className="relative rounded-3xl border border-[var(--border)]/60 bg-[var(--card)]/5 px-6 md:px-10 py-10 md:py-12 overflow-hidden">
            <div className="pointer-events-none absolute inset-x-10 -top-20 h-40 bg-gradient-to-r from-[var(--brand)]/10 via-transparent to-[var(--brand-secondary)]/10 blur-3xl" />

            {isEditable && (
              <div className="absolute top-6 right-6 opacity-0 group-hover/section:opacity-100 transition-opacity z-30">
                <Button
                  onClick={() => handleEdit('stats', { stats })}
                  variant="outline"
                  size="sm"
                  className="bg-[var(--card)]/90 backdrop-blur border-[var(--border)]"
                >
                  <Pencil className="w-3 h-3 mr-2" /> Chỉnh sửa số liệu
                </Button>
              </div>
            )}

            <SectionTitle
              title="NHỮNG CON SỐ BIẾT NÓI"
              subtitle={`Thành tựu ấn tượng khẳng định vị thế dẫn đầu sau ${
                new Date().getFullYear() - (company.foundedYear || 2015)
              } năm phát triển`}
            />

            <SectionCarousel className="mt-4">
              {statsToRender.map((stat: any, idx: number) => {
                const Icon = iconMap[stat.icon] || TrendingUp;
                return (
                  <div
                    key={idx}
                    className="bg-[var(--card)] rounded-3xl px-6 py-7 shadow-lg shadow-black/5 border border-[var(--border)] hover:-translate-y-2 hover:shadow-xl transition-all duration-300 relative overflow-hidden group min-w-[220px] w-[220px] flex flex-col justify-center items-center text-center select-none"
                  >
                    <div className="absolute -top-6 -right-4 opacity-10 group-hover:opacity-20 transition-opacity">
                      <Icon size={72} className="text-[var(--brand-secondary)]" />
                    </div>
                    <div className="text-3xl md:text-4xl font-black text-[var(--brand)] mb-1.5 relative z-10">
                      {stat.value}
                    </div>
                    <div className="text-xs md:text-sm font-semibold text-[var(--muted-foreground)] uppercase tracking-[0.18em] relative z-10">
                      {stat.label}
                    </div>
                  </div>
                );
              })}
            </SectionCarousel>

            {isEditable && usingSampleStats && (
              <p className="mt-6 text-xs text-[var(--muted-foreground)] italic text-center">
                {SAMPLE_NOTE}
              </p>
            )}
          </div>
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
                    {profile?.vision || (isEditable ? SAMPLE_VISION : "Chưa cập nhật")}
                 </p>
              </div>

              {/* Mission */}
              <div className="bg-white rounded-3xl p-10 shadow-2xl border border-slate-200 relative overflow-hidden border-t-4 border-blue-600 group">
                 <EditBtn section="mission" initialData={{ mission: profile?.mission || "" }} />
                 <Globe className="w-16 h-16 mb-6 text-blue-600" />
                 <h3 className="text-3xl font-bold mb-4 text-slate-900">Sứ Mệnh</h3>
                 <p className="text-slate-600 leading-relaxed text-lg whitespace-pre-line">
                    {profile?.mission || (isEditable ? SAMPLE_MISSION : "Chưa cập nhật")}
                 </p>
              </div>

              {/* Core Values */}
              <div className="bg-white rounded-3xl p-10 shadow-2xl border border-slate-200 relative overflow-hidden border-t-4 border-blue-600 group">
                 <EditBtn section="coreValues" initialData={{ coreValues: profile?.coreValues || "" }} />
                 <Gem className="w-16 h-16 mb-6 text-blue-600" />
                 <h3 className="text-3xl font-bold mb-6 text-slate-900">Giá Trị Cốt Lõi</h3>
                 <div className="space-y-4">
                    {/* Parse core values string to list if possible, else display text */}
                    {(profile?.coreValues || (isEditable ? SAMPLE_CORE_VALUES : ""))
                      .split('\n')
                      .filter((val) => val.trim().length > 0)
                      .map((val: string, i: number) => (
                        <div key={i} className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-900 font-bold shrink-0 mt-1">
                            {i+1}
                          </div>
                          <div className="text-slate-700 font-medium leading-relaxed">{val}</div>
                        </div>
                      ))}
                 </div>
              </div>
           </div>
           {isEditable && (usingSampleVision || usingSampleMission || usingSampleCoreValues) && (
             <p className="mt-4 text-xs text-slate-400 italic text-center md:text-left">
               {SAMPLE_NOTE}
             </p>
           )}
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

                {/* Right: Management Stats - verified by employees */}
                <div className="relative">
                      {isEditable && (
                        <div className="absolute top-0 right-0 z-10">
                             <Button onClick={() => setManageStatementsOpen(true)} variant="outline" size="sm" className="bg-white shadow-sm hover:bg-slate-50 text-slate-700">
                                <Pencil className="w-3 h-3 mr-2" /> Cập nhật
                            </Button>
                        </div>
                      )}
                      
                      <Badge>TRIẾT LÝ QUẢN TRỊ</Badge>
                      <h2 className="text-4xl font-extrabold text-slate-900 mt-4 mb-6 leading-tight">
                        Cam Kết Được <br/><span className="text-blue-600">Xác Thực Bởi Số Liệu</span>
                      </h2>
                      <p className="text-slate-600 text-lg mb-6">
                        Các tuyên bố dưới đây được xác thực trực tiếp bởi nhân viên thông qua email riêng biệt.
                      </p>

                      <Dialog open={manageStatementsOpen} onOpenChange={setManageStatementsOpen}>
                        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto bg-white sm:p-8">
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-bold">Quản lý Cam Kết & Xác thực</DialogTitle>
                                <DialogDescription className="text-slate-500">
                                    Tạo các tuyên bố mới để gửi email xác thực cho nhân viên, hoặc quản lý hiển thị các tuyên bố đã có.
                                </DialogDescription>
                            </DialogHeader>
                            
                            <div className="space-y-8 py-6">
                                {/* 1. EXISTING STATEMENTS (Now First) */}
                                <div className="space-y-4 border-b border-slate-100 pb-8">
                                     <h4 className="font-semibold text-slate-900 flex items-center gap-2 text-lg">
                                        <span className="w-7 h-7 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold">1</span>
                                        Quản lý tuyên bố hiện tại ({statements?.length || 0})
                                    </h4>
                                    <div className="pl-9 space-y-3">
                                        {!statements || statements.length === 0 ? (
                                            <p className="text-sm text-slate-400 italic">Chưa có tuyên bố nào.</p>
                                        ) : (
                                            <DndContext
                                              sensors={sensors}
                                              collisionDetection={closestCenter}
                                              onDragEnd={handleDragEnd}
                                            >
                                              <SortableContext
                                                items={statements.map((s: any) => s.id)}
                                                strategy={verticalListSortingStrategy}
                                              >
                                                  <div className="grid gap-3 max-h-[300px] overflow-y-auto pr-2">
                                                      {statements.map((s: any) => (
                                                          <SortableStatementItem
                                                              key={s.id}
                                                              id={s.id}
                                                              statement={s}
                                                              toggleStatementPublic={toggleStatementPublic}
                                                          />
                                                      ))}
                                                  </div>
                                              </SortableContext>
                                            </DndContext>
                                        )}
                                    </div>
                                </div>

                                {/* 2. NEW STATEMENTS (Now Second) */}
                                <div className="space-y-4 border-b border-slate-100 pb-8">
                                     <h4 className="font-semibold text-slate-900 flex items-center gap-2 text-lg">
                                        <span className="w-7 h-7 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold">2</span>
                                        Tạo tuyên bố mới
                                    </h4>
                                    <div className="pl-9 space-y-4">
                                        {newStatements.map((stmt, idx) => (
                                            <div key={idx} className="bg-slate-50 p-4 rounded-xl border border-slate-100 relative group">
                                                {newStatements.length > 1 && (
                                                    <button 
                                                        onClick={() => {
                                                            const next = [...newStatements];
                                                            next.splice(idx, 1);
                                                            setNewStatements(next);
                                                        }}
                                                        className="absolute top-2 right-2 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                                                    >
                                                        <Trash className="w-4 h-4" />
                                                    </button>
                                                )}
                                                <div className="space-y-3">
                                                    <div>
                                                        <Label className="text-xs text-slate-500 mb-1.5 block uppercase font-semibold">Nội dung tuyên bố {idx + 1}</Label>
                                                        <Input
                                                            value={stmt.title}
                                                            onChange={(e) => {
                                                                const next = [...newStatements];
                                                                next[idx].title = e.target.value;
                                                                setNewStatements(next);
                                                            }}
                                                            placeholder="Ví dụ: 10 năm hoạt động công ty luôn thưởng lương tháng 13"
                                                            className="bg-white"
                                                        />
                                                    </div>
                                                    <div>
                                                        <Input
                                                            value={stmt.description}
                                                            onChange={(e) => {
                                                                const next = [...newStatements];
                                                                next[idx].description = e.target.value;
                                                                setNewStatements(next);
                                                            }}
                                                            placeholder="Mô tả thêm (tuỳ chọn)..."
                                                            className="bg-white text-sm"
                                                        />
                                                    </div>
                                                    <label className="flex items-center gap-2 cursor-pointer select-none">
                                                        <input
                                                            type="checkbox"
                                                            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                                            checked={stmt.isPublic}
                                                            onChange={(e) => {
                                                                const next = [...newStatements];
                                                                next[idx].isPublic = e.target.checked;
                                                                setNewStatements(next);
                                                            }}
                                                        />
                                                        <span className="text-sm text-slate-600">Hiển thị công khai trên hồ sơ</span>
                                                    </label>
                                                </div>
                                            </div>
                                        ))}
                                        
                                        <Button 
                                            variant="outline" 
                                            size="sm" 
                                            onClick={() => setNewStatements([...newStatements, { title: "", description: "", isPublic: true }])}
                                            className="w-full border-dashed border-slate-300 text-slate-500 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50/50"
                                        >
                                            <Plus className="w-4 h-4 mr-2" /> Thêm dòng tuyên bố khác
                                        </Button>
                                    </div>
                                </div>

                                {/* 3. SELECT LIST (Now Third) */}
                                <div className="space-y-4">
                                    <h4 className="font-semibold text-slate-900 flex items-center gap-2 text-lg">
                                        <span className="w-7 h-7 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold">3</span>
                                        Danh sách email nhân viên
                                    </h4>
                                    <div className="pl-9 space-y-4">
                                        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end bg-slate-50 p-4 rounded-xl border border-slate-100">
                                            <div className="flex-1 w-full">
                                                <Label className="text-sm font-medium text-slate-700 mb-2 block">Chọn danh sách đã tải lên</Label>
                                                <select
                                                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                                    value={selectedListId}
                                                    onChange={(e) => setSelectedListId(e.target.value)}
                                                >
                                                    <option value="">-- Chọn danh sách email --</option>
                                                    {verificationLists.map((l) => (
                                                    <option key={l.id} value={l.id}>
                                                        {l.name} ({l.contactsCount} email)
                                                    </option>
                                                    ))}
                                                </select>
                                                {listsLoading && <p className="text-xs text-slate-400 mt-1">Đang tải danh sách...</p>}
                                            </div>
                                            
                                            <div className="flex items-center gap-3 w-full sm:w-auto">
                                                 <a
                                                    href="/verification-contacts-template.csv"
                                                    download="verification-contacts-template.csv"
                                                    className="text-sm text-blue-600 hover:text-blue-700 font-medium underline px-2"
                                                >
                                                    Tải mẫu CSV
                                                </a>
                                                <label className="flex-1 sm:flex-none whitespace-nowrap inline-flex items-center justify-center px-4 py-2.5 rounded-lg text-sm font-medium border border-slate-200 bg-white text-slate-700 cursor-pointer hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-sm">
                                                    <input
                                                    type="file"
                                                    accept=".csv,text/csv"
                                                    className="hidden"
                                                    onChange={async (e) => {
                                                        const file = e.target.files?.[0];
                                                        if (!file) return;
                                                        await handleUploadCsvList(file);
                                                        e.target.value = "";
                                                    }}
                                                    disabled={uploadingCsvList}
                                                    />
                                                    {uploadingCsvList ? (
                                                    <>
                                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                        Đang tải lên...
                                                    </>
                                                    ) : (
                                                    <>
                                                        <ImagePlus className="w-4 h-4 mr-2" />
                                                        Tải danh sách mới
                                                    </>
                                                    )}
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                             <DialogFooter className="gap-2 sm:gap-0">
                                <Button variant="ghost" onClick={() => setManageStatementsOpen(false)}>Đóng</Button>
                                <Button onClick={handleSendStatement} disabled={sendingStatement} className="bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-200">
                                    {sendingStatement ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Đang xử lý...
                                        </>
                                    ) : (
                                        <>Lưu & Gửi email xác thực</>
                                    )}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                      </Dialog>

                      <div className="space-y-4 mt-4">
                        {statementsLoading && (
                          <div className="text-sm text-slate-400 italic">Đang tải số liệu xác thực...</div>
                        )}
                        {statementsError && !statementsLoading && (
                          <div className="text-sm text-red-500">{statementsError}</div>
                        )}
                        {!statementsLoading && !statementsError && (statements?.length ?? 0) === 0 && (
                          <div className="text-slate-400 italic text-sm">
                            Chưa có tuyên bố nào được xác thực. Doanh nghiệp có thể tạo tuyên bố và gửi email cho nhân viên để bắt đầu thu thập số liệu.
                          </div>
                        )}

                        {statements && statements.length > 0 && (
                          <div className="space-y-4">
                            {statements.map((s: any) => (
                              <TooltipProvider key={s.id} delayDuration={100}>
                                  <Tooltip>
                                      <TooltipTrigger asChild>
                                        <div
                                            className="relative group/statement rounded-xl border border-slate-200 bg-white/80 px-4 py-3 shadow-sm hover:shadow-md transition-shadow cursor-default"
                                        >
                                            <div className="space-y-2">
                                            <div className="flex items-center justify-between gap-3">
                                                <div className="text-sm font-semibold text-slate-900 line-clamp-2">
                                                {s.title}
                                                </div>
                                                <div className="text-xs text-slate-600 whitespace-nowrap font-medium bg-slate-100 px-2 py-1 rounded-full">
                                                {Math.round(s.percentYes ?? 0)}%
                                                </div>
                                            </div>
                                            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                                <div
                                                className="h-full bg-slate-900 rounded-full"
                                                style={{ width: `${Math.min(100, Math.max(0, s.percentYes ?? 0))}%` }}
                                                />
                                            </div>
                                            {isEditable && (
                                                <div className="flex items-center justify-between text-[11px] text-slate-400">
                                                <div>
                                                    {s.isExpired || s.status === "EXPIRED"
                                                    ? "Đã kết thúc xác thực"
                                                    : "Đang trong thời gian xác thực"}
                                                </div>
                                                <div className="flex gap-2">
                                                    {s.sentAt && (
                                                    <span>Gửi: {new Date(s.sentAt).toLocaleDateString("vi-VN")}</span>
                                                    )}
                                                    {s.expiresAt && (
                                                    <span>
                                                        Hết hạn: {new Date(s.expiresAt).toLocaleDateString("vi-VN")}
                                                    </span>
                                                    )}
                                                </div>
                                                </div>
                                            )}
                                            </div>
                                        </div>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                          <p>{(s.yesCount ?? 0)}/{s.totalRecipients ?? 0} nhân sự xác thực đúng</p>
                                      </TooltipContent>
                                  </Tooltip>
                              </TooltipProvider>
                            ))}
                          </div>
                        )}
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
                
                {productsToRender.length > 0 ? (
                    <SectionCarousel>
                      {productsToRender.map((prod: any, i: number) => (
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
            {isEditable && usingSampleProducts && (
              <p className="mt-4 text-xs text-slate-400 italic text-center">
                {SAMPLE_NOTE}
              </p>
            )}
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
                  {recruitmentPrinciplesToRender.map((rule: any, i: number) => {
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
                  {/* {recruitmentPrinciples.length === 0 && isEditable && (
                      <div className="col-span-full text-center text-slate-500 italic border border-dashed p-8 rounded-xl">
                          Chưa có nguyên tắc nào.
                      </div>
                  )} */}
                </div>
                {isEditable && usingSampleRecruitmentPrinciples && (
                  <p className="mt-4 text-xs text-slate-400 italic text-center md:text-left">
                    {SAMPLE_NOTE}
                  </p>
                )}
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
                      {benefitsFinancialToRender.length > 0 ? (
                          benefitsFinancialToRender.map((item: string, i: number) => (
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
                      {benefitsNonFinancialToRender.length > 0 ? (
                          benefitsNonFinancialToRender.map((item: string, i: number) => (
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
            {isEditable && usingSampleBenefits && (
              <p className="mt-4 text-xs text-slate-400 italic text-center md:text-left">
                {SAMPLE_NOTE}
              </p>
            )}
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
                          {hrJourneyToRender.map((item: any, i: number) => (
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
            {isEditable && usingSampleHrJourney && (
              <p className="mt-4 px-6 text-xs text-slate-400 italic text-center md:text-left">
                {SAMPLE_NOTE}
              </p>
            )}
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
                {careerPathToRender.length > 0 ? (
                    <div className="bg-slate-900 text-white rounded-[3rem] p-10 md:p-16 text-center">
                        <h3 className="text-3xl font-bold mb-12">LỘ TRÌNH THĂNG TIẾN KHÔNG GIỚI HẠN</h3>
                        <div className="flex flex-col md:flex-row justify-center items-center gap-2 md:gap-0">
                          {careerPathToRender.map((level: string, i: number) => (
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
                {isEditable && usingSampleCareerPath && (
                  <p className="!mt-4 px-6 text-xs text-slate-400 italic text-center md:text-left">
                    {SAMPLE_NOTE}
                  </p>
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
                    {salaryItemsToRender.length > 0 ? (
                        salaryItemsToRender.map((item: string, i: number) => (
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
                    {bonusItemsToRender.length > 0 ? (
                        bonusItemsToRender.map((item: string, i: number) => (
                          <div key={i} className="flex items-center gap-2 text-sm text-slate-700"><div className="w-2 h-2 bg-blue-600 rounded-full"></div>{item}</div>
                        ))
                    ) : (
                        <div className="col-span-2 text-sm text-slate-400 italic">Đang cập nhật...</div>
                    )}
                </div>
            </div>
        </section>
        {isEditable && usingSampleSalaryAndBonus && (
          <p className="!mt-4 px-6 text-xs text-slate-400 italic text-center md:text-left">
            {SAMPLE_NOTE}
          </p>
        )}

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
                      {trainingDescriptionToRender || `Tại ${company.name}, việc học chưa bao giờ dừng lại. Chúng tôi cung cấp tài nguyên học tập không giới hạn và thư viện sách chuyên ngành phong phú.`}
                  </p>
                  {trainingBudgetToRender && (
                      <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/20 flex items-center gap-6">
                          <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center shrink-0 animate-pulse">
                            <GraduationCap size={32} />
                          </div>
                          <div>
                            <p className="text-sm text-slate-300 uppercase font-bold tracking-wider mb-1">Ngân sách đào tạo</p>
                            <p className="text-2xl md:text-3xl font-bold">{trainingBudgetToRender} <span className="text-sm font-normal text-slate-300">/nhân sự/năm</span></p>
                          </div>
                      </div>
                  )}
                </div>
                <div className="md:w-1/2 relative z-10">
                  <img 
                    src={trainingImageToRender} 
                    alt="Training" 
                    className="rounded-3xl shadow-2xl rotate-3 border-8 border-white/10 grayscale-[50%] object-cover aspect-video w-full" 
                  />
                </div>
            </div>

             <div className="mt-12">
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-slate-800 border-l-4 border-slate-900 pl-4">
                    Chương Trình Đào Tạo
                  </h3>
                </div>
                <SectionCarousel>
                  {trainingProgramsToRender.map((prog: any, i: number) => (
                    <div
                      key={i}
                      className="bg-white p-8 rounded-3xl border border-slate-200 hover:shadow-lg transition-shadow w-[85vw] md:w-[350px] shrink-0"
                    >
                      <h4 className="text-xl font-bold text-slate-900 mb-3">{prog.title}</h4>
                      <p className="text-slate-600">{prog.desc}</p>
                    </div>
                  ))}
                </SectionCarousel>
              </div>
        </section>
        {isEditable && usingSampleTraining && (
          <p className="!mt-2 text-xs text-slate-400 italic text-center md:text-left">
            {SAMPLE_NOTE}
          </p>
        )}

        {/* SECTION 10: LEADERS */}
        {(leadersToRender.length > 0 || isEditable) && (
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
                        {leadersToRender.map((leader: any, i: number) => (
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
                {/* {leaders.length === 0 && isEditable && (
                  <div className="w-full text-center text-slate-500 italic border border-dashed p-8 rounded-xl mt-8">
                      Chưa có thông tin ban lãnh đạo.
                  </div>
              )} */}
              {isEditable && usingSampleLeaders && (
                <p className="mt-4 text-xs text-slate-400 italic text-center md:text-left">
                  {SAMPLE_NOTE}
                </p>
              )}
            </section>
        )}

        {/* SECTION 11: TYPICAL DAY */}
        <section className="bg-slate-50 pt-10 rounded-[3rem] mx-6 relative group/culture-day">
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
                  {typicalDayToRender.map((slot: any, i: number) => {
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
        {isEditable && usingSampleTypicalDay && (
          <p className="!mt-4 px-6 text-xs text-slate-400 italic text-center md:text-left">
            {SAMPLE_NOTE}
          </p>
        )}

        {/* SECTION 14: AWARDS */}
        {(awardsToRender.length > 0 || isEditable) && (
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
                    {awardsToRender.map((award: any, i: number) => (
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
                {/* {awards.length === 0 && isEditable && (
                  <div className="w-full text-center text-slate-500 italic border border-dashed p-8 rounded-xl">
                      Chưa có giải thưởng.
                  </div>
                )} */}
                {isEditable && usingSampleAwards && (
                  <p className="mt-4 text-xs text-slate-400 italic text-center md:text-left">
                    {SAMPLE_NOTE}
                  </p>
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
             {(founderStoryToRender || isEditable) && (
                <section className="max-w-7xl mx-auto px-6">
                    <div className="bg-white rounded-[3rem] p-8 md:p-12 shadow-2xl border border-slate-100">
                        <SectionTitle title="CÂU CHUYỆN KHỞI NGUỒN" align="left" />
                        {founderStoryToRender ? (
                             <div className="flex flex-col md:flex-row gap-12 items-start">
                                {founderStoryToRender.image && (
                                    <div className="md:w-1/3 shrink-0">
                                        <img src={founderStoryToRender.image} alt="Founders" className="rounded-3xl shadow-xl w-full rotate-2 hover:rotate-0 transition-transform duration-500 grayscale" />
                                    </div>
                                )}
                                <div className="md:w-2/3 space-y-6">
                                    <h4 className="text-3xl font-bold text-slate-900">{founderStoryToRender.title}</h4>
                                    <p className="text-slate-600 text-lg leading-relaxed whitespace-pre-line">
                                        {founderStoryToRender.content}
                                    </p>
                                    <div className="pt-4">
                                        <p className="text-sm font-bold text-slate-400 mt-2">{founderStoryToRender.founder}</p>
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
        {isEditable && usingSampleFounderStory && (
          <p className="!mt-4 px-6 text-xs text-slate-400 italic text-center md:text-left">
            {SAMPLE_NOTE}
          </p>
        )}

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
            {(milestonesToRender.length > 0 || isEditable) && (
                <section className="max-w-7xl mx-auto px-6">
                    <SectionTitle title="CỘT MỐC PHÁT TRIỂN" />
                    <div className="relative border-l-4 border-slate-200 ml-4 md:ml-1/2 md:border-l-0">
                        <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-1 bg-slate-200 -translate-x-1/2 rounded-full"></div>
                        
                        <div className="space-y-12">
                          {milestonesToRender.map((item: any, i: number) => (
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
                           {/* {story.milestones?.length === 0 && (
                                <div className="text-center text-slate-500 italic p-8">Chưa có cột mốc phát triển.</div>
                           )} */}
                        </div>
                    </div>
                </section>
            )}
        </section>
        {isEditable && usingSampleMilestones && (
          <p className="!mt-4 px-6 text-xs text-slate-400 italic text-center md:text-left">
            {SAMPLE_NOTE}
          </p>
        )}

        {/* SECTION 20: TESTIMONIALS */}
        <section className="max-w-7xl mx-auto px-6 pb-20 relative group/testimonials">
             {isEditable && (
                <div className="absolute top-0 right-6 opacity-0 group-hover/testimonials:opacity-100 transition-opacity z-20">
                     <Button onClick={() => handleEdit('culture-testimonials', { culture })} variant="outline" size="sm" className="bg-white shadow-sm border">
                        <Pencil className="w-3 h-3 mr-2" /> Chỉnh sửa đánh giá
                    </Button>
                </div>
            )}
            
            {(testimonialsToRender.length > 0 || isEditable) && (
                <>
                    <SectionTitle title="NGƯỜI TRONG CUỘC NÓI GÌ?" subtitle={`Những chia sẻ chân thật từ chính các thành viên ${company.name}`} />
                    <SectionCarousel>
                        {testimonialsToRender.map((t: any, i: number) => (
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
                     {/* {culture.testimonials?.length === 0 && (
                         <div className="text-center text-slate-500 italic mt-8">Chưa có đánh giá nào.</div>
                     )} */}

                    {isEditable && usingSampleTestimonials && (
                      <p className="mt-4 text-xs text-slate-400 italic text-center md:text-left">
                        {SAMPLE_NOTE}
                      </p>
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
