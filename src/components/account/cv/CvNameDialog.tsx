"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CV_NAME_MAX_LENGTH } from "@/types/candidate-cv";

const schema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Tên CV không được để trống")
    .max(CV_NAME_MAX_LENGTH, `Tên CV tối đa ${CV_NAME_MAX_LENGTH} ký tự`),
});

type FormValues = z.infer<typeof schema>;

type CvNameDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  submitLabel: string;
  defaultName?: string;
  isSubmitting: boolean;
  /** Lỗi từ server (vd. trùng tên) hiển thị inline dưới ô nhập. */
  serverError?: string | null;
  onSubmit: (name: string) => void;
};

export default function CvNameDialog({
  open,
  onOpenChange,
  title,
  description,
  submitLabel,
  defaultName = "",
  isSubmitting,
  serverError,
  onSubmit,
}: CvNameDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: defaultName },
  });

  useEffect(() => {
    if (open) reset({ name: defaultName });
  }, [open, defaultName, reset]);

  useEffect(() => {
    if (serverError) setError("name", { type: "server", message: serverError });
  }, [serverError, setError]);

  return (
    <Dialog open={open} onOpenChange={(next) => !isSubmitting && onOpenChange(next)}>
      <DialogContent className="max-w-md">
        <form onSubmit={handleSubmit((values) => onSubmit(values.name))} className="space-y-4">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {description ? <DialogDescription>{description}</DialogDescription> : null}
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="cv-name-input">Tên CV</Label>
            <Input
              id="cv-name-input"
              autoFocus
              maxLength={CV_NAME_MAX_LENGTH}
              placeholder="Ví dụ: CV Backend Developer"
              disabled={isSubmitting}
              aria-invalid={Boolean(errors.name)}
              {...register("name")}
            />
            {errors.name ? <p className="text-sm text-red-600">{errors.name.message}</p> : null}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Hủy
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
