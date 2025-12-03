import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export type UnitType = 'piece' | 'kg' | 'liter' | '100g' | '100ml';

export interface IProduct extends Document {
  supermarketId: Types.ObjectId;
  categoryId: Types.ObjectId;
  subCategoryId?: Types.ObjectId;
  externalId: string;
  name: string;
  brand?: string;
  description?: string;
  imageUrl: string;
  images: string[];
  basePrice: number;
  unitType: UnitType;
  unitPrice?: number;
  unitPriceText?: string;
  sourceUrl: string;
  isAvailable: boolean;
  firstSeenAt: Date;
  lastSeenAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    supermarketId: { type: Schema.Types.ObjectId, ref: 'Supermarket', required: true },
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    subCategoryId: { type: Schema.Types.ObjectId, ref: 'Category', default: null },
    externalId: { type: String, required: true },
    name: { type: String, required: true },
    brand: { type: String },
    description: { type: String },
    imageUrl: { type: String, required: true },
    images: { type: [String], default: [] },
    basePrice: { type: Number, required: true },
    unitType: {
      type: String,
      enum: ['piece', 'kg', 'liter', '100g', '100ml'],
      default: 'piece',
    },
    unitPrice: { type: Number },
    unitPriceText: { type: String },
    sourceUrl: { type: String, required: true },
    isAvailable: { type: Boolean, default: true },
    firstSeenAt: { type: Date, default: Date.now },
    lastSeenAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

ProductSchema.index({ supermarketId: 1, externalId: 1 }, { unique: true });
ProductSchema.index({ supermarketId: 1, categoryId: 1 });
ProductSchema.index({ supermarketId: 1, subCategoryId: 1 });
ProductSchema.index({ name: 'text', brand: 'text' });
ProductSchema.index({ isAvailable: 1 });

const Product: Model<IProduct> =
  mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);

export default Product;
