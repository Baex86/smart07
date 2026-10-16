'use client';

import { ReactNode } from 'react';

export default function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6 lg:mb-8">
      <div className="min-w-0">
        <h1 className="font-display text-2xl lg:text-3xl font-bold text-navy-900 tracking-tight">
          {title}
        </h1>
        {description && (
          <p className="mt-1.5 text-sm lg:text-[15px] text-navy-500 max-w-2xl leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}