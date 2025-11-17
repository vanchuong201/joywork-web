import Header from "@/components/common/Header";
import LeftNav from "@/components/common/LeftNav";
import RightRail from "@/components/common/RightRail";

export const dynamic = 'force-dynamic';

export default function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-screen">
      <div className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--background)]/80 backdrop-blur supports-[backdrop-filter]:bg-[var(--background)]/60">
        <Header />
      </div>
      <div className="mx-auto flex max-w-[1440px] gap-8 px-6 py-6">
        <LeftNav />
        <main className="flex-1">{children}</main>
        <RightRail />
      </div>
    </div>
  );
}


