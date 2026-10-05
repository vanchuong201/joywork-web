"use client";

import { use } from "react";
import CvPublicPreviewScreen from "@/components/account/cv/CvPublicPreviewScreen";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

export default function AccountCvPreviewPage({ params }: { params: Promise<{ cvId: string }> }) {
  const { cvId } = use(params);
  return (
    <ProtectedRoute>
      <CvPublicPreviewScreen cvId={cvId} />
    </ProtectedRoute>
  );
}
