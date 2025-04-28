'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

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
  amountPaid: number;
  remainingAmount: number;
}

interface Member {
  _id: string;
  name: string;
  phoneNumber: string;
}

export default function LoansPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filter states
  const [selectedMember, setSelectedMember] = useState(searchParams.get('member') || '');
  const [selectedStatus, setSelectedStatus] = useState(searchParams.get('status') || '');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Build query string for loans
        let queryParams = new URLSearchParams();
        if (selectedMember) queryParams.append('member', selectedMember);
        if (selectedStatus) queryParams.append('status', selectedStatus);

        // Fetch loans
        const loansResponse = await fetch(`/api/loans?${queryParams.toString()}`);
        const loansResult = await loansResponse.json();

        if (!loansResult.success) {
          setError(loansResult.error || 'Failed to fetch loans');
          setLoading(false);
          return;
        }

        setLoans(loansResult.data);

        // Fetch members for filter
        const membersResponse = await fetch('/api/members');
        const membersResult = await membersResponse.json();

        if (membersResult.success) {
          setMembers(membersResult.data);
        }
      } catch (err) {
        setError('An error occurred while fetching data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedMember, selectedStatus]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this loan?')) {
      return;
    }

    try {
      const response = await fetch(`/api/loans/${id}`, {
        method: 'DELETE',
      });
      const result = await response.json();

      if (result.success) {
        setLoans(loans.filter(loan => loan._id !== id));
      } else {
        alert(result.error || 'Failed to delete loan');
      }
    } catch (err) {
      alert('An error occurred while deleting the loan');
      console.error(err);
    }
  };

  const applyFilters = () => {
    // Update URL with filters
    const params = new URLSearchParams();
    if (selectedMember) params.append('member', selectedMember);
    if (selectedStatus) params.append('status', selectedStatus);

    router.push(`/loans?${params.toString()}`);
  };

  const clearFilters = () => {
    setSelectedMember('');
    setSelectedStatus('');
    router.push('/loans');
  };

  if (loading) {
    return <div className="text-center py-8">Loading loans...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-500">{error}</div>;
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

  return (
    <div className="py-8">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-2xl font-bold">Loans</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage loans from investment funds to members
          </p>
        </div>
        <Link
          href="/loans/new"
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
        >
          New Loan
        </Link>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
        <div className="flex items-start">
          <div className="flex-shrink-0 mt-0.5">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 dark:text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300">Investment Funds Only</h3>
            <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
              Only investment funds can be used to issue loans to members. Make sure you have created investment funds before attempting to create a new loan.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <h2 className="text-lg font-semibold mb-4">Filter Loans</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <label htmlFor="statusFilter" className="block text-sm font-medium text-gray-700 mb-1">
              Loan Status
            </label>
            <select
              id="statusFilter"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="active">Active</option>
              <option value="paid">Paid</option>
              <option value="defaulted">Defaulted</option>
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

      {loans.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No loans found. Create your first loan to get started.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Member</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Interest Rate</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Date</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="py-3 px-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Remaining</th>
                  <th className="py-3 px-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loans.map((loan) => (
                  <tr key={loan._id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 whitespace-nowrap">
                      <Link href={`/members/${loan.member._id}`} className="text-blue-500 hover:underline">
                        {loan.member.name}
                      </Link>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">${loan.amount.toFixed(2)}</td>
                    <td className="py-3 px-4 whitespace-nowrap">{loan.interestRate}%</td>
                    <td className="py-3 px-4 whitespace-nowrap">{formatDate(loan.startDate)}</td>
                    <td className="py-3 px-4 whitespace-nowrap">{formatDate(loan.dueDate)}</td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded text-xs ${getStatusColor(loan.status)}`}>
                        {loan.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      ${loan.remainingAmount.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <div className="flex justify-center space-x-2">
                        <Link
                          href={`/loans/${loan._id}`}
                          className="text-blue-500 hover:text-blue-700"
                        >
                          View
                        </Link>
                        {loan.status === 'pending' && (
                          <button
                            onClick={() => handleDelete(loan._id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            Delete
                          </button>
                        )}
                      </div>
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
