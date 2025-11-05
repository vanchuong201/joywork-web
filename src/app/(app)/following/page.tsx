import EmptyState from "@/components/ui/empty-state";

export default function FollowingCompaniesPage() {
  return (
    <div className="space-y-6">
      <EmptyState
        title="Công ty theo dõi"
        subtitle="Các công ty bạn follow sẽ hiển thị tại đây với cập nhật mới nhất."
      />
    </div>
  );
}

