import EmptyState from "@/components/ui/empty-state";

export default function SystemPage() {
  return (
    <div className="space-y-6">
      <EmptyState
        title="Bảng điều khiển hệ thống"
        subtitle="Khu vực moderation và analytics sẽ được triển khai trong các phiên bản tiếp theo."
      />
    </div>
  );
}

