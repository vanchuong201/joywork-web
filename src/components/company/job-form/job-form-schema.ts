import { z } from "zod";
import { educationLevels } from "@/lib/education-levels";
import {
  WORKING_DAYS,
  WORKING_DAY_INDEX,
  TIME_PATTERN,
  SATURDAY_WORK_POLICIES,
} from "@/lib/working-time";

export const employmentTypes = ["FULL_TIME", "PART_TIME", "CONTRACT", "INTERNSHIP", "REMOTE"] as const;
export const experienceLevels = ["NO_EXPERIENCE", "LT_1_YEAR", "Y1_2", "Y2_3", "Y3_5", "Y5_10", "GT_10"] as const;
export const jobLevels = ["INTERN_STUDENT", "FRESH_GRAD", "EMPLOYEE", "SPECIALIST_TEAM_LEAD", "MANAGER_HEAD", "DIRECTOR", "EXECUTIVE"] as const;
export const genders = ["MALE", "FEMALE", "OTHER"] as const;

/** Max plain-text length for JD rich-text fields (aligned with API Zod + Swagger). */
export const JD_RICH_TEXT_MAX_LENGTH = 10000;

export const workingTimeRangeSchema = z
  .object({
    dayFrom: z.enum(WORKING_DAYS),
    dayTo: z.enum(WORKING_DAYS),
    timeStart: z.string().regex(TIME_PATTERN, "Định dạng giờ không hợp lệ (HH:mm)"),
    timeEnd: z.string().regex(TIME_PATTERN, "Định dạng giờ không hợp lệ (HH:mm)"),
  })
  .refine(
    (range) => WORKING_DAY_INDEX[range.dayFrom] <= WORKING_DAY_INDEX[range.dayTo],
    "Ngày bắt đầu phải đứng trước hoặc bằng ngày kết thúc",
  )
  .refine((range) => range.timeStart < range.timeEnd, "Giờ bắt đầu phải nhỏ hơn giờ kết thúc");

export function getPlainTextLength(html: string): number {
  if (typeof window === "undefined") return html.length;
  const div = document.createElement("div");
  div.innerHTML = html;
  return div.textContent?.length || 0;
}

export function optionalEnum<T extends readonly [string, ...string[]]>(values: T, message: string) {
  return z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? undefined : v),
    z.enum(values, { message }).optional(),
  );
}

export const jobFormSchema = z
  .object({
    title: z.string().min(4, "Tiêu đề tối thiểu 4 ký tự").max(200, "Tiêu đề tối đa 200 ký tự"),
    location: z.string().optional(),
    wardCode: z.string().optional(),
    specificAddress: z.string().max(200, "Địa chỉ cụ thể tối đa 200 ký tự").optional().or(z.literal("")),
    remote: z.boolean().optional().default(false),
    employmentType: z.enum(employmentTypes).default("FULL_TIME"),
    experienceLevel: z.enum(experienceLevels).default("NO_EXPERIENCE"),
    salaryMin: z.string().refine((val) => !val || /^\d+$/.test(val), { message: "Lương phải là số" }),
    salaryMax: z.string().refine((val) => !val || /^\d+$/.test(val), { message: "Lương phải là số" }),
    currency: z.enum(["VND", "USD"]).default("VND"),
    applicationDeadline: z.string().refine((val) => !val || !Number.isNaN(Date.parse(val)), { message: "Ngày không hợp lệ" }),
    tags: z.array(z.string()).max(10, "Tối đa 10 tags").optional(),
    department: z.string().max(100, "Bộ phận tối đa 100 ký tự").optional().or(z.literal("")),
    jobLevel: optionalEnum(jobLevels, "Cấp bậc không hợp lệ"),
    educationLevel: optionalEnum(educationLevels, "Học vấn không hợp lệ"),
    gender: optionalEnum(genders, "Giới tính không hợp lệ"),
    generalInfo: z.string().optional(),
    mission: z.string().refine((val) => getPlainTextLength(val) >= 10, { message: "Sứ mệnh/Vai trò tối thiểu 10 ký tự" }),
    tasks: z.string().refine((val) => getPlainTextLength(val) >= 10, { message: "Nhiệm vụ chuyên môn tối thiểu 10 ký tự" }),
    knowledge: z.string().refine((val) => getPlainTextLength(val) >= 10, { message: "Kiến thức chuyên môn tối thiểu 10 ký tự" }),
    skills: z.string().refine((val) => getPlainTextLength(val) >= 10, { message: "Kỹ năng cần thiết tối thiểu 10 ký tự" }),
    attitude: z.string().refine((val) => getPlainTextLength(val) >= 10, { message: "Thái độ và phẩm chất tối thiểu 10 ký tự" }),
    kpis: z.string().optional(),
    authority: z.string().optional(),
    relationships: z.string().optional(),
    careerPath: z.string().optional(),
    benefitsIncome: z.string().max(200, "Thu nhập tối đa 200 ký tự").optional().or(z.literal("")),
    benefitsPerks: z.string().optional(),
    workingTimeRanges: z.array(workingTimeRangeSchema).max(7, "Tối đa 7 dòng thời gian").optional(),
    workingTimeNote: z.string().max(1000, "Ghi chú thời gian làm việc tối đa 1000 ký tự").optional().or(z.literal("")),
    worksOnSaturday: z.preprocess(
      (val) => (val === "" || val === null ? undefined : val),
      z.enum(SATURDAY_WORK_POLICIES, {
        message: "Vui lòng xác nhận công ty có làm thứ 7 không",
      }),
    ),
  })
  .superRefine((vals, ctx) => {
    const fields = [
      { key: "generalInfo", max: JD_RICH_TEXT_MAX_LENGTH, label: "Thông tin bổ sung" },
      { key: "mission", max: JD_RICH_TEXT_MAX_LENGTH, label: "Sứ mệnh/Vai trò" },
      { key: "tasks", max: JD_RICH_TEXT_MAX_LENGTH, label: "Nhiệm vụ chuyên môn" },
      { key: "knowledge", max: JD_RICH_TEXT_MAX_LENGTH, label: "Kiến thức chuyên môn" },
      { key: "skills", max: JD_RICH_TEXT_MAX_LENGTH, label: "Kỹ năng cần thiết" },
      { key: "attitude", max: JD_RICH_TEXT_MAX_LENGTH, label: "Thái độ và phẩm chất" },
      { key: "kpis", max: JD_RICH_TEXT_MAX_LENGTH, label: "Kết quả chuyên môn" },
      { key: "authority", max: JD_RICH_TEXT_MAX_LENGTH, label: "Quyền hạn" },
      { key: "relationships", max: JD_RICH_TEXT_MAX_LENGTH, label: "Quan hệ công việc" },
      { key: "careerPath", max: JD_RICH_TEXT_MAX_LENGTH, label: "Lộ trình phát triển" },
      { key: "benefitsPerks", max: JD_RICH_TEXT_MAX_LENGTH, label: "Phúc lợi" },
    ] as const;

    fields.forEach(({ key, max, label }) => {
      const value = vals[key as keyof typeof vals] as string | undefined;
      if (value && getPlainTextLength(value) > max) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [key],
          message: `${label} tối đa ${max} ký tự`,
        });
      }
    });

    const min = vals.salaryMin ? Number(vals.salaryMin) : undefined;
    const max = vals.salaryMax ? Number(vals.salaryMax) : undefined;
    if (typeof min === "number" && typeof max === "number" && !Number.isNaN(min) && !Number.isNaN(max) && min > max) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["salaryMin"],
        message: "Lương tối thiểu không được lớn hơn lương tối đa",
      });
    }

    if (!vals.worksOnSaturday) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["worksOnSaturday"],
        message: "Vui lòng xác nhận công ty có làm thứ 7 không",
      });
    }
  });

export type JobFormValues = z.infer<typeof jobFormSchema>;
