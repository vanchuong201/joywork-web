"use client";

import { GraduationCap } from 'lucide-react';
import { UserEducation } from '@/types/user';

interface UserProfileEducationProps {
  educations: UserEducation[];
}

export default function UserProfileEducation({ educations }: UserProfileEducationProps) {
  if (educations.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
        <GraduationCap size={20} /> Học Vấn
      </h3>
      <div className="space-y-4">
        {educations.map((edu) => (
          <div key={edu.id}>
            <div className="font-bold text-slate-900">{edu.school}</div>
            <div className="text-sm text-slate-600">{edu.degree}</div>
            {edu.period && <div className="text-xs text-slate-400 mt-1">{edu.period}</div>}
            {edu.gpa && <div className="text-xs text-slate-500 mt-1">GPA: {edu.gpa}</div>}
            {edu.honors && <div className="text-xs text-slate-500 mt-1">{edu.honors}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

