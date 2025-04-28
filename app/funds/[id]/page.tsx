'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

interface Fund {
  _id: string;
  name: string;
  description?: string;
  type: 'savings' | 'investment' | 'emergency';
  interestRate: number;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
}

interface Contribution {
  _id: string;
  amount: number;
  date: string;
  member: {
    _id: string;
    name: string;
    phoneNumber: string;
  };
  fund: string;
}

export default function FundDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [fund, setFund] = useState<Fund | null>(null);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchFundData = async () => {
      try {
        // Fetch fund details
        const fundResponse = await fetch(`/api/funds/${params.id}`);
        const fundResult = await fundResponse.json();
        
        if (!fundResult.success) {
          setError(fundResult.error || 'Failed to fetch fund details');
          setLoading(false);
          return;
        }
        
        setFund(fundResult.data);
        
        // Fetch fund contributions
        const contributionsResponse = await fetch(`/api/contributions?fund=${params.id}`);
        const contributionsResult = await contributionsResponse.json();
        
        if (contributionsResult.success) {
          setContributions(contributionsResult.data);
        }
      } catch (err) {
        setError('An error occurred while fetching data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchFundData();
  }, [params.id]);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this fund?')) {
      return;
    }

    try {
      const response = await fetch(`/api/funds/${params.id}`, {
        method: 'DELETE',
      });
      const result = await response.json();
      
      if (result.success) {
        router.push('/funds');
      } else {
        alert(result.error || 'Failed to delete fund');
      }
    } catch (err) {
      alert('An error occurred while deleting the fund');
      console.error(err);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading fund details...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-500">{error}</div>;
  }

  if (!fund) {
    return <div className="text-center py-8">Fund not found</div>;
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Calculate projected interest
  const projectedInterest = fund.totalAmount * (fund.interestRate / 100);

  return (
    <div className="py-8">
      <div className="mb-6">
        <Link href="/funds" className="text-blue-500 hover:underline">
          &larr; Back to Funds
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
        <div className="p-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold mb-2">{fund.name}</h1>
              <p className="text-gray-600 mb-4">Created on {formatDate(fund.createdAt)}</p>
            </div>
            <div>
              <span className={`px-3 py-1 rounded-full text-sm ${
                fund.type === 'savings' ? 'bg-blue-100 text-blue-800' :
                fund.type === 'investment' ? 'bg-green-100 text-green-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {fund.type}
              </span>
            </div>
          </div>

          {fund.description && (
            <div className="mt-4 mb-6">
              <h2 className="text-lg font-semibold mb-2">Description</h2>
              <p className="text-gray-700">{fund.description}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-blue-800 mb-1">Total Amount</h3>
              <p className="text-2xl font-bold text-blue-900">${fund.totalAmount.toFixed(2)}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-green-800 mb-1">Interest Rate</h3>
              <p className="text-2xl font-bold text-green-900">{fund.interestRate}%</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-purple-800 mb-1">Projected Interest</h3>
              <p className="text-2xl font-bold text-purple-900">${projectedInterest.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex justify-between">
          <Link 
            href={`/funds/${fund._id}/edit`}
            className="text-blue-500 hover:text-blue-700"
          >
            Edit Fund
          </Link>
          <button 
            onClick={handleDelete}
            className="text-red-500 hover:text-red-700"
          >
            Delete Fund
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold">Contribution History</h2>
          <Link 
            href={`/contributions/new?fund=${fund._id}`}
            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
          >
            Add Contribution
          </Link>
        </div>

        {contributions.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No contributions found for this fund.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Member</th>
                  <th className="py-3 px-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {contributions.map((contribution) => (
                  <tr key={contribution._id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 whitespace-nowrap">{formatDate(contribution.date)}</td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <Link href={`/members/${contribution.member._id}`} className="text-blue-500 hover:underline">
                        {contribution.member.name}
                      </Link>
                    </td>
                    <td className="py-3 px-4 text-right">${contribution.amount.toFixed(2)}</td>
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
