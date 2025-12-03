'use client';

import DealList from './DealList';
import { DealCardProps } from './DealCard';

interface SearchResultsProps {
  query: string;
  deals: DealCardProps['deal'][];
  total: number;
  isLoading: boolean;
  onDealClick?: (deal: DealCardProps['deal']) => void;
}

export default function SearchResults({
  query,
  deals,
  total,
  isLoading,
  onDealClick,
}: SearchResultsProps) {
  if (!query) {
    return null;
  }

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-lg font-medium text-gray-900">
          {isLoading ? (
            'Đang tìm kiếm...'
          ) : (
            <>
              Kết quả cho &quot;{query}&quot;
              <span className="ml-2 text-sm font-normal text-gray-500">
                ({total} sản phẩm)
              </span>
            </>
          )}
        </h2>
      </div>

      <DealList deals={deals} isLoading={isLoading} onDealClick={onDealClick} />
    </div>
  );
}
