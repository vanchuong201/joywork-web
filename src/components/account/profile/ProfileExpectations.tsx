"use client";

import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { OwnUserProfile } from "@/types/user";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, X } from "lucide-react";

interface ProfileExpectationsProps {
  profile: OwnUserProfile;
}

export default function ProfileExpectations({ profile }: ProfileExpectationsProps) {
  const queryClient = useQueryClient();
  const [expectedSalary, setExpectedSalary] = useState(profile.profile?.expectedSalary || "");
  const [workMode, setWorkMode] = useState(profile.profile?.workMode || "");
  const [expectedCulture, setExpectedCulture] = useState(profile.profile?.expectedCulture || "");
  const [careerGoals, setCareerGoals] = useState<string[]>(profile.profile?.careerGoals || []);

  useEffect(() => {
    setExpectedSalary(profile.profile?.expectedSalary || "");
    setWorkMode(profile.profile?.workMode || "");
    setExpectedCulture(profile.profile?.expectedCulture || "");
    setCareerGoals(profile.profile?.careerGoals || []);
  }, [profile]);

  const updateProfile = useMutation({
    mutationFn: async (data: {
      expectedSalary?: string | null;
      workMode?: string | null;
      expectedCulture?: string | null;
      careerGoals?: string[];
    }) => {
      const res = await api.patch("/api/users/me/profile", data);
      return res.data.data.profile as OwnUserProfile;
    },
    onSuccess: (data) => {
      toast.success("Cập nhật mong muốn thành công");
      queryClient.setQueryData(["own-profile"], data);
    },
    onError: () => {
      toast.error("Cập nhật thất bại");
    },
  });

  const handleSave = () => {
    updateProfile.mutate({
      expectedSalary: expectedSalary || null,
      workMode: workMode || null,
      expectedCulture: expectedCulture || null,
      careerGoals,
    });
  };

  const addCareerGoal = () => {
    setCareerGoals([...careerGoals, ""]);
  };

  const updateCareerGoal = (index: number, value: string) => {
    const newGoals = [...careerGoals];
    newGoals[index] = value;
    setCareerGoals(newGoals);
  };

  const removeCareerGoal = (index: number) => {
    setCareerGoals(careerGoals.filter((_, i) => i !== index));
  };

  const hasChanges =
    expectedSalary !== (profile.profile?.expectedSalary || "") ||
    workMode !== (profile.profile?.workMode || "") ||
    expectedCulture !== (profile.profile?.expectedCulture || "") ||
    JSON.stringify(careerGoals) !== JSON.stringify(profile.profile?.careerGoals || []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mong muốn (Quyền lợi)</CardTitle>
        <CardDescription>Mức lương, hình thức làm việc và văn hóa mong muốn</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label htmlFor="expectedSalary">Mức lương kỳ vọng</Label>
          <Input
            id="expectedSalary"
            value={expectedSalary}
            onChange={(e) => setExpectedSalary(e.target.value)}
            placeholder="Ví dụ: $2000 - $2500"
            className="mt-2"
          />
        </div>

        <div>
          <Label htmlFor="workMode">Hình thức làm việc</Label>
          <Input
            id="workMode"
            value={workMode}
            onChange={(e) => setWorkMode(e.target.value)}
            placeholder="Ví dụ: Hybrid hoặc Remote"
            className="mt-2"
          />
        </div>

        <div>
          <Label htmlFor="expectedCulture">Văn hóa mong muốn</Label>
          <Textarea
            id="expectedCulture"
            value={expectedCulture}
            onChange={(e) => setExpectedCulture(e.target.value)}
            placeholder="Mô tả văn hóa công ty bạn mong muốn..."
            rows={4}
            className="mt-2"
          />
        </div>

        <div>
          <Label>Mục tiêu nghề nghiệp</Label>
          <div className="mt-2 space-y-2">
            {careerGoals.map((goal, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={goal}
                  onChange={(e) => updateCareerGoal(index, e.target.value)}
                  placeholder="Ví dụ: Trở thành Technical Lead trong 2 năm tới"
                />
                <Button type="button" variant="ghost" size="icon" onClick={() => removeCareerGoal(index)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={addCareerGoal} className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              Thêm mục tiêu
            </Button>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={!hasChanges || updateProfile.isPending}>
            {updateProfile.isPending ? "Đang lưu..." : "Lưu thay đổi"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

