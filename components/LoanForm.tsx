import React, { useState } from 'react';
import { ILoan, AccountType, LoanStatus } from '../models/Loan';
import { Account } from '../types/Account';

interface LoanFormProps {
    onSubmit: (loan: Partial<ILoan>) => void;
    sourceAccounts: Account[];
    destinationAccounts: Account[];
}

export const LoanForm: React.FC<LoanFormProps> = ({ onSubmit, sourceAccounts, destinationAccounts }) => {
    const [formData, setFormData] = useState<Partial<ILoan>>({
        sourceAccountId: '',
        destinationAccountId: '',
        principal: 0,
        interestRate: 0,
        status: LoanStatus.ACTIVE,
        startDate: new Date().toISOString().split('T')[0] // Add default date
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const monthlyPayment = (formData.principal * formData.interestRate) / 
            (1 - Math.pow(1 + formData.interestRate, -formData.term));

        const sourceAccount = sourceAccounts.find(a => a._id === formData.sourceAccountId);
        const destAccount = destinationAccounts.find(a => a._id === formData.destinationAccountId);

        if (!sourceAccount || !destAccount) return;

        onSubmit({
            ...formData,
            monthlyPayment,
            sourceAccountType: sourceAccount.accountType,
            destinationAccountType: destAccount.accountType,
            description: `Internal loan from ${sourceAccount.name} to ${destAccount.name}`
        } as Partial<ILoan>);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8 p-8 bg-white rounded-xl shadow-lg max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">From Account</label>
                    <select
                        value={formData.sourceAccountId}
                        onChange={e => setFormData({ ...formData, sourceAccountId: e.target.value })}
                        className="w-full p-3.5 border border-gray-200 rounded-lg shadow-sm 
                        focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                        bg-gray-50 hover:bg-gray-100 transition-all duration-200"
                    >
                        <option value="">Select source account</option>
                        {sourceAccounts.map(account => (
                            <option key={account._id} value={account._id}>
                                {account.name} (${account.balance.toFixed(2)})
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">To Account</label>
                    <select
                        value={formData.destinationAccountId}
                    >
                        <option value="">Select destination account</option>
                        {destinationAccounts.map(account => (
                            <option key={account._id} value={account._id}>
                                {account.name} (${account.balance.toFixed(2)})
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
                    <input
                        type="number"
                        value={formData.principal}
                        onChange={e => setFormData({ ...formData, principal: Number(e.target.value) })}
                        className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Interest Rate (%)</label>
                    <input
                        type="number"
                        step="0.01"
                        value={formData.interestRate}
                        onChange={e => setFormData({ ...formData, interestRate: Number(e.target.value) })}
                        className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Term (months)</label>
                    <input
                        type="number"
                        value={formData.term}
                        onChange={e => setFormData({ ...formData, term: Number(e.target.value) })}
                        className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                    <input
                        type="date"
                        value={formData.startDate}
                        onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                        className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                </div>
            </div>

            <button
                type="submit"
                className="w-full mt-6 px-6 py-3 bg-blue-600 text-white font-medium rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
                Create Loan
            </button>
        </form>
    );
};
