import { NextRequest, NextResponse } from 'next/server';
import { Types } from 'mongoose';
import connectDB from '@/lib/db/mongodb';
import Supermarket from '@/lib/db/models/Supermarket';
import CrawlerScheduler, { CrawlType } from '@/lib/crawler/scheduler';

const ADMIN_API_KEY = process.env.ADMIN_API_KEY;

function verifyAdminKey(request: NextRequest): boolean {
  if (!ADMIN_API_KEY) {
    return process.env.NODE_ENV === 'development';
  }

  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return false;
  }

  const token = authHeader.slice(7);
  return token === ADMIN_API_KEY;
}

export async function POST(request: NextRequest) {
  try {
    if (!verifyAdminKey(request)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { supermarketId, supermarketSlug, type = 'deals' } = body as {
      supermarketId?: string;
      supermarketSlug?: string;
      type?: CrawlType;
    };

    if (!['products', 'deals'].includes(type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid crawl type. Use "products" or "deals".' },
        { status: 400 }
      );
    }

    await connectDB();

    let supermarket;

    if (supermarketId) {
      if (!Types.ObjectId.isValid(supermarketId)) {
        return NextResponse.json(
          { success: false, error: 'Invalid supermarket ID' },
          { status: 400 }
        );
      }
      supermarket = await Supermarket.findById(supermarketId);
    } else if (supermarketSlug) {
      supermarket = await Supermarket.findOne({ slug: supermarketSlug });
    } else {
      return NextResponse.json(
        { success: false, error: 'Provide supermarketId or supermarketSlug' },
        { status: 400 }
      );
    }

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
      type
    );

    return NextResponse.json({
      success: result.success,
      message: result.message,
      supermarket: {
        id: supermarket._id,
        name: supermarket.name,
        slug: supermarket.slug,
      },
      type,
    });
  } catch (error) {
    console.error('Crawl API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    if (!verifyAdminKey(request)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const supermarkets = await Supermarket.find({ isActive: true })
      .select('name slug lastCrawl')
      .lean();

    return NextResponse.json({
      success: true,
      data: supermarkets.map((s) => ({
        id: s._id,
        name: s.name,
        slug: s.slug,
        lastCrawl: s.lastCrawl,
      })),
    });
  } catch (error) {
    console.error('Crawl status API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
