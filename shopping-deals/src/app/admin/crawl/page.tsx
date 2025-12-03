import connectDB from '@/lib/db/mongodb';
import Supermarket from '@/lib/db/models/Supermarket';
import CrawlLog from '@/lib/db/models/CrawlLog';
import TriggerCrawlButton from '@/components/admin/TriggerCrawlButton';

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
  const { supermarkets, crawlLogs } = await getData();

  return (
    <div>
      <h1 className="mb-8 text-3xl font-bold text-gray-900">Quản lý Crawl</h1>

      <div className="mb-8 rounded-lg bg-white p-6 shadow">
        <h2 className="mb-4 text-xl font-semibold text-gray-900">Siêu thị</h2>

        <div className="space-y-4">
          {supermarkets.map((supermarket) => (
            <div
              key={String(supermarket._id)}
              className="flex flex-wrap items-center justify-between gap-4 rounded-lg border p-4"
            >
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{supermarket.name}</h3>
                <p className="text-sm text-gray-500">
                  {supermarket.isActive ? (
                    <span className="text-green-600">● Hoạt động</span>
                  ) : (
                    <span className="text-gray-400">○ Không hoạt động</span>
                  )}
                </p>
                {supermarket.lastCrawl && (
                  <div className="mt-2 text-xs text-gray-500">
                    <p>
                      Products:{' '}
                      {supermarket.lastCrawl.productsAt
                        ? new Date(supermarket.lastCrawl.productsAt).toLocaleString('vi-VN')
                        : 'Chưa crawl'}
                    </p>
                    <p>
                      Deals:{' '}
                      {supermarket.lastCrawl.dealsAt
                        ? new Date(supermarket.lastCrawl.dealsAt).toLocaleString('vi-VN')
                        : 'Chưa crawl'}
                    </p>
                    {supermarket.lastCrawl.status === 'failed' && (
                      <p className="text-red-500">
                        Lỗi: {supermarket.lastCrawl.errorMessage}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <TriggerCrawlButton
                  supermarketId={String(supermarket._id)}
                  supermarketName={supermarket.name}
                  type="products"
                  disabled={!supermarket.isActive}
                />
                <TriggerCrawlButton
                  supermarketId={String(supermarket._id)}
                  supermarketName={supermarket.name}
                  type="deals"
                  disabled={!supermarket.isActive}
                />
              </div>
            </div>
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
                  <th className="pb-3">Trang</th>
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
                      {(log.supermarketId as { name: string })?.name || 'N/A'}
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
                      {new Date(log.startedAt).toLocaleString('vi-VN')}
                    </td>
                    <td className="py-3 text-sm">
                      {log.duration ? `${(log.duration / 1000).toFixed(1)}s` : '-'}
                    </td>
                    <td className="py-3 text-sm">{log.stats?.pagesProcessed || 0}</td>
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
