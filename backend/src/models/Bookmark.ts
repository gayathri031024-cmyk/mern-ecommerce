import { Schema, model, Document, Model, Types } from 'mongoose';

export interface IBookmark extends Document {
  user: Types.ObjectId;
  product: Types.ObjectId;
  note?: string;
  createdAt: Date;
}

type BookmarkModel = Model<IBookmark>;

const bookmarkSchema = new Schema<IBookmark>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    note: { type: String, trim: true, maxlength: 300 },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

// A user can only bookmark a given product once.
bookmarkSchema.index({ user: 1, product: 1 }, { unique: true });
bookmarkSchema.index({ user: 1, createdAt: -1 });

bookmarkSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret: any) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export default model<IBookmark, BookmarkModel>('Bookmark', bookmarkSchema);
