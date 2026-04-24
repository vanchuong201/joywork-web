export const EDUCATION_LEVELS = [
  "TRAINING_CENTER",
  "INTERMEDIATE",
  "COLLEGE",
  "BACHELOR",
  "MASTER",
  "PHD",
] as const;

export const educationLevels = EDUCATION_LEVELS;
export type EducationLevel = (typeof EDUCATION_LEVELS)[number];

export const EDUCATION_LEVEL_OPTIONS: { value: EducationLevel; label: string }[] = [
  { value: "TRAINING_CENTER", label: "Trung tâm đào tạo" },
  { value: "INTERMEDIATE", label: "Trung cấp" },
  { value: "COLLEGE", label: "Cao đẳng" },
  { value: "BACHELOR", label: "Đại học" },
  { value: "MASTER", label: "Thạc sĩ" },
  { value: "PHD", label: "Tiến sĩ" },
];

export function translateEducationLevel(level?: string | null): string {
  if (!level) return "";
  const map: Record<string, string> = {
    TRAINING_CENTER: "Trung tâm đào tạo",
    INTERMEDIATE: "Trung cấp",
    COLLEGE: "Cao đẳng",
    BACHELOR: "Đại học",
    MASTER: "Thạc sĩ",
    PHD: "Tiến sĩ",
  };
  return map[level] ?? level;
}
