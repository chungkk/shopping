'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface TriggerCrawlButtonProps {
  supermarketId: string;
  supermarketName: string;
  type: 'products' | 'deals';
  disabled?: boolean;
}

export default function TriggerCrawlButton({
  supermarketId,
  supermarketName,
  type,
  disabled = false,
}: TriggerCrawlButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleClick = async () => {
    if (loading || disabled) return;

    const confirmed = window.confirm(
      `Bạn có chắc muốn crawl ${type} cho ${supermarketName}?`
    );

    if (!confirmed) return;

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch('/api/admin/crawl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ supermarketId, type }),
      });

      const data = await res.json();
      setResult({ success: data.success, message: data.message || data.error });

      if (data.success) {
        router.refresh();
      }
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'Có lỗi xảy ra',
      });
    } finally {
      setLoading(false);
    }
  };

  const buttonStyles = type === 'products'
    ? 'bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300'
    : 'bg-green-600 hover:bg-green-700 disabled:bg-green-300';

  return (
    <div className="relative">
      <button
        onClick={handleClick}
        disabled={loading || disabled}
        className={`rounded px-3 py-1.5 text-sm font-medium text-white ${buttonStyles} disabled:cursor-not-allowed`}
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Đang crawl...
          </span>
        ) : (
          `Crawl ${type === 'products' ? 'Products' : 'Deals'}`
        )}
      </button>

      {result && (
        <div
          className={`absolute left-0 top-full z-10 mt-2 w-64 rounded-lg p-3 text-sm shadow-lg ${
            result.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}
        >
          <button
            onClick={() => setResult(null)}
            className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
          {result.message}
        </div>
      )}
    </div>
  );
}
