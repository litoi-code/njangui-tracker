import mongoose, { Schema, Document, Model } from 'mongoose';
import { IMember } from './Member';
import { IFund } from './Fund';

export interface ILoan extends Document {
  amount: number;
  interestRate: number;
  startDate: Date;
  dueDate: Date;
  status: 'pending' | 'approved' | 'active' | 'paid' | 'defaulted';
  member: IMember['_id'];
  fund: IFund['_id'];
  principalPaid: number;
  interestPaid: number;
  remainingPrincipal: number;
  remainingInterest: number;
  lastInterestCalculationDate: Date;
  createdAt: Date;
  updatedAt: Date;

  // Methods
  calculateMonthlyInterest(): number;
  calculateTotalDue(): number;
  makePayment(amount: number): Promise<this>;
  updateInterest(): Promise<this>;
}

const LoanSchema: Schema = new Schema(
  {
    amount: {
      type: Number,
      required: [true, 'Please specify the loan amount'],
      min: 0,
    },
    interestRate: {
      type: Number,
      required: [true, 'Please specify the interest rate'],
      min: 0,
      max: 100,
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    dueDate: {
      type: Date,
      required: [true, 'Please specify the due date'],
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'active', 'paid', 'defaulted'],
      default: 'pending',
    },
    member: {
      type: Schema.Types.ObjectId,
      ref: 'Member',
      required: [true, 'Please specify the member taking this loan'],
    },
    fund: {
      type: Schema.Types.ObjectId,
      ref: 'Fund',
      required: [true, 'Please specify the fund for this loan'],
    },
    principalPaid: {
      type: Number,
      default: 0,
    },
    interestPaid: {
      type: Number,
      default: 0,
    },
    remainingPrincipal: {
      type: Number,
      default: function(this: any) {
        return this.amount;
      },
    },
    remainingInterest: {
      type: Number,
      default: 0,
    },
    lastInterestCalculationDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Add methods for calculating interest, tracking repayments, etc.
LoanSchema.methods.calculateMonthlyInterest = function() {
  // Simple interest calculation (monthly)
  return (this.remainingPrincipal * this.interestRate / 100) / 12;
};

LoanSchema.methods.calculateTotalDue = function() {
  return this.remainingPrincipal + this.remainingInterest;
};

// Update interest based on time elapsed since last calculation
LoanSchema.methods.updateInterest = async function() {
  const now = new Date();
  const lastCalc = new Date(this.lastInterestCalculationDate);

  // Calculate months elapsed (approximate)
  const monthsElapsed = (now.getFullYear() - lastCalc.getFullYear()) * 12 +
                        (now.getMonth() - lastCalc.getMonth());

  if (monthsElapsed > 0 && this.status === 'active') {
    // Calculate interest for each month
    for (let i = 0; i < monthsElapsed; i++) {
      const monthlyInterest = this.calculateMonthlyInterest();
      this.remainingInterest += monthlyInterest;
    }

    this.lastInterestCalculationDate = now;
    await this.save();
  }

  return this;
};

LoanSchema.methods.makePayment = async function(amount: number) {
  // First, update any accrued interest
  await this.updateInterest();

  // Apply payment to interest first
  if (amount <= this.remainingInterest) {
    // Payment only covers some or all of the interest
    this.remainingInterest -= amount;
    this.interestPaid += amount;
  } else {
    // Payment covers all interest and some principal
    const remainingAmount = amount - this.remainingInterest;
    this.interestPaid += this.remainingInterest;
    this.remainingInterest = 0;

    // Apply the rest to principal
    this.principalPaid += remainingAmount;
    this.remainingPrincipal -= remainingAmount;

    // Ensure we don't have negative principal
    if (this.remainingPrincipal < 0) {
      this.remainingPrincipal = 0;
    }
  }

  // Update loan status
  if (this.remainingPrincipal === 0 && this.remainingInterest === 0) {
    this.status = 'paid';
  } else if (this.status !== 'active') {
    this.status = 'active';
  }

  // Update the fund's interest earned
  if (this.fund) {
    const Fund = mongoose.model('Fund');
    const fund = await Fund.findById(this.fund);
    if (fund) {
      // Add the interest portion of the payment to the fund's interest earned
      await fund.addInterestEarned(this.interestPaid);
    }
  }

  await this.save();
  return this;
};

// Create or retrieve the model
export default mongoose.models.Loan || mongoose.model<ILoan>('Loan', LoanSchema);
