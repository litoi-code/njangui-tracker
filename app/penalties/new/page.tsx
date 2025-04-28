'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Member {
  _id: string;
  name: string;
  phoneNumber: string;
  balance: number;
}

export default function NewPenaltyPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    amount: 0,
    reason: '',
    date: new Date().toISOString().split('T')[0],
    member: '',
    status: 'pending'
  });
  
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const response = await fetch('/api/members');
        const result = await response.json();
        
        if (result.success) {
          setMembers(result.data);
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: name === 'amount' ? parseFloat(value) || 0 : value
    }));
    
    // Update selected member
    if (name === 'member') {
      const member = members.find(m => m._id === value);
      setSelectedMember(member || null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    
    // Validate form data
    if (formData.amount <= 0) {
      setError('Amount must be greater than zero');
      setSubmitting(false);
      return;
    }
    
    if (!formData.reason.trim()) {
      setError('Please provide a reason for the penalty');
      setSubmitting(false);
      return;
    }
    
    if (!formData.member) {
      setError('Please select a member');
      setSubmitting(false);
      return;
    }
    
    try {
      const response = await fetch('/api/penalties', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      const result = await response.json();
      
      if (result.success) {
        router.push('/penalties');
      } else {
        setError(result.error || 'Failed to create penalty');
      }
    } catch (err) {
      setError('An error occurred while creating the penalty');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600 dark:border-primary-400"></div>
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
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-2xl font-bold">New Penalty</h1>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="mb-4">
                <label htmlFor="member" className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                  Member *
                </label>
                <select
                  id="member"
                  name="member"
                  value={formData.member}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Select a Member</option>
                  {members.map((member) => (
                    <option key={member._id} value={member._id}>
                      {member.name} ({member.phoneNumber})
                    </option>
                  ))}
                </select>
                
                {selectedMember && (
                  <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Current Balance: 
                      <span className={`ml-1 font-medium ${selectedMember.balance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        ${selectedMember.balance.toFixed(2)}
                      </span>
                    </p>
                  </div>
                )}
              </div>
              
              <div className="mb-4">
                <label htmlFor="amount" className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                  Amount *
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500 dark:text-gray-400">
                    $
                  </span>
                  <input
                    type="number"
                    id="amount"
                    name="amount"
                    value={formData.amount || ''}
                    onChange={handleChange}
                    step="0.01"
                    min="0.01"
                    required
                    className="w-full pl-8 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
              
              <div className="mb-4">
                <label htmlFor="date" className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                  Date
                </label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="status" className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                </select>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  If set to "Paid", the amount will be deducted from the member's balance immediately.
                </p>
              </div>
            </div>
            
            <div>
              <div className="mb-4">
                <label htmlFor="reason" className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                  Reason *
                </label>
                <textarea
                  id="reason"
                  name="reason"
                  value={formData.reason}
                  onChange={handleChange}
                  rows={6}
                  required
                  placeholder="Explain the reason for this penalty..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                ></textarea>
              </div>
              
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-4">
                <h3 className="text-yellow-800 dark:text-yellow-400 font-medium mb-2">Important Note</h3>
                <p className="text-yellow-700 dark:text-yellow-300 text-sm">
                  Penalties are used to enforce group rules and maintain discipline. When a penalty is marked as "Paid", 
                  the amount will be deducted from the member's balance and recorded as a transaction.
                </p>
              </div>
            </div>
          </div>
          
          <div className="mt-6 flex justify-end">
            <Link
              href="/penalties"
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded mr-2 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className={`px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors ${submitting ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {submitting ? 'Creating...' : 'Create Penalty'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
