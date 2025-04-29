'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

interface Member {
  _id: string;
  name: string;
  phoneNumber: string;
  balance: number;
}

interface Fund {
  _id: string;
  name: string;
  type: string;
  totalAmount: number;
}

interface FundContribution {
  fundId: string;
  amount: number;
}

export default function NewContributionPage() {
  const searchParams = useSearchParams();
  // Set August 31, 2024 as the default date
  // Using a direct string to avoid timezone issues
  const defaultDateString = '2024-11-30'; // Format: YYYY-MM-DD

  const [formData, setFormData] = useState({
    // date: new Date().toISOString().split('T')[0],
    date: defaultDateString, // Directly use the formatted string
    member: searchParams?.get('member') || '',
    host: ''
  });

  const [fundContributions, setFundContributions] = useState<FundContribution[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [funds, setFunds] = useState<Fund[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [totalAmount, setTotalAmount] = useState(0);
  const [insufficientBalance, setInsufficientBalance] = useState(false);

  // Use a ref to track if this is the first render
  const isFirstRender = React.useRef(true);

  // Add a useEffect to update the total amount whenever fundContributions changes
  useEffect(() => {
    if (fundContributions.length > 0) {
      const total = fundContributions.reduce((sum, fc) => sum + (fc.amount || 0), 0);
      setTotalAmount(total);

      // Check if member has sufficient balance
      if (selectedMember) {
        setInsufficientBalance(total > selectedMember.balance);
      }

      console.log('Updated total amount:', total);
    }
  }, [fundContributions, selectedMember]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch members
        const membersResponse = await fetch('/api/members');
        const membersResult = await membersResponse.json();

        if (membersResult.success) {
          const fetchedMembers = membersResult.data;
          setMembers(fetchedMembers);

          // Only set preselections on first render
          if (isFirstRender.current) {
            // Set selected member if ID is in URL
            if (formData.member) {
              const member = fetchedMembers.find((m: Member) => m._id === formData.member);
              if (member) {
                setSelectedMember(member);
              }
            }

            // Preselect the second member (index 1) as host if we have enough members
            if (fetchedMembers.length >= 2) {
              setFormData(prev => ({
                ...prev,
                host: fetchedMembers[6]._id
              }));
            }

            // Mark that we're no longer on first render
            isFirstRender.current = false;
          }
        } else {
          setError(membersResult.error || 'Failed to fetch members');
        }

        // Fetch funds
        const fundsResponse = await fetch('/api/funds');
        const fundsResult = await fundsResponse.json();

        if (fundsResult.success) {
          const fetchedFunds = fundsResult.data;
          setFunds(fetchedFunds);

          // Initialize fund contributions with default amounts
          // Set the second fund (index 1) to 3500 if it exists
          const initialFundContributions = fetchedFunds.map((fund: Fund, index: number) => ({
            fundId: fund._id,
            amount: index === 1 ? 3500 : 0
          }));

          // Calculate the initial total amount from the contributions
          const initialTotal = initialFundContributions.reduce((sum: number, fc: FundContribution) => sum + (fc.amount || 0), 0);

          // Set the fund contributions and total amount
          setFundContributions(initialFundContributions);
          setTotalAmount(initialTotal);

          // Check if member has sufficient balance
          if (selectedMember) {
            setInsufficientBalance(initialTotal > selectedMember.balance);
          }

          console.log('Initial fund contributions:', initialFundContributions);
          console.log('Initial total amount:', initialTotal);
        } else {
          setError(fundsResult.error || 'Failed to fetch funds');
        }
      } catch (err) {
        setError('An error occurred while fetching data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [formData.member]);

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    // Clear success message when user makes changes
    setSuccessMessage('');

    // Handle regular form fields
    if (['member', 'host', 'date'].includes(name)) {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));

      // Update selected member
      if (name === 'member') {
        if (value) {
          try {
            // Fetch the latest member data to ensure we have the most up-to-date balance
            const response = await fetch(`/api/members/${value}?t=${new Date().getTime()}`);
            const result = await response.json();

            if (result.success) {
              setSelectedMember(result.data);
            } else {
              const member = members.find(m => m._id === value);
              setSelectedMember(member || null);
            }
          } catch (err) {
            console.error('Error fetching member details:', err);
            const member = members.find(m => m._id === value);
            setSelectedMember(member || null);
          }
        } else {
          setSelectedMember(null);
        }
      }
    }
  };

  // Handle fund contribution amount changes
  const handleFundAmountChange = (fundId: string, amount: number) => {
    const newAmount = isNaN(amount) ? 0 : amount;

    // Clear success message when user changes amounts
    setSuccessMessage('');

    // Update the fund contributions
    setFundContributions(prev =>
      prev.map(fc =>
        fc.fundId === fundId
          ? { ...fc, amount: newAmount }
          : fc
      )
    );

    // Note: We don't need to manually update the total amount here
    // because the useEffect hook will handle that whenever fundContributions changes
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccessMessage('');

    // Validate form data
    if (totalAmount <= 0) {
      setError('Total contribution amount must be greater than zero');
      setSubmitting(false);
      return;
    }

    if (!formData.member) {
      setError('Please select a member');
      setSubmitting(false);
      return;
    }

    // Filter out funds with zero contributions
    const nonZeroContributions = fundContributions.filter(fc => fc.amount > 0);

    if (nonZeroContributions.length === 0) {
      setError('Please enter at least one fund contribution amount');
      setSubmitting(false);
      return;
    }

    // Inform if balance is insufficient, but don't block submission
    if (insufficientBalance) {
      const currentBalance = selectedMember?.balance || 0;

      const confirmContinue = confirm(
        `Note: The member's balance (${currentBalance.toFixed(2)} XAF) is less than the total contribution amount (${totalAmount.toFixed(2)} XAF). Do you want to continue?`
      );

      if (!confirmContinue) {
        setSubmitting(false);
        return;
      }
    }

    try {
      // Prepare all contributions with non-zero amounts
      const contributionsData = nonZeroContributions.map(fc => ({
        member: formData.member,
        fund: fc.fundId,
        amount: fc.amount,
        date: formData.date,
        host: formData.host || undefined
      }));

      // Send all contributions in a single request
      const response = await fetch('/api/contributions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(contributionsData),
      });

      const result = await response.json();

      // Check if the request was successful
      if (result.success) {
        // Show success message with contributor's name
        const contributorName = selectedMember?.name || 'member';
        setSuccessMessage(`Successfully created ${nonZeroContributions.length} contribution(s) for ${contributorName} totaling ${totalAmount.toFixed(2)} XAF`);

        // Clear error message if there was one
        setError('');

        // Reset form for a new contribution but keep the same member selected
        const currentMemberId = formData.member;

        // Reset fund contributions to initial state
        const resetFundContributions = funds.map((fund: Fund, index: number) => ({
          fundId: fund._id,
          amount: index === 1 ? 3500 : 0
        }));

        setFundContributions(resetFundContributions);

        // Calculate the new total
        const newTotal = resetFundContributions.reduce((sum: number, fc: FundContribution) => sum + (fc.amount || 0), 0);
        setTotalAmount(newTotal);

        // Fetch the latest member data to get updated balance
        if (currentMemberId) {
          try {
            const response = await fetch(`/api/members/${currentMemberId}?t=${new Date().getTime()}`);
            const result = await response.json();

            if (result.success) {
              // Update the selected member with fresh data
              setSelectedMember(result.data);

              // Update the success message with the latest member name
              const updatedMemberName = result.data.name || selectedMember?.name || 'member';
              setSuccessMessage(`Successfully created ${nonZeroContributions.length} contribution(s) for ${updatedMemberName} totaling ${totalAmount.toFixed(2)} XAF`);

              // Check if the member has sufficient balance for the new contribution
              setInsufficientBalance(newTotal > result.data.balance);
            }
          } catch (err) {
            console.error('Error fetching updated member details:', err);
          }
        }

        // Scroll to the top of the form to show the success message
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setError(result.error || 'Failed to create contributions');
        setSuccessMessage('');
      }
    } catch (err) {
      setError('An error occurred while creating the contributions');
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
      {/* Header Section */}
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">New Contribution</h1>
            <div className="flex items-center mt-2">
              <Link href="/contributions" className="text-blue-500 hover:underline dark:text-blue-400 flex items-center text-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
                Back to Contributions
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {successMessage && (
            <div className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <p className="text-green-600 dark:text-green-400 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                {successMessage}
              </p>
            </div>
          )}

          {/* Total Amount Display - Moved to top */}
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex justify-between items-center">
              <div className="text-lg font-semibold text-blue-700 dark:text-blue-300">
                Total Contribution Amount:
              </div>
              <div className="text-3xl font-bold text-blue-900 dark:text-blue-100">
                {totalAmount.toFixed(2)} XAF
              </div>
            </div>

            {selectedMember && (
              <div className="mt-2 flex justify-between items-center text-sm">
                <div className="text-gray-600 dark:text-gray-400">
                  Member's Current Balance:
                </div>
                <div className={selectedMember.balance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                  {selectedMember.balance.toFixed(2)} XAF
                </div>
              </div>
            )}
          </div>

          {/* Main Form */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* Member Selector */}
            <div>
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
                      {selectedMember.balance.toFixed(2)} XAF
                    </span>
                  </p>
                </div>
              )}
            </div>

            {/* Host Selector */}
            <div>
              <label htmlFor="host" className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                Host (Optional)
              </label>
              <select
                id="host"
                name="host"
                value={formData.host}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">Select a Host (Optional)</option>
                {members.map((member) => (
                  <option key={member._id} value={member._id}>
                    {member.name} ({member.phoneNumber})
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Optional: Select a member who is hosting this contribution session
              </p>
            </div>

            {/* Date Picker */}
            <div>
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
          </div>

          {/* Dynamic Funds Grid - Two columns */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-4 border-b pb-2 border-gray-200 dark:border-gray-700">
              Fund Contributions
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {funds.map((fund, index) => {
                const fundContribution = fundContributions.find(fc => fc.fundId === fund._id);
                const amount = fundContribution ? fundContribution.amount : 0;
                const isSecondFund = index === 1;

                return (
                  <div
                    key={fund._id}
                    className={`${isSecondFund ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'} border rounded-lg p-4 hover:shadow-md transition-shadow`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          {fund.name}
                        </h3>
                        <span className="inline-block mt-1 px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                          {fund.type}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Balance: {fund.totalAmount.toFixed(2)} XAF
                        {amount > 0 && (
                          <span className="ml-1 text-green-600 dark:text-green-400">
                            (+{amount.toFixed(2)} XAF)
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500 dark:text-gray-400">
                        XAF
                      </span>
                      <input
                        type="number"
                        value={amount}
                        onChange={(e) => handleFundAmountChange(fund._id, parseFloat(e.target.value))}
                        step="0.01"
                        min="0"
                        placeholder="Enter amount"
                        className={`w-full pl-8 px-3 py-2 border ${isSecondFund ? 'border-blue-300 dark:border-blue-700 focus:ring-blue-500' : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'} rounded-md focus:outline-none focus:ring-2 dark:bg-gray-700 dark:text-white`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <Link
              href="/contributions"
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded mr-2 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting || totalAmount <= 0}
              className={`px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors ${
                (submitting || totalAmount <= 0) ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {submitting ? 'Creating...' : 'Create Contribution'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
