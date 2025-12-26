"use client";

import { Target } from 'lucide-react';

interface UserProfileExpectationsProps {
  expectedSalary?: string | null;
  workMode?: string | null;
  expectedCulture?: string | null;
}

export default function UserProfileExpectations({
  expectedSalary,
  workMode,
  expectedCulture,
}: UserProfileExpectationsProps) {
  if (!expectedSalary && !workMode && !expectedCulture) {
    return null;
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
        <Target size={20} /> Mong Muốn (Quyền Lợi)
      </h3>
      <div className="space-y-4 text-sm">
        {expectedSalary && (
          <div className="flex justify-between items-center">
            <span className="text-slate-500">Mức lương kỳ vọng</span>
            <span className="font-bold text-green-600">{expectedSalary}</span>
          </div>
        )}
        {workMode && (
          <div className="flex justify-between items-center">
            <span className="text-slate-500">Hình thức làm việc</span>
            <span className="font-medium text-slate-900">{workMode}</span>
          </div>
        )}
        {expectedCulture && (
          <div>
            <span className="text-slate-500 block mb-1">Văn hóa mong muốn</span>
            <p className="text-slate-700 italic">&quot;{expectedCulture}&quot;</p>
          </div>
        )}
      </div>
    </div>
  );
}

