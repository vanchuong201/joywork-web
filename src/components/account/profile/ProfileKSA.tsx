"use client";

import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { OwnUserProfile } from "@/types/user";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, X } from "lucide-react";
import { Input } from "@/components/ui/input";

interface ProfileKSAProps {
  profile: OwnUserProfile;
}

export default function ProfileKSA({ profile }: ProfileKSAProps) {
  const queryClient = useQueryClient();
  const [knowledge, setKnowledge] = useState<string[]>(profile.profile?.knowledge || []);
  const [skills, setSkills] = useState<string[]>(profile.profile?.skills || []);
  const [attitude, setAttitude] = useState<string[]>(profile.profile?.attitude || []);

  useEffect(() => {
    setKnowledge(profile.profile?.knowledge || []);
    setSkills(profile.profile?.skills || []);
    setAttitude(profile.profile?.attitude || []);
  }, [profile]);

  const updateProfile = useMutation({
    mutationFn: async (data: { knowledge: string[]; skills: string[]; attitude: string[] }) => {
      const res = await api.patch("/api/users/me/profile", data);
      return res.data.data.profile as OwnUserProfile;
    },
    onSuccess: (data) => {
      toast.success("Cập nhật năng lực thành công");
      queryClient.setQueryData(["own-profile"], data);
    },
    onError: () => {
      toast.error("Cập nhật thất bại");
    },
  });

  const handleSave = () => {
    updateProfile.mutate({ knowledge, skills, attitude });
  };

  const addItem = (list: string[], setList: (items: string[]) => void) => {
    setList([...list, ""]);
  };

  const updateItem = (list: string[], setList: (items: string[]) => void, index: number, value: string) => {
    const newList = [...list];
    newList[index] = value;
    setList(newList);
  };

  const removeItem = (list: string[], setList: (items: string[]) => void, index: number) => {
    setList(list.filter((_, i) => i !== index));
  };

  const hasChanges =
    JSON.stringify(knowledge) !== JSON.stringify(profile.profile?.knowledge || []) ||
    JSON.stringify(skills) !== JSON.stringify(profile.profile?.skills || []) ||
    JSON.stringify(attitude) !== JSON.stringify(profile.profile?.attitude || []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Năng lực (KSA)</CardTitle>
        <CardDescription>Kiến thức, Kỹ năng và Thái độ</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Knowledge */}
        <div>
          <Label>Kiến thức</Label>
          <div className="mt-2 space-y-2">
            {knowledge.map((item, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={item}
                  onChange={(e) => updateItem(knowledge, setKnowledge, index, e.target.value)}
                  placeholder="Ví dụ: Kiến thức sâu về JavaScript (ES6+)"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeItem(knowledge, setKnowledge, index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => addItem(knowledge, setKnowledge)}
              className="w-full"
            >
              <Plus className="mr-2 h-4 w-4" />
              Thêm kiến thức
            </Button>
          </div>
        </div>

        {/* Skills */}
        <div>
          <Label>Kỹ năng</Label>
          <div className="mt-2 space-y-2">
            {skills.map((item, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={item}
                  onChange={(e) => updateItem(skills, setSkills, index, e.target.value)}
                  placeholder="Ví dụ: React, TypeScript"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeItem(skills, setSkills, index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => addItem(skills, setSkills)}
              className="w-full"
            >
              <Plus className="mr-2 h-4 w-4" />
              Thêm kỹ năng
            </Button>
          </div>
        </div>

        {/* Attitude */}
        <div>
          <Label>Thái độ</Label>
          <div className="mt-2 space-y-2">
            {attitude.map((item, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={item}
                  onChange={(e) => updateItem(attitude, setAttitude, index, e.target.value)}
                  placeholder="Ví dụ: Cầu tiến, ham học hỏi"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeItem(attitude, setAttitude, index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => addItem(attitude, setAttitude)}
              className="w-full"
            >
              <Plus className="mr-2 h-4 w-4" />
              Thêm thái độ
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

