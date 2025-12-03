import { redirect } from 'next/navigation';
import connectDB from '@/lib/db/mongodb';
import Product from '@/lib/db/models/Product';
import Category from '@/lib/db/models/Category';
import { getAdminSession } from '@/lib/auth/admin';
import Link from 'next/link';
import Image from 'next/image';

interface SearchParams {
  page?: string;
  category?: string;
  search?: string;
}

const ITEMS_PER_PAGE = 20;

async function getProducts(searchParams: SearchParams) {
  await connectDB();

  const page = parseInt(searchParams.page || '1', 10);
  const skip = (page - 1) * ITEMS_PER_PAGE;

  const query: Record<string, unknown> = {};

  if (searchParams.category) {
    const category = await Category.findOne({ slug: searchParams.category });
    if (category) {
      query.categoryId = category._id;
    }
  }

  if (searchParams.search) {
    query.name = { $regex: searchParams.search, $options: 'i' };
  }

  const [products, totalCount, categories] = await Promise.all([
    Product.find(query)
      .sort({ lastSeenAt: -1 })
      .skip(skip)
      .limit(ITEMS_PER_PAGE)
      .populate('categoryId', 'name nameVi slug')
      .lean(),
    Product.countDocuments(query),
    Category.find().sort({ sortOrder: 1 }).lean(),
  ]);

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return { products, totalCount, totalPages, currentPage: page, categories };
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const isAuthenticated = await getAdminSession();
  if (!isAuthenticated) {
    redirect('/admin/login');
  }

  const params = await searchParams;
  const { products, totalCount, totalPages, currentPage, categories } = await getProducts(params);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">
          Sản phẩm
          <span className="ml-2 text-lg font-normal text-gray-500">
            ({totalCount.toLocaleString()})
          </span>
        </h1>
      </div>

      <div className="mb-6 flex flex-wrap gap-4">
        <form className="flex gap-2" method="GET">
          <input
            type="text"
            name="search"
            placeholder="Tìm kiếm sản phẩm..."
            defaultValue={params.search || ''}
            className="rounded-lg border px-4 py-2 focus:border-blue-500 focus:outline-none"
          />
          <select
            name="category"
            defaultValue={params.category || ''}
            className="rounded-lg border px-4 py-2 focus:border-blue-500 focus:outline-none"
          >
            <option value="">Tất cả danh mục</option>
            {categories.map((cat) => (
              <option key={String(cat._id)} value={cat.slug}>
                {cat.nameVi || cat.name}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Lọc
          </button>
          {(params.search || params.category) && (
            <Link
              href="/admin/products"
              className="rounded-lg border px-4 py-2 hover:bg-gray-50"
            >
              Xóa lọc
            </Link>
          )}
        </form>
      </div>

      <div className="rounded-lg bg-white shadow">
        <table className="w-full">
          <thead>
            <tr className="border-b text-left text-sm text-gray-500">
              <th className="p-4">Hình</th>
              <th className="p-4">Tên sản phẩm</th>
              <th className="p-4">Danh mục</th>
              <th className="p-4">Giá</th>
              <th className="p-4">Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={String(product._id)} className="border-b hover:bg-gray-50">
                <td className="p-4">
                  {product.imageUrl ? (
                    <Image
                      src={product.imageUrl}
                      alt={product.name}
                      width={48}
                      height={48}
                      className="h-12 w-12 rounded object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded bg-gray-100 text-gray-400">
                      ?
                    </div>
                  )}
                </td>
                <td className="p-4">
                  <div className="font-medium">{product.name}</div>
                  <div className="text-xs text-gray-400">{product.externalId}</div>
                </td>
                <td className="p-4 text-sm">
                  {(product.categoryId as unknown as { nameVi?: string; name: string })?.nameVi ||
                    (product.categoryId as unknown as { name: string })?.name ||
                    'N/A'}
                </td>
                <td className="p-4">
                  <span className="font-medium text-green-600">
                    {product.basePrice?.toFixed(2)} €
                  </span>
                  {product.unitPriceText && (
                    <div className="text-xs text-gray-400">{product.unitPriceText}</div>
                  )}
                </td>
                <td className="p-4">
                  {product.isAvailable ? (
                    <span className="rounded bg-green-100 px-2 py-1 text-xs text-green-700">
                      Có sẵn
                    </span>
                  ) : (
                    <span className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-700">
                      Hết hàng
                    </span>
                  )}
                </td>
              </tr>
            ))}

            {products.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-gray-500">
                  Không tìm thấy sản phẩm nào.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t p-4">
            <div className="text-sm text-gray-500">
              Trang {currentPage} / {totalPages}
            </div>
            <div className="flex gap-2">
              {currentPage > 1 && (
                <Link
                  href={{
                    pathname: '/admin/products',
                    query: {
                      ...params,
                      page: currentPage - 1,
                    },
                  }}
                  className="rounded border px-3 py-1 hover:bg-gray-50"
                >
                  ← Trước
                </Link>
              )}
              {currentPage < totalPages && (
                <Link
                  href={{
                    pathname: '/admin/products',
                    query: {
                      ...params,
                      page: currentPage + 1,
                    },
                  }}
                  className="rounded border px-3 py-1 hover:bg-gray-50"
                >
                  Sau →
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
