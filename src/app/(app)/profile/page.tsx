import EmptyState from "@/components/ui/empty-state";

export default function ProfilePage() {
  return (
    <div className="space-y-6">
      <EmptyState
        title="Hồ sơ của tôi"
        subtitle="Trang chỉnh sửa hồ sơ đang được hoàn thiện. Bạn sẽ sớm cập nhật thông tin cá nhân tại đây."
      />
    </div>
  );
}

