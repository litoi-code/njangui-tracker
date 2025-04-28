'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

interface Transaction {
  _id: string;
  type: 'deposit' | 'withdrawal' | 'transfer' | 'loan' | 'repayment' | 'contribution' | 'penalty';
  amount: number;
  date: string;
  description?: string;
  member: {
    _id: string;
    name: string;
    phoneNumber: string;
  };
  recipient?: {
    _id: string;
    name: string;
    phoneNumber: string;
  };
  fund?: {
    _id: string;
    name: string;
    type: string;
  };
  relatedTransaction?: string;
}

interface Member {
  _id: string;
  name: string;
  phoneNumber: string;
}

interface Fund {
  _id: string;
  name: string;
  type: string;
}

export default function TransactionsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [funds, setFunds] = useState<Fund[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filter states
  const [selectedMember, setSelectedMember] = useState(searchParams.get('member') || '');
  const [selectedFund, setSelectedFund] = useState(searchParams.get('fund') || '');
  const [selectedType, setSelectedType] = useState(searchParams.get('type') || '');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Build query string for transactions
        let queryParams = new URLSearchParams();
        if (selectedMember) queryParams.append('member', selectedMember);
        if (selectedFund) queryParams.append('fund', selectedFund);
        if (selectedType) queryParams.append('type', selectedType);

        // Fetch transactions
        const transactionsResponse = await fetch(`/api/transactions?${queryParams.toString()}`);
        const transactionsResult = await transactionsResponse.json();

        if (!transactionsResult.success) {
          setError(transactionsResult.error || 'Failed to fetch transactions');
          setLoading(false);
          return;
        }

        setTransactions(transactionsResult.data);

        // Fetch members for filter
        const membersResponse = await fetch('/api/members');
        const membersResult = await membersResponse.json();

        if (membersResult.success) {
          setMembers(membersResult.data);
        }

        // Fetch funds for filter
        const fundsResponse = await fetch('/api/funds');
        const fundsResult = await fundsResponse.json();

        if (fundsResult.success) {
          setFunds(fundsResult.data);
        }
      } catch (err) {
        setError('An error occurred while fetching data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedMember, selectedFund, selectedType]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this transaction?')) {
      return;
    }

    try {
      const response = await fetch(`/api/transactions/${id}`, {
        method: 'DELETE',
      });
      const result = await response.json();

      if (result.success) {
        setTransactions(transactions.filter(transaction => transaction._id !== id));
      } else {
        alert(result.error || 'Failed to delete transaction');
      }
    } catch (err) {
      alert('An error occurred while deleting the transaction');
      console.error(err);
    }
  };

  const applyFilters = () => {
    // Update URL with filters
    const params = new URLSearchParams();
    if (selectedMember) params.append('member', selectedMember);
    if (selectedFund) params.append('fund', selectedFund);
    if (selectedType) params.append('type', selectedType);

    router.push(`/transactions?${params.toString()}`);
  };

  const clearFilters = () => {
    setSelectedMember('');
    setSelectedFund('');
    setSelectedType('');
    router.push('/transactions');
  };

  if (loading) {
    return <div className="text-center py-8">Loading transactions...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-500">{error}</div>;
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Transactions</h1>
        <Link
          href="/transactions/new"
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
        >
          New Transaction
        </Link>
      </div>

      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <h2 className="text-lg font-semibold mb-4">Filter Transactions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="memberFilter" className="block text-sm font-medium text-gray-700 mb-1">
              Member
            </label>
            <select
              id="memberFilter"
              value={selectedMember}
              onChange={(e) => setSelectedMember(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Members</option>
              {members.map((member) => (
                <option key={member._id} value={member._id}>
                  {member.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="fundFilter" className="block text-sm font-medium text-gray-700 mb-1">
              Fund
            </label>
            <select
              id="fundFilter"
              value={selectedFund}
              onChange={(e) => setSelectedFund(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Funds</option>
              {funds.map((fund) => (
                <option key={fund._id} value={fund._id}>
                  {fund.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="typeFilter" className="block text-sm font-medium text-gray-700 mb-1">
              Transaction Type
            </label>
            <select
              id="typeFilter"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              <option value="deposit">Deposit</option>
              <option value="withdrawal">Withdrawal</option>
              <option value="transfer">Transfer</option>
              <option value="loan">Loan</option>
              <option value="repayment">Repayment</option>
              <option value="contribution">Contribution</option>
              <option value="penalty">Penalty</option>
            </select>
          </div>
        </div>

        <div className="mt-4 flex justify-end space-x-2">
          <button
            onClick={clearFilters}
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded"
          >
            Clear Filters
          </button>
          <button
            onClick={applyFilters}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          >
            Apply Filters
          </button>
        </div>
      </div>

      {transactions.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No transactions found. Create your first transaction to get started.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Member</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fund</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="py-3 px-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="py-3 px-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {transactions.map((transaction) => (
                  <tr key={transaction._id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 whitespace-nowrap">{formatDate(transaction.date)}</td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded text-xs ${
                        transaction.type === 'deposit' ? 'bg-green-100 text-green-800' :
                        transaction.type === 'withdrawal' ? 'bg-red-100 text-red-800' :
                        transaction.type === 'transfer' ? 'bg-blue-100 text-blue-800' :
                        transaction.type === 'loan' ? 'bg-purple-100 text-purple-800' :
                        transaction.type === 'repayment' ? 'bg-indigo-100 text-indigo-800' :
                        transaction.type === 'contribution' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {transaction.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <Link href={`/members/${transaction.member._id}`} className="text-blue-500 hover:underline">
                        {transaction.member.name}
                      </Link>
                      {transaction.type === 'transfer' && transaction.recipient && (
                        <div className="text-xs text-gray-500 mt-1">
                          To: <Link href={`/members/${transaction.recipient._id}`} className="text-blue-500 hover:underline">
                            {transaction.recipient.name}
                          </Link>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {transaction.fund ? (
                        <Link href={`/funds/${transaction.fund._id}`} className="text-blue-500 hover:underline">
                          {transaction.fund.name}
                        </Link>
                      ) : (
                        <span className="text-gray-500">N/A</span>
                      )}
                    </td>
                    <td className="py-3 px-4">{transaction.description || 'N/A'}</td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <span className={
                        transaction.type === 'deposit' || transaction.type === 'loan' ? 'text-green-600' :
                        transaction.type === 'withdrawal' || transaction.type === 'repayment' ||
                        transaction.type === 'contribution' || transaction.type === 'penalty' ? 'text-red-600' :
                        transaction.type === 'transfer' ? 'text-blue-600' :
                        ''
                      }>
                        ${transaction.amount.toFixed(2)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleDelete(transaction._id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
