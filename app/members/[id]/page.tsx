'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

interface Member {
  _id: string;
  name: string;
  phoneNumber: string;
  address?: string;
  joinDate: string;
  status: 'active' | 'inactive' | 'suspended';
  balance: number;
  createdAt: string;
  updatedAt: string;
}

interface Transaction {
  _id: string;
  type: string;
  amount: number;
  date: string;
  description?: string;
  member: string | { _id: string; name: string; phoneNumber: string };
  fund?: string | { _id: string; name: string; type: string };
}

export default function MemberDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [member, setMember] = useState<Member | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchMemberData = async (isRefreshing = false) => {
    try {
      if (isRefreshing) {
        setRefreshing(true);
      }

      // Fetch member details
      const memberResponse = await fetch(`/api/members/${params.id}?t=${new Date().getTime()}`); // Add timestamp to prevent caching
      const memberResult = await memberResponse.json();

      if (!memberResult.success) {
        setError(memberResult.error || 'Failed to fetch member details');
        setLoading(false);
        return;
      }

      setMember(memberResult.data);

      // Fetch member transactions
      const transactionsResponse = await fetch(`/api/transactions?member=${params.id}&t=${new Date().getTime()}`);
      const transactionsResult = await transactionsResponse.json();

      if (transactionsResult.success) {
        setTransactions(transactionsResult.data);
      }
    } catch (err) {
      setError('An error occurred while fetching data');
      console.error(err);
    } finally {
      setLoading(false);
      if (isRefreshing) {
        setRefreshing(false);
      }
    }
  };

  // Refresh function that can be called by a button
  const refreshMemberData = () => {
    fetchMemberData(true);
  };

  useEffect(() => {
    fetchMemberData();
  }, [params.id]);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this member?')) {
      return;
    }

    try {
      const response = await fetch(`/api/members/${params.id}`, {
        method: 'DELETE',
      });
      const result = await response.json();

      if (result.success) {
        router.push('/members');
      } else {
        alert(result.error || 'Failed to delete member');
      }
    } catch (err) {
      alert('An error occurred while deleting the member');
      console.error(err);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading member details...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-500">{error}</div>;
  }

  if (!member) {
    return <div className="text-center py-8">Member not found</div>;
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="py-8">
      <div className="mb-6">
        <Link href="/members" className="text-blue-500 hover:underline">
          &larr; Back to Members
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
        <div className="p-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold mb-2">{member.name}</h1>
              <p className="text-gray-600 mb-4">Member since {formatDate(member.joinDate)}</p>
            </div>
            <div>
              <span className={`px-3 py-1 rounded-full text-sm ${
                member.status === 'active' ? 'bg-green-100 text-green-800' :
                member.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                'bg-red-100 text-red-800'
              }`}>
                {member.status}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div>
              <h2 className="text-lg font-semibold mb-3">Contact Information</h2>
              <div className="space-y-2">
                <p><span className="font-medium">Phone:</span> {member.phoneNumber}</p>
                <p><span className="font-medium">Address:</span> {member.address || 'N/A'}</p>
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold mb-3">Financial Information</h2>
                <button
                  onClick={refreshMemberData}
                  disabled={refreshing}
                  className="text-blue-500 hover:text-blue-700 flex items-center text-sm"
                >
                  {refreshing ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Refreshing...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                      </svg>
                      Refresh Balance
                    </>
                  )}
                </button>
              </div>
              <div className="space-y-2">
                <p>
                  <span className="font-medium">Balance:</span>
                  <span className={member.balance >= 0 ? 'text-green-600 ml-2' : 'text-red-600 ml-2'}>
                    ${member.balance.toFixed(2)}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex justify-between">
          <Link
            href={`/members/${member._id}/edit`}
            className="text-blue-500 hover:text-blue-700"
          >
            Edit Member
          </Link>
          <button
            onClick={handleDelete}
            className="text-red-500 hover:text-red-700"
          >
            Delete Member
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold">Transaction History</h2>
        </div>

        {transactions.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No transactions found for this member.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="py-3 px-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
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
                    <td className="py-3 px-4">{transaction.description || 'N/A'}</td>
                    <td className="py-3 px-4 text-right">
                      <span className={
                        transaction.type === 'deposit' || transaction.type === 'loan' ? 'text-green-600' :
                        transaction.type === 'withdrawal' || transaction.type === 'repayment' ||
                        transaction.type === 'contribution' || transaction.type === 'penalty' ? 'text-red-600' :
                        ''
                      }>
                        {transaction.type === 'deposit' || transaction.type === 'loan' ? '+' :
                         transaction.type === 'withdrawal' || transaction.type === 'repayment' ||
                         transaction.type === 'contribution' || transaction.type === 'penalty' ? '-' :
                         ''}
                        ${transaction.amount.toFixed(2)}
                      </span>
                    </td>
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
