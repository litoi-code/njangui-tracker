import mongoose, { Schema, Document, Model } from 'mongoose';
import { IMember } from './Member';
import { IFund } from './Fund';

export interface IContribution extends Document {
  amount: number;
  date: Date;
  member: IMember['_id'];
  fund: IFund['_id'];
  createdAt: Date;
  updatedAt: Date;
}

const ContributionSchema: Schema = new Schema(
  {
    amount: {
      type: Number,
      required: [true, 'Please specify the contribution amount'],
      min: 0,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    member: {
      type: Schema.Types.ObjectId,
      ref: 'Member',
      required: [true, 'Please specify the contributing member'],
    },
    fund: {
      type: Schema.Types.ObjectId,
      ref: 'Fund',
      required: [true, 'Please specify the fund for this contribution'],
    },
  },
  {
    timestamps: true,
  }
);

// NOTE: We've moved the post-save hook logic to the API route to handle multiple contributions in a single transaction
// This prevents race conditions when creating multiple contributions at once
// The commented code below is kept for reference
/*
ContributionSchema.post('save', async function(doc) {
  // Update fund total amount
  const Fund = mongoose.model('Fund');
  const fund = await Fund.findById(doc.fund);
  if (fund) {
    await fund.updateTotalAmount(doc.amount);
  }

  // Update member balance
  const Member = mongoose.model('Member');
  const member = await Member.findById(doc.member);
  if (member) {
    await member.updateBalance(-doc.amount);
  }
});
*/

// Create or retrieve the model
export default mongoose.models.Contribution || mongoose.model<IContribution>('Contribution', ContributionSchema);
