import { Schema, model, Document, Model, Types } from 'mongoose';
import { softDeletePlugin, SoftDeleteFields, SoftDeleteMethods } from './softDelete.plugin';

export interface IProductImage {
  url: string;
  alt?: string;
}

export interface IProduct extends Document, SoftDeleteFields, SoftDeleteMethods {
  title: string;
  slug: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  currency: string;
  stock: number;
  sku: string;
  brand?: string;
  rating: number;
  reviewCount: number;
  images: IProductImage[];
  category: Types.ObjectId;
  vendor?: Types.ObjectId;
  tags: string[];
  isFeatured: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface ProductModel extends Model<IProduct> {
  findDeleted(filter?: Record<string, unknown>): ReturnType<Model<IProduct>['find']>;
  findWithDeleted(filter?: Record<string, unknown>): ReturnType<Model<IProduct>['find']>;
}

const productImageSchema = new Schema<IProductImage>(
  { url: { type: String, required: true }, alt: { type: String, trim: true } },
  { _id: false },
);

const productSchema = new Schema<IProduct>(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    slug: { type: String, required: true, trim: true, lowercase: true },
    description: { type: String, default: '', maxlength: 5000 },
    price: { type: Number, required: true, min: 0 },
    compareAtPrice: {
      type: Number,
      min: 0,
      validate: {
        // "compare at" price is a strike-through original price, so it must
        // exceed the actual selling price or it doesn't make sense to show.
        validator: function (this: IProduct, value: number) {
          return value === undefined || value === null || value > this.price;
        },
        message: 'compareAtPrice must be greater than price',
      },
    },
    currency: { type: String, default: 'USD', uppercase: true, minlength: 3, maxlength: 3 },
    stock: { type: Number, default: 0, min: 0 },
    sku: { type: String, required: true, uppercase: true, trim: true },
    brand: { type: String, trim: true },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0, min: 0 },
    images: {
      type: [productImageSchema],
      validate: {
        validator: (arr: IProductImage[]) => arr.length <= 10,
        message: 'A product can have at most 10 images',
      },
    },
    category: { type: Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
    vendor: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    tags: { type: [String], set: (tags: string[]) => tags.map((t) => t.toLowerCase().trim()) },
    isFeatured: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

// Slug/SKU uniqueness only enforced among live (non-soft-deleted) products.
productSchema.index({ slug: 1 }, { unique: true, partialFilterExpression: { isDeleted: false } });
productSchema.index({ sku: 1 }, { unique: true, partialFilterExpression: { isDeleted: false } });

// Common storefront query patterns: browse by category sorted by price/rating/recency.
productSchema.index({ category: 1, price: 1 });
productSchema.index({ category: 1, rating: -1 });
productSchema.index({ isFeatured: 1, createdAt: -1 });
productSchema.index({ tags: 1 });
// Full-text search across title/description/brand, weighted so title matches rank highest.
productSchema.index(
  { title: 'text', description: 'text', brand: 'text' },
  { weights: { title: 5, brand: 3, description: 1 }, name: 'product_search_index' },
);

productSchema.plugin(softDeletePlugin);

// Reshape _id -> id to match frontend Product type
productSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret: any) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export default model<IProduct, ProductModel>('Product', productSchema);

