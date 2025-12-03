import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Deal from '@/lib/db/models/Deal';
import Supermarket from '@/lib/db/models/Supermarket';

const DEFAULT_LIMIT = 30;
const MAX_LIMIT = 100;

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const supermarketSlug = searchParams.get('supermarket');
    const categoryId = searchParams.get('category');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(
      MAX_LIMIT,
      Math.max(1, parseInt(searchParams.get('limit') || String(DEFAULT_LIMIT), 10))
    );
    const sortBy = searchParams.get('sort') || 'discount';
    const includeExpired = searchParams.get('includeExpired') === 'true';

    const query: Record<string, unknown> = {};

    if (supermarketSlug) {
      const supermarket = await Supermarket.findOne({ slug: supermarketSlug });
      if (!supermarket) {
        return NextResponse.json(
          { success: false, error: 'Supermarket not found' },
          { status: 404 }
        );
      }
      query.supermarketId = supermarket._id;
    }

    if (categoryId) {
      query.categoryId = categoryId;
    }

    if (!includeExpired) {
      query.isActive = true;
      query.endDate = { $gte: new Date() };
    }

    const sortOptions: Record<string, Record<string, 1 | -1>> = {
      discount: { discountPercent: -1, currentPrice: 1 },
      priceAsc: { currentPrice: 1 },
      priceDesc: { currentPrice: -1 },
      endDate: { endDate: 1 },
      name: { productName: 1 },
    };

    const sort = sortOptions[sortBy] || sortOptions.discount;
    const skip = (page - 1) * limit;

    const [deals, total] = await Promise.all([
      Deal.find(query).sort(sort).skip(skip).limit(limit).lean(),
      Deal.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      data: deals,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error('Error fetching deals:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch deals',
      },
      { status: 500 }
    );
  }
}
