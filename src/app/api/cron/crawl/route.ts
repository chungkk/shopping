import { NextRequest, NextResponse } from 'next/server';
import { Types } from 'mongoose';
import connectDB from '@/lib/db/mongodb';
import Supermarket from '@/lib/db/models/Supermarket';
import CrawlerScheduler from '@/lib/crawler/scheduler';

const CRON_SECRET = process.env.CRON_SECRET;

function verifyCronSecret(request: NextRequest): boolean {
  if (!CRON_SECRET) {
    return process.env.NODE_ENV === 'development';
  }

  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7) === CRON_SECRET;
  }

  return request.headers.get('x-vercel-cron-secret') === CRON_SECRET;
}

export async function GET(request: NextRequest) {
  try {
    if (!verifyCronSecret(request)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const supermarkets = await Supermarket.find({ isActive: true });

    if (supermarkets.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No active supermarkets to crawl',
        results: [],
      });
    }

    const scheduler = new CrawlerScheduler({
      maxRetries: 2,
      retryIntervalMs: 5 * 60 * 1000,
    });

    const results: Array<{
      supermarket: string;
      type: string;
      success: boolean;
      message: string;
    }> = [];

    for (const supermarket of supermarkets) {
      const dealsResult = await scheduler.runWithRetry(
        supermarket._id as Types.ObjectId,
        'deals'
      );

      results.push({
        supermarket: supermarket.name,
        type: 'deals',
        success: dealsResult.success,
        message: dealsResult.message,
      });
    }

    const successCount = results.filter((r) => r.success).length;
    const failCount = results.filter((r) => !r.success).length;

    return NextResponse.json({
      success: failCount === 0,
      message: `Crawl complete: ${successCount} succeeded, ${failCount} failed`,
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Cron crawl error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
