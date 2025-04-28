'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

interface Loan {
  _id: string;
  amount: number;
  interestRate: number;
  startDate: string;
  dueDate: string;
  status: 'pending' | 'approved' | 'active' | 'paid' | 'defaulted';
  member: {
    _id: string;
    name: string;
    phoneNumber: string;
  };
  fund: {
    _id: string;
    name: string;
    type: string;
  };
  principalPaid: number;
  interestPaid: number;
  remainingPrincipal: number;
  remainingInterest: number;
  lastInterestCalculationDate: string;
  createdAt: string;
  updatedAt: string;
}

interface Transaction {
  _id: string;
  type: string;
  amount: number;
  date: string;
  description?: string;
  member: {
    _id: string;
    name: string;
  };
}

export default function LoanDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [loan, setLoan] = useState<Loan | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [repaymentAmount, setRepaymentAmount] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);
  const [repaymentError, setRepaymentError] = useState('');

  useEffect(() => {
    const fetchLoanData = async () => {
      try {
        // Fetch loan details
        const loanResponse = await fetch(`/api/loans/${params.id}`);
        const loanResult = await loanResponse.json();

        if (!loanResult.success) {
          setError(loanResult.error || 'Failed to fetch loan details');
          setLoading(false);
          return;
        }

        setLoan(loanResult.data);

        // Set default repayment amount to total remaining (principal + interest)
        const totalRemaining = loanResult.data.remainingPrincipal + loanResult.data.remainingInterest;
        setRepaymentAmount(totalRemaining);

        // Fetch loan-related transactions
        const transactionsResponse = await fetch(`/api/transactions?member=${loanResult.data.member._id}&type=repayment`);
        const transactionsResult = await transactionsResponse.json();

        if (transactionsResult.success) {
          // Filter transactions related to this loan
          const loanTransactions = transactionsResult.data.filter(
            (t: Transaction) => t.description && t.description.includes(params.id as string)
          );
          setTransactions(loanTransactions);
        }
      } catch (err) {
        setError('An error occurred while fetching data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchLoanData();
  }, [params.id]);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this loan?')) {
      return;
    }

    try {
      const response = await fetch(`/api/loans/${params.id}`, {
        method: 'DELETE',
      });
      const result = await response.json();

      if (result.success) {
        router.push('/loans');
      } else {
        alert(result.error || 'Failed to delete loan');
      }
    } catch (err) {
      alert('An error occurred while deleting the loan');
      console.error(err);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!confirm(`Are you sure you want to change the loan status to ${newStatus}?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/loans/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });
      const result = await response.json();

      if (result.success) {
        setLoan(result.data);
      } else {
        alert(result.error || 'Failed to update loan status');
      }
    } catch (err) {
      alert('An error occurred while updating the loan status');
      console.error(err);
    }
  };

  const handleRepayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setRepaymentError('');

    if (repaymentAmount <= 0) {
      setRepaymentError('Repayment amount must be greater than zero');
      setSubmitting(false);
      return;
    }

    try {
      const response = await fetch(`/api/loans/${params.id}/repay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount: repaymentAmount }),
      });
      const result = await response.json();

      if (result.success) {
        setLoan(result.data);

        // Refresh transactions
        const transactionsResponse = await fetch(`/api/transactions?member=${result.data.member._id}&type=repayment`);
        const transactionsResult = await transactionsResponse.json();

        if (transactionsResult.success) {
          // Filter transactions related to this loan
          const loanTransactions = transactionsResult.data.filter(
            (t: Transaction) => t.description && t.description.includes(params.id as string)
          );
          setTransactions(loanTransactions);
        }

        // Reset repayment amount to total remaining
        const totalRemaining = result.data.remainingPrincipal + result.data.remainingInterest;
        setRepaymentAmount(totalRemaining);
      } else {
        setRepaymentError(result.error || 'Failed to process repayment');
      }
    } catch (err) {
      setRepaymentError('An error occurred while processing the repayment');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading loan details...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-500">{error}</div>;
  }

  if (!loan) {
    return <div className="text-center py-8">Loan not found</div>;
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-blue-100 text-blue-800';
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'paid':
        return 'bg-purple-100 text-purple-800';
      case 'defaulted':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Calculate total due (remaining principal + interest)
  const totalDue = loan.remainingPrincipal + loan.remainingInterest;

  // Calculate total paid (principal + interest)
  const totalPaid = loan.principalPaid + loan.interestPaid;

  // Calculate total loan amount with interest
  const totalLoanAmount = loan.amount * (1 + loan.interestRate / 100);

  // Calculate payment progress percentage
  const paymentProgress = totalLoanAmount > 0
    ? Math.min(100, Math.round((totalPaid / totalLoanAmount) * 100))
    : 100;

  return (
    <div className="py-8">
      <div className="mb-6">
        <Link href="/loans" className="text-blue-500 hover:underline">
          &larr; Back to Loans
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
        <div className="p-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold mb-2">Loan Details</h1>
              <p className="text-gray-600 mb-4">Created on {formatDate(loan.createdAt)}</p>
            </div>
            <div>
              <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(loan.status)}`}>
                {loan.status}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div>
              <h2 className="text-lg font-semibold mb-3">Loan Information</h2>
              <div className="space-y-2">
                <p><span className="font-medium">Member:</span>
                  <Link href={`/members/${loan.member._id}`} className="text-blue-500 hover:underline ml-2">
                    {loan.member.name}
                  </Link>
                </p>
                <p><span className="font-medium">Phone Number:</span> {loan.member.phoneNumber}</p>
                <p><span className="font-medium">Fund:</span>
                  <Link href={`/funds/${loan.fund._id}`} className="text-blue-500 hover:underline ml-2">
                    {loan.fund.name}
                  </Link>
                  <span className="ml-2 px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
                    Investment Fund
                  </span>
                </p>
                <p><span className="font-medium">Principal Amount:</span> ${loan.amount.toFixed(2)}</p>
                <p><span className="font-medium">Interest Rate:</span> {loan.interestRate}%</p>
                <p><span className="font-medium">Total Loan Amount:</span> ${totalLoanAmount.toFixed(2)}</p>
              </div>
            </div>
            <div>
              <h2 className="text-lg font-semibold mb-3">Payment Information</h2>
              <div className="space-y-2">
                <p><span className="font-medium">Start Date:</span> {formatDate(loan.startDate)}</p>
                <p><span className="font-medium">Due Date:</span> {formatDate(loan.dueDate)}</p>
                <p><span className="font-medium">Last Interest Calculation:</span> {formatDate(loan.lastInterestCalculationDate)}</p>
                <p><span className="font-medium">Principal Paid:</span> ${loan.principalPaid.toFixed(2)}</p>
                <p><span className="font-medium">Interest Paid:</span> ${loan.interestPaid.toFixed(2)}</p>
                <p><span className="font-medium">Total Paid:</span> ${totalPaid.toFixed(2)}</p>
                <p><span className="font-medium">Remaining Principal:</span> ${loan.remainingPrincipal.toFixed(2)}</p>
                <p><span className="font-medium">Remaining Interest:</span> ${loan.remainingInterest.toFixed(2)}</p>
                <p><span className="font-medium">Total Remaining:</span>
                  <span className={totalDue > 0 ? 'text-red-600 ml-2' : 'text-green-600 ml-2'}>
                    ${totalDue.toFixed(2)}
                  </span>
                </p>
                <p><span className="font-medium">Payment Progress:</span>
                  <span className="ml-2">
                    {paymentProgress}%
                  </span>
                </p>
              </div>
            </div>
          </div>

          {loan.status !== 'paid' && (
            <div className="mt-8 border-t border-gray-200 pt-6">
              <h2 className="text-lg font-semibold mb-4">Make a Repayment</h2>

              {repaymentError && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                  {repaymentError}
                </div>
              )}

              <form onSubmit={handleRepayment} className="flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-grow">
                  <label htmlFor="repaymentAmount" className="block text-sm font-medium text-gray-700 mb-1">
                    Repayment Amount
                  </label>
                  <input
                    type="number"
                    id="repaymentAmount"
                    value={repaymentAmount}
                    onChange={(e) => setRepaymentAmount(parseFloat(e.target.value) || 0)}
                    min="0.01"
                    step="0.01"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded disabled:bg-green-300"
                >
                  {submitting ? 'Processing...' : 'Make Payment'}
                </button>
              </form>
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex flex-wrap gap-2">
          {loan.status === 'pending' && (
            <>
              <button
                onClick={() => handleStatusChange('approved')}
                className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
              >
                Approve Loan
              </button>
              <button
                onClick={handleDelete}
                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
              >
                Delete Loan
              </button>
            </>
          )}

          {loan.status === 'approved' && (
            <button
              onClick={() => handleStatusChange('active')}
              className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
            >
              Mark as Active
            </button>
          )}

          {(loan.status === 'active' || loan.status === 'approved') && (
            <button
              onClick={() => handleStatusChange('defaulted')}
              className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
            >
              Mark as Defaulted
            </button>
          )}

          {loan.status === 'defaulted' && (
            <button
              onClick={() => handleStatusChange('active')}
              className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
            >
              Reactivate Loan
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold">Repayment History</h2>
        </div>

        {transactions.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No repayments found for this loan.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="py-3 px-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {transactions.map((transaction) => (
                  <tr key={transaction._id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 whitespace-nowrap">{formatDate(transaction.date)}</td>
                    <td className="py-3 px-4">{transaction.description || 'Loan repayment'}</td>
                    <td className="py-3 px-4 text-right">${transaction.amount.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
