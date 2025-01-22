import mongoose, { Schema } from 'mongoose';
import { Loan, calculateMonthlyPayment, generateRepaymentSchedule, AccountType, LoanStatus } from './Loan'; // Import AccountType and LoanStatus

export interface Account {
    _id: string;
    accountType: string;
    balance: number;
    name: string;
    loan?: Loan;
}

const accountSchema: Schema<Account> = new Schema({
    accountType: { type: String, required: true },
    balance: { type: Number, required: true, default: 0 },
    name: { type: String, required: true },
    loan: { type: Schema.Types.ObjectId, ref: 'Loan' },
});

const AccountModel = mongoose.models.Account || mongoose.model<Account>('Account', accountSchema);

export { AccountModel };
export type { Account as AccountInterface };

export function createLoan(principal: number, annualInterestRate: number, term: number): Loan {
    const monthlyInterestRate = annualInterestRate / 12 / 100;
    const monthlyPayment = calculateMonthlyPayment(principal, monthlyInterestRate, term);
    return {
        principal,
        monthlyInterestRate,
        term,
        monthlyPayment,
        sourceAccountId: '', // added placeholder values
        destinationAccountId: '', // added placeholder values
        sourceAccountType: AccountType.CHECKING, // added placeholder values
        destinationAccountType: AccountType.CHECKING, // added placeholder values
        status: LoanStatus.PENDING, // added placeholder values
        createdAt: new Date(), // added placeholder values
        updatedAt: new Date(), // added placeholder values
    };
}

export function getRepaymentSchedule(account: Account): { month: number, principal: number, interest: number, balance: number }[] | null {
    if (!account.loan) return null;
    return generateRepaymentSchedule(account.loan);
}
