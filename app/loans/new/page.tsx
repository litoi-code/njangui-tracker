'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface Member {
  _id: string;
  name: string;
  phoneNumber: string;
}

interface Fund {
  _id: string;
  name: string;
  type: string;
  totalAmount: number;
}

export default function NewLoanPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [members, setMembers] = useState<Member[]>([]);
  const [funds, setFunds] = useState<Fund[]>([]);
  // Calculate default dates safely
  const today = new Date();
  const nextYear = new Date(today);
  nextYear.setFullYear(today.getFullYear() + 1);

  const [formData, setFormData] = useState({
    amount: 0,
    interestRate: 5,
    startDate: today.toISOString().split('T')[0],
    // Set default due date to 1 year from start date (will be sent to API but not shown in form)
    dueDate: nextYear.toISOString().split('T')[0],
    status: 'pending',
    member: searchParams.get('member') || '',
    fund: searchParams.get('fund') || ''
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [selectedFundBalance, setSelectedFundBalance] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch members
        const membersResponse = await fetch('/api/members');
        const membersResult = await membersResponse.json();

        if (membersResult.success) {
          setMembers(membersResult.data);

          // Set default member if none is selected and members exist
          if (!formData.member && membersResult.data.length > 0) {
            setFormData(prev => ({
              ...prev,
              member: membersResult.data[0]._id
            }));
          }
        } else {
          setError(membersResult.error || 'Failed to fetch members');
          setLoading(false);
          return;
        }

        // Fetch funds
        const fundsResponse = await fetch('/api/funds');
        const fundsResult = await fundsResponse.json();

        if (fundsResult.success) {
          setFunds(fundsResult.data);

          // Filter investment funds
          const investmentFunds = fundsResult.data.filter(fund => fund.type === 'investment');

          if (investmentFunds.length === 0) {
            setError('No investment funds available. Please create an investment fund first.');
          } else {
            // Set default fund if none is selected and investment funds exist
            if (!formData.fund) {
              const defaultFund = investmentFunds[0];
              setFormData(prev => ({
                ...prev,
                fund: defaultFund._id
              }));
              setSelectedFundBalance(defaultFund.totalAmount);
            } else {
              // Set selected fund balance if fund is already selected
              const selectedFund = fundsResult.data.find(fund => fund._id === formData.fund);
              if (selectedFund) {
                // Verify the selected fund is an investment fund
                if (selectedFund.type === 'investment') {
                  setSelectedFundBalance(selectedFund.totalAmount);
                } else {
                  // If the selected fund is not an investment fund, select the first investment fund
                  const defaultFund = investmentFunds[0];
                  setFormData(prev => ({
                    ...prev,
                    fund: defaultFund._id
                  }));
                  setSelectedFundBalance(defaultFund.totalAmount);
                  setError('The previously selected fund is not an investment fund. Only investment funds can be used for loans.');
                }
              }
            }
          }
        } else {
          setError(fundsResult.error || 'Failed to fetch funds');
        }
      } catch (err) {
        setError('An error occurred while fetching data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    // Update form data
    setFormData(prev => {
      const updatedData = {
        ...prev,
        [name]: name === 'amount' || name === 'interestRate' ? parseFloat(value) || 0 : value
      };

      // If start date changes, update due date to be 1 year from start date
      if (name === 'startDate' && value) {
        try {
          const startDate = new Date(value);

          // Check if the date is valid
          if (!isNaN(startDate.getTime())) {
            const dueDate = new Date(startDate);
            dueDate.setFullYear(dueDate.getFullYear() + 1);
            updatedData.dueDate = dueDate.toISOString().split('T')[0];
          } else {
            // If date is invalid, keep the previous due date
            console.warn('Invalid start date provided');
          }
        } catch (err) {
          console.error('Error calculating due date:', err);
          // Keep the previous due date in case of error
        }
      }

      return updatedData;
    });

    // Update selected fund balance if fund is changed
    if (name === 'fund') {
      const selectedFund = funds.find(fund => fund._id === value);
      if (selectedFund) {
        setSelectedFundBalance(selectedFund.totalAmount);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    // Validate form data
    if (formData.amount <= 0) {
      setError('Amount must be greater than zero');
      setSubmitting(false);
      return;
    }

    if (formData.interestRate < 0) {
      setError('Interest rate cannot be negative');
      setSubmitting(false);
      return;
    }

    if (!formData.member) {
      setError('Please select a member');
      setSubmitting(false);
      return;
    }

    if (!formData.fund) {
      setError('Please select a fund');
      setSubmitting(false);
      return;
    }

    if (formData.amount > selectedFundBalance) {
      setError(`Loan amount exceeds fund balance (${selectedFundBalance.toFixed(2)})`);
      setSubmitting(false);
      return;
    }

    try {
      const response = await fetch('/api/loans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        router.push('/loans');
      } else {
        setError(result.error || 'Failed to create loan');
      }
    } catch (err) {
      setError('An error occurred while creating the loan');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="py-8">
      <div className="mb-6">
        <Link href="/loans" className="text-blue-500 hover:underline">
          &larr; Back to Loans
        </Link>
      </div>

      <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-6">New Loan</h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="member" className="block text-gray-700 font-medium mb-2">
              Member *
            </label>
            <select
              id="member"
              name="member"
              value={formData.member}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a Member</option>
              {members.map((member) => (
                <option key={member._id} value={member._id}>
                  {member.name} ({member.phoneNumber})
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label htmlFor="fund" className="block text-gray-700 font-medium mb-2">
              Fund *
            </label>
            <select
              id="fund"
              name="fund"
              value={formData.fund}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a Fund</option>
              {funds
                .filter(fund => fund.type === 'investment')
                .map((fund) => (
                  <option key={fund._id} value={fund._id}>
                    {fund.name} (Investment) - Balance: ${fund.totalAmount.toFixed(2)}
                  </option>
                ))}
            </select>
            {formData.fund ? (
              <p className="text-sm text-gray-500 mt-1">
                Available balance: ${selectedFundBalance.toFixed(2)}
              </p>
            ) : (
              <p className="text-sm text-gray-500 mt-1">
                Note: Only investment funds can be used for loans.
              </p>
            )}
          </div>

          <div className="mb-4">
            <label htmlFor="amount" className="block text-gray-700 font-medium mb-2">
              Loan Amount *
            </label>
            <input
              type="number"
              id="amount"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              min="0.01"
              step="0.01"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="mb-4">
            <label htmlFor="interestRate" className="block text-gray-700 font-medium mb-2">
              Interest Rate (%) *
            </label>
            <input
              type="number"
              id="interestRate"
              name="interestRate"
              value={formData.interestRate}
              onChange={handleChange}
              min="0"
              max="100"
              step="0.01"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="mb-4">
            <label htmlFor="startDate" className="block text-gray-700 font-medium mb-2">
              Start Date *
            </label>
            <input
              type="date"
              id="startDate"
              name="startDate"
              value={formData.startDate}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-sm text-gray-500 mt-1">
              Loans have a default term of 1 year from the start date.
            </p>
          </div>

          <div className="mb-6">
            <label htmlFor="status" className="block text-gray-700 font-medium mb-2">
              Status *
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="active">Active</option>
            </select>
          </div>

          <div className="flex justify-between">
            <Link
              href="/loans"
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded disabled:bg-blue-300"
            >
              {submitting ? 'Creating...' : 'Create Loan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
