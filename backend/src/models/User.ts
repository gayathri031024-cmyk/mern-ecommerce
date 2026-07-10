import crypto from 'crypto';
import { Schema, model, Document, Model, Types } from 'mongoose';
import bcrypt from 'bcryptjs';
import { ROLES, Role } from '@constants/roles';
import { softDeletePlugin, SoftDeleteFields, SoftDeleteMethods } from './softDelete.plugin';

export interface IAddress {
  _id: Types.ObjectId;
  label: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

const addressSchema = new Schema<IAddress>(
  {
    label: { type: String, required: true, trim: true, default: 'Home' },
    line1: { type: String, required: true, trim: true },
    line2: { type: String, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    postalCode: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true },
    isDefault: { type: Boolean, default: false },
  },
  { _id: true, timestamps: false },
);

export interface IUser extends Document, SoftDeleteFields, SoftDeleteMethods {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role: Role;
  avatarUrl?: string;
  addresses: Types.DocumentArray<IAddress>;

  isEmailVerified: boolean;
  emailVerificationTokenHash?: string;
  emailVerificationExpires?: Date;

  passwordResetTokenHash?: string;
  passwordResetExpires?: Date;

  refreshTokenHash?: string;

  createdAt: Date;
  updatedAt: Date;

  comparePassword(candidate: string): Promise<boolean>;
  createEmailVerificationToken(): string;
  createPasswordResetToken(): string;
  setRefreshToken(token: string): void;
  compareRefreshToken(candidate: string): boolean;
}

interface UserModel extends Model<IUser> {
  findDeleted(filter?: Record<string, unknown>): ReturnType<Model<IUser>['find']>;
  findWithDeleted(filter?: Record<string, unknown>): ReturnType<Model<IUser>['find']>;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email address'],
    },
    password: { type: String, required: true, minlength: 8, select: false },
    phone: { type: String, trim: true },
    role: { type: String, enum: Object.values(ROLES), default: ROLES.CUSTOMER, index: true },
    avatarUrl: { type: String },
    addresses: { type: [addressSchema], default: [] },

    isEmailVerified: { type: Boolean, default: false },
    emailVerificationTokenHash: { type: String, select: false },
    emailVerificationExpires: { type: Date, select: false },

    passwordResetTokenHash: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },

    refreshTokenHash: { type: String, select: false },
  },
  { timestamps: true },
);

// Enforce at most one default address per user.
userSchema.pre('save', function (next) {
  if (this.isModified('addresses')) {
    const defaults = this.addresses.filter((a) => a.isDefault);
    if (defaults.length > 1) {
      this.addresses.forEach((a, i) => {
        a.isDefault = i === this.addresses.findIndex((d) => d.isDefault);
      });
    } else if (defaults.length === 0 && this.addresses.length > 0) {
      this.addresses[0].isDefault = true;
    }
  }
  next();
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = async function (candidate: string): Promise<boolean> {
  return bcrypt.compare(candidate, this.password);
};

/** Generates a raw token to email to the user, storing only its SHA-256 hash. */
userSchema.methods.createEmailVerificationToken = function (): string {
  const rawToken = crypto.randomBytes(32).toString('hex');
  this.emailVerificationTokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  this.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h
  return rawToken;
};

userSchema.methods.createPasswordResetToken = function (): string {
  const rawToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetTokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  this.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1h
  return rawToken;
};

/** Stores only a hash of the refresh token so a DB leak can't be replayed directly. */
userSchema.methods.setRefreshToken = function (token: string): void {
  this.refreshTokenHash = crypto.createHash('sha256').update(token).digest('hex');
};

userSchema.methods.compareRefreshToken = function (candidate: string): boolean {
  if (!this.refreshTokenHash) return false;
  const candidateHash = crypto.createHash('sha256').update(candidate).digest('hex');
  return candidateHash === this.refreshTokenHash;
};

userSchema.plugin(softDeletePlugin);

// Email must stay unique only among non-deleted users, so a soft-deleted
// account doesn't permanently block someone from re-registering that email.
userSchema.index({ email: 1 }, { unique: true, partialFilterExpression: { isDeleted: false } });

userSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret: any) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    delete ret.password;
    delete ret.refreshTokenHash;
    delete ret.emailVerificationTokenHash;
    delete ret.emailVerificationExpires;
    delete ret.passwordResetTokenHash;
    delete ret.passwordResetExpires;
    return ret;
  },
});

export default model<IUser, UserModel>('User', userSchema);
