'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import RecentActivities from '@/components/dashboard/RecentActivities';

export default function ActivitiesPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activities, setActivities] = useState([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        // Fetch activities with a higher limit
        const activitiesResponse = await fetch('/api/dashboard/activities?limit=50');
        const activitiesResult = await activitiesResponse.json();

        if (activitiesResult.success) {
          setActivities(activitiesResult.data);
        } else {
          setError(activitiesResult.error || 'Failed to fetch activities');
        }
      } catch (err) {
        setError('An error occurred while fetching activities');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, []);

  const filteredActivities = filter === 'all'
    ? activities
    : activities.filter((activity: any) => activity.type === filter);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600 dark:border-primary-400"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
        <h2 className="text-xl font-semibold text-red-600 dark:text-red-400 mb-2">Error</h2>
        <p className="text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Activities</h1>
        <div className="flex space-x-2">
          <button
            onClick={() => window.location.reload()}
            className="btn-outline flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 dark:border-gray-700">
        <button
          className={`px-4 py-2 text-sm font-medium rounded-t-lg ${
            filter === 'all'
              ? 'bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-100 border-b-2 border-primary-500'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
          }`}
          onClick={() => setFilter('all')}
        >
          All
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium rounded-t-lg ${
            filter === 'transaction'
              ? 'bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-100 border-b-2 border-primary-500'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
          }`}
          onClick={() => setFilter('transaction')}
        >
          Transactions
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium rounded-t-lg ${
            filter === 'loan'
              ? 'bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-100 border-b-2 border-primary-500'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
          }`}
          onClick={() => setFilter('loan')}
        >
          Loans
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium rounded-t-lg ${
            filter === 'contribution'
              ? 'bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-100 border-b-2 border-primary-500'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
          }`}
          onClick={() => setFilter('contribution')}
        >
          Contributions
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium rounded-t-lg ${
            filter === 'member'
              ? 'bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-100 border-b-2 border-primary-500'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
          }`}
          onClick={() => setFilter('member')}
        >
          Members
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium rounded-t-lg ${
            filter === 'fund'
              ? 'bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-100 border-b-2 border-primary-500'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
          }`}
          onClick={() => setFilter('fund')}
        >
          Funds
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium rounded-t-lg ${
            filter === 'penalty'
              ? 'bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-100 border-b-2 border-primary-500'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
          }`}
          onClick={() => setFilter('penalty')}
        >
          Penalties
        </button>
      </div>

      {/* Activities List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-card">
        <RecentActivities activities={filteredActivities} limit={50} />
      </div>

      {/* Back to Dashboard */}
      <div className="text-center mt-8">
        <Link
          href="/"
          className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
        >
          &larr; Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
