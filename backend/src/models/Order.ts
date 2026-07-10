import { Schema, model, Document, Model, Types } from 'mongoose';
import { softDeletePlugin, SoftDeleteFields, SoftDeleteMethods } from './softDelete.plugin';

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
export type PaymentMethod = 'card' | 'cod' | 'paypal';

export interface IOrderItem {
  product: Types.ObjectId;
  title: string; // snapshot — survives later product edits/deletion
  image?: string;
  quantity: number;
  unitPrice: number;
}

export interface IOrderShippingAddress {
  label?: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface IOrderStatusEvent {
  status: OrderStatus;
  note?: string;
  changedAt: Date;
}

export interface IOrder extends Document, SoftDeleteFields, SoftDeleteMethods {
  orderNumber: string;
  user: Types.ObjectId;
  items: Types.DocumentArray<IOrderItem>;
  shippingAddress: IOrderShippingAddress;
  paymentMethod: PaymentMethod;
  status: OrderStatus;
  statusHistory: Types.DocumentArray<IOrderStatusEvent>;
  subtotal: number;
  shippingFee: number;
  tax: number;
  total: number;
  createdAt: Date;
  updatedAt: Date;
}

interface OrderModel extends Model<IOrder> {
  findDeleted(filter?: Record<string, unknown>): ReturnType<Model<IOrder>['find']>;
  findWithDeleted(filter?: Record<string, unknown>): ReturnType<Model<IOrder>['find']>;
}

const orderItemSchema = new Schema<IOrderItem>(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    title: { type: String, required: true },
    image: { type: String },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const shippingAddressSchema = new Schema<IOrderShippingAddress>(
  {
    label: { type: String },
    line1: { type: String, required: true },
    line2: { type: String },
    city: { type: String, required: true },
    state: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, required: true },
  },
  { _id: false },
);

const statusEventSchema = new Schema<IOrderStatusEvent>(
  {
    status: {
      type: String,
      enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'],
      required: true,
    },
    note: { type: String },
    changedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const orderSchema = new Schema<IOrder>(
  {
    orderNumber: { type: String, required: true, unique: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    items: {
      type: [orderItemSchema],
      validate: { validator: (arr: IOrderItem[]) => arr.length > 0, message: 'Order must contain at least one item' },
    },
    shippingAddress: { type: shippingAddressSchema, required: true },
    paymentMethod: { type: String, enum: ['card', 'cod', 'paypal'], required: true },
    status: {
      type: String,
      enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'],
      default: 'pending',
      index: true,
    },
    statusHistory: { type: [statusEventSchema], default: [] },
    subtotal: { type: Number, required: true, min: 0 },
    shippingFee: { type: Number, default: 0, min: 0 },
    tax: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },
  },
  { timestamps: true },
);

// Order history views: "my orders, newest first" and admin "orders by status".
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });

orderSchema.pre('validate', function (next) {
  if (this.isNew && this.statusHistory.length === 0) {
    this.statusHistory.push({ status: this.status, changedAt: new Date() });
  }
  next();
});

orderSchema.pre('save', function (next) {
  if (this.isModified('status') && !this.isNew) {
    this.statusHistory.push({ status: this.status, changedAt: new Date() });
  }
  next();
});

orderSchema.plugin(softDeletePlugin);

orderSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret: any) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export default model<IOrder, OrderModel>('Order', orderSchema);
