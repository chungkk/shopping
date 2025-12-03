import { NextRequest, NextResponse } from 'next/server';
import { Types } from 'mongoose';
import { getAdminSession } from '@/lib/auth/admin';
import connectDB from '@/lib/db/mongodb';
import Supermarket from '@/lib/db/models/Supermarket';
import CrawlerScheduler, { CrawlType } from '@/lib/crawler/scheduler';

export async function POST(request: NextRequest) {
  try {
    const isAuthenticated = await getAdminSession();
    if (!isAuthenticated) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { supermarketId, type = 'deals' } = await request.json();

    if (!supermarketId) {
      return NextResponse.json(
        { success: false, error: 'supermarketId is required' },
        { status: 400 }
      );
    }

    if (!['products', 'deals'].includes(type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid type. Use "products" or "deals".' },
        { status: 400 }
      );
    }

    await connectDB();

    const supermarket = await Supermarket.findById(supermarketId);
    if (!supermarket) {
      return NextResponse.json(
        { success: false, error: 'Supermarket not found' },
        { status: 404 }
      );
    }

    if (!supermarket.isActive) {
      return NextResponse.json(
        { success: false, error: 'Supermarket is not active' },
        { status: 400 }
      );
    }

    const scheduler = new CrawlerScheduler();
    const result = await scheduler.runCrawl(
      supermarket._id as Types.ObjectId,
      type as CrawlType
    );

    return NextResponse.json({
      success: result.success,
      message: result.message,
    });
  } catch (error) {
    console.error('Admin crawl error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
