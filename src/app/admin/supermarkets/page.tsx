import { redirect } from 'next/navigation';
import connectDB from '@/lib/db/mongodb';
import Supermarket from '@/lib/db/models/Supermarket';
import Deal from '@/lib/db/models/Deal';
import Product from '@/lib/db/models/Product';
import { getAdminSession } from '@/lib/auth/admin';
import FormattedDate from '@/components/admin/FormattedDate';

async function getSupermarkets() {
  await connectDB();

  const supermarkets = await Supermarket.find().sort({ name: 1 }).lean();

  const supermarketsWithCounts = await Promise.all(
    supermarkets.map(async (s) => {
      const [dealsCount, productsCount] = await Promise.all([
        Deal.countDocuments({ supermarketId: s._id, isActive: true }),
        Product.countDocuments({ supermarketId: s._id }),
      ]);
      return { ...s, dealsCount, productsCount };
    })
  );

  return supermarketsWithCounts;
}

export default async function SupermarketsPage() {
  const isAuthenticated = await getAdminSession();
  if (!isAuthenticated) {
    redirect('/admin/login');
  }

  const supermarkets = await getSupermarkets();

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Siêu thị</h1>
      </div>

      <div className="rounded-lg bg-white shadow">
        <table className="w-full">
          <thead>
            <tr className="border-b text-left text-sm text-gray-500">
              <th className="p-4">Tên</th>
              <th className="p-4">Slug</th>
              <th className="p-4">Trạng thái</th>
              <th className="p-4">Sản phẩm</th>
              <th className="p-4">Khuyến mãi</th>
              <th className="p-4">Crawl gần nhất</th>
            </tr>
          </thead>
          <tbody>
            {supermarkets.map((supermarket) => (
              <tr key={String(supermarket._id)} className="border-b">
                <td className="p-4 font-medium">{supermarket.name}</td>
                <td className="p-4 text-gray-500">{supermarket.slug}</td>
                <td className="p-4">
                  {supermarket.isActive ? (
                    <span className="rounded bg-green-100 px-2 py-1 text-xs text-green-700">
                      Hoạt động
                    </span>
                  ) : (
                    <span className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-700">
                      Tắt
                    </span>
                  )}
                </td>
                <td className="p-4">{supermarket.productsCount.toLocaleString()}</td>
                <td className="p-4">{supermarket.dealsCount.toLocaleString()}</td>
                <td className="p-4 text-sm text-gray-500">
                  {supermarket.lastCrawl?.dealsAt
                    ? <FormattedDate date={supermarket.lastCrawl.dealsAt} />
                    : 'Chưa crawl'}
                </td>
              </tr>
            ))}

            {supermarkets.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-500">
                  Chưa có siêu thị nào.
                  <br />
                  <code className="mt-2 block text-sm">
                    npx ts-node scripts/seed-supermarket.ts
                  </code>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
