"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog } from "@headlessui/react";
import { X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import api from "@/lib/api";
import { useMutation } from "@tanstack/react-query";

const inviteSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
  role: z.enum(["ADMIN", "MEMBER"]),
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
    defaultValues: {
      role: "MEMBER",
    },
  });

  const inviteMutation = useMutation({
    mutationFn: async (data: InviteFormData) => {
      await api.post(`/api/companies/${companyId}/members`, data);
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
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="text-lg font-semibold">Thêm thành viên</Dialog.Title>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <Dialog.Description className="mb-4 text-sm text-gray-500">
            Nhập email của người dùng bạn muốn mời vào công ty. Họ sẽ nhận được email hướng dẫn tham gia.
          </Dialog.Description>

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

            <div className="space-y-2">
              <label htmlFor="role" className="text-sm font-medium">
                Vai trò
              </label>
              <select
                id="role"
                {...register("role")}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="MEMBER">Thành viên (Member)</option>
                <option value="ADMIN">Quản trị viên (Admin)</option>
              </select>
              <p className="text-xs text-gray-500">
                Admin có quyền quản lý nội dung và thành viên. Member chỉ có quyền xem.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-4">
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
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}

