"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import EmptyState from "@/components/ui/empty-state";
import CompanySearch from "@/components/feed/CompanySearch";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type Job = {
  id: string;
  title: string;
  description: string;
  location?: string;
  remote: boolean;
  employmentType: string;
  experienceLevel: string;
  company: { id: string; name: string; slug: string };
};

export default function JobsPage() {
  const sp = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const companyId = sp.get("companyId") || undefined;
  const remote = sp.get("remote") === "true" ? true : undefined;
  const employmentType = sp.get("employmentType") || undefined;
  const experienceLevel = sp.get("experienceLevel") || undefined;

  const { data, isLoading } = useQuery<{ jobs: Job[]; pagination: any }>({
    queryKey: ["jobs", { remote, employmentType, experienceLevel, companyId }],
    queryFn: async () => {
      const res = await api.get("/api/jobs", {
        params: {
          limit: 10,
          companyId,
          remote,
          employmentType,
          experienceLevel,
        },
      });
      return res.data.data;
    },
  });

  const toggleParam = (key: string, value?: string) => {
    const next = new URLSearchParams(sp.toString());
    if (!value) next.delete(key);
    else next.set(key, value);
    router.replace(`${pathname}?${next.toString()}`);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
      <section className="hidden rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 lg:block">
        <h3 className="mb-3 text-sm font-semibold">Filters</h3>
        <div className="space-y-4 text-sm">
          <div>
            <div className="mb-2 font-medium">Company</div>
            <CompanySearch value={companyId} onSelect={(id) => toggleParam("companyId", id)} />
            {companyId ? (
              <button
                className="mt-1 text-xs text-[var(--brand)]"
                onClick={() => toggleParam("companyId", undefined)}
              >
                Clear company
              </button>
            ) : null}
          </div>
          <div>
            <div className="mb-2 font-medium">Work Type</div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={remote === true}
                onChange={(e) => toggleParam("remote", e.target.checked ? "true" : undefined)}
              />
              Remote
            </label>
          </div>
          <div>
            <div className="mb-2 font-medium">Employment Type</div>
            {[
              "FULL_TIME",
              "PART_TIME",
              "CONTRACT",
              "INTERNSHIP",
              "FREELANCE",
            ].map((t) => (
              <label key={t} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="employmentType"
                  checked={employmentType === t}
                  onChange={() => toggleParam("employmentType", t)}
                />
                {t.replace("_", " ")}
              </label>
            ))}
            <button
              className="mt-1 text-xs text-[var(--brand)]"
              onClick={() => toggleParam("employmentType", undefined)}
            >
              Clear
            </button>
          </div>
          <div>
            <div className="mb-2 font-medium">Experience Level</div>
            {["ENTRY", "JUNIOR", "MID", "SENIOR", "LEAD", "EXECUTIVE"].map((t) => (
              <label key={t} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="experienceLevel"
                  checked={experienceLevel === t}
                  onChange={() => toggleParam("experienceLevel", t)}
                />
                {t}
              </label>
            ))}
            <button
              className="mt-1 text-xs text-[var(--brand)]"
              onClick={() => toggleParam("experienceLevel", undefined)}
            >
              Clear
            </button>
          </div>
        </div>
      </section>
      <section className="space-y-4">
        <div>
          <h1 className="text-xl font-semibold">Jobs</h1>
          {companyId ? (
            <p className="mt-1 text-xs text-[var(--muted-foreground)]">
              Đang lọc theo doanh nghiệp:
              {" "}
              <span className="font-medium text-[var(--foreground)]">
                {data?.jobs?.[0]?.company?.name ?? (isLoading ? "đang tải..." : "không có job phù hợp")}
              </span>
            </p>
          ) : null}
        </div>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-lg" />
            ))}
          </div>
        ) : data?.jobs?.length ? (
          <div className="space-y-3">
            {data?.jobs?.map((j) => (
              <Card key={j.id}>
                <CardHeader className="pb-2">
                  <div className="text-sm text-[var(--muted-foreground)]">{j.company.name}</div>
                  <div className="text-base font-semibold">{j.title}</div>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-[var(--muted-foreground)] line-clamp-2">{j.description}</div>
                  <div className="mt-3 flex items-center gap-2">
                    <a href={`/jobs/${j.id}`}>
                      <Button size="sm">View</Button>
                    </a>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState title="No jobs found" subtitle="Try adjusting filters or search criteria" />
        )}
      </section>
    </div>
  );
}


