export interface Loan {
    principal: number;
    interestRate: number;
    term: number; // in months
    monthlyPayment: number;
}

export function calculateMonthlyPayment(principal: number, interestRate: number, term: number): number {
    const monthlyInterestRate = interestRate / 12 / 100;
    return (principal * monthlyInterestRate) / (1 - Math.pow(1 + monthlyInterestRate, -term));
}

export function generateRepaymentSchedule(loan: Loan): { month: number, principal: number, interest: number, balance: number }[] {
    const schedule = [];
    let balance = loan.principal;
    for (let month = 1; month <= loan.term; month++) {
        const interest = balance * loan.interestRate / 12 / 100;
        const principalPayment = loan.monthlyPayment - interest;
        balance -= principalPayment;
        schedule.push({ month, principal: principalPayment, interest, balance });
    }
    return schedule;
}
