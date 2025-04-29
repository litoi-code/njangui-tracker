'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Member {
  _id: string;
  name: string;
  phoneNumber: string;
  address?: string;
  joinDate: string;
  status: 'active' | 'inactive' | 'suspended';
  balance: number;
}

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        // Add timestamp to prevent caching
        const response = await fetch(`/api/members?t=${new Date().getTime()}`);
        const result = await response.json();

        if (result.success) {
          setMembers(result.data);
          setFilteredMembers(result.data);
        } else {
          setError(result.error || 'Failed to fetch members');
        }
      } catch (err) {
        setError('An error occurred while fetching members');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, []);

  // Filter members when status filter changes
  useEffect(() => {
    if (statusFilter === 'all') {
      setFilteredMembers(members);
    } else {
      setFilteredMembers(members.filter(member => member.status === statusFilter));
    }
  }, [statusFilter, members]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this member?')) {
      return;
    }

    try {
      const response = await fetch(`/api/members/${id}`, {
        method: 'DELETE',
      });
      const result = await response.json();

      if (result.success) {
        setMembers(members.filter(member => member._id !== id));
      } else {
        alert(result.error || 'Failed to delete member');
      }
    } catch (err) {
      alert('An error occurred while deleting the member');
      console.error(err);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading members...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-500">{error}</div>;
  }

  return (
    <div className="py-8">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-2xl font-bold">Members</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Total: <span className="font-semibold">{members.length}</span> {members.length === 1 ? 'member' : 'members'}
          </p>
        </div>
        <Link
          href="/members/new"
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
        >
          Add New Member
        </Link>
      </div>

      {members.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div
            className={`bg-white dark:bg-gray-800 rounded-lg shadow p-4 border-l-4 border-blue-500 cursor-pointer transition-all ${statusFilter === 'all' ? 'ring-2 ring-blue-500' : 'hover:shadow-md'}`}
            onClick={() => setStatusFilter('all')}
          >
            <h3 className="text-lg font-semibold mb-2">Total Members</h3>
            <p className="text-3xl font-bold">{members.length}</p>
          </div>

          <div
            className={`bg-white dark:bg-gray-800 rounded-lg shadow p-4 border-l-4 border-green-500 cursor-pointer transition-all ${statusFilter === 'active' ? 'ring-2 ring-green-500' : 'hover:shadow-md'}`}
            onClick={() => setStatusFilter('active')}
          >
            <h3 className="text-lg font-semibold mb-2">Active Members</h3>
            <p className="text-3xl font-bold">{members.filter(m => m.status === 'active').length}</p>
          </div>

          <div
            className={`bg-white dark:bg-gray-800 rounded-lg shadow p-4 border-l-4 border-gray-500 cursor-pointer transition-all ${statusFilter === 'inactive' ? 'ring-2 ring-gray-500' : 'hover:shadow-md'}`}
            onClick={() => setStatusFilter('inactive')}
          >
            <h3 className="text-lg font-semibold mb-2">Inactive Members</h3>
            <p className="text-3xl font-bold">{members.filter(m => m.status === 'inactive').length}</p>
          </div>
        </div>
      )}

      {members.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No members found. Add your first member to get started.</p>
        </div>
      ) : filteredMembers.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p className="text-gray-500 dark:text-gray-400">No members found with the selected filter.</p>
          <button
            onClick={() => setStatusFilter('all')}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Show All Members
          </button>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center mb-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Showing {filteredMembers.length} {filteredMembers.length === 1 ? 'member' : 'members'}
              {statusFilter !== 'all' && ` with status: ${statusFilter}`}
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Filter:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm bg-white dark:bg-gray-700 dark:text-white"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-700">
                  <th className="py-2 px-4 border-b dark:border-gray-600 text-left">Name</th>
                  <th className="py-2 px-4 border-b dark:border-gray-600 text-left">Phone Number</th>
                  <th className="py-2 px-4 border-b dark:border-gray-600 text-left">Status</th>
                  <th className="py-2 px-4 border-b dark:border-gray-600 text-right">Balance</th>
                  <th className="py-2 px-4 border-b dark:border-gray-600 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMembers.map((member) => (
                <tr key={member._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="py-2 px-4 border-b dark:border-gray-600">
                    <Link href={`/members/${member._id}`} className="text-blue-500 hover:underline dark:text-blue-400">
                      {member.name}
                    </Link>
                  </td>
                  <td className="py-2 px-4 border-b dark:border-gray-600">{member.phoneNumber}</td>
                  <td className="py-2 px-4 border-b dark:border-gray-600">
                    <span className={`px-2 py-1 rounded text-xs ${
                      member.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' :
                      member.status === 'inactive' ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' :
                      'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'
                    }`}>
                      {member.status}
                    </span>
                  </td>
                  <td className="py-2 px-4 border-b dark:border-gray-600 text-right">
                    <span className={member.balance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                      {member.balance.toFixed(2)} XAF
                    </span>
                  </td>
                  <td className="py-2 px-4 border-b dark:border-gray-600 text-center">
                    <div className="flex justify-center space-x-2">
                      <Link
                        href={`/members/${member._id}/edit`}
                        className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(member._id)}
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
        </>
      )}
    </div>
  );
}
