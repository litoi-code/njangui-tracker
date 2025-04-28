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
}

export default function NewTransactionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [members, setMembers] = useState<Member[]>([]);
  const [funds, setFunds] = useState<Fund[]>([]);
  const [formData, setFormData] = useState({
    type: 'deposit',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    description: '',
    member: searchParams.get('member') || '',
    recipient: '',
    fund: searchParams.get('fund') || ''
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

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
        }

        // Fetch funds
        const fundsResponse = await fetch('/api/funds');
        const fundsResult = await fundsResponse.json();

        if (fundsResult.success) {
          setFunds(fundsResult.data);

          // Set default fund if none is selected and funds exist
          if (!formData.fund && fundsResult.data.length > 0 &&
              (formData.type === 'contribution' || formData.type === 'transfer')) {
            setFormData(prev => ({
              ...prev,
              fund: fundsResult.data[0]._id
            }));
          }
        }
      } catch (err) {
        setError('An error occurred while fetching data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [formData.type]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    if (name === 'type') {
      if (value === 'transfer') {
        // For transfers, we need recipient but fund is optional
        setFormData(prev => ({
          ...prev,
          [name]: value,
        }));
        return;
      } else if (value === 'contribution') {
        // For contributions, we need fund but not recipient
        setFormData(prev => ({
          ...prev,
          [name]: value,
          recipient: ''
        }));
        return;
      } else {
        // For other types, reset both fund and recipient
        setFormData(prev => ({
          ...prev,
          [name]: value,
          fund: '',
          recipient: ''
        }));
        return;
      }
    }

    // For member selection, ensure recipient isn't the same
    if (name === 'member' && value === formData.recipient) {
      setFormData(prev => ({
        ...prev,
        [name]: value,
        recipient: ''
      }));
      return;
    }

    // For recipient selection, ensure member isn't the same
    if (name === 'recipient' && value === formData.member) {
      return; // Don't allow selecting the same member as recipient
    }

    setFormData(prev => ({
      ...prev,
      [name]: name === 'amount' ? parseFloat(value) || 0 : value
    }));
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

    if (!formData.member) {
      setError('Please select a member');
      setSubmitting(false);
      return;
    }

    if (formData.type === 'transfer' && !formData.recipient) {
      setError('Please select a recipient member for the transfer');
      setSubmitting(false);
      return;
    }

    if (formData.type === 'contribution' && !formData.fund) {
      setError('Please select a fund for this contribution');
      setSubmitting(false);
      return;
    }

    if (formData.type === 'transfer' && formData.member === formData.recipient) {
      setError('Sender and recipient cannot be the same member');
      setSubmitting(false);
      return;
    }

    try {
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        router.push('/transactions');
      } else {
        setError(result.error || 'Failed to create transaction');
      }
    } catch (err) {
      setError('An error occurred while creating the transaction');
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
        <Link href="/transactions" className="text-blue-500 hover:underline">
          &larr; Back to Transactions
        </Link>
      </div>

      <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-6">New Transaction</h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="type" className="block text-gray-700 font-medium mb-2">
              Transaction Type *
            </label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="deposit">Deposit</option>
              <option value="withdrawal">Withdrawal</option>
              <option value="transfer">Transfer</option>
              <option value="loan">Loan</option>
              <option value="repayment">Repayment</option>
              <option value="contribution">Contribution</option>
              <option value="penalty">Penalty</option>
            </select>
          </div>

          <div className="mb-4">
            <label htmlFor="amount" className="block text-gray-700 font-medium mb-2">
              Amount *
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
            <label htmlFor="date" className="block text-gray-700 font-medium mb-2">
              Date *
            </label>
            <input
              type="date"
              id="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

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

          {formData.type === 'transfer' && (
            <div className="mb-4">
              <label htmlFor="recipient" className="block text-gray-700 font-medium mb-2">
                Recipient Member *
              </label>
              <select
                id="recipient"
                name="recipient"
                value={formData.recipient}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a Recipient</option>
                {members
                  .filter(m => m._id !== formData.member) // Filter out the sender
                  .map((member) => (
                    <option key={member._id} value={member._id}>
                      {member.name} ({member.phoneNumber})
                    </option>
                  ))
                }
              </select>
              <p className="text-sm text-gray-500 mt-1">
                The recipient will receive the transferred amount in their account.
              </p>
            </div>
          )}

          {(formData.type === 'contribution' || formData.type === 'transfer') && (
            <div className="mb-4">
              <label htmlFor="fund" className="block text-gray-700 font-medium mb-2">
                Fund {formData.type === 'contribution' ? '*' : '(Optional)'}
              </label>
              <select
                id="fund"
                name="fund"
                value={formData.fund}
                onChange={handleChange}
                required={formData.type === 'contribution'}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a Fund</option>
                {funds.map((fund) => (
                  <option key={fund._id} value={fund._id}>
                    {fund.name} ({fund.type})
                  </option>
                ))}
              </select>
              {formData.type === 'transfer' && (
                <p className="text-sm text-gray-500 mt-1">
                  For member-to-member transfers, fund is optional.
                </p>
              )}
            </div>
          )}

          <div className="mb-6">
            <label htmlFor="description" className="block text-gray-700 font-medium mb-2">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-between">
            <Link
              href="/transactions"
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded disabled:bg-blue-300"
            >
              {submitting ? 'Creating...' : 'Create Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
