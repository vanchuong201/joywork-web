"use client";

import { useState, useEffect } from "react";
import { UserExperience } from "@/types/user";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Plus, X } from "lucide-react";

interface ExperienceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  experience: UserExperience | null | undefined;
  onSave: (data: Omit<UserExperience, "id" | "order"> | Partial<UserExperience>) => void;
  isLoading?: boolean;
}

export default function ExperienceDialog({
  open,
  onOpenChange,
  experience,
  onSave,
  isLoading = false,
}: ExperienceDialogProps) {
  const [role, setRole] = useState("");
  const [company, setCompany] = useState("");
  const [period, setPeriod] = useState("");
  const [desc, setDesc] = useState("");
  const [achievements, setAchievements] = useState<string[]>([]);

  useEffect(() => {
    if (experience) {
      setRole(experience.role);
      setCompany(experience.company);
      setPeriod(experience.period || "");
      setDesc(experience.desc || "");
      setAchievements(experience.achievements || []);
    } else {
      setRole("");
      setCompany("");
      setPeriod("");
      setDesc("");
      setAchievements([]);
    }
  }, [experience, open]);

  const handleSave = () => {
    if (!role.trim() || !company.trim()) {
      return;
    }
    onSave({
      role: role.trim(),
      company: company.trim(),
      period: period.trim() || null,
      desc: desc.trim() || null,
      achievements: achievements.filter((a) => a.trim()),
    });
  };

  const addAchievement = () => {
    setAchievements([...achievements, ""]);
  };

  const updateAchievement = (index: number, value: string) => {
    const newAchievements = [...achievements];
    newAchievements[index] = value;
    setAchievements(newAchievements);
  };

  const removeAchievement = (index: number) => {
    setAchievements(achievements.filter((_, i) => i !== index));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{experience ? "Chỉnh sửa kinh nghiệm" : "Thêm kinh nghiệm"}</DialogTitle>
          <DialogDescription>Thông tin về công việc và thành tích của bạn</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="role">Vị trí *</Label>
              <Input
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="Ví dụ: Senior Frontend Developer"
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="company">Công ty *</Label>
              <Input
                id="company"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Ví dụ: TechCorp"
                className="mt-2"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="period">Thời gian</Label>
            <Input
              id="period"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              placeholder="Ví dụ: 2019 - Hiện tại"
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="desc">Mô tả</Label>
            <Textarea
              id="desc"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Mô tả công việc và trách nhiệm..."
              rows={4}
              className="mt-2"
            />
          </div>

          <div>
            <Label>Thành tích đạt được (KPIs)</Label>
            <div className="mt-2 space-y-2">
              {achievements.map((ach, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={ach}
                    onChange={(e) => updateAchievement(index, e.target.value)}
                    placeholder="Ví dụ: Tối ưu hóa Core Web Vitals, tăng điểm Performance từ 60 lên 95"
                  />
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeAchievement(index)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={addAchievement} className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                Thêm thành tích
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button onClick={handleSave} disabled={!role.trim() || !company.trim() || isLoading}>
            {isLoading ? "Đang lưu..." : "Lưu"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

