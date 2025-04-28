import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IMember extends Document {
  name: string;
  phoneNumber: string;
  address?: string;
  joinDate: Date;
  status: 'active' | 'inactive' | 'suspended';
  balance: number;
  createdAt: Date;
  updatedAt: Date;
}

const MemberSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a name'],
      trim: true,
    },
    phoneNumber: {
      type: String,
      required: [true, 'Please provide a phone number'],
      unique: true,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    joinDate: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'suspended'],
      default: 'active',
    },
    balance: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Add methods to calculate balance, get transaction history, etc.
MemberSchema.methods.updateBalance = async function(amount: number) {
  this.balance += amount;
  await this.save();
  return this.balance;
};

// Create or retrieve the model
export default mongoose.models.Member || mongoose.model<IMember>('Member', MemberSchema);
