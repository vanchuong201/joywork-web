"use client";

import { use } from "react";
import AccountLayout from "@/components/account/AccountLayout";
import CvEditorScreen from "@/components/account/cv/CvEditorScreen";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

export default function AccountCvEditorPage({ params }: { params: Promise<{ cvId: string }> }) {
  const { cvId } = use(params);
  return (
    <ProtectedRoute>
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-6">
        <AccountLayout>
          <CvEditorScreen cvId={cvId} />
        </AccountLayout>
      </div>
    </ProtectedRoute>
  );
}
