import { redirect } from 'next/navigation';
import connectDB from '@/lib/db/mongodb';
import Supermarket from '@/lib/db/models/Supermarket';
import Category from '@/lib/db/models/Category';
import Product from '@/lib/db/models/Product';
import Deal from '@/lib/db/models/Deal';
import CrawlLog from '@/lib/db/models/CrawlLog';
import Link from 'next/link';
import { getAdminSession } from '@/lib/auth/admin';
import FormattedDate from '@/components/admin/FormattedDate';

async function getStats() {
  await connectDB();

  const [
    supermarketsCount,
    categoriesCount,
    productsCount,
    dealsCount,
    activeDealsCount,
    recentCrawls,
  ] = await Promise.all([
    Supermarket.countDocuments(),
    Category.countDocuments(),
    Product.countDocuments(),
    Deal.countDocuments(),
    Deal.countDocuments({ isActive: true, endDate: { $gte: new Date() } }),
    CrawlLog.find()
      .sort({ startedAt: -1 })
      .limit(5)
      .populate('supermarketId', 'name slug')
      .lean(),
  ]);

  return {
    supermarketsCount,
    categoriesCount,
    productsCount,
    dealsCount,
    activeDealsCount,
    recentCrawls,
  };
}

export default async function AdminDashboard() {
  const isAuthenticated = await getAdminSession();
  if (!isAuthenticated) {
    redirect('/admin/login');
  }

  const stats = await getStats();

  return (
    <div>
      <h1 className="mb-8 text-3xl font-bold text-gray-900">Dashboard</h1>

      <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Siêu thị"
          value={stats.supermarketsCount}
          icon="🏪"
          href="/admin/supermarkets"
        />
        <StatCard
          title="Danh mục"
          value={stats.categoriesCount}
          icon="📁"
          href="/admin/categories"
        />
        <StatCard
          title="Sản phẩm"
          value={stats.productsCount}
          icon="📦"
        />
        <StatCard
          title="Khuyến mãi đang có"
          value={stats.activeDealsCount}
          subtitle={`/ ${stats.dealsCount} tổng`}
          icon="🏷️"
        />
      </div>

      <div className="rounded-lg bg-white p-6 shadow">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Crawl gần đây</h2>
          <Link
            href="/admin/crawl"
            className="text-sm text-blue-600 hover:underline"
          >
            Xem tất cả →
          </Link>
        </div>

        {stats.recentCrawls.length > 0 ? (
          <table className="w-full">
            <thead>
              <tr className="border-b text-left text-sm text-gray-500">
                <th className="pb-3">Siêu thị</th>
                <th className="pb-3">Loại</th>
                <th className="pb-3">Trạng thái</th>
                <th className="pb-3">Thời gian</th>
                <th className="pb-3">Kết quả</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentCrawls.map((crawl) => (
                <tr key={String(crawl._id)} className="border-b">
                  <td className="py-3">
                    {(crawl.supermarketId as unknown as { name: string })?.name || 'N/A'}
                  </td>
                  <td className="py-3">
                    <span className={`rounded px-2 py-1 text-xs ${
                      crawl.type === 'deals' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {crawl.type}
                    </span>
                  </td>
                  <td className="py-3">
                    <StatusBadge status={crawl.status} />
                  </td>
                  <td className="py-3 text-sm text-gray-500">
                    <FormattedDate date={crawl.startedAt} />
                  </td>
                  <td className="py-3 text-sm">
                    {crawl.stats && (
                      <span>
                        {crawl.stats.itemsCreated} mới, {crawl.stats.itemsUpdated} cập nhật
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-gray-500">Chưa có lịch sử crawl</p>
        )}
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  subtitle,
  icon,
  href,
}: {
  title: string;
  value: number;
  subtitle?: string;
  icon: string;
  href?: string;
}) {
  const content = (
    <div className="rounded-lg bg-white p-6 shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="mt-1 text-3xl font-bold text-gray-900">
            {value.toLocaleString()}
            {subtitle && <span className="text-lg text-gray-400">{subtitle}</span>}
          </p>
        </div>
        <span className="text-4xl">{icon}</span>
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block transition-shadow hover:shadow-md">
        {content}
      </Link>
    );
  }

  return content;
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    success: 'bg-green-100 text-green-700',
    failed: 'bg-red-100 text-red-700',
    started: 'bg-yellow-100 text-yellow-700',
    running: 'bg-blue-100 text-blue-700',
  };

  return (
    <span className={`rounded px-2 py-1 text-xs ${styles[status] || 'bg-gray-100 text-gray-700'}`}>
      {status}
    </span>
  );
}
