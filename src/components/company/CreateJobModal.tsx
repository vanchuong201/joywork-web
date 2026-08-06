"use client";

import api from "@/lib/api";
import { JobFormModal } from "./job-form/JobFormModal";
import {
  EMPTY_JOB_FORM_VALUES,
  sanitizeHtml,
} from "./job-form/job-form-utils";
import type { JobFormValues } from "./job-form/job-form-schema";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  onSuccess?: () => void;
};

export default function CreateJobModal({ open, onOpenChange, companyId, onSuccess }: Props) {
  const handleSubmit = async (values: JobFormValues) => {
    const payload = {
      title: values.title.trim(),
      location: values.location || undefined,
      // Không gửi ward nếu không còn tỉnh — backend sẽ merge lại tỉnh từ ward còn sót.
      wardCodes: values.location && values.wardCode ? [values.wardCode] : [],
      specificAddress: values.specificAddress?.trim() || undefined,
      remote: values.remote ?? false,
      employmentType: values.employmentType,
      experienceLevel: values.experienceLevel,
      salaryMin: values.salaryMin ? Number(values.salaryMin) : undefined,
      salaryMax: values.salaryMax ? Number(values.salaryMax) : undefined,
      currency: values.currency || "VND",
      applicationDeadline: values.applicationDeadline ? new Date(values.applicationDeadline).toISOString() : undefined,
      tags: values.tags || [],
      department: values.department?.trim() || undefined,
      jobLevel: values.jobLevel || undefined,
      educationLevel: values.educationLevel || undefined,
      gender: values.gender || undefined,
      generalInfo: values.generalInfo ? sanitizeHtml(values.generalInfo) : undefined,
      mission: sanitizeHtml(values.mission),
      tasks: sanitizeHtml(values.tasks),
      knowledge: sanitizeHtml(values.knowledge),
      skills: sanitizeHtml(values.skills),
      attitude: sanitizeHtml(values.attitude),
      kpis: values.kpis ? sanitizeHtml(values.kpis) : undefined,
      authority: values.authority ? sanitizeHtml(values.authority) : undefined,
      relationships: values.relationships ? sanitizeHtml(values.relationships) : undefined,
      careerPath: values.careerPath ? sanitizeHtml(values.careerPath) : undefined,
      benefitsIncome: values.benefitsIncome?.trim() || undefined,
      benefitsPerks: values.benefitsPerks ? sanitizeHtml(values.benefitsPerks) : undefined,
      workingTimeRanges:
        values.workingTimeRanges && values.workingTimeRanges.length > 0
          ? values.workingTimeRanges
          : undefined,
      workingTimeNote: values.workingTimeNote?.trim() || undefined,
      worksOnSaturday: values.worksOnSaturday,
    };

    await api.post(`/api/jobs/companies/${companyId}/jobs`, payload);
  };

  return (
    <JobFormModal
      open={open}
      onOpenChange={onOpenChange}
      title="Đăng tin tuyển dụng mới"
      description="Điền đầy đủ thông tin để tạo JD chuẩn. Các trường có dấu * là bắt buộc."
      submitLabel="Đăng tin tuyển dụng"
      submittingLabel="Đang đăng..."
      successMessage="Đăng job mới thành công"
      fallbackErrorMessage="Đăng job thất bại, vui lòng thử lại"
      defaultValues={EMPTY_JOB_FORM_VALUES}
      onSubmit={handleSubmit}
      onSuccess={onSuccess}
    />
  );
}
