import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth/admin';
import connectDB from '@/lib/db/mongodb';
import Category from '@/lib/db/models/Category';

export async function GET(request: NextRequest) {
  try {
    const isAuthenticated = await getAdminSession();
    if (!isAuthenticated) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supermarketId = request.nextUrl.searchParams.get('supermarketId');

    if (!supermarketId) {
      return NextResponse.json(
        { success: false, error: 'supermarketId is required' },
        { status: 400 }
      );
    }

    await connectDB();

    const categories = await Category.find({
      supermarketId,
      isActive: true,
    })
      .sort({ sortOrder: 1, name: 1 })
      .lean();

    return NextResponse.json({
      success: true,
      categories: categories.map((c) => ({
        id: String(c._id),
        name: c.name,
        nameVi: c.nameVi,
        slug: c.slug,
        productCount: c.productCount,
      })),
    });
  } catch (error) {
    console.error('Get categories error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
