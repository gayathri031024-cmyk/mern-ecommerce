
import { Schema, Query, Document } from 'mongoose';
 
/**
 * Adds soft-delete support to any schema:
 *  - isDeleted / deletedAt / deletedBy fields
 *  - instance methods: softDelete(), restore()
 *  - static methods: findDeleted(filter), findWithDeleted(filter)
 *  - automatically excludes soft-deleted docs from find/findOne/count/aggregate
 *    unless the query explicitly opts in with `.withDeleted()` or `includeDeleted: true`
 */
 
export interface SoftDeleteFields {
  isDeleted: boolean;
  deletedAt?: Date | null;
  deletedBy?: Schema.Types.ObjectId | null;
}
 
export interface SoftDeleteMethods {
  softDelete(deletedBy?: Schema.Types.ObjectId | string): Promise<void>;
  restore(): Promise<void>;
}
 
export interface SoftDeleteQueryHelpers {
  withDeleted<T extends Query<unknown, Document>>(this: T): T;
}
 
export function softDeletePlugin(schema: Schema): void {
  schema.add({
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null },
    deletedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  });
 
  // Opt-out query helper: Model.find().withDeleted()
  // Schema.query's type only exposes helpers declared via the schema's own
  // QueryHelpers generic, so a plugin attaching one generically needs a cast.
  (schema.query as Record<string, unknown>).withDeleted = function (this: Query<unknown, Document>) {
    this.setOptions({ includeDeleted: true });
    return this;
  };
 
  const excludeDeleted = function (this: Query<unknown, Document>, next: () => void) {
    const options = this.getOptions();
    if (!options.includeDeleted && this.getFilter().isDeleted === undefined) {
      this.where({ isDeleted: { $ne: true } });
    }
    next();
  };
 
  ['find', 'findOne', 'findOneAndUpdate', 'countDocuments', 'findOneAndDelete'].forEach((hook) => {
    schema.pre(hook as never, excludeDeleted);
  });
 
  schema.pre('aggregate', function (next) {
    const options = this.options as { includeDeleted?: boolean };
    if (!options.includeDeleted) {
      this.pipeline().unshift({ $match: { isDeleted: { $ne: true } } });
    }
    next();
  });
 
  schema.methods.softDelete = async function (deletedBy?: Schema.Types.ObjectId | string) {
    this.isDeleted = true;
    this.deletedAt = new Date();
    if (deletedBy) this.deletedBy = deletedBy;
    await this.save();
  };
 
  schema.methods.restore = async function () {
    this.isDeleted = false;
    this.deletedAt = null;
    this.deletedBy = null;
    await this.save();
  };
 
  schema.statics.findDeleted = function (filter: Record<string, unknown> = {}) {
    return this.find({ ...filter, isDeleted: true }, null, { includeDeleted: true });
  };
 
  schema.statics.findWithDeleted = function (filter: Record<string, unknown> = {}) {
    return this.find(filter, null, { includeDeleted: true });
  };
}