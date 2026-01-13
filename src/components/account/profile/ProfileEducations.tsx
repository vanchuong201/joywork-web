"use client";

import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { UserEducation } from "@/types/user";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import EducationDialog from "./EducationDialog";

interface ProfileEducationsProps {
  educations: UserEducation[];
}

export default function ProfileEducations({ educations: initialEducations }: ProfileEducationsProps) {
  const queryClient = useQueryClient();
  const [educations, setEducations] = useState<UserEducation[]>(initialEducations);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    setEducations(initialEducations);
  }, [initialEducations]);

  const createEducation = useMutation({
    mutationFn: async (data: Omit<UserEducation, "id" | "order">) => {
      const res = await api.post("/api/users/me/educations", data);
      return res.data.data.education as UserEducation;
    },
    onSuccess: (newEdu) => {
      toast.success("Thêm học vấn thành công");
      queryClient.invalidateQueries({ queryKey: ["own-profile"] });
      
      // Update local state immediately for better UX, but handle potential missing ID
      if (newEdu && newEdu.id) {
        setEducations((prev) => [...prev, newEdu]);
      }
      setIsDialogOpen(false);
    },
    onError: () => {
      toast.error("Thêm thất bại");
    },
  });

  const updateEducation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<UserEducation> }) => {
      const res = await api.patch(`/api/users/me/educations/${id}`, data);
      return res.data.data.education as UserEducation;
    },
    onSuccess: (updatedEdu) => {
      toast.success("Cập nhật học vấn thành công");
      queryClient.invalidateQueries({ queryKey: ["own-profile"] });
      setEducations((prev) => prev.map((edu) => (edu.id === updatedEdu.id ? updatedEdu : edu)));
      setEditingId(null);
      setIsDialogOpen(false);
    },
    onError: () => {
      toast.error("Cập nhật thất bại");
    },
  });

  const deleteEducation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/users/me/educations/${id}`);
    },
    onSuccess: (_, id) => {
      toast.success("Xóa học vấn thành công");
      queryClient.invalidateQueries({ queryKey: ["own-profile"] });
      setEducations((prev) => prev.filter((edu) => edu.id !== id));
    },
    onError: () => {
      toast.error("Xóa thất bại");
    },
  });

  const handleEdit = (edu: UserEducation) => {
    setEditingId(edu.id);
    setIsDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingId(null);
    setIsDialogOpen(true);
  };

  const handleSave = (data: Omit<UserEducation, "id" | "order"> | Partial<UserEducation>) => {
    if (editingId) {
      updateEducation.mutate({ id: editingId, data });
    } else {
      createEducation.mutate(data as Omit<UserEducation, "id" | "order">);
    }
  };

  const editingEducation = editingId ? educations.find((edu) => edu.id === editingId) : null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Học vấn</CardTitle>
            <CardDescription>Thêm và quản lý thông tin học vấn của bạn</CardDescription>
          </div>
          <Button onClick={handleAdd} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Thêm học vấn
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {educations.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">Chưa có thông tin học vấn nào</p>
        ) : (
          <div className="space-y-4">
            {educations.map((edu) => (
              <div key={edu.id} className="rounded-lg border border-slate-200 p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold">{edu.school}</h4>
                    <p className="text-sm text-slate-600">{edu.degree}</p>
                    {edu.period && <p className="text-xs text-slate-500">{edu.period}</p>}
                    {edu.gpa && <p className="mt-1 text-xs text-slate-500">GPA: {edu.gpa}</p>}
                    {edu.honors && <p className="mt-1 text-xs text-slate-500">{edu.honors}</p>}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(edu)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (confirm("Bạn có chắc muốn xóa thông tin học vấn này?")) {
                          deleteEducation.mutate(edu.id);
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

        <EducationDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          education={editingEducation}
          onSave={handleSave}
          isLoading={createEducation.isPending || updateEducation.isPending}
        />
      </CardContent>
    </Card>
  );
}

