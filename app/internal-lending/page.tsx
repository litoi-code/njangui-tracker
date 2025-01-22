`use client`
import React, { useState, useEffect } from 'react';
import { LoanForm } from '../../components/LoanForm';
import { LoanList } from '../../components/LoanList';
import { Loan, AccountType, LoanStatus } from '../../models/Loan';

interface Account {
    _id: string;
    accountType: AccountType;
    balance: number;
    name: string;
}

export default function InternalLendingPage() {
    const [loans, setLoans] = useState<Loan[]>([]);
    const [sourceAccounts, setSourceAccounts] = useState<Account[]>([]);
    const [destinationAccounts, setDestinationAccounts] = useState<Account[]>([]);
    const [accounts] = useState<Account[]>([
        { _id: '1', accountType: AccountType.SAVINGS, balance: 1000, name: 'Main Savings' },
        { _id: '2', accountType: AccountType.CHECKING, balance: 500, name: 'Main Checking' },
        { _id: '3', accountType: AccountType.INVESTMENT, balance: 2000, name: 'Investment Account' }
    ]);

    useEffect(() => {
        // Filter accounts based on account type
        const sourceAccounts = accounts.filter((account: Account) =>
            account.accountType === AccountType.SAVINGS || account.accountType === AccountType.INVESTMENT
        );
        const destinationAccounts = accounts.filter((account: Account) =>
            account.accountType === AccountType.CHECKING
        );

        setSourceAccounts(sourceAccounts);
        setDestinationAccounts(destinationAccounts);
    }, [accounts]);

    const handleCreateLoan = (newLoan: Loan) => {
        // Update source account balance
        setSourceAccounts(currentSourceAccounts =>
            currentSourceAccounts.map(account =>
                account._id === newLoan.sourceAccountId
                    ? { ...account, balance: account.balance - newLoan.principal }
                    : account
            )
        );

        // Update destination account balance
        setDestinationAccounts(currentDestinationAccounts =>
            currentDestinationAccounts.map(account =>
                account._id === newLoan.destinationAccountId
                    ? { ...account, balance: account.balance + newLoan.principal }
                    : account
            )
        );

        // Add new loan
        setLoans([...loans, {
            ...newLoan,
            id: Date.now().toString(),
            status: LoanStatus.ACTIVE,
            createdAt: new Date(),
            updatedAt: new Date()
        }]);
    };

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-6">Internal Account Lending</h1>
            
            <div className="grid grid-cols-3 gap-4 mb-6">
                {accounts.map(account => (
                    <div key={account._id} className="p-4 border rounded shadow">
                        <h3 className="font-bold">{account.name}</h3>
                        <p className="text-lg">${account.balance.toFixed(2)}</p>
                        <p className="text-sm text-gray-600">{account.accountType}</p>
                    </div>
                ))}
            </div>

            <div className="mb-8">
                <h2 className="text-xl font-bold mb-4">Create New Internal Loan</h2>
                <LoanForm
                    onSubmit={handleCreateLoan}
                    sourceAccounts={sourceAccounts}
                    destinationAccounts={destinationAccounts}
                />
            </div>

            <div>
                <h2 className="text-xl font-bold mb-4">Active Loans</h2>
                <LoanList
                    loans={loans}
                    sourceAccounts={sourceAccounts}
                    destinationAccounts={destinationAccounts}
                />
            </div>
        </div>
    );
}
