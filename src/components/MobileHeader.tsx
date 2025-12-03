'use client';

import { useState } from 'react';
import Link from 'next/link';

interface MobileHeaderProps {
  title?: string;
}

export default function MobileHeader({ title = 'Đi Chợ Thông Minh' }: MobileHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b bg-white px-4 lg:hidden">
        <Link href="/" className="text-lg font-bold text-blue-600">
          {title}
        </Link>

        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          className="rounded-lg p-2 hover:bg-gray-100"
          aria-label="Menu"
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </header>

      {menuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMenuOpen(false)} />

          <div className="absolute right-0 top-0 h-full w-64 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b p-4">
              <span className="text-lg font-semibold">Menu</span>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                className="rounded-full p-2 hover:bg-gray-100"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <nav className="p-4">
              <Link
                href="/"
                onClick={() => setMenuOpen(false)}
                className="block rounded-lg px-4 py-3 text-gray-700 hover:bg-gray-100"
              >
                Trang chủ
              </Link>
              <Link
                href="/deals"
                onClick={() => setMenuOpen(false)}
                className="block rounded-lg px-4 py-3 text-gray-700 hover:bg-gray-100"
              >
                Khuyến mãi
              </Link>
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
