"use client";

import { useState, useEffect } from "react";
import { UserEducation } from "@/types/user";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface EducationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  education: UserEducation | null | undefined;
  onSave: (data: Omit<UserEducation, "id" | "order"> | Partial<UserEducation>) => void;
  isLoading?: boolean;
}

export default function EducationDialog({
  open,
  onOpenChange,
  education,
  onSave,
  isLoading = false,
}: EducationDialogProps) {
  const [school, setSchool] = useState("");
  const [degree, setDegree] = useState("");
  const [period, setPeriod] = useState("");
  const [gpa, setGpa] = useState("");
  const [honors, setHonors] = useState("");

  useEffect(() => {
    if (education) {
      setSchool(education.school);
      setDegree(education.degree);
      setPeriod(education.period || "");
      setGpa(education.gpa || "");
      setHonors(education.honors || "");
    } else {
      setSchool("");
      setDegree("");
      setPeriod("");
      setGpa("");
      setHonors("");
    }
  }, [education, open]);

  const handleSave = () => {
    if (!school.trim() || !degree.trim()) {
      return;
    }
    onSave({
      school: school.trim(),
      degree: degree.trim(),
      period: period.trim() || null,
      gpa: gpa.trim() || null,
      honors: honors.trim() || null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{education ? "Chỉnh sửa học vấn" : "Thêm học vấn"}</DialogTitle>
          <DialogDescription>Thông tin về học vấn của bạn</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="school">Trường học *</Label>
            <Input
              id="school"
              value={school}
              onChange={(e) => setSchool(e.target.value)}
              placeholder="Ví dụ: Đại học Khoa học Tự nhiên"
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="degree">Bằng cấp *</Label>
            <Input
              id="degree"
              value={degree}
              onChange={(e) => setDegree(e.target.value)}
              placeholder="Ví dụ: Cử nhân Công nghệ thông tin"
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="period">Thời gian</Label>
            <Input
              id="period"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              placeholder="Ví dụ: 2015 - 2019"
              className="mt-2"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="gpa">GPA</Label>
              <Input
                id="gpa"
                value={gpa}
                onChange={(e) => setGpa(e.target.value)}
                placeholder="Ví dụ: 3.8/4.0"
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="honors">Danh hiệu</Label>
              <Input
                id="honors"
                value={honors}
                onChange={(e) => setHonors(e.target.value)}
                placeholder="Ví dụ: Học bổng xuất sắc"
                className="mt-2"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button onClick={handleSave} disabled={!school.trim() || !degree.trim() || isLoading}>
            {isLoading ? "Đang lưu..." : "Lưu"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

