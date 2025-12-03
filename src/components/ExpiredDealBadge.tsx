interface ExpiredDealBadgeProps {
  className?: string;
}

export default function ExpiredDealBadge({ className = '' }: ExpiredDealBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full bg-gray-500 px-2 py-1 text-xs font-medium text-white ${className}`}
    >
      Đã hết hạn
    </span>
  );
}
