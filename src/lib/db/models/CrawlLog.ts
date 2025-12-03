import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export type CrawlType = 'products' | 'deals';
export type CrawlStatus = 'started' | 'success' | 'failed';

export interface ICrawlStats {
  pagesProcessed: number;
  itemsFound: number;
  itemsCreated: number;
  itemsUpdated: number;
  errors: number;
}

export interface ICrawlErrorDetails {
  message: string;
  stack?: string;
  failedUrls?: string[];
}

export interface ICrawlLog extends Document {
  supermarketId: Types.ObjectId;
  type: CrawlType;
  status: CrawlStatus;
  startedAt: Date;
  completedAt?: Date;
  duration?: number;
  stats: ICrawlStats;
  errorDetails?: ICrawlErrorDetails;
  createdAt: Date;
  updatedAt: Date;
}

const CrawlStatsSchema = new Schema<ICrawlStats>(
  {
    pagesProcessed: { type: Number, default: 0 },
    itemsFound: { type: Number, default: 0 },
    itemsCreated: { type: Number, default: 0 },
    itemsUpdated: { type: Number, default: 0 },
    errors: { type: Number, default: 0 },
  },
  { _id: false }
);

const CrawlErrorDetailsSchema = new Schema<ICrawlErrorDetails>(
  {
    message: { type: String, required: true },
    stack: { type: String },
    failedUrls: { type: [String], default: [] },
  },
  { _id: false }
);

const CrawlLogSchema = new Schema<ICrawlLog>(
  {
    supermarketId: { type: Schema.Types.ObjectId, ref: 'Supermarket', required: true },
    type: { type: String, enum: ['products', 'deals'], required: true },
    status: { type: String, enum: ['started', 'success', 'failed'], required: true },
    startedAt: { type: Date, required: true },
    completedAt: { type: Date },
    duration: { type: Number },
    stats: { type: CrawlStatsSchema, default: () => ({}) },
    errorDetails: { type: CrawlErrorDetailsSchema },
  },
  { timestamps: true }
);

CrawlLogSchema.index({ supermarketId: 1, startedAt: -1 });
CrawlLogSchema.index({ status: 1 });

const CrawlLog: Model<ICrawlLog> =
  mongoose.models.CrawlLog || mongoose.model<ICrawlLog>('CrawlLog', CrawlLogSchema);

export default CrawlLog;
