'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import TriggerCrawlButton from './TriggerCrawlButton';
import FormattedDate from './FormattedDate';

interface Category {
  id: string;
  name: string;
  nameVi: string;
  slug: string;
  productCount: number;
}

interface Supermarket {
  _id: string;
  name: string;
  slug: string;
  isActive: boolean;
  lastCrawl?: {
    productsAt?: Date | null;
    dealsAt?: Date | null;
    status?: string;
    errorMessage?: string;
  };
}

interface SupermarketCrawlCardProps {
  supermarket: Supermarket;
}

export default function SupermarketCrawlCard({ supermarket }: SupermarketCrawlCardProps) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [crawlingCategory, setCrawlingCategory] = useState<string | null>(null);
  const [result, setResult] = useState<{ slug: string; success: boolean; message: string } | null>(null);

  const handleToggle = async () => {
    if (!expanded && categories.length === 0) {
      setLoadingCategories(true);
      try {
        const res = await fetch(`/api/admin/categories?supermarketId=${supermarket._id}`);
        const data = await res.json();
        if (data.success) {
          setCategories(data.categories);
        }
      } catch (error) {
        console.error('Failed to load categories:', error);
      } finally {
        setLoadingCategories(false);
      }
    }
    setExpanded(!expanded);
  };

  const handleCrawlCategory = async (category: Category) => {
    if (crawlingCategory) return;

    const confirmed = window.confirm(
      `Bạn có chắc muốn crawl danh mục "${category.nameVi || category.name}"?`
    );

    if (!confirmed) return;

    setCrawlingCategory(category.slug);
    setResult(null);

    try {
      const res = await fetch('/api/admin/crawl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supermarketId: supermarket._id,
          type: 'products',
          categorySlug: category.slug,
        }),
      });

      const data = await res.json();
      setResult({
        slug: category.slug,
        success: data.success,
        message: data.message || data.error,
      });

      if (data.success) {
        router.refresh();
      }
    } catch (error) {
      setResult({
        slug: category.slug,
        success: false,
        message: error instanceof Error ? error.message : 'Có lỗi xảy ra',
      });
    } finally {
      setCrawlingCategory(null);
    }
  };

  return (
    <div className="rounded-lg border bg-white">
      <div
        className="flex cursor-pointer flex-wrap items-center justify-between gap-4 p-4"
        onClick={handleToggle}
      >
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-gray-400">
              {expanded ? '▼' : '▶'}
            </span>
            <h3 className="font-semibold text-gray-900">{supermarket.name}</h3>
          </div>
          <p className="ml-6 text-sm text-gray-500">
            {supermarket.isActive ? (
              <span className="text-green-600">● Hoạt động</span>
            ) : (
              <span className="text-gray-400">○ Không hoạt động</span>
            )}
          </p>
          {supermarket.lastCrawl && (
            <div className="ml-6 mt-2 text-xs text-gray-500">
              <p>
                Products:{' '}
                {supermarket.lastCrawl.productsAt ? (
                  <FormattedDate date={supermarket.lastCrawl.productsAt} />
                ) : (
                  'Chưa crawl'
                )}
              </p>
              <p>
                Deals:{' '}
                {supermarket.lastCrawl.dealsAt ? (
                  <FormattedDate date={supermarket.lastCrawl.dealsAt} />
                ) : (
                  'Chưa crawl'
                )}
              </p>
              {supermarket.lastCrawl.status === 'failed' && (
                <p className="text-red-500">Lỗi: {supermarket.lastCrawl.errorMessage}</p>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
          <TriggerCrawlButton
            supermarketId={supermarket._id}
            supermarketName={supermarket.name}
            type="products"
            disabled={!supermarket.isActive}
          />
          <TriggerCrawlButton
            supermarketId={supermarket._id}
            supermarketName={supermarket.name}
            type="deals"
            disabled={!supermarket.isActive}
          />
        </div>
      </div>

      {expanded && (
        <div className="border-t bg-gray-50 p-4">
          <h4 className="mb-3 text-sm font-semibold text-gray-700">
            Crawl theo danh mục
          </h4>

          {loadingCategories ? (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Đang tải danh mục...
            </div>
          ) : categories.length > 0 ? (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center justify-between rounded border bg-white p-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900">
                      {category.nameVi || category.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {category.productCount} sản phẩm
                    </p>
                  </div>
                  <button
                    onClick={() => handleCrawlCategory(category)}
                    disabled={crawlingCategory !== null || !supermarket.isActive}
                    className="ml-2 rounded bg-blue-600 px-2 py-1 text-xs font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                  >
                    {crawlingCategory === category.slug ? (
                      <span className="flex items-center gap-1">
                        <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24">
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="none"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                          />
                        </svg>
                        ...
                      </span>
                    ) : (
                      'Crawl'
                    )}
                  </button>
                  {result && result.slug === category.slug && (
                    <div
                      className={`absolute left-0 top-full z-10 mt-1 w-48 rounded p-2 text-xs shadow-lg ${
                        result.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                      }`}
                    >
                      {result.message}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">
              Chưa có danh mục nào. Hãy crawl products trước.
            </p>
          )}

          {result && (
            <div
              className={`mt-3 rounded p-3 text-sm ${
                result.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
              }`}
            >
              <button
                onClick={() => setResult(null)}
                className="float-right text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
              {result.message}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
