"use client";

import { UserCheck, TrendingUp } from 'lucide-react';

interface UserProfileBioProps {
  bio?: string | null;
  careerGoals: string[];
}

export default function UserProfileBio({ bio, careerGoals }: UserProfileBioProps) {
  if (!bio && careerGoals.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
      <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2 uppercase tracking-wide">
        <UserCheck className="text-blue-600" size={20} /> Giới thiệu bản thân (Sứ Mệnh)
      </h3>
      {bio && (
        <p className="text-slate-700 leading-relaxed text-lg whitespace-pre-line">{bio}</p>
      )}

      {careerGoals.length > 0 && (
        <div className="mt-6 pt-6 border-t border-slate-100">
          <h4 className="text-sm font-bold text-slate-900 mb-2">Mục tiêu nghề nghiệp (Lộ trình):</h4>
          <div className="flex flex-col sm:flex-row gap-4">
            {careerGoals.map((goal, i) => (
              <div
                key={i}
                className="flex-1 bg-slate-50 p-3 rounded-lg border border-slate-100 text-sm text-slate-700 flex items-start gap-2"
              >
                <TrendingUp size={16} className="text-blue-600 shrink-0 mt-0.5" />
                {goal}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

