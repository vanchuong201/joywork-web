"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import api from "@/lib/api";
import { useMutation } from "@tanstack/react-query";

const inviteSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
});

type InviteFormData = z.infer<typeof inviteSchema>;

type Props = {
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
  onSuccess: () => void;
};

export default function InviteMemberModal({ isOpen, onClose, companyId, onSuccess }: Props) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InviteFormData>({
    resolver: zodResolver(inviteSchema),
  });

  const inviteMutation = useMutation({
    mutationFn: async (data: InviteFormData) => {
      await api.post(`/api/companies/${companyId}/members`, { ...data, role: "ADMIN" });
    },
    onSuccess: () => {
      toast.success("Đã gửi lời mời thành công");
      reset();
      onSuccess();
      onClose();
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error?.message ?? "Không thể gửi lời mời";
      const code = error?.response?.data?.error?.code;
      if (code === "MEMBER_EXISTS") {
        toast.error("Người dùng này đã là thành viên công ty");
      } else if (code === "INVITATION_EXISTS") {
        toast.error("Email này đã được mời, vui lòng chờ ứng viên chấp nhận hoặc đợi lời mời hết hạn.");
      } else {
        toast.error(message);
      }
    },
  });

  const onSubmit = (data: InviteFormData) => {
    inviteMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-white sm:p-8">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Thêm thành viên</DialogTitle>
          <DialogDescription className="text-slate-500">
            Nhập email của người dùng bạn muốn mời vào công ty. Họ sẽ nhận được email hướng dẫn tham gia.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <Input
                id="email"
                placeholder="name@example.com"
                {...register("email")}
                className={errors.email ? "border-red-500" : ""}
              />
              {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
            </div>

            <p className="text-xs text-gray-500">Người được mời sẽ có vai trò Quản trị viên (Admin).</p>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 mt-6">
              <Button type="button" variant="outline" onClick={onClose} disabled={inviteMutation.isPending}>
                Hủy
              </Button>
              <Button type="submit" disabled={inviteMutation.isPending}>
                {inviteMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang thêm...
                  </>
                ) : (
                  "Thêm thành viên"
                )}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}

