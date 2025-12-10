"use client";

import { Button } from "@/components/ui/button";
import { MessageCircleHeart } from "lucide-react";
import { useState } from "react";
import { useAuthStore } from "@/store/useAuth";
import { useAuthPrompt } from "@/contexts/AuthPromptContext";
import CreateTicketModal from "@/components/tickets/CreateTicketModal";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type Props = {
  companyId: string;
  companyName: string;
};

export default function CompanyMessageButton({ companyId, companyName }: Props) {
  const [ticketModalOpen, setTicketModalOpen] = useState(false);
  const user = useAuthStore((s) => s.user);
  const { openPrompt } = useAuthPrompt();
  const router = useRouter();

  const handleMessageClick = () => {
    if (!user) {
      openPrompt("message-company");
      return;
    }
    setTicketModalOpen(true);
  };

  return (
    <>
      <Button variant="outline" size="sm" onClick={handleMessageClick}>
        <MessageCircleHeart className="mr-2 h-4 w-4" /> Nhắn tin / Liên hệ
      </Button>

      <CreateTicketModal
        open={ticketModalOpen}
        onOpenChange={setTicketModalOpen}
        companyId={companyId}
        companyName={companyName}
        onCreated={(ticket) => {
          setTicketModalOpen(false);
          toast.success("Đã tạo tin nhắn, chuyển tới trang hội thoại");
          router.push(`/tickets/${ticket.id}`);
        }}
      />
    </>
  );
}

