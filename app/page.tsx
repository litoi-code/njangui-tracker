'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import StatCard from '@/components/dashboard/StatCard';
import RecentActivities from '@/components/dashboard/RecentActivities';
import NotificationsPanel from '@/components/dashboard/NotificationsPanel';
import BarChart from '@/components/charts/BarChart';
import LineChart from '@/components/charts/LineChart';
import PieChart from '@/components/charts/PieChart';
import DoughnutChart from '@/components/charts/DoughnutChart';

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState<any>(null);
  const [activities, setActivities] = useState([]);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch dashboard stats
        const statsResponse = await fetch('/api/dashboard/stats');
        const statsResult = await statsResponse.json();

        if (!statsResult.success) {
          setError(statsResult.error || 'Failed to fetch dashboard statistics');
          setLoading(false);
          return;
        }

        setStats(statsResult.data);

        // Fetch activities
        const activitiesResponse = await fetch('/api/dashboard/activities?limit=5');
        const activitiesResult = await activitiesResponse.json();

        if (activitiesResult.success) {
          setActivities(activitiesResult.data);
        }

        // Fetch notifications
        const notificationsResponse = await fetch('/api/dashboard/notifications?limit=5');
        const notificationsResult = await notificationsResponse.json();

        if (notificationsResult.success) {
          setNotifications(notificationsResult.data);
        }
      } catch (err) {
        setError('An error occurred while fetching dashboard data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

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

  if (!stats) {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 text-center">
        <h2 className="text-xl font-semibold text-yellow-600 dark:text-yellow-400 mb-2">No Data</h2>
        <p className="text-yellow-600 dark:text-yellow-400">No dashboard data available.</p>

        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-4">
            <Link href="/members" className="card card-hover p-6">
              <h2 className="text-xl font-semibold mb-2">Member Management</h2>
              <p className="text-gray-600 dark:text-gray-400">
                Manage members, view profiles, and track balances.
              </p>
            </Link>

            <Link href="/funds" className="card card-hover p-6">
              <h2 className="text-xl font-semibold mb-2">Fund Management</h2>
              <p className="text-gray-600 dark:text-gray-400">
                Manage different fund types and track contributions.
              </p>
            </Link>

            <Link href="/transactions" className="card card-hover p-6">
              <h2 className="text-xl font-semibold mb-2">Transactions</h2>
              <p className="text-gray-600 dark:text-gray-400">
                View and manage all financial transactions.
              </p>
            </Link>

            <Link href="/loans" className="card card-hover p-6">
              <h2 className="text-xl font-semibold mb-2">Loan Management</h2>
              <p className="text-gray-600 dark:text-gray-400">
                Issue loans, track repayments, and manage interest.
              </p>
            </Link>

            <Link href="/contributions" className="card card-hover p-6">
              <h2 className="text-xl font-semibold mb-2">Contributions</h2>
              <p className="text-gray-600 dark:text-gray-400">
                Track member contributions to various funds.
              </p>
            </Link>

            <Link href="/penalties" className="card card-hover p-6">
              <h2 className="text-xl font-semibold mb-2">Penalties</h2>
              <p className="text-gray-600 dark:text-gray-400">
                Manage penalties and track payments.
              </p>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Members"
          value={stats.members.total}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          }
          change={
            stats.members.total > 0
              ? {
                  value: Math.round((stats.members.active / stats.members.total) * 100),
                  isPositive: true,
                }
              : undefined
          }
        />

        <StatCard
          title="Total Funds"
          value={`$${stats.funds.totalAmount.toFixed(2)}`}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />

        <StatCard
          title="Active Loans"
          value={stats.loans.active}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          }
          change={
            stats.loans.total > 0
              ? {
                  value: Math.round((stats.loans.active / stats.loans.total) * 100),
                  isPositive: false,
                }
              : undefined
          }
        />

        <StatCard
          title="Outstanding Loans"
          value={`$${stats.loans.outstandingAmount.toFixed(2)}`}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-card p-6">
          <LineChart
            title="Monthly Transactions"
            labels={stats.charts.monthlyTransactions.map((item: any) => item.month)}
            datasets={[
              {
                label: 'Transaction Amount',
                data: stats.charts.monthlyTransactions.map((item: any) => item.amount),
                borderColor: 'rgba(59, 130, 246, 0.8)',
                backgroundColor: 'rgba(59, 130, 246, 0.2)',
              },
            ]}
          />
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-card p-6">
          <BarChart
            title="Monthly Transaction Count"
            labels={stats.charts.monthlyTransactions.map((item: any) => item.month)}
            datasets={[
              {
                label: 'Number of Transactions',
                data: stats.charts.monthlyTransactions.map((item: any) => item.count),
                backgroundColor: 'rgba(139, 92, 246, 0.6)',
                borderColor: 'rgba(139, 92, 246, 1)',
              },
            ]}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-card p-6">
          <PieChart
            title="Fund Distribution"
            labels={stats.charts.fundDistribution.map((item: any) => item.name)}
            data={stats.charts.fundDistribution.map((item: any) => item.amount)}
            height={250}
          />
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-card p-6">
          <DoughnutChart
            title="Loan Status Distribution"
            labels={stats.charts.loanStatusDistribution.map((item: any) => item.status)}
            data={stats.charts.loanStatusDistribution.map((item: any) => item.count)}
            height={250}
          />
        </div>
      </div>

      {/* Recent Activities and Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentActivities activities={activities} />
        <NotificationsPanel notifications={notifications} />
      </div>

      {/* Quick Links */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-card p-6">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link href="/members/new" className="bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 p-4 rounded-lg text-center transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mx-auto mb-2 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Add Member</span>
          </Link>

          <Link href="/funds/new" className="bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 p-4 rounded-lg text-center transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mx-auto mb-2 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span className="text-sm font-medium text-purple-700 dark:text-purple-300">Create Fund</span>
          </Link>

          <Link href="/loans/new" className="bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 p-4 rounded-lg text-center transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mx-auto mb-2 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span className="text-sm font-medium text-green-700 dark:text-green-300">New Loan</span>
          </Link>

          <Link href="/transactions/new" className="bg-yellow-50 dark:bg-yellow-900/20 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 p-4 rounded-lg text-center transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mx-auto mb-2 text-yellow-600 dark:text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            <span className="text-sm font-medium text-yellow-700 dark:text-yellow-300">New Transaction</span>
          </Link>

          <Link href="/penalties/new" className="bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 p-4 rounded-lg text-center transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mx-auto mb-2 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="text-sm font-medium text-red-700 dark:text-red-300">New Penalty</span>
          </Link>
        </div>
      </div>

      {/* About Section */}
      <div className="bg-gray-100 dark:bg-gray-800 rounded-xl p-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">About HODYVIKU</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            HODYVIKU is a comprehensive financial management system designed for community savings groups,
            cooperatives, and microfinance organizations. Our platform makes it easy to manage members,
            track contributions, issue loans, and generate reports.
          </p>
          <p className="text-gray-700 dark:text-gray-300">
            With HODYVIKU, you can efficiently manage your organization's finances with real-time
            updates, transparent transaction history, and powerful reporting tools.
          </p>
        </div>
      </div>
    </div>
  );
}
