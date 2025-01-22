import mongoose, { Schema, model, Model } from 'mongoose';

export enum AccountType {
    SAVINGS = 'SAVINGS',
    CHECKING = 'CHECKING',
    INVESTMENT = 'INVESTMENT'
}

export enum LoanStatus {
    ACTIVE = 'ACTIVE',
    PAID = 'PAID',
    DEFAULTED = 'DEFAULTED'
}

interface ILoan {
    sourceAccountId: string;
    destinationAccountId: string;
    principal: number;
    currentBalance: number;
    interestRate: number;
    status: LoanStatus;
    lastInterestUpdate: Date;
    createdAt: Date;
    updatedAt: Date;
    startDate: string;
    term: number;  // Duration in months
}

const loanSchema = new Schema<ILoan>({
    sourceAccountId: { type: String, required: true },
    destinationAccountId: { type: String, required: true },
    principal: { type: Number, required: true },
    currentBalance: { type: Number, required: true }, // Including accumulated interest
    interestRate: { type: Number, required: true }, // Annual interest rate
    status: { type: String, enum: Object.values(LoanStatus), default: LoanStatus.ACTIVE },
    lastInterestUpdate: { type: Date, default: Date.now },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    term: { type: Number, required: true }  // Duration in months
});

// Delete the model if it exists to prevent the "Cannot overwrite model once compiled" error
mongoose.models = {};

const LoanModel = model<ILoan>('Loan', loanSchema);

export type { ILoan };
export { LoanModel };
export default LoanModel;

// Remove calculateMonthlyPayment function as it's no longer needed

export function calculateTotalRepayment(loan: ILoan, customTerm?: number): number {
    const termToUse = customTerm || loan.term;
    const monthlyInterest = loan.principal * (loan.interestRate / 100);
    return loan.principal + (monthlyInterest * termToUse);
}

export function generateRepaymentSchedule(loan: ILoan): { month: number, principal: number, interest: number, balance: number }[] {
    const schedule = [];
    const monthlyInterest = loan.principal * (loan.interestRate / 100);
    const totalInterest = monthlyInterest * loan.term;
    const monthlyPrincipal = loan.principal / loan.term;
    let remainingBalance = loan.principal + totalInterest;

    for (let month = 1; month <= loan.term; month++) {
        remainingBalance -= (monthlyPrincipal + monthlyInterest);
        schedule.push({
            month,
            principal: monthlyPrincipal,
            interest: monthlyInterest,
            balance: Math.max(0, remainingBalance)
        });
    }
    return schedule;
}
