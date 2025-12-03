import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface ICategory extends Document {
  supermarketId: Types.ObjectId;
  name: string;
  nameVi: string;
  slug: string;
  parentId: Types.ObjectId | null;
  externalId: string;
  iconUrl?: string;
  sortOrder: number;
  productCount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema = new Schema<ICategory>(
  {
    supermarketId: { type: Schema.Types.ObjectId, ref: 'Supermarket', required: true },
    name: { type: String, required: true },
    nameVi: { type: String, required: true },
    slug: { type: String, required: true },
    parentId: { type: Schema.Types.ObjectId, ref: 'Category', default: null },
    externalId: { type: String, required: true },
    iconUrl: { type: String },
    sortOrder: { type: Number, default: 0 },
    productCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

CategorySchema.index({ supermarketId: 1, slug: 1 }, { unique: true });
CategorySchema.index({ supermarketId: 1, sortOrder: 1 });
CategorySchema.index({ parentId: 1 });

const Category: Model<ICategory> =
  mongoose.models.Category || mongoose.model<ICategory>('Category', CategorySchema);

export default Category;
