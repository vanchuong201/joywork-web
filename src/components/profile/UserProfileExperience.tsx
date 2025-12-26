"use client";

import { Briefcase, Building2, BarChart3, CheckCircle } from 'lucide-react';
import { UserExperience } from '@/types/user';

interface UserProfileExperienceProps {
  experiences: UserExperience[];
}

export default function UserProfileExperience({ experiences }: UserProfileExperienceProps) {
  if (experiences.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
      <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2 uppercase tracking-wide">
        <Briefcase className="text-blue-600" size={20} /> Kinh Nghiệm Làm Việc (Nhiệm Vụ)
      </h3>
      <div className="space-y-8">
        {experiences.map((exp, i) => (
          <div key={exp.id} className="relative pl-8 border-l-2 border-slate-100 last:border-0 pb-2">
            <div className="absolute left-[-9px] top-0 w-4 h-4 rounded-full bg-blue-600 border-4 border-white shadow-sm"></div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
              <h4 className="text-xl font-bold text-slate-900">{exp.role}</h4>
              {exp.period && (
                <span className="text-sm font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded">
                  {exp.period}
                </span>
              )}
            </div>
            <div className="text-blue-600 font-bold mb-3 flex items-center gap-2">
              <Building2 size={16} />
              {exp.company}
            </div>
            {exp.desc && <p className="text-slate-600 mb-4 whitespace-pre-line">{exp.desc}</p>}

            {/* Achievements / KPIs */}
            {exp.achievements && exp.achievements.length > 0 && (
              <div className="bg-slate-50 p-4 rounded-xl">
                <h5 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
                  <BarChart3 size={14} /> Kết quả đạt được (KPIs):
                </h5>
                <ul className="space-y-2">
                  {exp.achievements.map((ach, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm text-slate-700">
                      <CheckCircle size={14} className="text-green-500 shrink-0 mt-0.5" />
                      {ach}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

