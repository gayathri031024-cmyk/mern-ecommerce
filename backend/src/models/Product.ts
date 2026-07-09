import { Schema, model, Document } from 'mongoose';

export interface IProduct extends Document {
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
  images: { url: string; alt?: string }[];
  category?: Schema.Types.ObjectId;
  tags: string[];
  isFeatured: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<IProduct>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    description: { type: String, default: '' },
    price: { type: Number, required: true, min: 0 },
    compareAtPrice: { type: Number, min: 0 },
    currency: { type: String, default: 'USD' },
    stock: { type: Number, default: 0 },
    sku: { type: String, required: true, unique: true },
    brand: { type: String },
    rating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    images: [{ url: String, alt: String }],
    category: { type: Schema.Types.ObjectId, ref: 'Category' },
    tags: [{ type: String }],
    isFeatured: { type: Boolean, default: false },
  },
  { timestamps: true },
);

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

export default model<IProduct>('Product', productSchema);
