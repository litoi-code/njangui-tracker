'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

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

interface FilterOptions {
  member: string;
  fund: string;
  date: string;
}

export default function ContributionsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [filteredContributions, setFilteredContributions] = useState<Contribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [totalAmount, setTotalAmount] = useState(0);
  const [members, setMembers] = useState<{ _id: string; name: string }[]>([]);
  const [funds, setFunds] = useState<{ _id: string; name: string; type?: string; totalAmount?: number }[]>([]);
  const [fundTotals, setFundTotals] = useState<{ [key: string]: { amount: number; name: string; id: string; type?: string } }>({});
  const [uniqueContributorsCount, setUniqueContributorsCount] = useState(0);

  // Filter state with no default date
  const [filters, setFilters] = useState<FilterOptions>({
    member: '',
    fund: '',
    date: '' // No default date
  });

  // Sorting state
  const [sortField, setSortField] = useState<string>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Memoized sorted funds
  const sortedFunds = useMemo(() => {
    return Object.values(fundTotals).sort((a, b) => b.amount - a.amount);
  }, [fundTotals]);

  // Memoized top two funds sum
  const topTwoFundsSum = useMemo(() => {
    if (sortedFunds.length < 2) return sortedFunds.length === 1 ? sortedFunds[0].amount : 0;
    return sortedFunds[0].amount + sortedFunds[1].amount;
  }, [sortedFunds]);

  useEffect(() => {
    const fetchContributions = async () => {
      try {
        // Check if there's a specific contribution ID in the URL
        const contributionId = searchParams?.get('id');

        if (contributionId) {
          // Redirect to the contribution detail page
          router.push(`/contributions/${contributionId}`);
          return;
        }

        // Fetch all contributions
        const response = await fetch('/api/contributions');
        const result = await response.json();

        if (result.success) {
          setContributions(result.data);
          setFilteredContributions(result.data);

          // Calculate total amount
          const total = result.data.reduce((sum: number, contribution: Contribution) =>
            sum + contribution.amount, 0);
          setTotalAmount(total);
        } else {
          setError(result.error || 'Failed to fetch contributions');
        }

        // Fetch members for filter dropdown
        const membersResponse = await fetch('/api/members');
        const membersResult = await membersResponse.json();

        if (membersResult.success) {
          setMembers(membersResult.data.map((member: any) => ({
            _id: member._id,
            name: member.name
          })));
        }

        // Fetch funds for filter dropdown
        const fundsResponse = await fetch('/api/funds');
        const fundsResult = await fundsResponse.json();

        if (fundsResult.success) {
          setFunds(fundsResult.data.map((fund: any) => ({
            _id: fund._id,
            name: fund.name,
            type: fund.type
          })));

          // Calculate total amount per fund
          const fundTotalsMap: { [key: string]: { amount: number; name: string; id: string; type?: string } } = {};

          // Initialize with all funds at 0
          fundsResult.data.forEach((fund: any) => {
            fundTotalsMap[fund._id] = {
              amount: 0,
              name: fund.name,
              id: fund._id,
              type: fund.type
            };
          });

          // Sum up contributions for each fund
          if (result.success) {
            result.data.forEach((contribution: Contribution) => {
              const fundId = contribution.fund._id;
              if (fundTotalsMap[fundId]) {
                fundTotalsMap[fundId].amount += contribution.amount;
              } else {
                fundTotalsMap[fundId] = {
                  amount: contribution.amount,
                  name: contribution.fund.name,
                  id: fundId,
                  type: contribution.fund.type
                };
              }
            });
          }

          setFundTotals(fundTotalsMap);
        }
      } catch (err) {
        setError('An error occurred while fetching contributions');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchContributions();
  }, [searchParams, router]);

  // Apply filters and sorting
  useEffect(() => {
    let result = [...contributions];

    // Apply filters
    if (filters.member) {
      result = result.filter(contribution => contribution.member._id === filters.member);
    }

    if (filters.fund) {
      result = result.filter(contribution => contribution.fund._id === filters.fund);
    }

    if (filters.date) {
      // Create date objects for comparison
      const filterDate = new Date(filters.date);
      // Set to start of day
      filterDate.setHours(0, 0, 0, 0);

      // Create end of day date
      const endOfDay = new Date(filters.date);
      endOfDay.setHours(23, 59, 59, 999);

      // Filter contributions that match the selected date
      result = result.filter(contribution => {
        const contributionDate = new Date(contribution.date);
        return contributionDate >= filterDate && contributionDate <= endOfDay;
      });
    }

    // Apply sorting
    result.sort((a, b) => {
      let aValue, bValue;

      switch (sortField) {
        case 'date':
          aValue = new Date(a.date).getTime();
          bValue = new Date(b.date).getTime();
          break;
        case 'amount':
          aValue = a.amount;
          bValue = b.amount;
          break;
        case 'member':
          aValue = a.member.name.toLowerCase();
          bValue = b.member.name.toLowerCase();
          break;
        case 'fund':
          aValue = a.fund.name.toLowerCase();
          bValue = b.fund.name.toLowerCase();
          break;
        default:
          aValue = new Date(a.date).getTime();
          bValue = new Date(b.date).getTime();
      }

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredContributions(result);

    // Calculate filtered total
    const filteredTotal = result.reduce((sum, contribution) => sum + contribution.amount, 0);
    setTotalAmount(filteredTotal);

    // Calculate unique contributors count
    if (filters.date) {
      // Get unique member IDs for the filtered date
      const uniqueMemberIds = new Set(
        result.map(contribution => contribution.member._id)
      );
      setUniqueContributorsCount(uniqueMemberIds.size);
    } else {
      // If no date filter, set to 0
      setUniqueContributorsCount(0);
    }

    // Always update fund totals based on filtered contributions
    const filteredFundTotals: { [key: string]: { amount: number; name: string; id: string; type?: string } } = {};

    // Initialize with all funds at 0
    funds.forEach(fund => {
      filteredFundTotals[fund._id] = {
        amount: 0,
        name: fund.name,
        id: fund._id,
        type: fund.type
      };
    });

    // Sum up filtered contributions for each fund
    result.forEach(contribution => {
      const fundId = contribution.fund._id;
      if (filteredFundTotals[fundId]) {
        filteredFundTotals[fundId].amount += contribution.amount;
      } else {
        filteredFundTotals[fundId] = {
          amount: contribution.amount,
          name: contribution.fund.name,
          id: fundId,
          type: contribution.fund.type
        };
      }
    });

    setFundTotals(filteredFundTotals);
  }, [contributions, filters, sortField, sortDirection]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      // Toggle direction if clicking the same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field and default to descending
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const resetFilters = () => {
    setFilters({
      member: '',
      fund: '',
      date: '' // Reset to empty date
    });
  };

  const handleFundCardClick = (fundId: string) => {
    setFilters(prev => ({
      ...prev,
      fund: fundId
    }));

    // Scroll to the contributions table
    setTimeout(() => {
      document.getElementById('contributions-table')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this contribution?')) {
      return;
    }

    try {
      const response = await fetch(`/api/contributions/${id}`, {
        method: 'DELETE'
      });

      const result = await response.json();

      if (result.success) {
        // Remove the deleted contribution from state
        setContributions(prev => prev.filter(contribution => contribution._id !== id));
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
    <div className="py-8">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold">Contributions</h1>
          </div>
          <Link
            href="/contributions/new"
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition-colors"
          >
            Add New Contribution
          </Link>
        </div>

        {/* Statistics in a single line */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-4">
          <div className="flex flex-wrap justify-between items-center gap-x-6 gap-y-3">
            {/* Total Contributions */}
            <div className="flex items-center">
              <div className="w-2 h-8 bg-blue-500 rounded-full mr-2"></div>
              <div>
                <div className="text-xs font-medium text-gray-500 dark:text-gray-400">Total</div>
                <div className="text-lg font-bold text-gray-900 dark:text-white">
                  {totalAmount.toFixed(2)} XAF
                  <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">({filteredContributions.length})</span>
                </div>
              </div>
            </div>

            {/* Top Two Funds Sum */}
            {sortedFunds.length > 0 && (
              <div className="flex items-center">
                <div className="w-2 h-8 bg-indigo-500 rounded-full mr-2"></div>
                <div>
                  <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    Top Two Sum
                  </div>
                  <div className="text-lg font-bold text-gray-900 dark:text-white">
                    {topTwoFundsSum.toFixed(2)} XAF
                    <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">
                      ({totalAmount > 0 ? Math.round(topTwoFundsSum / totalAmount * 100) : 0}%)
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Contributors */}
            {filters.date && (
              <div className="flex items-center">
                <div className="w-2 h-8 bg-purple-500 rounded-full mr-2"></div>
                <div>
                  <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    Contributors ({new Date(filters.date).toLocaleDateString()})
                  </div>
                  <div className="text-lg font-bold text-gray-900 dark:text-white">
                    {uniqueContributorsCount} members
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Fund Total Cards */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-semibold">Fund Totals</h2>
          {(filters.member || filters.date) && (
            <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
              </svg>
              Showing filtered totals
            </div>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 relative">
          {/* First row label */}
          <div className="col-span-full mb-1">
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
              First Row
            </span>
          </div>

          {/* Group funds into rows of three */}
          {(() => {
            const sortedFundsList = Object.values(fundTotals).sort((a, b) => b.amount - a.amount);
            const rows = [];

            // Create rows of three funds each
            for (let i = 0; i < sortedFundsList.length; i += 3) {
              const rowFunds = sortedFundsList.slice(i, i + 3);

              // Add a visual separator and row label between rows (except for the first row)
              if (i > 0) {
                rows.push(
                  <div key={`separator-${i}`} className="col-span-full border-b border-gray-200 dark:border-gray-700 my-3 relative">
                    <span className="absolute -top-3 left-2 bg-white dark:bg-gray-800 px-2 text-xs text-gray-500 dark:text-gray-400">
                      {i === 3 ? 'Second Row' : i === 6 ? 'Third Row' : `Row ${Math.floor(i/3) + 1}`}
                    </span>
                  </div>
                );
              }

              rows.push(
                <div key={`row-${i}`} className="contents">
                  {rowFunds.map(fund => (
                    <div
                      key={fund.id}
                      onClick={() => handleFundCardClick(fund.id)}
                      className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 border-l-4
                        ${filters.fund === fund.id ? 'border-blue-500 ring-2 ring-blue-500 ring-opacity-50' :
                          i === 0 ? 'border-green-500 dark:border-green-700' :
                          i === 3 ? 'border-yellow-500 dark:border-yellow-700' :
                          'border-gray-300 dark:border-gray-700'}
                        hover:shadow-lg transition-all cursor-pointer relative`}
                    >
                      {filters.fund === fund.id && (
                        <div className="absolute top-2 right-2">
                          <span className="flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-medium text-gray-900 dark:text-white">{fund.name}</h3>
                        {fund.type && (
                          <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                            {fund.type}
                          </span>
                        )}
                      </div>
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {fund.amount.toFixed(2)} XAF
                      </div>
                      <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                        </svg>
                        {filters.fund === fund.id ? 'Currently filtered' : 'Click to filter'}
                      </div>
                    </div>
                  ))}
                </div>
              );
            }

            return rows;
          })()}
        </div>
      </div>
      
        {/* Filters - Moved here between statistics and fund totals */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-6">
          <div className="flex flex-col md:flex-row md:items-end md:space-x-4">
            <div className="flex-1 mb-4 md:mb-0">
              <label htmlFor="member" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Member
              </label>
              <select
                id="member"
                name="member"
                value={filters.member}
                onChange={handleFilterChange}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">All Members</option>
                {members.map(member => (
                  <option key={member._id} value={member._id}>{member.name}</option>
                ))}
              </select>
            </div>

            <div className="flex-1 mb-4 md:mb-0">
              <label htmlFor="fund" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Fund
              </label>
              <select
                id="fund"
                name="fund"
                value={filters.fund}
                onChange={handleFilterChange}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">All Funds</option>
                {funds.map(fund => (
                  <option key={fund._id} value={fund._id}>{fund.name}</option>
                ))}
              </select>
            </div>

            <div className="flex-1 mb-4 md:mb-0">
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Date
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"></path>
                  </svg>
                </div>
                <input
                  type="date"
                  id="date"
                  name="date"
                  value={filters.date}
                  onChange={handleFilterChange}
                  className="w-full pl-10 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Select date"
                />
                {filters.date && (
                  <button
                    type="button"
                    onClick={() => setFilters(prev => ({ ...prev, date: '' }))}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                    title="Clear date"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            <div className="md:ml-2 flex justify-end md:self-end">
              <button
                onClick={resetFilters}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors whitespace-nowrap"
              >
                Reset Filters
              </button>
            </div>
          </div>

          {/* Active Filters Indicators */}
          {(filters.fund || filters.member || filters.date) && (
            <div className="mt-4 flex flex-wrap items-center gap-2 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center mr-2">
                <span className="mr-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500 dark:text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
                  </svg>
                </span>
                <span className="text-blue-700 dark:text-blue-300 font-medium">
                  Active Filters:
                </span>
              </div>

              {filters.fund && (
                <div className="flex items-center bg-white dark:bg-gray-800 px-3 py-1 rounded-full border border-blue-200 dark:border-blue-800">
                  <span className="text-sm text-gray-700 dark:text-gray-300 mr-2">
                    Fund: <strong>{funds.find(f => f._id === filters.fund)?.name}</strong>
                  </span>
                  <button
                    onClick={() => setFilters(prev => ({ ...prev, fund: '' }))}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              )}

              {filters.member && (
                <div className="flex items-center bg-white dark:bg-gray-800 px-3 py-1 rounded-full border border-blue-200 dark:border-blue-800">
                  <span className="text-sm text-gray-700 dark:text-gray-300 mr-2">
                    Member: <strong>{members.find(m => m._id === filters.member)?.name}</strong>
                  </span>
                  <button
                    onClick={() => setFilters(prev => ({ ...prev, member: '' }))}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              )}

              {filters.date && (
                <div className="flex items-center bg-white dark:bg-gray-800 px-3 py-1 rounded-full border border-blue-200 dark:border-blue-800">
                  <span className="text-sm text-gray-700 dark:text-gray-300 mr-2">
                    Date: <strong>{new Date(filters.date).toLocaleDateString()}</strong>
                  </span>
                  <button
                    onClick={() => setFilters(prev => ({ ...prev, date: '' }))}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    title="Clear date"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              )}

              <button
                onClick={resetFilters}
                className="ml-auto text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                </svg>
                Reset All Filters
              </button>
            </div>
          )}
        </div>
      </div>

      

      {/* Filters */}
      {/* <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-end md:space-x-4">
          <div className="flex-1 mb-4 md:mb-0">
            <label htmlFor="member" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Member
            </label>
            <select
              id="member"
              name="member"
              value={filters.member}
              onChange={handleFilterChange}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">All Members</option>
              {members.map(member => (
                <option key={member._id} value={member._id}>{member.name}</option>
              ))}
            </select>
          </div>

          <div className="flex-1 mb-4 md:mb-0">
            <label htmlFor="fund" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Fund
            </label>
            <select
              id="fund"
              name="fund"
              value={filters.fund}
              onChange={handleFilterChange}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">All Funds</option>
              {funds.map(fund => (
                <option key={fund._id} value={fund._id}>{fund.name}</option>
              ))}
            </select>
          </div>

          <div className="flex-1 mb-4 md:mb-0">
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Date
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"></path>
                </svg>
              </div>
              <input
                type="date"
                id="date"
                name="date"
                value={filters.date}
                onChange={handleFilterChange}
                className="w-full pl-10 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Select date"
              />
              {filters.date && (
                <button
                  type="button"
                  onClick={() => setFilters(prev => ({ ...prev, date: '' }))}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  title="Clear date"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          <div className="md:ml-2 flex justify-end md:self-end">
            <button
              onClick={resetFilters}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors whitespace-nowrap"
            >
              Reset Filters
            </button>
          </div>
        </div>
      </div> */}

      {/* Contributions Table */}

      {filteredContributions.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
          <p className="text-gray-500 dark:text-gray-400">No contributions found matching your filters.</p>
          {(filters.member || filters.fund || filters.date) && (
            <button
              onClick={resetFilters}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <div id="contributions-table" className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('date')}
                  >
                    <div className="flex items-center">
                      Date
                      {sortField === 'date' && (
                        <span className="ml-1">
                          {sortDirection === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('member')}
                  >
                    <div className="flex items-center">
                      Member
                      {sortField === 'member' && (
                        <span className="ml-1">
                          {sortDirection === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('fund')}
                  >
                    <div className="flex items-center">
                      Fund
                      {sortField === 'fund' && (
                        <span className="ml-1">
                          {sortDirection === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('amount')}
                  >
                    <div className="flex items-center justify-end">
                      Amount
                      {sortField === 'amount' && (
                        <span className="ml-1">
                          {sortDirection === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredContributions.map((contribution) => (
                  <tr key={contribution._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {formatDate(contribution.date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link href={`/members/${contribution.member._id}`} className="text-blue-500 hover:underline dark:text-blue-400">
                        {contribution.member.name}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link href={`/funds/${contribution.fund._id}`} className="text-blue-500 hover:underline dark:text-blue-400">
                        {contribution.fund.name}
                      </Link>
                      <span className="ml-2 px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                        {contribution.fund.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right font-medium">
                      {contribution.amount.toFixed(2)} XAF
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex justify-center space-x-2">
                        <Link
                          href={`/contributions/${contribution._id}`}
                          className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          View
                        </Link>
                        <button
                          onClick={() => handleDelete(contribution._id)}
                          className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              {/* <tfoot className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <td colSpan={3} className="px-6 py-4 text-right font-medium">
                    Total:
                  </td>
                  <td className="px-6 py-4 text-right font-bold">
                    {totalAmount.toFixed(2)} XAF
                  </td>
                  <td></td>
                </tr>
              </tfoot> */}
            </table>
          </div>
        </div>
      )}
      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-end md:space-x-4">
          <div className="flex-1 mb-4 md:mb-0">
            <label htmlFor="member" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Member
            </label>
            <select
              id="member"
              name="member"
              value={filters.member}
              onChange={handleFilterChange}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">All Members</option>
              {members.map(member => (
                <option key={member._id} value={member._id}>{member.name}</option>
              ))}
            </select>
          </div>

          <div className="flex-1 mb-4 md:mb-0">
            <label htmlFor="fund" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Fund
            </label>
            <select
              id="fund"
              name="fund"
              value={filters.fund}
              onChange={handleFilterChange}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">All Funds</option>
              {funds.map(fund => (
                <option key={fund._id} value={fund._id}>{fund.name}</option>
              ))}
            </select>
          </div>

          <div className="flex-1 mb-4 md:mb-0">
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Date
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"></path>
                </svg>
              </div>
              <input
                type="date"
                id="date"
                name="date"
                value={filters.date}
                onChange={handleFilterChange}
                className="w-full pl-10 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Select date"
              />
              {filters.date && (
                <button
                  type="button"
                  onClick={() => setFilters(prev => ({ ...prev, date: '' }))}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  title="Clear date"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          <div className="md:ml-2 flex justify-end md:self-end">
            <button
              onClick={resetFilters}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors whitespace-nowrap"
            >
              Reset Filters
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
