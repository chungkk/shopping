import { NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Supermarket from '@/lib/db/models/Supermarket';

export async function GET() {
  try {
    await connectDB();

    const supermarkets = await Supermarket.find({ isActive: true })
      .select('name slug logo website lastCrawl')
      .sort({ name: 1 })
      .lean();

    return NextResponse.json({
      success: true,
      data: supermarkets,
    });
  } catch (error) {
    console.error('Error fetching supermarkets:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch supermarkets',
      },
      { status: 500 }
    );
  }
}
