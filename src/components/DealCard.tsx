'use client';

import Image from 'next/image';
import { formatPrice } from '@/lib/utils/price';
import { formatDateRangeVi, isDealExpired } from '@/lib/utils/date';
import ExpiredDealBadge from './ExpiredDealBadge';

export interface DealCardProps {
  deal: {
    _id: string;
    productName: string;
    productBrand?: string;
    productImageUrl: string;
    currentPrice: number;
    originalPrice: number | null;
    discountPercent: number | null;
    priceText: string;
    originalPriceText?: string;
    startDate: string;
    endDate: string;
    source: string;
    sourceRef: string;
  };
  onClick?: () => void;
}

export default function DealCard({ deal, onClick }: DealCardProps) {
  const expired = isDealExpired(new Date(deal.endDate));
  const hasDiscount = deal.discountPercent && deal.discountPercent > 0;

  return (
    <div
      className={`relative flex flex-col rounded-lg border bg-white shadow-sm transition-shadow hover:shadow-md active:scale-[0.98] ${
        expired ? 'opacity-60' : ''
      } ${onClick ? 'cursor-pointer touch-manipulation' : ''}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
    >
      {expired && (
        <div className="absolute left-2 top-2 z-10">
          <ExpiredDealBadge />
        </div>
      )}

      {hasDiscount && !expired && (
        <div className="absolute right-2 top-2 z-10 rounded-full bg-red-500 px-2 py-1 text-xs font-bold text-white">
          -{deal.discountPercent}%
        </div>
      )}

      <div className="relative aspect-square w-full overflow-hidden rounded-t-lg bg-gray-100">
        {deal.productImageUrl ? (
          <Image
            src={deal.productImageUrl}
            alt={deal.productName}
            fill
            className="object-contain p-2"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-gray-400">
            <svg
              className="h-12 w-12"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-3">
        {deal.productBrand && (
          <span className="text-xs font-medium text-gray-500">{deal.productBrand}</span>
        )}

        <h3 className="mt-1 line-clamp-2 text-sm font-medium text-gray-900">
          {deal.productName}
        </h3>

        <div className="mt-auto pt-2">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-red-600">
              {formatPrice(deal.currentPrice)}
            </span>
            {deal.originalPrice && (
              <span className="text-sm text-gray-400 line-through">
                {formatPrice(deal.originalPrice)}
              </span>
            )}
          </div>

          <div className="mt-1 text-xs text-gray-500">
            {formatDateRangeVi(new Date(deal.startDate), new Date(deal.endDate))}
          </div>
        </div>
      </div>
    </div>
  );
}
