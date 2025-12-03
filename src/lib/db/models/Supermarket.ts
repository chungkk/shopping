import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ILocation {
  name: string;
  slug: string;
  address: string;
  flyerUrl: string;
}

export interface ICrawlConfig {
  delayMs: number;
  userAgent: string;
  selectors: Record<string, string>;
}

export interface ILastCrawl {
  productsAt: Date | null;
  dealsAt: Date | null;
  status: 'success' | 'failed' | 'pending';
  errorMessage?: string;
}

export interface ISupermarket extends Document {
  name: string;
  slug: string;
  logo: string;
  website: string;
  productCatalogUrl: string;
  flyerUrl: string;
  locations: ILocation[];
  isActive: boolean;
  crawlConfig: ICrawlConfig;
  lastCrawl: ILastCrawl;
  createdAt: Date;
  updatedAt: Date;
}

const LocationSchema = new Schema<ILocation>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true },
    address: { type: String, required: true },
    flyerUrl: { type: String, required: true },
  },
  { _id: false }
);

const CrawlConfigSchema = new Schema<ICrawlConfig>(
  {
    delayMs: { type: Number, default: 3000 },
    userAgent: { type: String, default: 'ShoppingDeals Bot/1.0' },
    selectors: { type: Map, of: String, default: {} },
  },
  { _id: false }
);

const LastCrawlSchema = new Schema<ILastCrawl>(
  {
    productsAt: { type: Date, default: null },
    dealsAt: { type: Date, default: null },
    status: { type: String, enum: ['success', 'failed', 'pending'], default: 'pending' },
    errorMessage: { type: String },
  },
  { _id: false }
);

const SupermarketSchema = new Schema<ISupermarket>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    logo: { type: String, required: true },
    website: { type: String, required: true },
    productCatalogUrl: { type: String },
    flyerUrl: { type: String },
    locations: { type: [LocationSchema], default: [] },
    isActive: { type: Boolean, default: true },
    crawlConfig: { type: CrawlConfigSchema, default: () => ({}) },
    lastCrawl: { type: LastCrawlSchema, default: () => ({}) },
  },
  { timestamps: true }
);

SupermarketSchema.index({ slug: 1 }, { unique: true });
SupermarketSchema.index({ isActive: 1 });

const Supermarket: Model<ISupermarket> =
  mongoose.models.Supermarket || mongoose.model<ISupermarket>('Supermarket', SupermarketSchema);

export default Supermarket;
