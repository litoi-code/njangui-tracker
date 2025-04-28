'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';

interface Penalty {
  _id: string;
  amount: number;
  reason: string;
  date: string;
  status: 'pending' | 'paid';
  member: {
    _id: string;
    name: string;
    phoneNumber: string;
  };
  createdAt: string;
  updatedAt: string;
}

export default function PenaltyDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [penalty, setPenalty] = useState<Penalty | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPenalty = async () => {
      try {
        const response = await fetch(`/api/penalties/${params.id}`);
        const result = await response.json();
        
        if (result.success) {
          setPenalty(result.data);
        } else {
          setError(result.error || 'Failed to fetch penalty details');
        }
      } catch (err) {
        setError('An error occurred while fetching penalty details');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPenalty();
  }, [params.id]);

  const handlePayPenalty = async () => {
    if (!confirm('Are you sure you want to mark this penalty as paid?')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/penalties/${params.id}/pay`, {
        method: 'POST'
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Update the penalty in the state
        setPenalty(prev => prev ? { ...prev, status: 'paid' } : null);
      } else {
        alert(result.error || 'Failed to pay penalty');
      }
    } catch (err) {
      alert('An error occurred while paying the penalty');
      console.error(err);
    }
  };
  
  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this penalty?')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/penalties/${params.id}`, {
        method: 'DELETE'
      });
      
      const result = await response.json();
      
      if (result.success) {
        router.push('/penalties');
      } else {
        alert(result.error || 'Failed to delete penalty');
      }
    } catch (err) {
      alert('An error occurred while deleting the penalty');
      console.error(err);
    }
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };
  
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600 dark:border-primary-400"></div>
      </div>
    );
  }

  if (error || !penalty) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
        <h2 className="text-xl font-semibold text-red-600 dark:text-red-400 mb-2">Error</h2>
        <p className="text-red-600 dark:text-red-400">{error || 'Penalty not found'}</p>
        <Link href="/penalties" className="mt-4 inline-block text-blue-500 hover:underline">
          Back to Penalties
        </Link>
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="mb-6">
        <Link href="/penalties" className="text-blue-500 hover:underline dark:text-blue-400 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Back to Penalties
        </Link>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Penalty Details</h1>
          <span className={`px-3 py-1 rounded-full text-sm ${
            penalty.status === 'paid' 
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' 
              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100'
          }`}>
            {penalty.status}
          </span>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h2 className="text-lg font-semibold mb-4">Penalty Information</h2>
              <div className="space-y-3">
                <p>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Amount:</span>
                  <span className="ml-2 text-lg font-bold">${penalty.amount.toFixed(2)}</span>
                </p>
                <p>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Date:</span>
                  <span className="ml-2">{formatDate(penalty.date)}</span>
                </p>
                <p>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Created:</span>
                  <span className="ml-2">{formatDateTime(penalty.createdAt)}</span>
                </p>
                <p>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Last Updated:</span>
                  <span className="ml-2">{formatDateTime(penalty.updatedAt)}</span>
                </p>
              </div>
              
              <h2 className="text-lg font-semibold mt-6 mb-4">Member Information</h2>
              <div className="space-y-3">
                <p>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Member:</span>
                  <Link 
                    href={`/members/${penalty.member._id}`} 
                    className="ml-2 text-blue-500 hover:underline dark:text-blue-400"
                  >
                    {penalty.member.name}
                  </Link>
                </p>
                <p>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Phone Number:</span>
                  <span className="ml-2">{penalty.member.phoneNumber}</span>
                </p>
              </div>
            </div>
            
            <div>
              <h2 className="text-lg font-semibold mb-4">Reason</h2>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{penalty.reason}</p>
              </div>
              
              {penalty.status === 'pending' && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
                  <h3 className="text-yellow-800 dark:text-yellow-400 font-medium mb-2">Pending Payment</h3>
                  <p className="text-yellow-700 dark:text-yellow-300 text-sm">
                    This penalty is still pending payment. When the penalty is paid, the amount will be deducted from the member's balance.
                  </p>
                </div>
              )}
              
              {penalty.status === 'paid' && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
                  <h3 className="text-green-800 dark:text-green-400 font-medium mb-2">Payment Completed</h3>
                  <p className="text-green-700 dark:text-green-300 text-sm">
                    This penalty has been paid. The amount has been deducted from the member's balance.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600 flex justify-between">
          <div className="flex space-x-2">
            <Link
              href={`/penalties/${penalty._id}/edit`}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Edit Penalty
            </Link>
            
            {penalty.status === 'pending' && (
              <button
                onClick={handlePayPenalty}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
              >
                Mark as Paid
              </button>
            )}
          </div>
          
          <button
            onClick={handleDelete}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
          >
            Delete Penalty
          </button>
        </div>
      </div>
    </div>
  );
}
