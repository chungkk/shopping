import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Supermarket from '@/lib/db/models/Supermarket';
import Deal from '@/lib/db/models/Deal';
import CrawlLog from '@/lib/db/models/CrawlLog';
import { isDataStale } from '@/lib/utils/date';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const supermarketSlug = searchParams.get('supermarket');

    if (supermarketSlug) {
      const supermarket = await Supermarket.findOne({ slug: supermarketSlug })
        .select('name slug lastCrawl')
        .lean();

      if (!supermarket) {
        return NextResponse.json(
          { success: false, error: 'Supermarket not found' },
          { status: 404 }
        );
      }

      const [activeDeals, lastCrawlLog] = await Promise.all([
        Deal.countDocuments({
          supermarketId: supermarket._id,
          isActive: true,
          endDate: { $gte: new Date() },
        }),
        CrawlLog.findOne({ supermarketId: supermarket._id })
          .sort({ startedAt: -1 })
          .select('type status startedAt completedAt stats')
          .lean(),
      ]);

      const lastDealsUpdate = supermarket.lastCrawl?.dealsAt;
      const isStale = isDataStale(lastDealsUpdate ? new Date(lastDealsUpdate) : null, 24);

      return NextResponse.json({
        success: true,
        data: {
          supermarket: {
            name: supermarket.name,
            slug: supermarket.slug,
          },
          crawlStatus: supermarket.lastCrawl?.status || 'pending',
          lastDealsUpdate,
          lastProductsUpdate: supermarket.lastCrawl?.productsAt,
          isStale,
          activeDeals,
          lastCrawl: lastCrawlLog,
        },
      });
    }

    const supermarkets = await Supermarket.find({ isActive: true })
      .select('name slug lastCrawl')
      .lean();

    const statusData = await Promise.all(
      supermarkets.map(async (sm) => {
        const activeDeals = await Deal.countDocuments({
          supermarketId: sm._id,
          isActive: true,
          endDate: { $gte: new Date() },
        });

        const lastDealsUpdate = sm.lastCrawl?.dealsAt;

        return {
          name: sm.name,
          slug: sm.slug,
          crawlStatus: sm.lastCrawl?.status || 'pending',
          lastDealsUpdate,
          isStale: isDataStale(lastDealsUpdate ? new Date(lastDealsUpdate) : null, 24),
          activeDeals,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: statusData,
    });
  } catch (error) {
    console.error('Error fetching status:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch status',
      },
      { status: 500 }
    );
  }
}
