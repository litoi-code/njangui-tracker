'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

interface Contribution {
  _id: string;
  amount: number;
  date: string;
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
  createdAt: string;
  updatedAt: string;
}

export default function ContributionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [contribution, setContribution] = useState<Contribution | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchContribution = async () => {
      try {
        const response = await fetch(`/api/contributions/${params.id}`);
        const result = await response.json();
        
        if (result.success) {
          setContribution(result.data);
        } else {
          setError(result.error || 'Failed to fetch contribution details');
        }
      } catch (err) {
        setError('An error occurred while fetching contribution details');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchContribution();
  }, [params.id]);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this contribution?')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/contributions/${params.id}`, {
        method: 'DELETE'
      });
      
      const result = await response.json();
      
      if (result.success) {
        router.push('/contributions');
      } else {
        alert(result.error || 'Failed to delete contribution');
      }
    } catch (err) {
      alert('An error occurred while deleting the contribution');
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

  if (error || !contribution) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
        <h2 className="text-xl font-semibold text-red-600 dark:text-red-400 mb-2">Error</h2>
        <p className="text-red-600 dark:text-red-400">{error || 'Contribution not found'}</p>
        <Link href="/contributions" className="mt-4 inline-block text-blue-500 hover:underline">
          Back to Contributions
        </Link>
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="mb-6">
        <Link href="/contributions" className="text-blue-500 hover:underline dark:text-blue-400 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Back to Contributions
        </Link>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-2xl font-bold">Contribution Details</h1>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h2 className="text-lg font-semibold mb-4">Contribution Information</h2>
              <div className="space-y-3">
                <p>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Amount:</span>
                  <span className="ml-2 text-lg font-bold">${contribution.amount.toFixed(2)}</span>
                </p>
                <p>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Date:</span>
                  <span className="ml-2">{formatDate(contribution.date)}</span>
                </p>
                <p>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Created:</span>
                  <span className="ml-2">{formatDateTime(contribution.createdAt)}</span>
                </p>
                <p>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Last Updated:</span>
                  <span className="ml-2">{formatDateTime(contribution.updatedAt)}</span>
                </p>
              </div>
            </div>
            
            <div>
              <h2 className="text-lg font-semibold mb-4">Related Information</h2>
              <div className="space-y-3">
                <p>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Member:</span>
                  <Link 
                    href={`/members/${contribution.member._id}`} 
                    className="ml-2 text-blue-500 hover:underline dark:text-blue-400"
                  >
                    {contribution.member.name}
                  </Link>
                </p>
                <p>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Phone Number:</span>
                  <span className="ml-2">{contribution.member.phoneNumber}</span>
                </p>
                <p>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Fund:</span>
                  <Link 
                    href={`/funds/${contribution.fund._id}`} 
                    className="ml-2 text-blue-500 hover:underline dark:text-blue-400"
                  >
                    {contribution.fund.name}
                  </Link>
                </p>
                <p>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Fund Type:</span>
                  <span className="ml-2 px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                    {contribution.fund.type}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600 flex justify-between">
          <div className="flex space-x-2">
            <Link
              href={`/contributions/new?member=${contribution.member._id}&fund=${contribution.fund._id}`}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
            >
              New Similar Contribution
            </Link>
          </div>
          <button
            onClick={handleDelete}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
          >
            Delete Contribution
          </button>
        </div>
      </div>
    </div>
  );
}
