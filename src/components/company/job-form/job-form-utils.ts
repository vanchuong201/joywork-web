import type { DefaultValues } from "react-hook-form";
import DOMPurify from "dompurify";
import { educationLevels } from "@/lib/education-levels";
import { parseWorkingTimeRanges, SATURDAY_WORK_POLICIES, type SaturdayWorkPolicy } from "@/lib/working-time";
import {
  employmentTypes,
  experienceLevels,
  jobLevels,
  type JobFormValues,
} from "./job-form-schema";

const DESCRIPTION_SANITIZE_CONFIG = {
  ALLOWED_TAGS: ["p", "strong", "em", "u", "s", "span", "a", "ul", "ol", "li", "blockquote", "code", "pre", "h1", "h2", "h3", "br", "div"],
  ALLOWED_ATTR: ["href", "target", "rel", "style", "class"],
};

export const INITIAL_EXPANDED_SECTIONS = ["basic", "general", "mission", "tasks", "ksa", "workingTime"] as const;

export const FIELD_LABELS: Record<string, string> = {
  title: "Tiêu đề vị trí",
  department: "Bộ phận",
  jobLevel: "Cấp bậc",
  educationLevel: "Học vấn",
  generalInfo: "Thông tin bổ sung",
  mission: "Sứ mệnh/Vai trò",
  tasks: "Nhiệm vụ chuyên môn",
  knowledge: "Kiến thức chuyên môn",
  skills: "Kỹ năng cần thiết",
  attitude: "Thái độ và phẩm chất",
  kpis: "Kết quả chuyên môn",
  authority: "Quyền hạn",
  relationships: "Quan hệ công việc",
  careerPath: "Lộ trình phát triển",
  benefitsIncome: "Thu nhập",
  benefitsPerks: "Phúc lợi",
  salaryMin: "Lương tối thiểu",
  salaryMax: "Lương tối đa",
  currency: "Đơn vị tiền tệ",
  applicationDeadline: "Hạn nộp hồ sơ",
  location: "Tỉnh / thành phố",
  wardCode: "Phường / xã",
  specificAddress: "Địa chỉ cụ thể",
  workingTimeRanges: "Thời gian làm việc",
  workingTimeNote: "Ghi chú thời gian làm việc",
  worksOnSaturday: "Công ty có làm thứ 7 không",
};

export const SECTION_MAP: Record<string, string> = {
  title: "basic",
  location: "basic",
  wardCode: "basic",
  specificAddress: "basic",
  employmentType: "basic",
  experienceLevel: "basic",
  salaryMin: "basic",
  salaryMax: "basic",
  currency: "basic",
  applicationDeadline: "basic",
  tags: "basic",
  department: "basic",
  jobLevel: "basic",
  educationLevel: "basic",
  mission: "mission",
  tasks: "tasks",
  kpis: "kpis",
  knowledge: "ksa",
  skills: "ksa",
  attitude: "ksa",
  authority: "authority",
  relationships: "relationships",
  careerPath: "careerPath",
  benefitsIncome: "benefits",
  benefitsPerks: "benefits",
  workingTimeRanges: "workingTime",
  workingTimeNote: "workingTime",
  worksOnSaturday: "workingTime",
  generalInfo: "general",
};

export type EditableJob = {
  id: string;
  title?: string | null;
  locations?: string[] | null;
  wardCodes?: string[] | null;
  specificAddress?: string | null;
  remote?: boolean | null;
  employmentType?: (typeof employmentTypes)[number] | null;
  experienceLevel?: (typeof experienceLevels)[number] | null;
  salaryMin?: number | null;
  salaryMax?: number | null;
  currency?: "VND" | "USD" | null;
  applicationDeadline?: string | null;
  tags?: string[] | null;
  department?: string | null;
  jobLevel?: (typeof jobLevels)[number] | null;
  educationLevel?: (typeof educationLevels)[number] | null;
  gender?: "MALE" | "FEMALE" | "OTHER" | null;
  generalInfo?: string | null;
  mission?: string | null;
  tasks?: string | null;
  knowledge?: string | null;
  skills?: string | null;
  attitude?: string | null;
  kpis?: string | null;
  authority?: string | null;
  relationships?: string | null;
  careerPath?: string | null;
  benefitsIncome?: string | null;
  benefitsPerks?: string | null;
  workingTimeRanges?: unknown;
  workingTimeNote?: string | null;
  worksOnSaturday?: SaturdayWorkPolicy | null;
};

export const EMPTY_JOB_FORM_VALUES: DefaultValues<JobFormValues> = {
  title: "",
  location: "",
  wardCode: "",
  specificAddress: "",
  remote: false,
  employmentType: undefined,
  experienceLevel: undefined,
  salaryMin: "",
  salaryMax: "",
  currency: "VND",
  applicationDeadline: "",
  tags: [],
  department: "",
  jobLevel: undefined,
  educationLevel: undefined,
  gender: undefined,
  generalInfo: "",
  mission: "",
  tasks: "",
  knowledge: "",
  skills: "",
  attitude: "",
  kpis: "",
  authority: "",
  relationships: "",
  careerPath: "",
  benefitsIncome: "",
  benefitsPerks: "",
  workingTimeRanges: [],
  workingTimeNote: "",
  worksOnSaturday: undefined,
};

export function getPlainTextLength(html: string): number {
  if (typeof window === "undefined") return html.length;
  const div = document.createElement("div");
  div.innerHTML = html;
  return div.textContent?.length || 0;
}

export function sanitizeHtml(html: string): string {
  const sanitized = DOMPurify.sanitize(html, DESCRIPTION_SANITIZE_CONFIG as never);
  return typeof sanitized === "string" ? sanitized : String(sanitized);
}

export function translateEmploymentType(type: (typeof employmentTypes)[number]): string {
  const map: Record<(typeof employmentTypes)[number], string> = {
    FULL_TIME: "Toàn thời gian",
    PART_TIME: "Bán thời gian",
    CONTRACT: "Hợp đồng thời vụ",
    INTERNSHIP: "Thực tập",
    REMOTE: "Làm việc từ xa (Remote)",
  };
  return map[type] || type;
}

export function translateExperienceLevel(level: (typeof experienceLevels)[number]): string {
  const map: Record<(typeof experienceLevels)[number], string> = {
    NO_EXPERIENCE: "Không yêu cầu kinh nghiệm",
    LT_1_YEAR: "Dưới 1 năm",
    Y1_2: "1 - 2 năm",
    Y2_3: "2 - 3 năm",
    Y3_5: "3 - 5 năm",
    Y5_10: "5 - 10 năm",
    GT_10: "Trên 10 năm",
  };
  return map[level] || level;
}

export function translateJobLevel(level: (typeof jobLevels)[number]): string {
  const map: Record<(typeof jobLevels)[number], string> = {
    INTERN_STUDENT: "Thực tập sinh / Sinh viên",
    FRESH_GRAD: "Mới tốt nghiệp",
    EMPLOYEE: "Nhân viên",
    SPECIALIST_TEAM_LEAD: "Chuyên viên / Trưởng nhóm",
    MANAGER_HEAD: "Quản lý / Trưởng phòng",
    DIRECTOR: "Giám đốc",
    EXECUTIVE: "Điều hành",
  };
  return map[level] || level;
}

export function createInitialExpandedSections(): Set<string> {
  return new Set(INITIAL_EXPANDED_SECTIONS);
}

function normalizeSaturdayPolicy(value: unknown): SaturdayWorkPolicy | undefined {
  if (typeof value === "string" && (SATURDAY_WORK_POLICIES as readonly string[]).includes(value)) {
    return value as SaturdayWorkPolicy;
  }
  return undefined;
}

export function jobToFormValues(job: EditableJob): DefaultValues<JobFormValues> {
  return {
    title: job.title ?? "",
    location: job.locations?.[0] ?? "",
    wardCode: job.wardCodes?.[0] ?? "",
    specificAddress: job.specificAddress ?? "",
    remote: job.remote ?? false,
    employmentType: job.employmentType ?? undefined,
    experienceLevel: job.experienceLevel ?? undefined,
    salaryMin: job.salaryMin != null ? String(job.salaryMin) : "",
    salaryMax: job.salaryMax != null ? String(job.salaryMax) : "",
    currency: job.currency ?? "VND",
    applicationDeadline: typeof job.applicationDeadline === "string" ? job.applicationDeadline.slice(0, 10) : "",
    tags: Array.isArray(job.tags) ? job.tags : [],
    department: job.department ?? "",
    jobLevel: job.jobLevel ?? undefined,
    educationLevel: job.educationLevel ?? undefined,
    gender: job.gender ?? undefined,
    generalInfo: job.generalInfo ?? "",
    mission: job.mission ?? "",
    tasks: job.tasks ?? "",
    knowledge: job.knowledge ?? "",
    skills: job.skills ?? "",
    attitude: job.attitude ?? "",
    kpis: job.kpis ?? "",
    authority: job.authority ?? "",
    relationships: job.relationships ?? "",
    careerPath: job.careerPath ?? "",
    benefitsIncome: job.benefitsIncome ?? "",
    benefitsPerks: job.benefitsPerks ?? "",
    workingTimeRanges: parseWorkingTimeRanges(job.workingTimeRanges),
    workingTimeNote: job.workingTimeNote ?? "",
    worksOnSaturday: normalizeSaturdayPolicy(job.worksOnSaturday),
  };
}
