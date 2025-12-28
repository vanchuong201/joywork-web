"use client";

import { Sparkles, BookOpen, Zap, Heart } from 'lucide-react';

interface UserProfileKSAProps {
  knowledge: string[];
  skills: string[];
  attitude: string[];
}

export default function UserProfileKSA({ knowledge, skills, attitude }: UserProfileKSAProps) {
  if (knowledge.length === 0 && skills.length === 0 && attitude.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 border-t-4 border-[var(--brand-secondary)]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-slate-900 flex items-center gap-2">
          <Sparkles className="text-[var(--brand-secondary)]" size={20} /> Năng Lực (KSA)
        </h3>
        {/* <span className="text-xs font-bold bg-pink-500/10 text-pink-500 px-2 py-1 rounded">
          Matching Data
        </span> */}
      </div>

      <div className="space-y-6">
        {/* Knowledge */}
        {knowledge.length > 0 && (
          <>
            <div>
              <h4 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-1">
                <BookOpen size={16} className="text-slate-400" /> Kiến thức
              </h4>
              <ul className="text-sm text-slate-600 space-y-2">
                {knowledge.map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="mt-1.5 w-1 h-1 rounded-full bg-slate-400 shrink-0"></span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            {(skills.length > 0 || attitude.length > 0) && <div className="h-px bg-slate-100"></div>}
          </>
        )}

        {/* Skills */}
        {skills.length > 0 && (
          <>
            <div>
              <h4 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-1">
                <Zap size={16} className="text-slate-400" /> Kỹ năng
              </h4>
              <div className="flex flex-wrap gap-2">
                {skills.map((item, i) => (
                  <span
                    key={i}
                    className="px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs font-medium text-slate-700"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
            {attitude.length > 0 && <div className="h-px bg-slate-100"></div>}
          </>
        )}

        {/* Attitude */}
        {attitude.length > 0 && (
          <div>
            <h4 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-1">
              <Heart size={16} className="text-slate-400" /> Thái độ
            </h4>
            <ul className="text-sm text-slate-600 space-y-2">
              {attitude.map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-1.5 w-1 h-1 rounded-full bg-slate-400 shrink-0"></span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

