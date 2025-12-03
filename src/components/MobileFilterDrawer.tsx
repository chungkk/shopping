'use client';

import { useEffect, useCallback } from 'react';
import CategoryFilter, { Category } from './CategoryFilter';
import SupermarketSelector, { Supermarket } from './SupermarketSelector';

interface MobileFilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  selectedCategory: string | null;
  onCategorySelect: (categoryId: string | null) => void;
  supermarkets: Supermarket[];
  selectedSupermarket: string | null;
  onSupermarketSelect: (slug: string | null) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
  onClearAll: () => void;
}

export default function MobileFilterDrawer({
  isOpen,
  onClose,
  categories,
  selectedCategory,
  onCategorySelect,
  supermarkets,
  selectedSupermarket,
  onSupermarketSelect,
  sortBy,
  onSortChange,
  onClearAll,
}: MobileFilterDrawerProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  const hasFilters = selectedCategory || selectedSupermarket;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="absolute bottom-0 left-0 right-0 max-h-[85vh] overflow-y-auto rounded-t-2xl bg-white shadow-xl">
        <div className="sticky top-0 flex items-center justify-between border-b bg-white px-4 py-3">
          <h2 className="text-lg font-semibold">Bộ lọc</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 hover:bg-gray-100"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4 space-y-6">
          <div>
            <h3 className="mb-3 text-sm font-medium text-gray-700">Siêu thị</h3>
            <SupermarketSelector
              supermarkets={supermarkets}
              selected={selectedSupermarket}
              onSelect={(slug) => {
                onSupermarketSelect(slug);
              }}
            />
          </div>

          {categories.length > 0 && (
            <div>
              <h3 className="mb-3 text-sm font-medium text-gray-700">Danh mục</h3>
              <div className="flex flex-wrap gap-2">
                <CategoryFilter
                  categories={categories}
                  selected={selectedCategory}
                  onSelect={(id) => {
                    onCategorySelect(id);
                  }}
                  showCount
                />
              </div>
            </div>
          )}

          <div>
            <h3 className="mb-3 text-sm font-medium text-gray-700">Sắp xếp</h3>
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm"
            >
              <option value="discount">Giảm giá nhiều nhất</option>
              <option value="priceAsc">Giá thấp đến cao</option>
              <option value="priceDesc">Giá cao đến thấp</option>
              <option value="endDate">Sắp hết hạn</option>
              <option value="name">Tên A-Z</option>
            </select>
          </div>
        </div>

        <div className="sticky bottom-0 flex gap-3 border-t bg-white p-4">
          {hasFilters && (
            <button
              type="button"
              onClick={onClearAll}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700"
            >
              Xóa bộ lọc
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white"
          >
            Áp dụng
          </button>
        </div>
      </div>
    </div>
  );
}
