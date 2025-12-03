import { formatDateRangeVi, formatRelativeTimeVi, isDealExpired, isDealActive } from '@/lib/utils/date';

interface ValidityBadgeProps {
  startDate: Date | string;
  endDate: Date | string;
  showRelative?: boolean;
  className?: string;
}

export default function ValidityBadge({
  startDate,
  endDate,
  showRelative = true,
  className = '',
}: ValidityBadgeProps) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const expired = isDealExpired(end);
  const active = isDealActive(start, end);

  const statusClasses = expired
    ? 'bg-gray-100 text-gray-600 border-gray-200'
    : active
    ? 'bg-green-50 text-green-700 border-green-200'
    : 'bg-yellow-50 text-yellow-700 border-yellow-200';

  const statusIcon = expired ? (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ) : active ? (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ) : (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );

  return (
    <div className={`inline-flex flex-col gap-1 ${className}`}>
      <div
        className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm ${statusClasses}`}
      >
        {statusIcon}
        <span>
          {expired ? 'Đã hết hạn' : active ? 'Đang áp dụng' : 'Sắp áp dụng'}
        </span>
      </div>

      <div className="text-sm text-gray-600">
        <span className="font-medium">Thời gian:</span> {formatDateRangeVi(start, end)}
      </div>

      {showRelative && !expired && (
        <div className="text-sm text-gray-500">{formatRelativeTimeVi(end)}</div>
      )}
    </div>
  );
}
