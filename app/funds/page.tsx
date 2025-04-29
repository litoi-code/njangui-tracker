'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Fund {
  _id: string;
  name: string;
  description?: string;
  type: 'savings' | 'investment' | 'emergency';
  interestRate: number;
  totalAmount: number;
}

export default function FundsPage() {
  const [funds, setFunds] = useState<Fund[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const fetchFunds = async () => {
      try {
        const response = await fetch('/api/funds');
        const result = await response.json();

        if (result.success) {
          setFunds(result.data);
        } else {
          setError(result.error || 'Failed to fetch funds');
        }
      } catch (err) {
        setError('An error occurred while fetching funds');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchFunds();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this fund?')) {
      return;
    }

    try {
      const response = await fetch(`/api/funds/${id}`, {
        method: 'DELETE',
      });
      const result = await response.json();

      if (result.success) {
        setFunds(funds.filter(fund => fund._id !== id));
      } else {
        alert(result.error || 'Failed to delete fund');
      }
    } catch (err) {
      alert('An error occurred while deleting the fund');
      console.error(err);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading funds...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-500">{error}</div>;
  }

  return (
    <div className="py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Funds</h1>
        <Link
          href="/funds/new"
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
        >
          Add New Fund
        </Link>
      </div>

      {funds.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No funds found. Add your first fund to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {funds.map((fund) => (
            <div key={fund._id} className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-xl font-semibold">{fund.name}</h2>
                  <span className={`px-2 py-1 rounded text-xs ${
                    fund.type === 'savings' ? 'bg-blue-100 text-blue-800' :
                    fund.type === 'investment' ? 'bg-green-100 text-green-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {fund.type}
                  </span>
                </div>

                <p className="text-gray-600 mb-4 line-clamp-2">
                  {fund.description || 'No description provided.'}
                </p>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Interest Rate:</span>
                    <span>{fund.interestRate}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Amount:</span>
                    <span className="font-semibold">{fund.totalAmount.toFixed(2)} XAF</span>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 px-6 py-3 bg-gray-50 flex justify-between">
                <Link
                  href={`/funds/${fund._id}`}
                  className="text-blue-500 hover:text-blue-700"
                >
                  View Details
                </Link>
                <div className="flex space-x-4">
                  <Link
                    href={`/funds/${fund._id}/edit`}
                    className="text-blue-500 hover:text-blue-700"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(fund._id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
