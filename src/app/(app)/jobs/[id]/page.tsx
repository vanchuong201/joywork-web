"use client";

import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { toast } from "sonner";

export default function JobDetailPage() {
  const params = useParams<{ id: string }>();
  const qc = useQueryClient();
  const jobId = params?.id as string;

  const { data, isLoading } = useQuery<{ job: any }>({
    queryKey: ["job", jobId],
    queryFn: async () => {
      const res = await api.get(`/api/jobs/${jobId}`);
      return res.data.data;
    },
    enabled: !!jobId,
  });

  const applyMutation = useMutation({
    mutationFn: async () => {
      await api.post("/api/jobs/apply", { jobId });
    },
    onSuccess: () => {
      toast.success("Application submitted");
      qc.invalidateQueries({ queryKey: ["job", jobId] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.error?.message ?? "Failed to apply"),
  });

  if (isLoading) return <div className="h-40 animate-pulse rounded-lg border border-[var(--border)] bg-[var(--card)]" />;

  const job = data?.job;
  if (!job) return <div>Job not found</div>;

  return (
    <Card>
      <CardHeader>
        <div className="text-sm text-[var(--muted-foreground)]">{job.company.name}</div>
        <h1 className="text-xl font-semibold">{job.title}</h1>
      </CardHeader>
      <CardContent>
        <p className="whitespace-pre-wrap text-sm text-[var(--foreground)]">{job.description}</p>
        <div className="mt-4">
          <Button onClick={() => applyMutation.mutate()} disabled={applyMutation.isPending}>
            {applyMutation.isPending ? "Applying..." : "Apply Now"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}


