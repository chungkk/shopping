import Link from 'next/link';
import { getAdminSession } from '@/lib/auth/admin';
import AdminLogoutButton from '@/components/admin/AdminLogoutButton';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isAuthenticated = await getAdminSession();

  if (!isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <aside className="w-64 bg-gray-900 text-white">
        <div className="p-4">
          <h1 className="text-xl font-bold">Admin Panel</h1>
        </div>
        <nav className="mt-4">
          <Link
            href="/admin"
            className="block px-4 py-3 hover:bg-gray-800"
          >
            Dashboard
          </Link>
          <Link
            href="/admin/crawl"
            className="block px-4 py-3 hover:bg-gray-800"
          >
            Quản lý Crawl
          </Link>
          <Link
            href="/admin/supermarkets"
            className="block px-4 py-3 hover:bg-gray-800"
          >
            Siêu thị
          </Link>
          <Link
            href="/admin/categories"
            className="block px-4 py-3 hover:bg-gray-800"
          >
            Danh mục
          </Link>
          <hr className="my-4 border-gray-700" />
          <Link
            href="/"
            className="block px-4 py-3 text-gray-400 hover:bg-gray-800 hover:text-white"
          >
            ← Về trang chủ
          </Link>
          <AdminLogoutButton />
        </nav>
      </aside>

      <main className="flex-1 p-8">
        {children}
      </main>
    </div>
  );
}
