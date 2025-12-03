'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';

export interface Supermarket {
  _id: string;
  name: string;
  slug: string;
  logo?: string;
}

interface SupermarketSelectorProps {
  supermarkets: Supermarket[];
  selected: string | null;
  onSelect: (slug: string | null) => void;
  placeholder?: string;
}

export default function SupermarketSelector({
  supermarkets,
  selected,
  onSelect,
  placeholder = 'Chọn siêu thị',
}: SupermarketSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedSupermarket = supermarkets.find((s) => s.slug === selected);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-left shadow-sm hover:bg-gray-50 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:w-auto sm:min-w-[200px]"
      >
        <span className={selectedSupermarket ? 'text-gray-900' : 'text-gray-500'}>
          {selectedSupermarket?.name || placeholder}
        </span>
        <svg
          className={`h-5 w-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute left-0 z-20 mt-1 w-full min-w-[200px] rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
          <button
            type="button"
            onClick={() => {
              onSelect(null);
              setIsOpen(false);
            }}
            className={`flex w-full items-center px-4 py-2 text-left hover:bg-gray-100 ${
              !selected ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
            }`}
          >
            Tất cả siêu thị
          </button>

          {supermarkets.map((supermarket) => (
            <button
              key={supermarket._id}
              type="button"
              onClick={() => {
                onSelect(supermarket.slug);
                setIsOpen(false);
              }}
              className={`flex w-full items-center gap-2 px-4 py-2 text-left hover:bg-gray-100 ${
                selected === supermarket.slug ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
              }`}
            >
              {supermarket.logo && (
                <Image
                  src={supermarket.logo}
                  alt={supermarket.name}
                  width={20}
                  height={20}
                  className="h-5 w-5 object-contain"
                  unoptimized
                />
              )}
              {supermarket.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
