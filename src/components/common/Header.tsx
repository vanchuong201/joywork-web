"use client";

import { BriefcaseBusiness, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/store/useAuth";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Header() {
  const user = useAuth((s) => s.user);
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--card)]/80 backdrop-blur supports-[backdrop-filter]:bg-[var(--card)]/60">
      <div className="mx-auto flex h-14 max-w-[1440px] items-center gap-4 px-4">
        <div className="flex items-center gap-2 text-[var(--foreground)]">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[var(--brand)] text-white">
            <BriefcaseBusiness size={18} />
          </div>
          <span className="text-lg font-semibold">JoyWork</span>
        </div>
        <div className="ml-auto hidden items-center gap-6 md:flex">
          {[{href:"/",label:"Home"},{href:"/jobs",label:"Jobs"},{href:"/inbox",label:"Inbox"}].map((n)=>{
            const active = n.href === "/" ? pathname === "/" : pathname.startsWith(n.href);
            return (
              <Link key={n.href} href={n.href} className={cn("text-sm", active?"text-[var(--foreground)]":"text-[var(--muted-foreground)] hover:text-[var(--foreground)]")}>{n.label}</Link>
            );
          })}
        </div>
        <div className="ml-4 flex flex-1 items-center justify-end">
          <div className="relative w-full max-w-md">
            <input
              className="h-9 w-full rounded-md border border-[var(--border)] bg-[var(--input)] pl-9 pr-3 text-sm outline-none placeholder:text-[var(--muted-foreground)] focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
              placeholder="Search companies or jobs..."
            />
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" size={16} />
          </div>
          <div className="ml-4 text-sm">
            {user ? (
              <span className="text-[var(--foreground)]">{user.name ?? user.email}</span>
            ) : (
              <>
                <a className="text-[var(--brand)]" href="/login">Login</a>
                <span className="mx-1 text-[var(--muted-foreground)]">/</span>
                <a className="text-[var(--brand)]" href="/register">Register</a>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}


