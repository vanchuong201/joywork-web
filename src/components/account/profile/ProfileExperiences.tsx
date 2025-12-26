"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { UserExperience } from "@/types/user";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import ExperienceDialog from "./ExperienceDialog";

interface ProfileExperiencesProps {
  experiences: UserExperience[];
}

export default function ProfileExperiences({ experiences: initialExperiences }: ProfileExperiencesProps) {
  const queryClient = useQueryClient();
  const [experiences, setExperiences] = useState<UserExperience[]>(initialExperiences);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const createExperience = useMutation({
    mutationFn: async (data: Omit<UserExperience, "id" | "order">) => {
      const res = await api.post("/api/users/me/experiences", data);
      return res.data.data.experience as UserExperience;
    },
    onSuccess: (newExp) => {
      toast.success("Thêm kinh nghiệm thành công");
      queryClient.invalidateQueries({ queryKey: ["own-profile"] });
      setExperiences([...experiences, newExp]);
      setIsDialogOpen(false);
    },
    onError: () => {
      toast.error("Thêm thất bại");
    },
  });

  const updateExperience = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<UserExperience> }) => {
      const res = await api.patch(`/api/users/me/experiences/${id}`, data);
      return res.data.data.experience as UserExperience;
    },
    onSuccess: (updatedExp) => {
      toast.success("Cập nhật kinh nghiệm thành công");
      queryClient.invalidateQueries({ queryKey: ["own-profile"] });
      setExperiences(experiences.map((exp) => (exp.id === updatedExp.id ? updatedExp : exp)));
      setEditingId(null);
      setIsDialogOpen(false);
    },
    onError: () => {
      toast.error("Cập nhật thất bại");
    },
  });

  const deleteExperience = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/users/me/experiences/${id}`);
    },
    onSuccess: (_, id) => {
      toast.success("Xóa kinh nghiệm thành công");
      queryClient.invalidateQueries({ queryKey: ["own-profile"] });
      setExperiences(experiences.filter((exp) => exp.id !== id));
    },
    onError: () => {
      toast.error("Xóa thất bại");
    },
  });

  const handleEdit = (exp: UserExperience) => {
    setEditingId(exp.id);
    setIsDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingId(null);
    setIsDialogOpen(true);
  };

  const handleSave = (data: Omit<UserExperience, "id" | "order"> | Partial<UserExperience>) => {
    if (editingId) {
      updateExperience.mutate({ id: editingId, data });
    } else {
      createExperience.mutate(data as Omit<UserExperience, "id" | "order">);
    }
  };

  const editingExperience = editingId ? experiences.find((exp) => exp.id === editingId) : null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Kinh nghiệm làm việc</CardTitle>
            <CardDescription>Thêm và quản lý kinh nghiệm làm việc của bạn</CardDescription>
          </div>
          <Button onClick={handleAdd} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Thêm kinh nghiệm
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {experiences.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">Chưa có kinh nghiệm nào</p>
        ) : (
          <div className="space-y-4">
            {experiences.map((exp) => (
              <div key={exp.id} className="rounded-lg border border-slate-200 p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold">{exp.role}</h4>
                    <p className="text-sm text-slate-600">{exp.company}</p>
                    {exp.period && <p className="text-xs text-slate-500">{exp.period}</p>}
                    {exp.desc && <p className="mt-2 text-sm text-slate-700">{exp.desc}</p>}
                    {exp.achievements && exp.achievements.length > 0 && (
                      <ul className="mt-2 space-y-1">
                        {exp.achievements.map((ach, i) => (
                          <li key={i} className="text-sm text-slate-600">
                            • {ach}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(exp)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (confirm("Bạn có chắc muốn xóa kinh nghiệm này?")) {
                          deleteExperience.mutate(exp.id);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <ExperienceDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          experience={editingExperience}
          onSave={handleSave}
          isLoading={createExperience.isPending || updateExperience.isPending}
        />
      </CardContent>
    </Card>
  );
}

