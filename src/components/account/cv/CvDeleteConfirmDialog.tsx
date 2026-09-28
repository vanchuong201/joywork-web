"use client";

import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type CvDeleteConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cvName: string;
  isDeleting: boolean;
  onConfirm: () => void;
};

export default function CvDeleteConfirmDialog({
  open,
  onOpenChange,
  cvName,
  isDeleting,
  onConfirm,
}: CvDeleteConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(next) => !isDeleting && onOpenChange(next)}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Xóa CV?</DialogTitle>
          <DialogDescription>
            CV &quot;{cvName}&quot; sẽ bị xóa vĩnh viễn. Các đơn đã ứng tuyển bằng CV này vẫn giữ nguyên nội dung
            tại thời điểm ứng tuyển.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isDeleting}>
            Hủy
          </Button>
          <Button
            type="button"
            className="bg-red-600 text-white hover:bg-red-700"
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Xóa CV
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
