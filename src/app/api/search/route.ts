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
    const query = searchParams.get('q')?.trim();
    const supermarketSlug = searchParams.get('supermarket');
    const categoryId = searchParams.get('category');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(
      MAX_LIMIT,
      Math.max(1, parseInt(searchParams.get('limit') || String(DEFAULT_LIMIT), 10))
    );

    if (!query || query.length < 2) {
      return NextResponse.json(
        { success: false, error: 'Search query must be at least 2 characters' },
        { status: 400 }
      );
    }

    const searchFilter: Record<string, unknown> = {
      isActive: true,
      endDate: { $gte: new Date() },
      $or: [
        { productName: { $regex: query, $options: 'i' } },
        { productBrand: { $regex: query, $options: 'i' } },
      ],
    };

    if (supermarketSlug) {
      const supermarket = await Supermarket.findOne({ slug: supermarketSlug });
      if (supermarket) {
        searchFilter.supermarketId = supermarket._id;
      }
    }

    if (categoryId) {
      searchFilter.categoryId = categoryId;
    }

    const skip = (page - 1) * limit;

    const [deals, total] = await Promise.all([
      Deal.find(searchFilter)
        .sort({ discountPercent: -1, currentPrice: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Deal.countDocuments(searchFilter),
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      data: deals,
      query,
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
    console.error('Error searching deals:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to search deals',
      },
      { status: 500 }
    );
  }
}
