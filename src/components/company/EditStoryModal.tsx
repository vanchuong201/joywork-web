"use client";

import { Dialog } from "@headlessui/react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import CompanyStoryEditor from "@/components/company/CompanyStoryEditor";
import type { CompanyStoryBlock } from "@/types/company";
import { useState } from "react";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
  initialStory?: CompanyStoryBlock[] | null;
  fallbackDescription?: string | null;
  onSuccess: () => void;
};

export default function EditStoryModal({
  isOpen,
  onClose,
  companyId,
  initialStory,
  fallbackDescription,
  onSuccess,
}: Props) {
  const [busy, setBusy] = useState(false);

  return (
    <Dialog open={isOpen} onClose={() => !busy && onClose()} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto w-full max-w-5xl rounded-xl bg-[var(--card)] p-0 shadow-xl">
          <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4">
            <Dialog.Title className="text-lg font-semibold text-[var(--foreground)]">
              Trình bày câu chuyện doanh nghiệp
            </Dialog.Title>
            <button
              onClick={() => !busy && onClose()}
              className="rounded-full p-1 text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
              aria-label="Đóng"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="max-h-[80vh] overflow-auto p-6">
            <CompanyStoryEditor
              companyId={companyId}
              initialStory={initialStory}
              fallbackDescription={fallbackDescription}
              onSaved={() => {
                onSuccess();
                onClose();
              }}
            />
          </div>
          <div className="flex items-center justify-end gap-2 border-t border-[var(--border)] px-6 py-3">
            <Button type="button" variant="outline" onClick={() => onClose()}>
              Đóng
            </Button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}


