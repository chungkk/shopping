# Quickstart: German Supermarket Deals Aggregator

**Date**: 2025-12-03

## Prerequisites

- Node.js 20.x LTS
- MongoDB 6.0+ (local hoặc Atlas)
- pnpm (recommended) hoặc npm

## 1. Setup Project

```bash
# Clone và install
cd /Users/chungkk/Code/Shopping
npx create-next-app@latest shopping-deals --typescript --tailwind --eslint --app --src-dir

cd shopping-deals

# Install dependencies
pnpm add mongoose puppeteer
pnpm add -D @types/mongoose
```

## 2. Environment Variables

Tạo file `.env.local`:

```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/shopping-deals
# Hoặc MongoDB Atlas:
# MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/shopping-deals

# Crawl Config
CRAWL_DELAY_MS=3000
CRAWL_USER_AGENT="ShoppingDeals Bot/1.0"

# Optional: Admin key for manual crawl trigger
ADMIN_API_KEY=your-secret-key
```

## 3. MongoDB Setup

### Option A: Local MongoDB
```bash
# macOS với Homebrew
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community

# Verify
mongosh
```

### Option B: MongoDB Atlas (Free Tier)
1. Tạo account tại https://cloud.mongodb.com
2. Create Cluster (M0 Free)
3. Database Access → Add user
4. Network Access → Add IP (0.0.0.0/0 cho dev)
5. Copy connection string vào `.env.local`

## 4. Project Structure

```bash
# Tạo cấu trúc thư mục
mkdir -p src/lib/db/models
mkdir -p src/lib/crawler/globus
mkdir -p src/lib/utils
mkdir -p src/components
mkdir -p src/i18n
```

## 5. Database Connection

Tạo `src/lib/db/mongodb.ts`:

```typescript
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
  throw new Error('Please define MONGODB_URI in .env.local');
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI).then((mongoose) => {
      return mongoose;
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
```

## 6. Create Models

Tạo `src/lib/db/models/Deal.ts`:

```typescript
import mongoose, { Schema, Document } from 'mongoose';

export interface IDeal extends Document {
  supermarketId: mongoose.Types.ObjectId;
  productId?: mongoose.Types.ObjectId;
  categoryId: mongoose.Types.ObjectId;
  productName: string;
  productBrand?: string;
  productImageUrl: string;
  currentPrice: number;
  originalPrice?: number;
  discountPercent?: number;
  unitType: 'piece' | 'kg' | 'liter' | '100g' | '100ml';
  priceText: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  source: 'flyer' | 'website';
  sourceRef: string;
}

const DealSchema = new Schema<IDeal>(
  {
    supermarketId: { type: Schema.Types.ObjectId, ref: 'Supermarket', required: true },
    productId: { type: Schema.Types.ObjectId, ref: 'Product' },
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    productName: { type: String, required: true },
    productBrand: String,
    productImageUrl: { type: String, required: true },
    currentPrice: { type: Number, required: true },
    originalPrice: Number,
    discountPercent: Number,
    unitType: { type: String, enum: ['piece', 'kg', 'liter', '100g', '100ml'], default: 'piece' },
    priceText: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
    source: { type: String, enum: ['flyer', 'website'], required: true },
    sourceRef: { type: String, required: true },
  },
  { timestamps: true }
);

// Indexes
DealSchema.index({ supermarketId: 1, isActive: 1, endDate: -1 });
DealSchema.index({ supermarketId: 1, categoryId: 1, isActive: 1 });
DealSchema.index({ productName: 'text' });

export default mongoose.models.Deal || mongoose.model<IDeal>('Deal', DealSchema);
```

## 7. First API Route

Tạo `src/app/api/deals/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongodb';
import Deal from '@/lib/db/models/Deal';

export async function GET(request: NextRequest) {
  await connectDB();

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = Math.min(parseInt(searchParams.get('limit') || '30'), 100);
  const skip = (page - 1) * limit;

  const deals = await Deal.find({ isActive: true })
    .sort({ discountPercent: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const total = await Deal.countDocuments({ isActive: true });

  return NextResponse.json({
    data: deals,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
  });
}
```

## 8. Run Development Server

```bash
pnpm dev
```

Truy cập:
- http://localhost:3000 - Homepage
- http://localhost:3000/api/deals - API endpoint

## 9. Seed Test Data

Tạo `scripts/seed.ts`:

```typescript
import { connectDB } from '../src/lib/db/mongodb';
import Deal from '../src/lib/db/models/Deal';
import mongoose from 'mongoose';

async function seed() {
  await connectDB();
  
  // Clear existing
  await Deal.deleteMany({});
  
  // Seed sample deals
  const deals = [
    {
      supermarketId: new mongoose.Types.ObjectId(),
      categoryId: new mongoose.Types.ObjectId(),
      productName: 'Coca-Cola Classic 1,5L',
      productBrand: 'Coca-Cola',
      productImageUrl: 'https://via.placeholder.com/200',
      currentPrice: 99,
      originalPrice: 149,
      discountPercent: 34,
      unitType: 'piece',
      priceText: '0,99 €',
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      isActive: true,
      source: 'flyer',
      sourceRef: 'KW49',
    },
    // Add more...
  ];
  
  await Deal.insertMany(deals);
  console.log('Seeded', deals.length, 'deals');
  process.exit(0);
}

seed();
```

Chạy: `pnpm tsx scripts/seed.ts`

## 10. Next Steps

1. [ ] Implement Globus crawler (`src/lib/crawler/globus/`)
2. [ ] Create frontend components
3. [ ] Add Vietnamese translations
4. [ ] Setup cron job for daily crawl
5. [ ] Deploy to Vercel

## Useful Commands

```bash
# Development
pnpm dev

# Build
pnpm build

# Type check
pnpm tsc --noEmit

# Lint
pnpm lint

# Test
pnpm test
```
