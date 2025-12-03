'use client';

import { useEffect, useCallback } from 'react';
import DealDetail, { DealDetailData } from './DealDetail';

interface DealModalProps {
  deal: DealDetailData | null;
  isOpen: boolean;
  isLoading: boolean;
  onClose: () => void;
}

export default function DealModal({ deal, isOpen, isLoading, onClose }: DealModalProps) {
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative z-10 max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-xl bg-white shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-20 rounded-full bg-white p-2 shadow-md hover:bg-gray-100"
        >
          <svg
            className="h-5 w-5 text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        <div className="p-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <svg
                className="h-12 w-12 animate-spin text-blue-600"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <p className="mt-4 text-gray-500">Đang tải chi tiết...</p>
            </div>
          ) : deal ? (
            <DealDetail deal={deal} />
          ) : (
            <div className="py-16 text-center text-gray-500">
              Không tìm thấy thông tin khuyến mãi
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
