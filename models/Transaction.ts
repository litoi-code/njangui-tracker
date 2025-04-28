import mongoose, { Schema, Document, Model } from 'mongoose';
import { IMember } from './Member';
import { IFund } from './Fund';

export interface ITransaction extends Document {
  type: 'deposit' | 'withdrawal' | 'transfer' | 'loan' | 'repayment' | 'contribution' | 'penalty';
  amount: number;
  date: Date;
  description?: string;
  member: IMember['_id'];
  recipient?: IMember['_id']; // Added recipient field for member-to-member transfers
  fund?: IFund['_id'];
  relatedTransaction?: ITransaction['_id'];
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema: Schema = new Schema(
  {
    type: {
      type: String,
      enum: ['deposit', 'withdrawal', 'transfer', 'loan', 'repayment', 'contribution', 'penalty'],
      required: [true, 'Please specify the transaction type'],
    },
    amount: {
      type: Number,
      required: [true, 'Please specify the transaction amount'],
    },
    date: {
      type: Date,
      default: Date.now,
    },
    description: {
      type: String,
      trim: true,
    },
    member: {
      type: Schema.Types.ObjectId,
      ref: 'Member',
      required: [true, 'Please specify the member associated with this transaction'],
    },
    recipient: {
      type: Schema.Types.ObjectId,
      ref: 'Member',
    },
    fund: {
      type: Schema.Types.ObjectId,
      ref: 'Fund',
    },
    relatedTransaction: {
      type: Schema.Types.ObjectId,
      ref: 'Transaction',
    },
  },
  {
    timestamps: true,
  }
);

// Add methods for validating transactions, etc.
TransactionSchema.pre('save', async function(next) {
  // We're allowing transactions with insufficient balance as per requirements
  next();
});

// Create or retrieve the model
export default mongoose.models.Transaction || mongoose.model<ITransaction>('Transaction', TransactionSchema);
