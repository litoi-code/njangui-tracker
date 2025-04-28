import mongoose, { Schema, Document, Model } from 'mongoose';
import { IMember } from './Member';

export interface IPenalty extends Document {
  amount: number;
  reason: string;
  date: Date;
  member: IMember['_id'];
  status: 'pending' | 'paid';
  createdAt: Date;
  updatedAt: Date;
}

const PenaltySchema: Schema = new Schema(
  {
    amount: {
      type: Number,
      required: [true, 'Please specify the penalty amount'],
      min: 0,
    },
    reason: {
      type: String,
      required: [true, 'Please provide a reason for the penalty'],
      trim: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    member: {
      type: Schema.Types.ObjectId,
      ref: 'Member',
      required: [true, 'Please specify the member receiving this penalty'],
    },
    status: {
      type: String,
      enum: ['pending', 'paid'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);

// Add methods for applying penalties, etc.
PenaltySchema.methods.markAsPaid = async function() {
  this.status = 'paid';
  await this.save();
  
  // Update member balance
  const Member = mongoose.model('Member');
  const member = await Member.findById(this.member);
  if (member) {
    await member.updateBalance(-this.amount);
  }
  
  return this;
};

// Create or retrieve the model
export default mongoose.models.Penalty || mongoose.model<IPenalty>('Penalty', PenaltySchema);
