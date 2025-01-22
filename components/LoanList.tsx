import React, { useState } from 'react';
import { ILoan, calculateTotalRepayment } from '../models/Loan';
import { Account } from '../types/Account';
import { calculateMonthlyPayment } from '../models/Loan';

interface LoanListProps {
    loans: ILoan[];
    sourceAccounts: Account[];
    destinationAccounts: Account[];
}

export const LoanList: React.FC<LoanListProps> = ({ loans, sourceAccounts, destinationAccounts }) => {
    const [customTerms, setCustomTerms] = useState<{ [key: string]: number }>({});
    
    const getAccountName = (id: string, accounts: Account[]): string => {
        return accounts.find(acc => acc._id === id)?.name || 'Unknown Account';
    };

    const formatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

    const handleTermChange = (loanId: string, term: number) => {
        setCustomTerms(prev => ({
            ...prev,
            [loanId]: term
        }));
    };

    const calculateCustomRepayment = (loan: ILoan) => {
        const termToUse = customTerms[loan._id] || loan.term;
        const monthlyInterest = loan.principal * (loan.interestRate / 100);
        return loan.principal + (monthlyInterest * termToUse);
    };

    const calculateSourceTotals = () => {
        const totals: { [key: string]: number } = {};
        sourceAccounts.forEach(account => {
            const accountLoans = loans.filter(loan => loan.sourceAccountId === account._id);
            const total = accountLoans.reduce((sum, loan) => sum + loan.currentBalance, 0);
            if (total > 0) {
                totals[account._id] = total;
            }
        });
        return totals;
    };

    const sourceTotals = calculateSourceTotals();

    return (
        <div className="overflow-x-auto shadow-md rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                    <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Source
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Destination
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Principal
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Current Balance
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Interest Rate
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Total to Repay
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Status
                        </th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {loans.map((loan) => (
                        <tr key={loan._id} className="hover:bg-gray-50 transition-colors duration-200">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                                {getAccountName(loan.sourceAccountId, sourceAccounts)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                                {getAccountName(loan.destinationAccountId, destinationAccounts)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(loan.principal)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(loan.currentBalance)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {loan.interestRate.toFixed(2)}%
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="number"
                                        className="w-16 px-2 py-1 border rounded"
                                        value={customTerms[loan._id] || loan.term}
                                        onChange={(e) => handleTermChange(loan._id, parseInt(e.target.value) || 0)}
                                        min="1"
                                    />
                                    <span>{formatter.format(calculateCustomRepayment(loan))}</span>
                                </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-3 py-1 text-xs font-semibold rounded-full 
                                    ${loan.status === 'ACTIVE' ? 'bg-green-100 text-green-800 border border-green-200' : 
                                    loan.status === 'PAID' ? 'bg-blue-100 text-blue-800 border border-blue-200' : 
                                    'bg-red-100 text-red-800 border border-red-200'}`}>
                                    {loan.status}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
                <tfoot className="bg-gray-50">
                    {Object.entries(sourceTotals).map(([accountId, total]) => (
                        <tr key={accountId}>
                            <td colSpan={6} className="px-6 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                                {getAccountName(accountId, sourceAccounts)} Portfolio Value: {formatter.format(total)}
                            </td>
                        </tr>
                    ))}
                    <tr className="border-t border-gray-200">
                        <td colSpan={6} className="px-6 py-3 whitespace-nowrap text-sm font-semibold text-gray-900">
                            Total Portfolio Value: {formatter.format(loans.reduce((sum, loan) => sum + loan.currentBalance, 0))}
                        </td>
                    </tr>
                </tfoot>
            </table>
        </div>
    );
};
