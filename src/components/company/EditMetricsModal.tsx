"use client";

import { useEffect, useState } from "react";
import { Dialog } from "@headlessui/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import api from "@/lib/api";
import { X, Plus, GripVertical, Trash2, Edit2, Check } from "lucide-react";
import type { CompanyMetric } from "@/types/company";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
  currentMetrics?: CompanyMetric[] | null;
  onSuccess: () => void;
};

type MetricWithId = CompanyMetric & { id: string };

function generateId() {
  return `metric-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export default function EditMetricsModal({
  isOpen,
  onClose,
  companyId,
  currentMetrics,
  onSuccess,
}: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [metrics, setMetrics] = useState<MetricWithId[]>(() => {
    if (!currentMetrics?.length) return [];
    return currentMetrics.map((m) => ({
      ...m,
      id: m.id || generateId(),
    }));
  });
  const [editingId, setEditingId] = useState<string | null>(null);

  // Đồng bộ lại dữ liệu mỗi khi mở modal hoặc khi props thay đổi
  useEffect(() => {
    if (!isOpen) return;
    const next = (currentMetrics ?? []).map((m) => ({
      ...m,
      id: m.id || generateId(),
    }));
    setMetrics(next);
    setEditingId(null);
  }, [isOpen, currentMetrics]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setMetrics((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const addMetric = () => {
    const newMetric: MetricWithId = {
      id: generateId(),
      label: "",
      value: "",
      description: "",
      icon: "",
    };
    setMetrics([...metrics, newMetric]);
    setEditingId(newMetric.id);
  };

  const updateMetric = (id: string, updates: Partial<MetricWithId>) => {
    setMetrics((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...updates } : m))
    );
  };

  const deleteMetric = (id: string) => {
    setMetrics((prev) => prev.filter((m) => m.id !== id));
    if (editingId === id) setEditingId(null);
  };

  const handleSubmit = async () => {
    // Validate
    const validMetrics = metrics.filter((m) => m.label.trim() && m.value.trim());
    if (metrics.length > 0 && validMetrics.length === 0) {
      toast.error("Vui lòng điền đầy đủ Tên chỉ số và Giá trị cho các mục.");
      return;
    }

    setIsSubmitting(true);
    try {
      // Remove temporary IDs before sending to backend
      const metricsToSave = validMetrics.map(({ id, ...rest }) => rest);

      await api.patch(`/api/companies/${companyId}`, {
        // Backend yêu cầu mảng ([]), không chấp nhận null
        metrics: metricsToSave,
      });
      toast.success("Cập nhật chỉ số nổi bật thành công");
      onSuccess();
      handleClose();
    } catch (error: any) {
      const message = error?.response?.data?.error?.message ?? "Cập nhật chỉ số thất bại";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      // Reset to initial state
      setMetrics(
        currentMetrics?.map((m) => ({
          ...m,
          id: m.id || generateId(),
        })) || []
      );
      setEditingId(null);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onClose={handleClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto w-full max-w-3xl rounded-xl bg-[var(--card)] p-6 shadow-xl">
          <div className="mb-4 flex items-center justify-between">
            <Dialog.Title className="text-lg font-semibold text-[var(--foreground)]">
              Quản lý Chỉ số nổi bật
            </Dialog.Title>
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="rounded-full p-1 text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)] disabled:opacity-50"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <Dialog.Description className="mb-4 text-sm text-[var(--muted-foreground)]">
            Thêm các chỉ số quan trọng về công ty (ví dụ: số năm hoạt động, số khách hàng, doanh thu...). 
            Kéo thả để sắp xếp thứ tự hiển thị.
          </Dialog.Description>

          <div className="mb-4 space-y-3">
            {metrics.length === 0 ? (
              <div className="rounded-lg border-2 border-dashed border-[var(--border)] bg-[var(--muted)]/30 p-8 text-center">
                <p className="text-sm text-[var(--muted-foreground)]">Chưa có chỉ số nào. Nhấn “Thêm chỉ số” để tạo.</p>
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={metrics.map((m) => m.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {metrics.map((metric) => (
                    <MetricItem
                      key={metric.id}
                      metric={metric}
                      isEditing={editingId === metric.id}
                      onEdit={() => setEditingId(metric.id)}
                      onSave={() => setEditingId(null)}
                      onUpdate={(updates) => updateMetric(metric.id, updates)}
                      onDelete={() => deleteMetric(metric.id)}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            )}
          </div>

          <div className="flex items-center justify-between border-t border-[var(--border)] pt-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addMetric}
              disabled={isSubmitting}
            >
              <Plus className="mr-1 h-4 w-4" />
              Thêm chỉ số
            </Button>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Huỷ
              </Button>
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Đang lưu..." : "Lưu thay đổi"}
              </Button>
            </div>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}

function MetricItem({
  metric,
  isEditing,
  onEdit,
  onSave,
  onUpdate,
  onDelete,
}: {
  metric: MetricWithId;
  isEditing: boolean;
  onEdit: () => void;
  onSave: () => void;
  onUpdate: (updates: Partial<MetricWithId>) => void;
  onDelete: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: metric.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  if (isEditing) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4"
      >
        <div className="space-y-3">
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--foreground)]">
                Tên chỉ số <span className="text-red-500">*</span>
              </label>
              <Input
                value={metric.label}
                onChange={(e) => onUpdate({ label: e.target.value })}
                placeholder="Ví dụ: Năm kinh nghiệm"
                autoFocus
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--foreground)]">
                Giá trị <span className="text-red-500">*</span>
              </label>
              <Input
                value={metric.value}
                onChange={(e) => onUpdate({ value: e.target.value })}
                placeholder="Ví dụ: 10+"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--foreground)]">
              Mô tả (tùy chọn)
            </label>
            <Textarea
              value={metric.description || ""}
              onChange={(e) => onUpdate({ description: e.target.value })}
              placeholder="Mô tả chi tiết về metric này..."
              rows={2}
            />
          </div>
          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onDelete}
              className="text-red-500 hover:bg-red-500/10 hover:text-red-600"
            >
              <Trash2 className="mr-1 h-3 w-3" />
              Xoá
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onSave}
            >
              <Check className="mr-1 h-3 w-3" />
              Xong
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group flex items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 hover:bg-[var(--muted)]/30"
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab touch-none text-[var(--muted-foreground)] hover:text-[var(--foreground)] active:cursor-grabbing"
      >
        <GripVertical className="h-5 w-5" />
      </button>

      <div className="flex-1">
        <div className="flex items-baseline gap-2">
          <span className="font-medium text-[var(--foreground)]">{metric.label || "(Chưa có tên chỉ số)"}</span>
          <span className="text-lg font-semibold text-[var(--brand)]">{metric.value || "(Chưa có giá trị)"}</span>
        </div>
        {metric.description && (
          <p className="mt-1 text-xs text-[var(--muted-foreground)]">{metric.description}</p>
        )}
      </div>

      <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          onClick={onEdit}
          className="rounded p-1.5 text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
          title="Chỉnh sửa"
        >
          <Edit2 className="h-4 w-4" />
        </button>
        <button
          onClick={onDelete}
          className="rounded p-1.5 text-[var(--muted-foreground)] hover:bg-red-500/10 hover:text-red-500"
          title="Xoá"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

