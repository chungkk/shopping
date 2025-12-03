import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import { Inter } from 'next/font/google';
import Link from 'next/link';
import './globals.css';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin', 'vietnamese'],
});

export const metadata: Metadata = {
  title: {
    default: 'Đi Chợ Thông Minh - Khuyến mãi siêu thị Đức',
    template: '%s | Đi Chợ Thông Minh',
  },
  description: 'Tổng hợp khuyến mãi từ các siêu thị Đức: Globus, Aldi, Lidl, Rewe, Edeka. Cập nhật hàng ngày, tiết kiệm tiền mua sắm.',
  keywords: ['khuyến mãi', 'siêu thị Đức', 'Globus', 'Aldi', 'Lidl', 'giảm giá', 'deals', 'Germany supermarket'],
  authors: [{ name: 'Đi Chợ Thông Minh' }],
  creator: 'Đi Chợ Thông Minh',
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'),
  openGraph: {
    type: 'website',
    locale: 'vi_VN',
    siteName: 'Đi Chợ Thông Minh',
    title: 'Đi Chợ Thông Minh - Khuyến mãi siêu thị Đức',
    description: 'Tổng hợp khuyến mãi từ các siêu thị Đức. Cập nhật hàng ngày.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Đi Chợ Thông Minh - Khuyến mãi siêu thị Đức',
    description: 'Tổng hợp khuyến mãi từ các siêu thị Đức. Cập nhật hàng ngày.',
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: '/favicon.ico',
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body className={`${inter.variable} font-sans antialiased bg-gray-50`}>
        <NextIntlClientProvider messages={messages}>
          <header className="sticky top-0 z-50 border-b bg-white shadow-sm">
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
              <Link href="/" className="text-xl font-bold text-blue-600">
                Đi Chợ Thông Minh
              </Link>
              <nav className="flex items-center gap-4">
                <Link href="/" className="text-gray-600 hover:text-blue-600">
                  Trang chủ
                </Link>
                <Link href="/deals" className="text-gray-600 hover:text-blue-600">
                  Khuyến mãi
                </Link>
              </nav>
            </div>
          </header>
          <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
          <footer className="border-t bg-white py-8 text-center text-sm text-gray-500">
            <p>&copy; 2025 Đi Chợ Thông Minh. Dữ liệu được cập nhật hàng ngày.</p>
          </footer>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
