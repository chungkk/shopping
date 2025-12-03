'use client';

import DealCard, { DealCardProps } from './DealCard';

interface DealListProps {
  deals: DealCardProps['deal'][];
  onDealClick?: (deal: DealCardProps['deal']) => void;
  emptyMessage?: string;
  isLoading?: boolean;
}

function DealListSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {Array.from({ length: 10 }).map((_, i) => (
        <div
          key={i}
          className="flex animate-pulse flex-col rounded-lg border bg-white shadow-sm"
        >
          <div className="aspect-square w-full rounded-t-lg bg-gray-200" />
          <div className="p-3">
            <div className="h-3 w-1/3 rounded bg-gray-200" />
            <div className="mt-2 h-4 w-full rounded bg-gray-200" />
            <div className="mt-1 h-4 w-2/3 rounded bg-gray-200" />
            <div className="mt-3 h-5 w-1/2 rounded bg-gray-200" />
            <div className="mt-1 h-3 w-2/3 rounded bg-gray-200" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function DealList({
  deals,
  onDealClick,
  emptyMessage = 'Không có khuyến mãi nào',
  isLoading = false,
}: DealListProps) {
  if (isLoading) {
    return <DealListSkeleton />;
  }

  if (deals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <svg
          className="mb-4 h-16 w-16 text-gray-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <p className="text-lg font-medium text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {deals.map((deal) => (
        <DealCard
          key={deal._id}
          deal={deal}
          onClick={onDealClick ? () => onDealClick(deal) : undefined}
        />
      ))}
    </div>
  );
}
