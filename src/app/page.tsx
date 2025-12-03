import Link from 'next/link';
import Image from 'next/image';
import connectDB from '@/lib/db/mongodb';
import Supermarket from '@/lib/db/models/Supermarket';
import Deal from '@/lib/db/models/Deal';

async function getSupermarkets() {
  await connectDB();
  return Supermarket.find().select('name slug logo isActive').sort({ isActive: -1, name: 1 }).lean();
}

async function getDealsCount() {
  await connectDB();
  return Deal.countDocuments({ isActive: true, endDate: { $gte: new Date() } });
}

export default async function Home() {
  const [supermarkets, dealsCount] = await Promise.all([getSupermarkets(), getDealsCount()]);

  return (
    <div className="py-8">
      <section className="mb-12 text-center">
        <h1 className="mb-4 text-4xl font-bold text-gray-900">
          Khuyến mãi siêu thị Đức hôm nay
        </h1>
        <p className="mb-8 text-lg text-gray-600">
          Tổng hợp {dealsCount > 0 ? `${dealsCount} ` : ''}sản phẩm giảm giá từ các siêu thị lớn
        </p>
        <Link
          href="/deals"
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-lg font-medium text-white transition-colors hover:bg-blue-700"
        >
          Xem tất cả khuyến mãi
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </section>

      <section>
        <h2 className="mb-6 text-2xl font-bold text-gray-900">Chọn siêu thị</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {supermarkets.map((supermarket) => {
            const isActive = supermarket.isActive;
            const cardContent = (
              <>
                {!isActive && (
                  <span className="absolute top-2 right-2 rounded bg-gray-200 px-2 py-0.5 text-xs text-gray-600">
                    Sắp ra mắt
                  </span>
                )}
                {supermarket.logo ? (
                  <Image
                    src={supermarket.logo}
                    alt={supermarket.name}
                    width={120}
                    height={48}
                    className="h-12 w-auto object-contain"
                    unoptimized
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-xl font-bold text-blue-600">
                    {supermarket.name[0]}
                  </div>
                )}
                <span className="text-lg font-medium text-gray-900">{supermarket.name}</span>
              </>
            );
            
            const cardClass = `relative flex flex-col items-center gap-3 rounded-lg border bg-white p-6 shadow-sm transition-shadow ${
              isActive ? 'hover:shadow-md cursor-pointer' : 'opacity-60 cursor-default'
            }`;

            return isActive ? (
              <Link
                key={String(supermarket._id)}
                href={`/deals?supermarket=${supermarket.slug}`}
                className={cardClass}
              >
                {cardContent}
              </Link>
            ) : (
              <div key={String(supermarket._id)} className={cardClass}>
                {cardContent}
              </div>
            );
          })}

          {supermarkets.length === 0 && (
            <div className="col-span-full py-8 text-center text-gray-500">
              <p>Chưa có siêu thị nào. Vui lòng chạy seed script.</p>
            </div>
          )}
        </div>
      </section>

      <section className="mt-12 rounded-lg bg-blue-50 p-6">
        <h2 className="mb-4 text-xl font-bold text-gray-900">Về Đi Chợ Thông Minh</h2>
        <p className="text-gray-600">
          Chúng tôi tổng hợp khuyến mãi từ các siêu thị lớn tại Đức để giúp bạn tiết kiệm tiền mua
          sắm. Dữ liệu được cập nhật tự động hàng ngày từ website chính thức của các siêu thị.
        </p>
      </section>
    </div>
  );
}
