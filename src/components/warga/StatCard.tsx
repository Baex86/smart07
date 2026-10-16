'use client';

import { ReactNode } from 'react';

export default function StatCard({
  label,
  value,
  hint,
  icon,
  accent = false,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: ReactNode;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-4 lg:p-5 ${
        accent
          ? 'bg-navy-900 border-navy-900 text-white'
          : 'bg-surface border-navy-100 text-navy-900'
      } shadow-card`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p
            className={`text-xs font-medium uppercase tracking-wide ${
              accent ? 'text-navy-300' : 'text-navy-400'
            }`}
          >
            {label}
          </p>
          <div
            className={`mt-2 font-display text-2xl lg:text-[26px] font-bold leading-none tracking-tight ${
              accent ? 'text-white' : 'text-navy-900'
            }`}
          >
            {value}
          </div>
          {hint && (
            <p
              className={`mt-1.5 text-xs ${
                accent ? 'text-navy-300' : 'text-navy-500'
              }`}
            >
              {hint}
            </p>
          )}
        </div>
        {icon && (
          <div
            className={`shrink-0 h-10 w-10 rounded-lg flex items-center justify-center ${
              accent ? 'bg-white/10 text-accent' : 'bg-accent/15 text-navy-800'
            }`}
          >
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}