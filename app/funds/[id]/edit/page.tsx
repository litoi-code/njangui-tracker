'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface FundFormData {
  name: string;
  description: string;
  type: 'savings' | 'investment' | 'emergency';
  interestRate: number;
  totalAmount: number;
}

export default function EditFundPage() {
  const params = useParams();
  const router = useRouter();
  const [formData, setFormData] = useState<FundFormData>({
    name: '',
    description: '',
    type: 'savings',
    interestRate: 0,
    totalAmount: 0
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchFund = async () => {
      try {
        const response = await fetch(`/api/funds/${params.id}`);
        const result = await response.json();
        
        if (result.success) {
          const { name, description, type, interestRate, totalAmount } = result.data;
          setFormData({
            name,
            description: description || '',
            type,
            interestRate,
            totalAmount
          });
        } else {
          setError(result.error || 'Failed to fetch fund');
        }
      } catch (err) {
        setError('An error occurred while fetching the fund');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchFund();
  }, [params.id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'interestRate' || name === 'totalAmount' ? parseFloat(value) || 0 : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const response = await fetch(`/api/funds/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        router.push(`/funds/${params.id}`);
      } else {
        setError(result.error || 'Failed to update fund');
      }
    } catch (err) {
      setError('An error occurred while updating the fund');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading fund data...</div>;
  }

  return (
    <div className="py-8">
      <div className="mb-6">
        <Link href={`/funds/${params.id}`} className="text-blue-500 hover:underline">
          &larr; Back to Fund Details
        </Link>
      </div>

      <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-6">Edit Fund</h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="name" className="block text-gray-700 font-medium mb-2">
              Fund Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="mb-4">
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

          <div className="mb-4">
            <label htmlFor="type" className="block text-gray-700 font-medium mb-2">
              Fund Type *
            </label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="savings">Savings</option>
              <option value="investment">Investment</option>
              <option value="emergency">Emergency</option>
            </select>
          </div>

          <div className="mb-4">
            <label htmlFor="interestRate" className="block text-gray-700 font-medium mb-2">
              Interest Rate (%)
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="mb-6">
            <label htmlFor="totalAmount" className="block text-gray-700 font-medium mb-2">
              Total Amount
            </label>
            <input
              type="number"
              id="totalAmount"
              name="totalAmount"
              value={formData.totalAmount}
              onChange={handleChange}
              min="0"
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-sm text-gray-500 mt-1">
              Note: Editing amount directly is not recommended. Use contributions instead.
            </p>
          </div>

          <div className="flex justify-between">
            <Link
              href={`/funds/${params.id}`}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded disabled:bg-blue-300"
            >
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
