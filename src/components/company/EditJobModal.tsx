"use client";

import { useMemo } from "react";
import api from "@/lib/api";
import { JobFormModal } from "./job-form/JobFormModal";
import {
  EMPTY_JOB_FORM_VALUES,
  type EditableJob,
  jobToFormValues,
  sanitizeHtml,
} from "./job-form/job-form-utils";
import type { JobFormValues } from "./job-form/job-form-schema";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job: EditableJob;
  onSuccess?: () => void;
};

export default function EditJobModal({ open, onOpenChange, job, onSuccess }: Props) {
  const defaultValues = useMemo(
    () => (job ? jobToFormValues(job) : EMPTY_JOB_FORM_VALUES),
    [job],
  );

  const handleSubmit = async (values: JobFormValues) => {
    if (!job?.id) {
      throw new Error("Job không hợp lệ");
    }

    const payload = {
      title: values.title.trim(),
      location: values.location || null,
      // Không gửi ward nếu không còn tỉnh — backend sẽ merge lại tỉnh từ ward còn sót.
      wardCodes: values.location && values.wardCode ? [values.wardCode] : [],
      specificAddress: values.specificAddress?.trim() || null,
      remote: values.remote ?? false,
      employmentType: values.employmentType,
      experienceLevel: values.experienceLevel,
      salaryMin: values.salaryMin ? Number(values.salaryMin) : null,
      salaryMax: values.salaryMax ? Number(values.salaryMax) : null,
      currency: values.currency || "VND",
      applicationDeadline: values.applicationDeadline ? new Date(values.applicationDeadline).toISOString() : null,
      department: values.department?.trim() || null,
      jobLevel: values.jobLevel,
      educationLevel: values.educationLevel,
      gender: values.gender || null,
      generalInfo: values.generalInfo ? sanitizeHtml(values.generalInfo) : null,
      mission: sanitizeHtml(values.mission),
      tasks: sanitizeHtml(values.tasks),
      knowledge: sanitizeHtml(values.knowledge),
      skills: sanitizeHtml(values.skills),
      attitude: sanitizeHtml(values.attitude),
      kpis: values.kpis ? sanitizeHtml(values.kpis) : null,
      authority: values.authority ? sanitizeHtml(values.authority) : null,
      relationships: values.relationships ? sanitizeHtml(values.relationships) : null,
      careerPath: values.careerPath ? sanitizeHtml(values.careerPath) : null,
      benefitsIncome: values.benefitsIncome?.trim() || null,
      benefitsPerks: values.benefitsPerks ? sanitizeHtml(values.benefitsPerks) : null,
      workingTimeRanges:
        values.workingTimeRanges && values.workingTimeRanges.length > 0
          ? values.workingTimeRanges
          : null,
      workingTimeNote: values.workingTimeNote?.trim() || null,
      worksOnSaturday: values.worksOnSaturday,
    };

    await api.patch(`/api/jobs/${job.id}`, payload);
  };

  return (
    <JobFormModal
      open={open}
      onOpenChange={onOpenChange}
      title="Chỉnh sửa job"
      description="Cập nhật đầy đủ thông tin để JD chuẩn. Các trường có dấu * là bắt buộc."
      submitLabel="Lưu thay đổi"
      submittingLabel="Đang lưu..."
      successMessage="Cập nhật job thành công"
      fallbackErrorMessage="Cập nhật job thất bại"
      defaultValues={defaultValues}
      onSubmit={handleSubmit}
      onSuccess={onSuccess}
    />
  );
}
