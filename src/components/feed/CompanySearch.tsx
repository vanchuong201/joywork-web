"use client";

import * as Popover from "@radix-ui/react-popover";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Input } from "@/components/ui/input";
import { useEffect, useMemo, useState } from "react";

type Company = { id: string; name: string; slug: string };

export default function CompanySearch({ value, onSelect }: { value?: string; onSelect: (companyId?: string) => void }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const { data, refetch } = useQuery<{ companies: Company[] }>({
    queryKey: ["company-search", q],
    queryFn: async () => {
      const res = await api.get("/api/companies", { params: { q, limit: 5 } });
      return res.data.data;
    },
    enabled: false,
  });

  useEffect(() => {
    if (q.trim().length >= 2) refetch();
  }, [q, refetch]);

  const displayLabel = useMemo(() => {
    if (!value) return q;
    const match = data?.companies?.find((c) => c.id === value);
    return match ? match.name : q;
  }, [data?.companies, q, value]);

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Anchor asChild>
        <Input
          placeholder="Filter by company..."
          value={displayLabel}
          onChange={(e) => {
            setQ(e.target.value);
            if (!open) setOpen(true);
          }}
          onFocus={() => setOpen(true)}
        />
      </Popover.Anchor>
      <Popover.Content
        className="z-50 mt-2 w-[280px] rounded-md border border-[var(--border)] bg-[var(--card)] p-1 shadow-md"
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        <ul className="max-h-60 overflow-auto text-sm">
          {data?.companies?.length ? (
            data.companies.map((c) => (
              <li key={c.id}>
                <button
                  className="w-full rounded-md px-2 py-1.5 text-left hover:bg-[var(--muted)]"
                  onClick={() => {
                    onSelect(c.id);
                    setQ(c.name);
                    setOpen(false);
                  }}
                >
                  {c.name}
                </button>
              </li>
            ))
          ) : (
            <li className="px-2 py-1.5 text-[var(--muted-foreground)]">Type to search...</li>
          )}
          <li>
            <button
              className="w-full rounded-md px-2 py-1.5 text-left text-[var(--brand)] hover:bg-[var(--muted)]"
              onClick={() => {
                onSelect(undefined);
                setQ("");
                setOpen(false);
              }}
            >
              Clear filter
            </button>
          </li>
        </ul>
      </Popover.Content>
    </Popover.Root>
  );
}


