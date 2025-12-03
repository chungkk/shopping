import connectDB from '@/lib/db/mongodb';
import Category from '@/lib/db/models/Category';
import Deal from '@/lib/db/models/Deal';

async function getCategories() {
  await connectDB();

  const categories = await Category.find()
    .sort({ sortOrder: 1, name: 1 })
    .populate('supermarketId', 'name')
    .lean();

  const categoriesWithCounts = await Promise.all(
    categories.map(async (c) => {
      const dealsCount = await Deal.countDocuments({
        categoryId: c._id,
        isActive: true,
      });
      return { ...c, dealsCount };
    })
  );

  return categoriesWithCounts;
}

export default async function CategoriesPage() {
  const categories = await getCategories();

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Danh mục</h1>
      </div>

      <div className="rounded-lg bg-white shadow">
        <table className="w-full">
          <thead>
            <tr className="border-b text-left text-sm text-gray-500">
              <th className="p-4">Thứ tự</th>
              <th className="p-4">Tên (DE)</th>
              <th className="p-4">Tên (VI)</th>
              <th className="p-4">Slug</th>
              <th className="p-4">Siêu thị</th>
              <th className="p-4">Khuyến mãi</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((category) => (
              <tr key={String(category._id)} className="border-b">
                <td className="p-4 text-gray-500">{category.sortOrder}</td>
                <td className="p-4 font-medium">{category.name}</td>
                <td className="p-4">{category.nameVi}</td>
                <td className="p-4 text-gray-500">{category.slug}</td>
                <td className="p-4">
                  {(category.supermarketId as { name: string })?.name || 'N/A'}
                </td>
                <td className="p-4">{category.dealsCount}</td>
              </tr>
            ))}

            {categories.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-500">
                  Chưa có danh mục nào.
                  <br />
                  <code className="mt-2 block text-sm">
                    npx ts-node scripts/seed-categories.ts
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
