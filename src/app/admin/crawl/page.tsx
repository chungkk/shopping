import { redirect } from 'next/navigation';
import connectDB from '@/lib/db/mongodb';
import Supermarket from '@/lib/db/models/Supermarket';
import CrawlLog from '@/lib/db/models/CrawlLog';
import { getAdminSession } from '@/lib/auth/admin';
import FormattedDate from '@/components/admin/FormattedDate';
import SupermarketCrawlCard from '@/components/admin/SupermarketCrawlCard';

async function getData() {
  await connectDB();

  const [supermarkets, crawlLogs] = await Promise.all([
    Supermarket.find().sort({ name: 1 }).lean(),
    CrawlLog.find()
      .sort({ startedAt: -1 })
      .limit(50)
      .populate('supermarketId', 'name slug')
      .lean(),
  ]);

  return { supermarkets, crawlLogs };
}

export default async function CrawlManagementPage() {
  const isAuthenticated = await getAdminSession();
  if (!isAuthenticated) {
    redirect('/admin/login');
  }

  const { supermarkets, crawlLogs } = await getData();

  return (
    <div>
      <h1 className="mb-8 text-3xl font-bold text-gray-900">Quản lý Crawl</h1>

      <div className="mb-8 rounded-lg bg-white p-6 shadow">
        <h2 className="mb-4 text-xl font-semibold text-gray-900">Siêu thị</h2>

        <div className="space-y-4">
          {supermarkets.map((supermarket) => (
            <SupermarketCrawlCard
              key={String(supermarket._id)}
              supermarket={{
                _id: String(supermarket._id),
                name: supermarket.name,
                slug: supermarket.slug,
                isActive: supermarket.isActive,
                lastCrawl: supermarket.lastCrawl,
              }}
            />
          ))}

          {supermarkets.length === 0 && (
            <p className="text-gray-500">
              Chưa có siêu thị nào. Chạy <code>npx ts-node scripts/seed-supermarket.ts</code>
            </p>
          )}
        </div>
      </div>

      <div className="rounded-lg bg-white p-6 shadow">
        <h2 className="mb-4 text-xl font-semibold text-gray-900">Lịch sử Crawl</h2>

        {crawlLogs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b text-left text-sm text-gray-500">
                  <th className="pb-3">Siêu thị</th>
                  <th className="pb-3">Loại</th>
                  <th className="pb-3">Trạng thái</th>
                  <th className="pb-3">Bắt đầu</th>
                  <th className="pb-3">Thời lượng</th>
                  <th className="pb-3">Tìm thấy</th>
                  <th className="pb-3">Tạo mới</th>
                  <th className="pb-3">Cập nhật</th>
                  <th className="pb-3">Lỗi</th>
                </tr>
              </thead>
              <tbody>
                {crawlLogs.map((log) => (
                  <tr key={String(log._id)} className="border-b">
                    <td className="py-3">
                      {(log.supermarketId as unknown as { name: string })?.name || 'N/A'}
                    </td>
                    <td className="py-3">
                      <span className={`rounded px-2 py-1 text-xs ${
                        log.type === 'deals' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {log.type}
                      </span>
                    </td>
                    <td className="py-3">
                      <StatusBadge status={log.status} />
                    </td>
                    <td className="py-3 text-sm">
                      <FormattedDate date={log.startedAt} />
                    </td>
                    <td className="py-3 text-sm">
                      {log.duration ? `${(log.duration / 1000).toFixed(1)}s` : '-'}
                    </td>
                    <td className="py-3 text-sm">{log.stats?.itemsFound || 0}</td>
                    <td className="py-3 text-sm text-green-600">{log.stats?.itemsCreated || 0}</td>
                    <td className="py-3 text-sm text-blue-600">{log.stats?.itemsUpdated || 0}</td>
                    <td className="py-3 text-sm text-red-600">{log.stats?.errors || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500">Chưa có lịch sử crawl</p>
        )}
      </div>
    </div>
  );
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
