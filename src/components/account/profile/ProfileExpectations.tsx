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

const MAX_EXPECTED_CULTURE_LENGTH = 400;

type Currency = "VND" | "USD";

export default function ProfileExpectations({ profile }: ProfileExpectationsProps) {
  const queryClient = useQueryClient();
  const [salaryMin, setSalaryMin] = useState<string>(
    profile.profile?.expectedSalaryMin != null ? String(profile.profile.expectedSalaryMin) : ""
  );
  const [salaryMax, setSalaryMax] = useState<string>(
    profile.profile?.expectedSalaryMax != null ? String(profile.profile.expectedSalaryMax) : ""
  );
  const [currency, setCurrency] = useState<Currency>(
    (profile.profile?.salaryCurrency as Currency) || "VND"
  );
  const [workMode, setWorkMode] = useState(profile.profile?.workMode || "");
  const [expectedCulture, setExpectedCulture] = useState(
    (profile.profile?.expectedCulture || "").slice(0, MAX_EXPECTED_CULTURE_LENGTH)
  );
  const [careerGoals, setCareerGoals] = useState<string[]>(profile.profile?.careerGoals || []);

  useEffect(() => {
    setSalaryMin(profile.profile?.expectedSalaryMin != null ? String(profile.profile.expectedSalaryMin) : "");
    setSalaryMax(profile.profile?.expectedSalaryMax != null ? String(profile.profile.expectedSalaryMax) : "");
    setCurrency((profile.profile?.salaryCurrency as Currency) || "VND");
    setWorkMode(profile.profile?.workMode || "");
    setExpectedCulture((profile.profile?.expectedCulture || "").slice(0, MAX_EXPECTED_CULTURE_LENGTH));
    setCareerGoals(profile.profile?.careerGoals || []);
  }, [profile]);

  const updateProfile = useMutation({
    mutationFn: async (data: {
      expectedSalaryMin?: number | null;
      expectedSalaryMax?: number | null;
      salaryCurrency?: string | null;
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
    const minVal = salaryMin ? parseInt(salaryMin, 10) : null;
    const maxVal = salaryMax ? parseInt(salaryMax, 10) : null;

    if (minVal !== null && maxVal !== null && minVal > maxVal) {
      toast.error("Lương từ không được lớn hơn lương đến");
      return;
    }

    updateProfile.mutate({
      expectedSalaryMin: minVal,
      expectedSalaryMax: maxVal,
      salaryCurrency: (minVal !== null || maxVal !== null) ? currency : null,
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
    salaryMin !== (profile.profile?.expectedSalaryMin != null ? String(profile.profile.expectedSalaryMin) : "") ||
    salaryMax !== (profile.profile?.expectedSalaryMax != null ? String(profile.profile.expectedSalaryMax) : "") ||
    currency !== ((profile.profile?.salaryCurrency as Currency) || "VND") ||
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
        {/* Salary Range — cùng bố cục form tạo JD (CreateJobModal) */}
        <div className="space-y-2">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="profile-expected-salary-min">Mức lương tối thiểu</Label>
              <Input
                id="profile-expected-salary-min"
                type="number"
                value={salaryMin}
                onChange={(e) => setSalaryMin(e.target.value)}
                placeholder="VD: 10000000"
                min={0}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-expected-salary-max">Mức lương tối đa</Label>
              <Input
                id="profile-expected-salary-max"
                type="number"
                value={salaryMax}
                onChange={(e) => setSalaryMax(e.target.value)}
                placeholder="VD: 20000000"
                min={0}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-salary-currency">Đơn vị tiền tệ</Label>
              <select
                id="profile-salary-currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value as Currency)}
                className="h-10 w-full rounded-md border border-[var(--border)] bg-[var(--input)] px-3 text-sm"
              >
                <option value="VND">VND</option>
                <option value="USD">USD</option>
              </select>
            </div>
          </div>
          {salaryMin && salaryMax && parseInt(salaryMin, 10) > parseInt(salaryMax, 10) && (
            <p className="text-xs text-red-500">Mức lương tối thiểu không được lớn hơn mức lương tối đa</p>
          )}
          <p className="text-xs text-muted-foreground">
            {currency === "VND"
              ? "Nhập số tiền (VND), ví dụ 15.000.000 – 25.000.000."
              : "Nhập số tiền (USD), ví dụ 1.000 – 2.000."}
          </p>
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
          <Label htmlFor="expectedCulture">
            Văn hóa mong muốn <span className="text-red-500">*</span>
          </Label>
          <Textarea
            id="expectedCulture"
            value={expectedCulture}
            onChange={(e) =>
              setExpectedCulture(e.target.value.slice(0, MAX_EXPECTED_CULTURE_LENGTH))
            }
            placeholder="Mô tả văn hóa công ty bạn mong muốn..."
            rows={4}
            maxLength={MAX_EXPECTED_CULTURE_LENGTH}
            required
            className="mt-2"
          />
          <p className="mt-1 text-right text-xs text-[var(--muted-foreground)]">
            {expectedCulture.length}/{MAX_EXPECTED_CULTURE_LENGTH}
          </p>
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

