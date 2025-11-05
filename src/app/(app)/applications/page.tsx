import EmptyState from "@/components/ui/empty-state";

export default function ApplicationsPage() {
  return (
    <div className="space-y-6">
      <EmptyState
        title="Ứng tuyển của tôi"
        subtitle="Danh sách hồ sơ đã nộp sẽ xuất hiện tại đây khi tính năng hoàn tất."
      />
    </div>
  );
}

