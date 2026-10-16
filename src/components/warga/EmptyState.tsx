'use client';

import { ReactNode } from 'react';

export default function EmptyState({
  icon,
  title,
  description,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center px-6 py-14 rounded-xl border border-dashed border-navy-200 bg-surface/60">
      {icon && (
        <div className="h-12 w-12 rounded-xl bg-navy-50 flex items-center justify-center text-navy-400 mb-4">
          {icon}
        </div>
      )}
      <p className="font-display font-semibold text-navy-800">{title}</p>
      {description && (
        <p className="mt-1 text-sm text-navy-500 max-w-sm leading-relaxed">
          {description}
        </p>
      )}
    </div>
  );
}