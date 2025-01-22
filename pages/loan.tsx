`use client`
import React, { useState, useEffect } from 'react';
import { LoanForm } from '../components/LoanForm';
import { LoanList } from '../components/LoanList';
import { Loan, AccountType, LoanStatus, ILoan } from '../models/Loan';
import Layout from '../components/Layout';

interface Account {
    _id: string;
    accountType: AccountType;
    type: AccountType; // Added type property
    balance: number;
    name: string;
}

export default function InternalLendingPage() {
    const [loans, setLoans] = useState<ILoan[]>([]);
    const [loadingLoans, setLoadingLoans] = useState(true);
    const [loansError, setLoansError] = useState<string | null>(null);
    const [sourceAccounts, setSourceAccounts] = useState<Account[]>([]);
    const [destinationAccounts, setDestinationAccounts] = useState<Account[]>([]);
    const [loadingAccounts, setLoadingAccounts] = useState(true);
    const [accountsError, setAccountsError] = useState<string | null>(null);

    const fetchAccounts = async () => {
        setLoadingAccounts(true);
        setAccountsError(null);
        
        try {
            const res = await fetch('/api/accounts');
            const contentType = res.headers.get('content-type');
            
            if (!contentType?.includes('application/json')) {
                throw new Error('Server returned non-JSON response. Please check your API endpoint.');
            }

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || `Server responded with status: ${res.status}`);
            }

            if (!Array.isArray(data)) {
                throw new Error('Invalid data format received from server');
            }

            const sourceAccounts = data.filter((account: Account) =>
                account.accountType.toLowerCase() === AccountType.SAVINGS.toString().toLowerCase() ||
                account.accountType.toLowerCase() === AccountType.INVESTMENT.toString().toLowerCase()
            );
            const destinationAccounts = data.filter((account: Account) =>
                account.accountType.toLowerCase() === AccountType.CHECKING.toString().toLowerCase()
            );

            setSourceAccounts(sourceAccounts);
            setDestinationAccounts(destinationAccounts);

        } catch (error: any) {
            const errorMessage = error.message || 'Failed to fetch accounts';
            console.error("Failed to fetch accounts:", errorMessage);
            if (error instanceof SyntaxError) {
                setAccountsError('Server returned invalid data. Please check your API endpoint.');
            } else {
                setAccountsError(errorMessage);
            }
            setSourceAccounts([]);
            setDestinationAccounts([]);
        } finally {
            setLoadingAccounts(false);
        }
    };

    const fetchLoans = async () => {
        setLoadingLoans(true);
        setLoansError(null);
        
        try {
            const res = await fetch('/api/loans');
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || `Server responded with status: ${res.status}`);
            }

            if (!Array.isArray(data)) {
                throw new Error('Invalid loan data format received from server');
            }

            setLoans(data);
        } catch (error: any) {
            const errorMessage = error.message || 'Failed to fetch loans';
            console.error('Error fetching loans:', errorMessage);
            setLoansError(errorMessage);
            setLoans([]);
        } finally {
            setLoadingLoans(false);
        }
    };

    const updateLoansInterest = async () => {
        try {
            const res = await fetch('/api/loans/update-interest', {
                method: 'POST'
            });
            if (!res.ok) throw new Error('Failed to update interest');
            await fetchLoans(); // Refresh loans after interest update
        } catch (error) {
            console.error('Error updating interest:', error);
        }
    };

    useEffect(() => {
        fetchLoans();
        fetchAccounts();
        
        // Set up monthly interest calculation
        const interestInterval = setInterval(updateLoansInterest, 86400000); // Check daily
        return () => clearInterval(interestInterval);
    }, []);

    const handleCreateLoan = async (newLoan: Partial<ILoan>) => {
        try {
            const res = await fetch('/api/loans', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...newLoan,
                    currentBalance: newLoan.principal,
                    status: LoanStatus.ACTIVE,
                    lastInterestUpdate: new Date(),
                }),
            });
            
            const data = await res.json();
            
            if (!res.ok) {
                throw new Error(data.message || 'Failed to create loan');
            }
            
            await fetchLoans();
            await fetchAccounts();
        } catch (error: any) {
            console.error('Error creating loan:', error);
            alert(error.message || 'Failed to create loan. Please try again.');
        }
    };

    if (loadingAccounts || loadingLoans) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
            </div>
        );
    }

    if (accountsError) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-100">
                <div className="bg-white p-6 rounded-lg shadow-lg">
                    <p className="text-red-600">Error loading accounts: {accountsError}</p>
                </div>
            </div>
        );
    }

    if (loansError) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-100">
                <div className="bg-white p-6 rounded-lg shadow-lg">
                    <p className="text-red-600">Error loading loans: {loansError}</p>
                </div>
            </div>
        );
    }

    return (
        <Layout>
            <div className="min-h-screen py-10 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
                <div className="container mx-auto px-4 md:px-0 max-w-4xl transition-all duration-300 ease-in-out">
                    <h1 className="text-5xl font-extrabold text-center mb-12 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        Internal Account Lending
                    </h1>

                    <div className="bg-white p-8 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] mb-10 hover:shadow-[0_8px_30px_rgb(0,0,0,0.16)] transition-shadow duration-300">
                        <h2 className="text-3xl font-bold text-gray-800 mb-6 border-b pb-4">
                            Create New Internal Loan
                        </h2>
                        <LoanForm
                            onSubmit={handleCreateLoan}
                            sourceAccounts={sourceAccounts}
                            destinationAccounts={destinationAccounts}
                        />
                    </div>

                    <div className="bg-white p-8 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.16)] transition-shadow duration-300">
                        <h2 className="text-3xl font-bold text-gray-800 mb-6 border-b pb-4">
                            Active Loans
                        </h2>
                        <LoanList 
                            loans={loans} 
                            sourceAccounts={sourceAccounts} 
                            destinationAccounts={destinationAccounts} 
                        />
                    </div>
                </div>
            </div>
        </Layout>
    );
}
