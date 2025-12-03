import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Product from '@/lib/db/models/Product';
import Supermarket from '@/lib/db/models/Supermarket';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const supermarketSlug = searchParams.get('supermarket');
    const categoryId = searchParams.get('category');
    const search = searchParams.get('q');
    const available = searchParams.get('available');
    const sortBy = searchParams.get('sort') || 'name';

    const query: Record<string, unknown> = {};

    if (supermarketSlug) {
      const supermarket = await Supermarket.findOne({ slug: supermarketSlug }).select('_id');
      if (supermarket) {
        query.supermarketId = supermarket._id;
      } else {
        return NextResponse.json({
          success: true,
          data: [],
          pagination: {
            page,
            limit,
            total: 0,
            totalPages: 0,
            hasNext: false,
            hasPrev: false,
          },
        });
      }
    }

    if (categoryId) {
      query.categoryId = categoryId;
    }

    if (available !== null) {
      query.isAvailable = available === 'true';
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } },
      ];
    }

    const sortOptions: Record<string, Record<string, 1 | -1>> = {
      name: { name: 1 },
      priceAsc: { basePrice: 1 },
      priceDesc: { basePrice: -1 },
      newest: { firstSeenAt: -1 },
      updated: { lastSeenAt: -1 },
    };

    const sort = sortOptions[sortBy] || sortOptions.name;

    const [products, total] = await Promise.all([
      Product.find(query)
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('categoryId', 'name nameVi slug')
        .populate('supermarketId', 'name slug logoUrl')
        .lean(),
      Product.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      data: products.map((product) => ({
        _id: product._id,
        name: product.name,
        brand: product.brand,
        imageUrl: product.imageUrl,
        basePrice: product.basePrice,
        unitType: product.unitType,
        unitPrice: product.unitPrice,
        unitPriceText: product.unitPriceText,
        isAvailable: product.isAvailable,
        sourceUrl: product.sourceUrl,
        category: product.categoryId,
        supermarket: product.supermarketId,
      })),
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
    console.error('Products API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
