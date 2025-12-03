import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Deal from '@/lib/db/models/Deal';
import Category from '@/lib/db/models/Category';
import Supermarket from '@/lib/db/models/Supermarket';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;

    const deal = await Deal.findById(id).lean();

    if (!deal) {
      return NextResponse.json(
        { success: false, error: 'Deal not found' },
        { status: 404 }
      );
    }

    const [category, supermarket] = await Promise.all([
      deal.categoryId ? Category.findById(deal.categoryId).select('name nameVi slug').lean() : null,
      deal.supermarketId ? Supermarket.findById(deal.supermarketId).select('name slug logo').lean() : null,
    ]);

    return NextResponse.json({
      success: true,
      data: {
        ...deal,
        category,
        supermarket,
      },
    });
  } catch (error) {
    console.error('Error fetching deal:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch deal',
      },
      { status: 500 }
    );
  }
}
