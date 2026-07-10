import { Schema, model, Document, Model, Types } from 'mongoose';
import { softDeletePlugin, SoftDeleteFields, SoftDeleteMethods } from './softDelete.plugin';

export interface ICategory extends Document, SoftDeleteFields, SoftDeleteMethods {
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  parent?: Types.ObjectId | null;
  isActive: boolean;
  productCount: number;
  createdAt: Date;
  updatedAt: Date;
}

interface CategoryModel extends Model<ICategory> {
  findDeleted(filter?: Record<string, unknown>): ReturnType<Model<ICategory>['find']>;
  findWithDeleted(filter?: Record<string, unknown>): ReturnType<Model<ICategory>['find']>;
}

const categorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      match: [/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase, alphanumeric and hyphenated'],
    },
    description: { type: String, trim: true, maxlength: 1000 },
    imageUrl: { type: String },
    parent: { type: Schema.Types.ObjectId, ref: 'Category', default: null, index: true },
    isActive: { type: Boolean, default: true },
    // Denormalized counter kept in sync via Product hooks / a maintenance job —
    // avoids a COUNT aggregation every time a category list is rendered.
    productCount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true },
);

// Slug is unique only among non-deleted categories, so a soft-deleted
// "electronics" doesn't block a new category from reusing the slug.
categorySchema.index({ slug: 1 }, { unique: true, partialFilterExpression: { isDeleted: false } });
categorySchema.index({ parent: 1, isActive: 1 });
categorySchema.index({ name: 'text', description: 'text' });

categorySchema.plugin(softDeletePlugin);

categorySchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret: any) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export default model<ICategory, CategoryModel>('Category', categorySchema);
