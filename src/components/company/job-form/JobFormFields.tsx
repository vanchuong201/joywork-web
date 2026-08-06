import { Controller, useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import TiptapEditor from "@/components/ui/tiptap-editor";
import ProvinceSelect from "@/components/ui/province-select";
import WardSelect from "@/components/ui/ward-select";
import { educationLevels, translateEducationLevel } from "@/lib/education-levels";
import {
  SATURDAY_POLICY_OPTIONS,
  rangesIncludeSaturday,
  type WorkingTimeRange,
} from "@/lib/working-time";
import { WorkingTimeEditor } from "@/components/jobs/WorkingTimeEditor";
import { FormField, FormSection } from "./JobFormPrimitives";
import {
  employmentTypes,
  experienceLevels,
  jobLevels,
  type JobFormValues,
} from "./job-form-schema";
import {
  translateEmploymentType,
  translateExperienceLevel,
  translateJobLevel,
} from "./job-form-utils";

type JobFormFieldsProps = {
  expandedSections: Set<string>;
  onToggle: (section: string) => void;
};

export function JobFormFields({ expandedSections, onToggle }: JobFormFieldsProps) {
  const {
    register,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useFormContext<JobFormValues>();

  const locationSelected = watch("location");
  const worksOnSaturdayValue = watch("worksOnSaturday");
  const workingTimeRangesValue = watch("workingTimeRanges") ?? [];

  const saturdayRangeConflict =
    worksOnSaturdayValue === "NO" && rangesIncludeSaturday(workingTimeRangesValue)
      ? 'Khung giờ bên dưới đang có Thứ 7, trong khi bạn chọn "Không làm thứ 7". Bộ lọc sẽ ưu tiên lựa chọn này.'
      : worksOnSaturdayValue === "FIXED" &&
          workingTimeRangesValue.length > 0 &&
          !rangesIncludeSaturday(workingTimeRangesValue)
        ? 'Bạn chọn "Làm cố định thứ 7" nhưng khung giờ bên dưới chưa có Thứ 7.'
        : null;

  return (
    <>
      <FormSection
        title="1. Thông tin cơ bản"
        description="Thông tin này sẽ hiển thị ở phần đầu của JD, giúp ứng viên nhanh chóng nắm bắt thông tin chính"
        isExpanded={expandedSections.has("basic")}
        onToggle={() => onToggle("basic")}
      >
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-700">
            <strong>💡 Gợi ý:</strong> Các thông tin này sẽ được hiển thị dạng badge/icons ở phần header của JD, giúp ứng viên dễ dàng tìm kiếm và lọc việc làm.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="Tiêu đề vị trí" error={errors.title?.message as string | undefined} required>
            <Input
              placeholder="Ví dụ: Senior Frontend Developer"
              {...register("title")}
              className={errors.title ? "border-red-500 focus-visible:ring-red-500" : ""}
            />
          </FormField>
          <FormField label="Bộ phận" error={errors.department?.message as string | undefined}>
            <Input
              placeholder="Ví dụ: Kỹ thuật, Kinh doanh, Marketing..."
              {...register("department")}
              className={errors.department ? "border-red-500 focus-visible:ring-red-500" : ""}
            />
          </FormField>
        </div>

        <div className="space-y-3">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-[var(--foreground)]">Địa điểm làm việc</span>
          </label>
          <div className="grid gap-3 md:grid-cols-2">
            <ProvinceSelect
              value={watch("location")}
              onChange={(val) => setValue("location", val ?? undefined, { shouldDirty: true })}
              placeholder="Chọn tỉnh/thành phố"
            />
            <WardSelect
              provinceCodes={locationSelected ? [locationSelected] : []}
              disabled={!locationSelected}
              value={watch("wardCode") ?? undefined}
              onChange={(val) => setValue("wardCode", val ?? undefined, { shouldDirty: true })}
            />
          </div>
          <Input
            placeholder="Số nhà, phố..."
            {...register("specificAddress")}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {/* TODO: Re-enable remote checkbox when backend supports separate remote field */}
          {/*
          <FormField label="Hình thức làm việc">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                {...register("remote")}
                className="h-4 w-4 rounded border-[var(--border)]"
              />
              Cho phép làm việc từ xa (Remote)
            </label>
          </FormField>
          */}
          <FormField label="Hình thức làm việc">
            <select {...register("employmentType")} className="h-10 w-full rounded-md border border-[var(--border)] bg-[var(--input)] px-3 text-sm">
              {employmentTypes.map((type) => (
                <option key={type} value={type}>
                  {translateEmploymentType(type)}
                </option>
              ))}
            </select>
          </FormField>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <FormField label="Mức lương tối thiểu" error={errors.salaryMin?.message as string | undefined}>
            <Input
              type="number"
              placeholder="VD: 10000000"
              {...register("salaryMin")}
              className={errors.salaryMin ? "border-red-500 focus-visible:ring-red-500" : ""}
            />
          </FormField>
          <FormField label="Mức lương tối đa" error={errors.salaryMax?.message as string | undefined}>
            <Input
              type="number"
              placeholder="VD: 20000000"
              {...register("salaryMax")}
              className={errors.salaryMax ? "border-red-500 focus-visible:ring-red-500" : ""}
            />
          </FormField>
          <FormField label="Đơn vị tiền tệ" error={errors.currency?.message as string | undefined}>
            <select
              {...register("currency")}
              className="h-10 w-full rounded-md border border-[var(--border)] bg-[var(--input)] px-3 text-sm"
            >
              <option value="VND">VND</option>
              <option value="USD">USD</option>
            </select>
          </FormField>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <FormField label="Kinh nghiệm yêu cầu">
            <select {...register("experienceLevel")} className="h-10 w-full rounded-md border border-[var(--border)] bg-[var(--input)] px-3 text-sm">
              {experienceLevels.map((level) => (
                <option key={level} value={level}>
                  {translateExperienceLevel(level)}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Cấp bậc">
            <select {...register("jobLevel")} className="h-10 w-full rounded-md border border-[var(--border)] bg-[var(--input)] px-3 text-sm">
              <option value="">-- Chọn cấp bậc --</option>
              {jobLevels.map((level) => (
                <option key={level} value={level}>
                  {translateJobLevel(level)}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Học vấn">
            <select {...register("educationLevel")} className="h-10 w-full rounded-md border border-[var(--border)] bg-[var(--input)] px-3 text-sm">
              <option value="">-- Chọn học vấn --</option>
              {educationLevels.map((level) => (
                <option key={level} value={level}>
                  {translateEducationLevel(level)}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Giới tính (tuỳ chọn)">
            <select {...register("gender")} className="h-10 w-full rounded-md border border-[var(--border)] bg-[var(--input)] px-3 text-sm">
              <option value="">-- Không giới hạn --</option>
              <option value="MALE">Nam</option>
              <option value="FEMALE">Nữ</option>
              <option value="OTHER">Khác</option>
            </select>
          </FormField>
        </div>

        <div className="grid gap-4 md:grid-cols-1">
          <FormField label="Hạn nộp hồ sơ" error={errors.applicationDeadline?.message as string | undefined}>
            <Input type="date" {...register("applicationDeadline")} />
          </FormField>
        </div>
      </FormSection>

      <FormSection
        title="2. Sứ mệnh / Vai trò tổng quát"
        description="Mô tả tổng quan về vai trò và đóng góp của vị trí này. Nội dung sẽ được hiển thị với background màu xám nhạt và chữ in nghiêng để nổi bật."
        isExpanded={expandedSections.has("mission")}
        onToggle={() => onToggle("mission")}
        required
      >
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-xs text-amber-700">
            <strong>💡 Gợi ý:</strong> Viết bằng văn phong tự nhiên, mô tả sứ mệnh và vai trò tổng quát. Ví dụ: “Đóng góp giá trị vào mục tiêu chung của công ty trong việc lan tỏa triết lý...”
          </p>
        </div>
        <FormField label="Mô tả sứ mệnh và vai trò của vị trí" error={errors.mission?.message as string | undefined} required>
          <div data-field="mission">
            <Controller
              name="mission"
              control={control}
              render={({ field }) => (
                <TiptapEditor
                  value={field.value}
                  onChange={field.onChange}
                  placeholder={`Ví dụ:

Đóng góp giá trị vào mục tiêu chung của công ty trong việc lan tỏa triết lý “Quản trị đúng” và “đi làm là phải vui” đến doanh nghiệp Việt Nam.

Lãnh đạo mảng cộng đồng, kết nối, chăm lo và phát triển cộng đồng các nhà quản lý, người đi làm - những người cùng niềm tin về công việc hạnh phúc.`}
                  className={errors.mission ? "border-red-500" : ""}
                />
              )}
            />
          </div>
        </FormField>
      </FormSection>

      <FormSection
        title="3. Nhiệm vụ chuyên môn"
        description="Liệt kê chi tiết các nhiệm vụ và trách nhiệm chính của vị trí. Có thể nhóm theo từng nhóm nhiệm vụ để dễ đọc."
        isExpanded={expandedSections.has("tasks")}
        onToggle={() => onToggle("tasks")}
        required
      >
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-xs text-amber-700">
            <strong>💡 Gợi ý:</strong> Sử dụng bullet points để liệt kê. Có thể nhóm nhiệm vụ theo từng nhóm (ví dụ: “Nhóm nhiệm vụ phát triển cộng đồng”, “Nhóm nhiệm vụ vận hành cộng đồng”).
          </p>
        </div>
        <FormField label="Mô tả chi tiết nhiệm vụ và trách nhiệm" error={errors.tasks?.message as string | undefined} required>
          <div data-field="tasks">
            <Controller
              name="tasks"
              control={control}
              render={({ field }) => (
                <TiptapEditor
                  value={field.value}
                  onChange={field.onChange}
                  placeholder={`Ví dụ:

Nhóm nhiệm vụ phát triển cộng đồng:
• Phát triển thành viên các cộng đồng
• Tạo ra môi trường, hoạt động để thành viên có thể cùng tham gia

Nhóm nhiệm vụ vận hành cộng đồng:
• Xây dựng và thực hiện các hoạt động cộng đồng
• Thúc đẩy tương tác, thảo luận trong cộng đồng`}
                  className={errors.tasks ? "border-red-500" : ""}
                />
              )}
            />
          </div>
        </FormField>
      </FormSection>

      <FormSection
        title="4. Kết quả chuyên môn cần đạt"
        description="Mô tả các KPI hoặc mục tiêu vị trí này cần đạt được."
        isExpanded={expandedSections.has("kpis")}
        onToggle={() => onToggle("kpis")}
      >
        <FormField label="Mô tả các KPI/OKR cần đạt" error={errors.kpis?.message as string | undefined}>
          <Controller
            name="kpis"
            control={control}
            render={({ field }) => (
              <TiptapEditor
                value={field.value || ""}
                onChange={field.onChange}
                placeholder={`Ví dụ:

• Số lượng và chất lượng thành viên các cộng đồng
• Tỷ lệ thành viên hoạt động và tương tác
• Doanh thu từ cộng đồng
• Số lượng và chất lượng sự kiện/hội thảo được tổ chức`}
              />
            )}
          />
        </FormField>
      </FormSection>

      <FormSection
        title="5. Yêu cầu vị trí"
        description="Mô tả chi tiết các yêu cầu về Kiến thức, Kỹ năng và Thái độ. Trên trang hiển thị sẽ được chia thành 3 cột với icon tương ứng."
        isExpanded={expandedSections.has("ksa")}
        onToggle={() => onToggle("ksa")}
        required
      >
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-xs text-amber-700">
            <strong>💡 Gợi ý:</strong> Kiến thức sẽ hiển thị full width ở trên, Kỹ năng và Thái độ sẽ hiển thị 2 cột bên dưới. Sử dụng bullet points để liệt kê rõ ràng.
          </p>
        </div>
        <div className="space-y-4">
          <FormField label="Kiến thức chuyên môn" error={errors.knowledge?.message as string | undefined} required>
            <div data-field="knowledge">
              <Controller
                name="knowledge"
                control={control}
                render={({ field }) => (
                  <TiptapEditor
                    value={field.value}
                    onChange={field.onChange}
                    placeholder={`Ví dụ:

• Có kinh nghiệm tối thiểu trong việc phát triển, quản lý cộng đồng
• Ưu tiên đã có kinh nghiệm quản lý cộng đồng kinh doanh, doanh nghiệp
• Hiểu biết về điều phối, dẫn dắt thảo luận cộng đồng
• Hiểu biết về MBO, OKRs là lợi thế`}
                    className={errors.knowledge ? "border-red-500" : ""}
                  />
                )}
              />
            </div>
          </FormField>
          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Kỹ năng cần thiết" error={errors.skills?.message as string | undefined} required>
              <div data-field="skills">
                <Controller
                  name="skills"
                  control={control}
                  render={({ field }) => (
                    <TiptapEditor
                      value={field.value}
                      onChange={field.onChange}
                      placeholder={`Ví dụ:

• Khả năng lập và kiểm soát kế hoạch tốt
• Làm việc đa tác vụ
• Tư duy chiến lược, khả năng nhìn bao quát`}
                      className={errors.skills ? "border-red-500" : ""}
                    />
                  )}
                />
              </div>
            </FormField>
            <FormField label="Thái độ và phẩm chất" error={errors.attitude?.message as string | undefined} required>
              <div data-field="attitude">
                <Controller
                  name="attitude"
                  control={control}
                  render={({ field }) => (
                    <TiptapEditor
                      value={field.value}
                      onChange={field.onChange}
                      placeholder={`Ví dụ:

• Phù hợp với văn hóa và 5 giá trị cốt lõi công ty
• Đam mê tạo ra giá trị, muốn mang lại điều tốt đẹp cho người khác
• Tinh thần phụng sự`}
                      className={errors.attitude ? "border-red-500" : ""}
                    />
                  )}
                />
              </div>
            </FormField>
          </div>
        </div>
      </FormSection>

      <FormSection
        title="6. Quyền hạn và phạm vi ra quyết định"
        description="Mô tả các quyền hạn và phạm vi ra quyết định của vị trí. Trên trang hiển thị sẽ có tiêu đề phụ 'Có thể tự quyết:'."
        isExpanded={expandedSections.has("authority")}
        onToggle={() => onToggle("authority")}
      >
        <FormField label="Mô tả quyền hạn" error={errors.authority?.message as string | undefined}>
          <Controller
            name="authority"
            control={control}
            render={({ field }) => (
              <TiptapEditor
                value={field.value || ""}
                onChange={field.onChange}
                placeholder={`Ví dụ:

• Kế hoạch hoạt động hàng ngày của cộng đồng
• Nội dung và hình thức tương tác với thành viên
• Điều phối các hoạt động trong phạm vi được giao`}
              />
            )}
          />
        </FormField>
      </FormSection>

      <FormSection
        title="7. Quan hệ công việc"
        description="Mô tả các mối quan hệ nội bộ và bên ngoài mà vị trí này cần làm việc cùng."
        isExpanded={expandedSections.has("relationships")}
        onToggle={() => onToggle("relationships")}
      >
        <FormField label="Mô tả quan hệ nội bộ và bên ngoài" error={errors.relationships?.message as string | undefined}>
          <Controller
            name="relationships"
            control={control}
            render={({ field }) => (
              <TiptapEditor
                value={field.value || ""}
                onChange={field.onChange}
                placeholder={`Ví dụ:

Quan hệ nội bộ:
• CEO Mai Xuân Đạt - nhận định hướng và báo cáo trực tiếp
• Nhóm chuyên môn (đào tạo, huấn luyện) - để tạo nội dung giá trị

Quan hệ bên ngoài:
• Thành viên các cộng đồng (Quản trị Quán, học viên/khách hàng, độc giả)`}
              />
            )}
          />
        </FormField>
      </FormSection>

      <FormSection
        title="8. Lộ trình phát triển"
        description="Mô tả các hướng phát triển nghề nghiệp cho vị trí này. Trên trang hiển thị sẽ có dòng giới thiệu về phát triển theo năng lực."
        isExpanded={expandedSections.has("careerPath")}
        onToggle={() => onToggle("careerPath")}
      >
        <div className="mb-4 p-3 bg-slate-50 border border-slate-200 rounded-lg">
          <p className="text-xs text-slate-600">
            <strong>ℹ️ Lưu ý:</strong> Trên trang hiển thị JD sẽ tự động thêm dòng: “Tùy thuộc vào năng lực và nguyện vọng cá nhân, có thể phát triển theo hướng:”
          </p>
        </div>
        <FormField label="Mô tả lộ trình phát triển" error={errors.careerPath?.message as string | undefined}>
          <Controller
            name="careerPath"
            control={control}
            render={({ field }) => (
              <TiptapEditor
                value={field.value || ""}
                onChange={field.onChange}
                placeholder={`Ví dụ:

• Xây dựng và quản lý team khi cộng đồng phát triển
• Mở rộng phạm vi quản lý sang các mảng khác của công ty`}
              />
            )}
          />
        </FormField>
      </FormSection>

      <FormSection
        title="9. Quyền lợi"
        description="Mô tả thu nhập và các phúc lợi. Thu nhập sẽ được hiển thị nổi bật với font lớn và màu brand."
        isExpanded={expandedSections.has("benefits")}
        onToggle={() => onToggle("benefits")}
      >
        <FormField label="Thu nhập" error={errors.benefitsIncome?.message as string | undefined}>
          <Input placeholder="15 - 25 triệu++, sẵn sàng trả mức lương xứng đáng..." {...register("benefitsIncome")} />
          <p className="text-xs text-slate-500 mt-1">Nếu không điền, hệ thống sẽ tự động hiển thị mức lương từ các trường trên hoặc “Thoả thuận”</p>
        </FormField>
        <FormField label="Chế độ, phúc lợi" error={errors.benefitsPerks?.message as string | undefined}>
          <Controller
            name="benefitsPerks"
            control={control}
            render={({ field }) => (
              <TiptapEditor
                value={field.value || ""}
                onChange={field.onChange}
                placeholder={`Ví dụ:

• Làm việc linh hoạt ở bất cứ đâu (Công ty vận hành theo hướng quản trị bằng mục tiêu)
• Được tiếp cận và học hỏi trực tiếp từ CEO về quản trị
• Môi trường làm việc với triết lý “đi làm là phải vui”`}
              />
            )}
          />
        </FormField>
      </FormSection>

      <FormSection
        title="10. Thời gian làm việc"
        description="Mô tả lịch làm việc thông thường. Thông tin này được dùng cho bộ lọc nâng cao (ví dụ: nghỉ thứ 7, làm thứ 7)."
        isExpanded={expandedSections.has("workingTime")}
        onToggle={() => onToggle("workingTime")}
        required
      >
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-700">
            <strong>💡 Gợi ý:</strong> Có thể thêm nhiều khung thời gian (ví dụ Thứ 2 - Thứ 6: 08:30 - 17:00, Thứ 7: 08:00 - 12:00). Ghi chú phía dưới dùng để mô tả thêm các trường hợp linh hoạt.
          </p>
        </div>
        <FormField
          label="Công ty có làm thứ 7 không?"
          error={errors.worksOnSaturday?.message as string | undefined}
          required
        >
          <div className="space-y-2" data-field="worksOnSaturday">
            <Controller
              name="worksOnSaturday"
              control={control}
              render={({ field }) => (
                <div className="space-y-1.5">
                  {SATURDAY_POLICY_OPTIONS.map((opt) => (
                    <label key={opt.value} className="flex cursor-pointer items-center gap-2 text-sm">
                      <input
                        type="radio"
                        name={field.name}
                        value={opt.value}
                        checked={field.value === opt.value}
                        onChange={() => field.onChange(opt.value)}
                        className="h-4 w-4 accent-[var(--brand)]"
                      />
                      <span>{opt.label}</span>
                    </label>
                  ))}
                </div>
              )}
            />
            {saturdayRangeConflict ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                <p className="text-xs text-amber-800">{saturdayRangeConflict}</p>
              </div>
            ) : null}
          </div>
        </FormField>
        <Controller
          name="workingTimeRanges"
          control={control}
          render={({ field: rangesField }) => (
            <Controller
              name="workingTimeNote"
              control={control}
              render={({ field: noteField }) => (
                <WorkingTimeEditor
                  ranges={(rangesField.value as WorkingTimeRange[] | undefined) ?? []}
                  onRangesChange={(next) => rangesField.onChange(next)}
                  note={noteField.value ?? ""}
                  onNoteChange={(next) => noteField.onChange(next)}
                  rangeError={errors.workingTimeRanges?.message as string | undefined}
                  noteError={errors.workingTimeNote?.message as string | undefined}
                />
              )}
            />
          )}
        />
      </FormSection>

      <FormSection
        title="11. Thông tin bổ sung"
        description="Thông tin bổ sung về vị trí (tên vị trí, báo cáo cho ai, v.v.). Section này sẽ hiển thị ở cuối trang JD."
        isExpanded={expandedSections.has("general")}
        onToggle={() => onToggle("general")}
      >
        <FormField label="Nhập thông tin bổ sung (Bộ phận, Báo cáo cho...)" error={errors.generalInfo?.message as string | undefined}>
          <div data-field="generalInfo">
            <Controller
              name="generalInfo"
              control={control}
              render={({ field }) => (
                <TiptapEditor
                  value={field.value || ""}
                  onChange={field.onChange}
                  placeholder={`Ví dụ:

● Tên vị trí: Phụ trách Phát triển Cộng đồng
● Bộ phận: Cộng đồng
● Báo cáo cho: CEO Mai Xuân Đạt (trực tiếp)`}
                  className={errors.generalInfo ? "border-red-500" : ""}
                />
              )}
            />
          </div>
        </FormField>
      </FormSection>
    </>
  );
}
