import { Schema, model, Document, Model, Types } from 'mongoose';

export interface ICartItem {
  product: Types.ObjectId;
  quantity: number;
  priceAtAdd: number;
}

export interface ICart extends Document {
  user: Types.ObjectId;
  items: Types.DocumentArray<ICartItem>;
  subtotal: number; // virtual
  itemCount: number; // virtual
  createdAt: Date;
  updatedAt: Date;
}

const cartItemSchema = new Schema<ICartItem>(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true, min: 1, max: 99, default: 1 },
    // Snapshot of unit price when added, so an in-progress cart is unaffected
    // by a price change until the user revisits/refreshes it.
    priceAtAdd: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const cartSchema = new Schema<ICart>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    items: { type: [cartItemSchema], default: [] },
  },
  { timestamps: true },
);

cartSchema.index({ 'items.product': 1 });

cartSchema.virtual('itemCount').get(function (this: ICart) {
  return this.items.reduce((sum, item) => sum + item.quantity, 0);
});

cartSchema.virtual('subtotal').get(function (this: ICart) {
  return Math.round(this.items.reduce((sum, item) => sum + item.priceAtAdd * item.quantity, 0) * 100) / 100;
});

cartSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret: any) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export default model<ICart, Model<ICart>>('Cart', cartSchema);
