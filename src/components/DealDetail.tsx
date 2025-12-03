'use client';

import Image from 'next/image';
import PriceDisplay from './PriceDisplay';
import ValidityBadge from './ValidityBadge';

export interface DealDetailData {
  _id: string;
  productName: string;
  productBrand?: string;
  productImageUrl: string;
  currentPrice: number;
  originalPrice: number | null;
  discountPercent: number | null;
  unitType: string;
  unitPrice?: number;
  priceText: string;
  originalPriceText?: string;
  startDate: string;
  endDate: string;
  source: string;
  sourceRef: string;
  sourceUrl?: string;
  category?: {
    name: string;
    nameVi: string;
    slug: string;
  } | null;
  supermarket?: {
    name: string;
    slug: string;
    logo?: string;
  } | null;
}

interface DealDetailProps {
  deal: DealDetailData;
}

export default function DealDetail({ deal }: DealDetailProps) {
  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <div className="flex-shrink-0 lg:w-1/2">
        <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-gray-100">
          {deal.productImageUrl ? (
            <Image
              src={deal.productImageUrl}
              alt={deal.productName}
              fill
              className="object-contain p-4"
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority
            />
          ) : (
            <div className="flex h-full items-center justify-center text-gray-400">
              <svg className="h-24 w-24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-4">
        {deal.supermarket && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            {deal.supermarket.logo && (
              <Image
                src={deal.supermarket.logo}
                alt={deal.supermarket.name}
                width={80}
                height={20}
                className="h-5 w-auto object-contain"
                unoptimized
              />
            )}
            <span>{deal.supermarket.name}</span>
          </div>
        )}

        {deal.productBrand && (
          <span className="text-sm font-medium text-gray-500">{deal.productBrand}</span>
        )}

        <h2 className="text-2xl font-bold text-gray-900">{deal.productName}</h2>

        {deal.category && (
          <div className="text-sm text-gray-500">
            Danh mục: <span className="font-medium">{deal.category.nameVi}</span>
          </div>
        )}

        <PriceDisplay
          currentPrice={deal.currentPrice}
          originalPrice={deal.originalPrice}
          discountPercent={deal.discountPercent}
          size="lg"
        />

        {deal.unitPrice && (
          <div className="text-sm text-gray-600">
            Giá đơn vị: {deal.priceText} / {deal.unitType}
          </div>
        )}

        <div className="border-t pt-4">
          <ValidityBadge startDate={deal.startDate} endDate={deal.endDate} />
        </div>

        <div className="border-t pt-4">
          <div className="text-sm text-gray-500">
            <span className="font-medium">Nguồn:</span>{' '}
            {deal.sourceRef}
            {deal.source === 'flyer' && ' (Tờ rơi quảng cáo)'}
            {deal.source === 'website' && ' (Website)'}
          </div>
          {deal.sourceUrl && (
            <a
              href={deal.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
            >
              Xem nguồn gốc
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
