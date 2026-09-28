"use client";

import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateApplicationStatus } from "@/lib/api/applications";
import { getApiErrorMessage } from "@/lib/api-error";
import { APPLICATION_STATUS_LABEL, APPLICATION_STATUS_OPTIONS } from "./application-status";

export type ApplicationStatusTarget = {
  id: string;
  status: string;
  notes?: string | null;
  candidateName: string;
  jobTitle?: string | null;
};

type ApplicationStatusDialogProps = {
  target: ApplicationStatusTarget | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated?: () => void;
};

export default function ApplicationStatusDialog({ target, open, onOpenChange, onUpdated }: ApplicationStatusDialogProps) {
  const [status, setStatus] = useState("");
  const [notes, setNotes] = useState("");

  const targetId = target?.id;
  const targetStatus = target?.status;
  const targetNotes = target?.notes;
  useEffect(() => {
    if (open && targetId) {
      setStatus(targetStatus ?? "");
      setNotes(targetNotes || "");
    }
  }, [open, targetId, targetStatus, targetNotes]);

  const mutation = useMutation({
    mutationFn: () => {
      if (!target) throw new Error("NO_TARGET");
      return updateApplicationStatus(target.id, { status, notes: notes || undefined });
    },
    onSuccess: () => {
      toast.success("Đã cập nhật trạng thái");
      onOpenChange(false);
      onUpdated?.();
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, "Không thể cập nhật trạng thái"));
    },
  });

  return (
    <Dialog open={open} onOpenChange={(next) => !mutation.isPending && onOpenChange(next)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cập nhật trạng thái ứng tuyển</DialogTitle>
          <DialogDescription>
            {target ? (
              <>
                Ứng viên: <strong>{target.candidateName}</strong>
                {target.jobTitle ? (
                  <>
                    <br />
                    Vị trí: <strong>{target.jobTitle}</strong>
                  </>
                ) : null}
                <br />
                <span className="mt-2 block text-xs">
                  Khi bạn cập nhật, ứng viên sẽ nhận thông báo trên JOYWORK và email (nếu tài khoản có email đã xác minh).
                </span>
              </>
            ) : null}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="application-status">Trạng thái</Label>
            <select
              id="application-status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="h-10 w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] focus:border-[var(--brand)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/20"
            >
              {APPLICATION_STATUS_OPTIONS.map((value) => (
                <option key={value} value={value}>
                  {APPLICATION_STATUS_LABEL[value]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="application-notes">Phản hồi của doanh nghiệp (tùy chọn)</Label>
            <Textarea
              id="application-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Thêm phản hồi cho ứng viên này..."
              rows={4}
              maxLength={1000}
            />
            <p className="mt-1 text-xs text-[var(--muted-foreground)]">{notes.length}/1000 ký tự</p>
          </div>
        </div>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>
            Hủy
          </Button>
          <Button onClick={() => mutation.mutate()} disabled={!status || mutation.isPending}>
            {mutation.isPending ? "Đang cập nhật..." : "Cập nhật"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
