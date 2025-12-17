import { Company } from "@/types/company";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Globe, MapPin, Users, CheckCircle, MessageCircle } from "lucide-react";
import CompanyMessageButton from "@/components/company/CompanyMessageButton";
import { Badge } from "@/components/ui/badge";

export default function CompanyProfileHero({ company }: { company: Company }) {
    return (
        <section className="relative max-w-7xl mx-auto px-4 sm:px-6 mb-20 pt-8">
             <div className="bg-slate-900 text-white rounded-[3rem] p-10 md:p-16 text-center relative overflow-hidden shadow-2xl">
                 {/* Background decoration */}
                 <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
                     <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-600 rounded-full blur-[120px]"></div>
                     <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-600 rounded-full blur-[120px]"></div>
                 </div>

                 <div className="relative z-10 flex flex-col items-center">
                     {/* Logo */}
                     <div className="w-32 h-32 md:w-40 md:h-40 rounded-3xl bg-white p-2 mb-8 shadow-xl border-4 border-white/10 hover:scale-105 transition-transform duration-300">
                         <div className="relative w-full h-full bg-white rounded-2xl overflow-hidden flex items-center justify-center">
                             {company.logoUrl ? (
                                 <Image src={company.logoUrl} alt={company.name} fill className="object-contain" />
                             ) : (
                                 <span className="text-4xl font-bold text-slate-800">{company.name.charAt(0)}</span>
                             )}
                         </div>
                     </div>

                     {/* EST. Year */}
                     <div className="text-blue-400 font-bold tracking-[0.2em] mb-4 text-sm md:text-base animate-fade-in uppercase">
                         EST. {company.foundedYear || 2015}
                     </div>

                     {/* Name */}
                     <h1 className="text-4xl md:text-6xl lg:text-7xl font-black mb-6 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-100 to-slate-300">
                         {company.name}
                     </h1>

                     {/* Tagline */}
                     <p className="text-lg md:text-2xl text-slate-300 max-w-4xl mx-auto mb-10 font-light leading-relaxed">
                         {company.tagline || "Kiến tạo tương lai số"}
                     </p>
                    
                     {/* Legal Name & Verified Badge */}
                     <div className="flex flex-wrap justify-center items-center gap-3 mb-8">
                        {company.legalName && (
                            <span className="text-slate-400 font-medium">
                                {company.legalName}
                            </span>
                        )}
                        {company.isVerified && (
                             <Badge className="bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 border-0 px-3 py-1">
                                 <CheckCircle className="w-4 h-4 mr-1.5" /> Đã xác thực
                             </Badge>
                        )}
                     </div>

                     {/* Meta Info */}
                     <div className="flex flex-wrap justify-center gap-6 md:gap-10 text-slate-300 mb-12 text-sm md:text-base font-medium">
                         {company.location && (
                             <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full backdrop-blur-sm border border-white/10">
                                 <MapPin className="w-5 h-5 text-blue-400" />
                                 <span>{company.location}</span>
                             </div>
                         )}
                         {company.size && (
                             <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full backdrop-blur-sm border border-white/10">
                                 <Users className="w-5 h-5 text-purple-400" />
                                 <span>{company.size}</span>
                             </div>
                         )}
                         {company.website && (
                             <a href={company.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full backdrop-blur-sm border border-white/10 hover:bg-white/10 hover:text-white transition-all">
                                 <Globe className="w-5 h-5 text-green-400" />
                                 <span>Website</span>
                             </a>
                         )}
                     </div>
                     
                     {/* Actions */}
                     <div className="flex flex-wrap justify-center gap-4">
                        <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-8 py-6 text-lg shadow-lg shadow-blue-600/20 font-bold transition-all hover:scale-105 active:scale-95 border-0">
                            Theo dõi ngay
                        </Button>
                        <CompanyMessageButton 
                            companyId={company.id} 
                            companyName={company.name}
                            variant="secondary"
                            size="lg"
                            className="rounded-full px-8 py-6 text-lg font-bold bg-white text-slate-900 hover:bg-slate-100 transition-all hover:scale-105 active:scale-95 border-0"
                        >
                            <MessageCircle className="w-5 h-5 mr-2" /> Nhắn tin / Liên hệ
                        </CompanyMessageButton>
                     </div>
                 </div>
             </div>
        </section>
    );
}

