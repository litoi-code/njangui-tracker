'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

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

interface Member {
  _id: string;
  name: string;
  phoneNumber: string;
}

export default function PenaltiesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [penalties, setPenalties] = useState<Penalty[]>([]);
  const [filteredPenalties, setFilteredPenalties] = useState<Penalty[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [memberFilter, setMemberFilter] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<string>('');
  
  // Stats
  const [totalPenalties, setTotalPenalties] = useState(0);
  const [pendingAmount, setPendingAmount] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Check if there's a specific penalty ID in the URL
        const penaltyId = searchParams.get('id');
        
        if (penaltyId) {
          // Redirect to the penalty detail page
          router.push(`/penalties/${penaltyId}`);
          return;
        }
        
        // Fetch all penalties
        const penaltiesResponse = await fetch('/api/penalties');
        const penaltiesResult = await penaltiesResponse.json();
        
        if (penaltiesResult.success) {
          setPenalties(penaltiesResult.data);
          setFilteredPenalties(penaltiesResult.data);
          
          // Calculate stats
          const total = penaltiesResult.data.reduce((sum: number, penalty: Penalty) => sum + penalty.amount, 0);
          setTotalPenalties(total);
          
          const pending = penaltiesResult.data
            .filter((p: Penalty) => p.status === 'pending')
            .reduce((sum: number, penalty: Penalty) => sum + penalty.amount, 0);
          setPendingAmount(pending);
          
          const paid = penaltiesResult.data
            .filter((p: Penalty) => p.status === 'paid')
            .reduce((sum: number, penalty: Penalty) => sum + penalty.amount, 0);
          setPaidAmount(paid);
        } else {
          setError(penaltiesResult.error || 'Failed to fetch penalties');
        }
        
        // Fetch members for filter dropdown
        const membersResponse = await fetch('/api/members');
        const membersResult = await membersResponse.json();
        
        if (membersResult.success) {
          setMembers(membersResult.data);
        } else {
          console.error('Failed to fetch members');
        }
      } catch (err) {
        setError('An error occurred while fetching penalties');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [searchParams, router]);
  
  // Apply filters and search
  useEffect(() => {
    let result = [...penalties];
    
    // Apply search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(penalty => 
        penalty.member.name.toLowerCase().includes(term) ||
        penalty.reason.toLowerCase().includes(term)
      );
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      result = result.filter(penalty => penalty.status === statusFilter);
    }
    
    // Apply member filter
    if (memberFilter) {
      result = result.filter(penalty => penalty.member._id === memberFilter);
    }
    
    // Apply date filter
    if (dateFilter) {
      const filterDate = new Date(dateFilter);
      filterDate.setHours(0, 0, 0, 0);
      
      result = result.filter(penalty => {
        const penaltyDate = new Date(penalty.date);
        penaltyDate.setHours(0, 0, 0, 0);
        return penaltyDate.getTime() === filterDate.getTime();
      });
    }
    
    setFilteredPenalties(result);
  }, [penalties, searchTerm, statusFilter, memberFilter, dateFilter]);
  
  const handlePayPenalty = async (id: string) => {
    if (!confirm('Are you sure you want to mark this penalty as paid?')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/penalties/${id}/pay`, {
        method: 'POST'
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Update the penalty in the state
        setPenalties(prev => 
          prev.map(penalty => 
            penalty._id === id 
              ? { ...penalty, status: 'paid' } 
              : penalty
          )
        );
        
        // Update stats
        const paidPenalty = penalties.find(p => p._id === id);
        if (paidPenalty) {
          setPendingAmount(prev => prev - paidPenalty.amount);
          setPaidAmount(prev => prev + paidPenalty.amount);
        }
      } else {
        alert(result.error || 'Failed to pay penalty');
      }
    } catch (err) {
      alert('An error occurred while paying the penalty');
      console.error(err);
    }
  };
  
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this penalty?')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/penalties/${id}`, {
        method: 'DELETE'
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Remove the deleted penalty from state
        const deletedPenalty = penalties.find(p => p._id === id);
        setPenalties(prev => prev.filter(penalty => penalty._id !== id));
        
        // Update stats
        if (deletedPenalty) {
          setTotalPenalties(prev => prev - deletedPenalty.amount);
          if (deletedPenalty.status === 'pending') {
            setPendingAmount(prev => prev - deletedPenalty.amount);
          } else {
            setPaidAmount(prev => prev - deletedPenalty.amount);
          }
        }
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
  
  const resetFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setMemberFilter('');
    setDateFilter('');
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
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Penalties</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage member penalties and fines
          </p>
        </div>
        <Link 
          href="/penalties/new" 
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition-colors"
        >
          Add New Penalty
        </Link>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 border-l-4 border-blue-500">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase">Total Penalties</h3>
          <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">${totalPenalties.toFixed(2)}</p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 border-l-4 border-yellow-500">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase">Pending Amount</h3>
          <p className="mt-2 text-3xl font-bold text-yellow-600 dark:text-yellow-400">${pendingAmount.toFixed(2)}</p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 border-l-4 border-green-500">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase">Paid Amount</h3>
          <p className="mt-2 text-3xl font-bold text-green-600 dark:text-green-400">${paidAmount.toFixed(2)}</p>
        </div>
      </div>
      
      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Search
            </label>
            <input
              type="text"
              id="search"
              placeholder="Search by member name or reason..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
          
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Status
            </label>
            <select
              id="status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="member" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Member
            </label>
            <select
              id="member"
              value={memberFilter}
              onChange={(e) => setMemberFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="">All Members</option>
              {members.map((member) => (
                <option key={member._id} value={member._id}>{member.name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Date
            </label>
            <input
              type="date"
              id="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>
        
        <div className="mt-4 flex justify-end">
          <button
            onClick={resetFilters}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            Reset Filters
          </button>
        </div>
      </div>
      
      {/* Penalties List */}
      {filteredPenalties.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
          <p className="text-gray-500 dark:text-gray-400">No penalties found matching your filters.</p>
          {(searchTerm || statusFilter !== 'all' || memberFilter || dateFilter) && (
            <button
              onClick={resetFilters}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Member
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Reason
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredPenalties.map((penalty) => (
                  <tr key={penalty._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {formatDate(penalty.date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link href={`/members/${penalty.member._id}`} className="text-blue-500 hover:underline dark:text-blue-400">
                        {penalty.member.name}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <div className="line-clamp-2">{penalty.reason}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right font-medium">
                      ${penalty.amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        penalty.status === 'paid' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' 
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100'
                      }`}>
                        {penalty.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex justify-center space-x-2">
                        <Link
                          href={`/penalties/${penalty._id}/edit`}
                          className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          Edit
                        </Link>
                        
                        {penalty.status === 'pending' && (
                          <button
                            onClick={() => handlePayPenalty(penalty._id)}
                            className="text-green-500 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
                          >
                            Pay
                          </button>
                        )}
                        
                        <button
                          onClick={() => handleDelete(penalty._id)}
                          className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
