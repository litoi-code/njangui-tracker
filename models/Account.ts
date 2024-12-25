import { Loan, calculateMonthlyPayment, generateRepaymentSchedule } from './Loan';

export interface Account {
    // ...existing code...
    loan?: Loan;
}

// ...existing code...

export function createLoan(principal: number, interestRate: number, term: number): Loan {
    const monthlyPayment = calculateMonthlyPayment(principal, interestRate, term);
    return { principal, interestRate, term, monthlyPayment };
}

export function getRepaymentSchedule(account: Account): { month: number, principal: number, interest: number, balance: number }[] | null {
    if (!account.loan) return null;
    return generateRepaymentSchedule(account.loan);
}
