import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import type { UnitType } from './Product';

export type DealSource = 'flyer' | 'website' | 'api';

export interface IDeal extends Document {
  supermarketId: Types.ObjectId;
  productId: Types.ObjectId | null;
  categoryId: Types.ObjectId;
  locationSlug?: string;
  productName: string;
  productBrand?: string;
  productImageUrl: string;
  currentPrice: number;
  originalPrice: number | null;
  discountPercent: number | null;
  unitType: UnitType;
  unitPrice?: number;
  priceText: string;
  originalPriceText?: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  source: DealSource;
  sourceRef: string;
  sourceUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const DealSchema = new Schema<IDeal>(
  {
    supermarketId: { type: Schema.Types.ObjectId, ref: 'Supermarket', required: true },
    productId: { type: Schema.Types.ObjectId, ref: 'Product', default: null },
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    locationSlug: { type: String },
    productName: { type: String, required: true },
    productBrand: { type: String },
    productImageUrl: { type: String, required: true },
    currentPrice: { type: Number, required: true },
    originalPrice: { type: Number, default: null },
    discountPercent: { type: Number, default: null },
    unitType: {
      type: String,
      enum: ['piece', 'kg', 'liter', '100g', '100ml'],
      default: 'piece',
    },
    unitPrice: { type: Number },
    priceText: { type: String, required: true },
    originalPriceText: { type: String },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
    source: { type: String, enum: ['flyer', 'website', 'api'], required: true },
    sourceRef: { type: String, required: true },
    sourceUrl: { type: String },
  },
  { timestamps: true }
);

DealSchema.index({ supermarketId: 1, isActive: 1, endDate: -1 });
DealSchema.index({ supermarketId: 1, categoryId: 1, isActive: 1 });
DealSchema.index({ productName: 'text' });
DealSchema.index({ endDate: 1 });
DealSchema.index({ productId: 1 });

DealSchema.pre('save', function () {
  if (this.originalPrice && this.currentPrice) {
    this.discountPercent = Math.round(
      ((this.originalPrice - this.currentPrice) / this.originalPrice) * 100
    );
  }
  const now = new Date();
  this.isActive = this.startDate <= now && now <= this.endDate;
});

const Deal: Model<IDeal> = mongoose.models.Deal || mongoose.model<IDeal>('Deal', DealSchema);

export default Deal;
