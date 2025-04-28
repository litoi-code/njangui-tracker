import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IFund extends Document {
  name: string;
  description?: string;
  type: 'savings' | 'investment' | 'emergency';
  interestRate: number;
  totalAmount: number;
  interestEarned: number;
  lastInterestDistributionDate: Date;
  createdAt: Date;
  updatedAt: Date;

  // Methods
  updateTotalAmount(amount: number): Promise<number>;
  calculateInterest(): number;
  addInterestEarned(amount: number): Promise<number>;
  distributeInterest(): Promise<this>;
}

const FundSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a fund name'],
      trim: true,
      unique: true,
    },
    description: {
      type: String,
      trim: true,
    },
    type: {
      type: String,
      enum: ['savings', 'investment', 'emergency'],
      required: [true, 'Please specify the fund type'],
    },
    interestRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    totalAmount: {
      type: Number,
      default: 0,
    },
    interestEarned: {
      type: Number,
      default: 0,
    },
    lastInterestDistributionDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Add methods for calculating interest, distributing funds, etc.
FundSchema.methods.updateTotalAmount = async function(amount: number) {
  this.totalAmount += amount;
  await this.save();
  return this.totalAmount;
};

FundSchema.methods.calculateInterest = function() {
  // Simple interest calculation
  return this.totalAmount * (this.interestRate / 100);
};

FundSchema.methods.addInterestEarned = async function(amount: number) {
  this.interestEarned += amount;
  await this.save();
  return this.interestEarned;
};

// Distribute interest to members based on their contributions
FundSchema.methods.distributeInterest = async function() {
  if (this.interestEarned <= 0) {
    return this;
  }

  const Contribution = mongoose.model('Contribution');
  const Member = mongoose.model('Member');
  const Transaction = mongoose.model('Transaction');

  // Get all contributions to this fund
  const contributions = await Contribution.find({ fund: this._id });

  if (contributions.length === 0) {
    return this;
  }

  // Calculate total contribution amount
  const totalContributions = contributions.reduce((sum, contribution) => sum + contribution.amount, 0);

  if (totalContributions <= 0) {
    return this;
  }

  // Create a map to track interest distribution by member
  const memberInterestMap = new Map();

  // Calculate each member's share based on their contribution percentage
  for (const contribution of contributions) {
    const contributionPercentage = contribution.amount / totalContributions;
    const interestShare = this.interestEarned * contributionPercentage;

    // Add to member's share
    const memberId = contribution.member.toString();
    const currentShare = memberInterestMap.get(memberId) || 0;
    memberInterestMap.set(memberId, currentShare + interestShare);
  }

  // Distribute interest to each member
  for (const [memberId, interestAmount] of memberInterestMap.entries()) {
    const member = await Member.findById(memberId);
    if (member) {
      // Update member balance
      await member.updateBalance(interestAmount);

      // Create a transaction record
      await Transaction.create({
        type: 'deposit',
        amount: interestAmount,
        date: new Date(),
        description: `Interest distribution from ${this.name} fund`,
        member: memberId,
        fund: this._id
      });
    }
  }

  // Reset interest earned and update distribution date
  this.interestEarned = 0;
  this.lastInterestDistributionDate = new Date();
  await this.save();

  return this;
};

// Create or retrieve the model
export default mongoose.models.Fund || mongoose.model<IFund>('Fund', FundSchema);
