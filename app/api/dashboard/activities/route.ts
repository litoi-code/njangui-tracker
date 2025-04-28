import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Transaction, Loan, Contribution, Member, Fund, Penalty } from '@/models';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    
    // Get query parameters
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get('limit') || '10', 10);
    
    // Get recent transactions
    const recentTransactions = await Transaction.find()
      .sort({ date: -1 })
      .limit(20)
      .populate('member', 'name phoneNumber')
      .populate('fund', 'name type');
    
    // Get recent loans
    const recentLoans = await Loan.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('member', 'name phoneNumber')
      .populate('fund', 'name type');
    
    // Get recent contributions
    const recentContributions = await Contribution.find()
      .sort({ date: -1 })
      .limit(10)
      .populate('member', 'name phoneNumber')
      .populate('fund', 'name type');
    
    // Get recent members
    const recentMembers = await Member.find()
      .sort({ createdAt: -1 })
      .limit(5);
    
    // Get recent funds
    const recentFunds = await Fund.find()
      .sort({ createdAt: -1 })
      .limit(5);
    
    // Get recent penalties
    const recentPenalties = await Penalty.find()
      .sort({ date: -1 })
      .limit(10)
      .populate('member', 'name phoneNumber');
    
    // Transform data into activities format
    const activities = [
      // Transaction activities
      ...recentTransactions.map(transaction => ({
        id: transaction._id.toString(),
        type: 'transaction',
        action: `${transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)} Transaction`,
        description: transaction.description || `${transaction.type} transaction for ${transaction.member.name}`,
        date: transaction.date,
        amount: transaction.amount,
        link: {
          href: `/transactions?id=${transaction._id}`,
          label: 'View Transaction'
        }
      })),
      
      // Loan activities
      ...recentLoans.map(loan => ({
        id: loan._id.toString(),
        type: 'loan',
        action: `Loan ${loan.status.charAt(0).toUpperCase() + loan.status.slice(1)}`,
        description: `Loan of $${loan.amount} for ${loan.member.name}`,
        date: loan.createdAt,
        amount: loan.amount,
        status: loan.status,
        link: {
          href: `/loans/${loan._id}`,
          label: 'View Loan'
        }
      })),
      
      // Contribution activities
      ...recentContributions.map(contribution => ({
        id: contribution._id.toString(),
        type: 'contribution',
        action: 'New Contribution',
        description: `${contribution.member.name} contributed to ${contribution.fund.name}`,
        date: contribution.date,
        amount: contribution.amount,
        link: {
          href: `/contributions?id=${contribution._id}`,
          label: 'View Contribution'
        }
      })),
      
      // Member activities
      ...recentMembers.map(member => ({
        id: member._id.toString(),
        type: 'member',
        action: 'New Member',
        description: `${member.name} joined the system`,
        date: member.createdAt,
        link: {
          href: `/members/${member._id}`,
          label: 'View Member'
        }
      })),
      
      // Fund activities
      ...recentFunds.map(fund => ({
        id: fund._id.toString(),
        type: 'fund',
        action: 'New Fund',
        description: `${fund.name} fund was created`,
        date: fund.createdAt,
        link: {
          href: `/funds/${fund._id}`,
          label: 'View Fund'
        }
      })),
      
      // Penalty activities
      ...recentPenalties.map(penalty => ({
        id: penalty._id.toString(),
        type: 'penalty',
        action: 'Penalty Applied',
        description: `${penalty.reason} for ${penalty.member.name}`,
        date: penalty.date,
        amount: penalty.amount,
        status: penalty.status,
        link: {
          href: `/penalties?id=${penalty._id}`,
          label: 'View Penalty'
        }
      }))
    ];
    
    // Sort by date (newest first) and limit
    const sortedActivities = activities
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit);
    
    return NextResponse.json({
      success: true,
      data: sortedActivities
    });
  } catch (error) {
    console.error('Error fetching activities:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch activities' },
      { status: 500 }
    );
  }
}
