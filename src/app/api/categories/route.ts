import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Category from '@/lib/db/models/Category';
import Supermarket from '@/lib/db/models/Supermarket';
import Deal from '@/lib/db/models/Deal';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const supermarketSlug = searchParams.get('supermarket');
    const includeCount = searchParams.get('includeCount') === 'true';

    const query: Record<string, unknown> = { isActive: true };

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

    const categories = await Category.find(query)
      .select('name nameVi slug sortOrder supermarketId')
      .sort({ sortOrder: 1 })
      .lean();

    if (includeCount) {
      const categoriesWithCount = await Promise.all(
        categories.map(async (category) => {
          const dealCount = await Deal.countDocuments({
            categoryId: category._id,
            isActive: true,
            endDate: { $gte: new Date() },
          });
          return { ...category, dealCount };
        })
      );
      return NextResponse.json({
        success: true,
        data: categoriesWithCount,
      });
    }

    return NextResponse.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch categories',
      },
      { status: 500 }
    );
  }
}
