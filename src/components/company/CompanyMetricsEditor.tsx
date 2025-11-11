"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import api from "@/lib/api";
import { type CompanyMetric } from "@/types/company";

type EditableMetric = CompanyMetric & { _localId: string };

type Props = {
  companyId: string;
  initialMetrics?: CompanyMetric[] | null;
};

const MAX_METRICS = 6;

export default function CompanyMetricsEditor({ companyId, initialMetrics }: Props) {
  const [metrics, setMetrics] = useState<EditableMetric[]>(() => toEditable(initialMetrics));
  const [isDirty, setDirty] = useState(false);

  useEffect(() => {
    setMetrics(toEditable(initialMetrics));
    setDirty(false);
  }, [initialMetrics]);

  const filteredMetrics = useMemo(
    () => metrics.filter((metric) => metric.label.trim() && metric.value.trim()),
    [metrics],
  );

  const updateMetrics = useMutation({
    mutationFn: async (payload: CompanyMetric[]) => {
      await api.patch(`/api/companies/${companyId}`, {
        metrics: payload,
      });
    },
    onSuccess: () => {
      toast.success("Đã lưu danh sách chỉ số nổi bật");
      setDirty(false);
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error?.message ?? "Không thể lưu chỉ số, thử lại sau";
      toast.error(message);
    },
  });

  const handleAddMetric = () => {
    if (metrics.length >= MAX_METRICS) {
      toast.info(`Bạn chỉ nên hiển thị tối đa ${MAX_METRICS} chỉ số.`);
      return;
    }
    setMetrics((prev) => [
      ...prev,
      {
        _localId: crypto.randomUUID(),
        label: "",
        value: "",
        description: "",
      },
    ]);
    setDirty(true);
  };

  const handleChange = (id: string, field: keyof CompanyMetric, value: string) => {
    setMetrics((prev) =>
      prev.map((metric) =>
        metric._localId === id
          ? {
              ...metric,
              [field]: value,
            }
          : metric,
      ),
    );
    setDirty(true);
  };

  const handleRemove = (id: string) => {
    setMetrics((prev) => prev.filter((metric) => metric._localId !== id));
    setDirty(true);
  };

  const handleRestore = () => {
    setMetrics(toEditable(initialMetrics));
    setDirty(false);
  };

  const handleSave = () => {
    updateMetrics.mutate(
      filteredMetrics.map(({ _localId, ...rest }) => ({
        ...rest,
        id: rest.id ?? undefined,
        description: rest.description?.trim() ? rest.description : undefined,
        value: rest.value.trim(),
        label: rest.label.trim(),
      })),
    );
  };

  return (
    <Card>
      <CardHeader className="space-y-2">
        <div>
          <h3 className="text-lg font-semibold text-[var(--foreground)]">Chỉ số nổi bật</h3>
          <p className="text-sm text-[var(--muted-foreground)]">
            Nêu bật các con số biết nói về doanh nghiệp của bạn (ví dụ: Điểm eNPS, Tỷ lệ nghỉ việc, Tỷ lệ nữ...).
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {metrics.length === 0 ? (
          <div className="rounded-md border border-dashed border-[var(--border)] bg-[var(--background)] p-4 text-sm text-[var(--muted-foreground)]">
            Chưa có chỉ số nào. Hãy thêm ít nhất một chỉ số để tăng tính tin cậy cho ứng viên.
          </div>
        ) : (
          <div className="space-y-4">
            {metrics.map((metric, index) => (
              <div
                key={metric._localId}
                className="rounded-lg border border-[var(--border)] bg-[var(--card)]/70 p-4 shadow-sm"
              >
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-medium text-[var(--muted-foreground)]">
                    Chỉ số #{index + 1}
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-xs text-red-500 hover:bg-red-500/10"
                    onClick={() => handleRemove(metric._localId)}
                  >
                    Xoá
                  </Button>
                </div>
                <div className="space-y-3">
                  <div className="grid gap-3 md:grid-cols-2">
                    <FormControl label="Tên chỉ số" required>
                      <Input
                        placeholder="Ví dụ: Điểm eNPS"
                        value={metric.label}
                        onChange={(event) => handleChange(metric._localId, "label", event.target.value)}
                      />
                    </FormControl>
                    <FormControl label="Giá trị" required>
                      <Input
                        placeholder="Ví dụ: 74/100"
                        value={metric.value}
                        onChange={(event) => handleChange(metric._localId, "value", event.target.value)}
                      />
                    </FormControl>
                  </div>
                  <FormControl label="Mô tả ngắn">
                    <Textarea
                      rows={2}
                      placeholder="Bổ sung bối cảnh cho chỉ số, ví dụ: Khảo sát nội bộ quý 3/2025"
                      value={metric.description ?? ""}
                      onChange={(event) => handleChange(metric._localId, "description", event.target.value)}
                    />
                  </FormControl>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <Button type="button" variant="outline" size="sm" onClick={handleAddMetric}>
            Thêm chỉ số
          </Button>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRestore}
              disabled={updateMetrics.isPending || !isDirty}
            >
              Khôi phục
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSave}
              disabled={updateMetrics.isPending || (!isDirty && filteredMetrics.length === toEditable(initialMetrics).length)}
            >
              {updateMetrics.isPending ? "Đang lưu..." : "Lưu chỉ số"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function toEditable(metrics?: CompanyMetric[] | null): EditableMetric[] {
  if (!metrics?.length) {
    return [];
  }
  return metrics.map((metric) => ({
    _localId: crypto.randomUUID(),
    label: metric.label,
    value: metric.value,
    description: metric.description,
    icon: metric.icon,
    id: metric.id,
  }));
}

function FormControl({
  label,
  children,
  required,
}: {
  label: string;
  children: ReactNode;
  required?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium text-[var(--foreground)]">
        {label}
        {required ? <span className="text-red-500"> *</span> : null}
      </span>
      {children}
    </label>
  );
}

