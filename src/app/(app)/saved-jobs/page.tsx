import EmptyState from "@/components/ui/empty-state";

export default function SavedJobsPage() {
  return (
    <div className="space-y-6">
      <EmptyState
        title="Việc đã lưu"
        subtitle="Bạn có thể lưu việc làm yêu thích và quản lý tại đây. Tính năng đang trong quá trình phát triển."
      />
    </div>
  );
}

