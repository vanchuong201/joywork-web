"use client";

import { useState } from "react";
import { useAuthStore } from "@/store/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { MoreVertical, Trash2, UserCog, Shield, ShieldAlert, User, LogOut } from "lucide-react";
import { Menu, Transition } from "@headlessui/react";
import { Fragment } from "react";
import { toast } from "sonner";
import api from "@/lib/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import InviteMemberModal from "./InviteMemberModal";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

type Member = {
  id: string;
  userId: string;
  role: string;
  joinedAt: string;
  user: {
    id: string;
    email: string;
    name?: string | null;
    avatar?: string | null;
  };
};

type Props = {
  companyId: string;
  members: Member[];
  currentUserRole: string; // "OWNER" | "ADMIN" | "MEMBER"
  currentUserId: string;
};

export default function CompanyMembersList({ companyId, members, currentUserRole, currentUserId }: Props) {
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const queryClient = useQueryClient();
  const router = useRouter();

  const canManage = currentUserRole === "OWNER" || currentUserRole === "ADMIN";

  const removeMutation = useMutation({
    mutationFn: async (memberId: string) => {
      await api.delete(`/api/companies/${companyId}/members/${memberId}`);
    },
    onSuccess: () => {
      toast.success("Đã xóa thành viên");
      queryClient.invalidateQueries({ queryKey: ["company-manage"] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error?.message ?? "Không thể xóa thành viên");
    },
  });

  const leaveMutation = useMutation({
    mutationFn: async () => {
      await api.delete(`/api/companies/${companyId}/leave`);
    },
    onSuccess: () => {
      toast.success("Đã rời khỏi công ty");
      // Reload lại toàn bộ trang để update state memberships
      window.location.href = "/companies"; 
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error?.message ?? "Không thể rời khỏi công ty");
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ memberId, role }: { memberId: string; role: "ADMIN" | "MEMBER" }) => {
      await api.patch(`/api/companies/${companyId}/members/${memberId}`, { role });
    },
    onSuccess: () => {
      toast.success("Đã cập nhật vai trò");
      queryClient.invalidateQueries({ queryKey: ["company-manage"] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error?.message ?? "Không thể cập nhật vai trò");
    },
  });

  const handleRemove = (memberId: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa thành viên này khỏi công ty?")) {
      removeMutation.mutate(memberId);
    }
  };

  const handleLeave = () => {
    if (confirm("Bạn có chắc chắn muốn rời khỏi công ty này?")) {
      leaveMutation.mutate();
    }
  };

  const handleUpdateRole = (memberId: string, newRole: "ADMIN" | "MEMBER") => {
    updateRoleMutation.mutate({ memberId, role: newRole });
  };

  const canActionOnMember = (targetMember: Member) => {
    if (targetMember.userId === currentUserId) return true; // Self (for leave action) - logic changed below
    if (currentUserRole === "OWNER") return true; // Owner can action on anyone else
    if (currentUserRole === "ADMIN") {
      // Admin can only action on MEMBERS
      return targetMember.role === "MEMBER";
    }
    return false;
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "OWNER":
        return <span className="inline-flex items-center rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-800"><ShieldAlert className="mr-1 h-3 w-3" /> Owner</span>;
      case "ADMIN":
        return <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800"><Shield className="mr-1 h-3 w-3" /> Admin</span>;
      default:
        return <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800"><User className="mr-1 h-3 w-3" /> Member</span>;
    }
  };

  return (
    <div className="space-y-4">
      {canManage && (
        <div className="flex justify-end">
          <Button onClick={() => setIsInviteOpen(true)}>Thêm thành viên</Button>
        </div>
      )}

      <Card>
        <CardHeader className="pb-3">
          <h3 className="text-lg font-semibold">Danh sách thành viên ({members.length})</h3>
        </CardHeader>
        <CardContent className="divide-y divide-[var(--border)] p-0">
          {members.map((member) => (
            <div key={member.id} className="flex items-center justify-between px-6 py-4">
              <div className="flex items-center gap-3">
                {member.user.avatar ? (
                  <img
                    src={member.user.avatar}
                    alt={member.user.name ?? "Avatar"}
                    className="h-10 w-10 rounded-full object-cover bg-[var(--muted)]"
                  />
                ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--muted)] font-semibold text-[var(--muted-foreground)]">
                  {(member.user.name ?? member.user.email).charAt(0).toUpperCase()}
                </div>
                )}
                <div>
                  <p className="font-medium text-[var(--foreground)]">{member.user.name ?? "Chưa đặt tên"}</p>
                  <p className="text-sm text-[var(--muted-foreground)]">{member.user.email}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                {getRoleBadge(member.role)}
                
                {canActionOnMember(member) && (
                  <Menu as="div" className="relative inline-block text-left">
                    <div>
                      <Menu.Button className="flex items-center rounded-full p-2 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:ring-offset-2">
                        <MoreVertical className="h-5 w-5" aria-hidden="true" />
                      </Menu.Button>
                    </div>
                    <Transition
                      as={Fragment}
                      enter="transition ease-out duration-100"
                      enterFrom="transform opacity-0 scale-95"
                      enterTo="transform opacity-100 scale-100"
                      leave="transition ease-in duration-75"
                      leaveFrom="transform opacity-100 scale-100"
                      leaveTo="transform opacity-0 scale-95"
                    >
                      <Menu.Items className="absolute right-0 z-10 mt-2 w-56 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                        {member.userId === currentUserId ? (
                           // Self actions (Leave company)
                           <div className="py-1">
                              {currentUserRole !== 'OWNER' && (
                                <Menu.Item>
                                  {({ active }) => (
                                    <button
                                      onClick={handleLeave}
                                      className={cn(
                                        active ? "bg-red-50 text-red-900" : "text-red-700",
                                        "group flex w-full items-center px-4 py-2 text-sm"
                                      )}
                                    >
                                      <LogOut className="mr-3 h-4 w-4 text-red-500" aria-hidden="true" />
                                      Rời công ty
                                    </button>
                                  )}
                                </Menu.Item>
                              )}
                           </div>
                        ) : (
                           // Actions on others
                           <>
                        <div className="py-1">
                          {member.role === "MEMBER" && (
                            <Menu.Item>
                              {({ active }) => (
                                <button
                                  onClick={() => handleUpdateRole(member.id, "ADMIN")}
                                  className={cn(
                                    active ? "bg-gray-100 text-gray-900" : "text-gray-700",
                                    "group flex w-full items-center px-4 py-2 text-sm"
                                  )}
                                >
                                  <Shield className="mr-3 h-4 w-4 text-blue-500" aria-hidden="true" />
                                  Thăng cấp Admin
                                </button>
                              )}
                            </Menu.Item>
                          )}
                          {member.role === "ADMIN" && currentUserRole === "OWNER" && (
                            <Menu.Item>
                              {({ active }) => (
                                <button
                                  onClick={() => handleUpdateRole(member.id, "MEMBER")}
                                  className={cn(
                                    active ? "bg-gray-100 text-gray-900" : "text-gray-700",
                                    "group flex w-full items-center px-4 py-2 text-sm"
                                  )}
                                >
                                  <User className="mr-3 h-4 w-4 text-gray-500" aria-hidden="true" />
                                  Giáng cấp Member
                                </button>
                              )}
                            </Menu.Item>
                          )}
                        </div>
                        <div className="py-1">
                          <Menu.Item>
                            {({ active }) => (
                              <button
                                onClick={() => handleRemove(member.id)}
                                className={cn(
                                  active ? "bg-red-50 text-red-900" : "text-red-700",
                                  "group flex w-full items-center px-4 py-2 text-sm"
                                )}
                              >
                                <Trash2 className="mr-3 h-4 w-4 text-red-500" aria-hidden="true" />
                                Xóa thành viên
                              </button>
                            )}
                          </Menu.Item>
                        </div>
                           </>
                        )}
                      </Menu.Items>
                    </Transition>
                  </Menu>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <InviteMemberModal
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        companyId={companyId}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["company-manage"] });
        }}
      />
    </div>
  );
}

