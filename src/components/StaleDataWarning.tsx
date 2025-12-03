'use client';

import { formatLastUpdatedVi } from '@/lib/utils/date';

interface StaleDataWarningProps {
  lastUpdated: Date | string | null;
  className?: string;
}

export default function StaleDataWarning({ lastUpdated, className = '' }: StaleDataWarningProps) {
  const lastUpdatedDate = lastUpdated ? new Date(lastUpdated) : null;

  return (
    <div
      className={`flex items-center gap-2 rounded-lg border border-yellow-300 bg-yellow-50 px-4 py-3 ${className}`}
    >
      <svg
        className="h-5 w-5 flex-shrink-0 text-yellow-600"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        />
      </svg>
      <div className="flex-1">
        <p className="text-sm font-medium text-yellow-800">Dữ liệu có thể đã cũ</p>
        <p className="text-xs text-yellow-700">
          {formatLastUpdatedVi(lastUpdatedDate)}
        </p>
      </div>
    </div>
  );
}
