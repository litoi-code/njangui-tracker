import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Member, Fund, Transaction, Loan, Contribution, Penalty } from '@/models';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    
    // Get total members
    const totalMembers = await Member.countDocuments();
    const activeMembers = await Member.countDocuments({ status: 'active' });
    
    // Get total funds
    const funds = await Fund.find();
    const totalFunds = funds.length;
    const totalFundAmount = funds.reduce((sum, fund) => sum + fund.totalAmount, 0);
    
    // Get total loans
    const loans = await Loan.find();
    const totalLoans = loans.length;
    const activeLoans = await Loan.countDocuments({ status: 'active' });
    const totalLoanAmount = loans.reduce((sum, loan) => sum + loan.amount, 0);
    const totalOutstandingLoanAmount = loans
      .filter(loan => loan.status !== 'paid')
      .reduce((sum, loan) => sum + loan.remainingPrincipal + loan.remainingInterest, 0);
    
    // Get total contributions
    const contributions = await Contribution.find();
    const totalContributions = contributions.length;
    const totalContributionAmount = contributions.reduce((sum, contribution) => sum + contribution.amount, 0);
    
    // Get total penalties
    const penalties = await Penalty.find();
    const totalPenalties = penalties.length;
    const totalPenaltyAmount = penalties.reduce((sum, penalty) => sum + penalty.amount, 0);
    const unpaidPenalties = await Penalty.countDocuments({ status: 'pending' });
    
    // Get total transactions
    const transactions = await Transaction.find();
    const totalTransactions = transactions.length;
    
    // Get monthly transaction data for the last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const monthlyTransactions = await Transaction.aggregate([
      {
        $match: {
          date: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' }
          },
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);
    
    // Format monthly data
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyData = monthlyTransactions.map(item => ({
      month: `${monthNames[item._id.month - 1]} ${item._id.year}`,
      count: item.count,
      amount: item.totalAmount
    }));
    
    // Get fund distribution data
    const fundDistribution = funds.map(fund => ({
      name: fund.name,
      amount: fund.totalAmount
    }));
    
    // Get loan status distribution
    const loanStatusCounts = await Loan.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const loanStatusDistribution = loanStatusCounts.map(item => ({
      status: item._id,
      count: item.count
    }));
    
    // Get recent transactions
    const recentTransactions = await Transaction.find()
      .sort({ date: -1 })
      .limit(10)
      .populate('member', 'name phoneNumber')
      .populate('fund', 'name type');
    
    return NextResponse.json({
      success: true,
      data: {
        members: {
          total: totalMembers,
          active: activeMembers,
          inactive: totalMembers - activeMembers
        },
        funds: {
          total: totalFunds,
          totalAmount: totalFundAmount
        },
        loans: {
          total: totalLoans,
          active: activeLoans,
          totalAmount: totalLoanAmount,
          outstandingAmount: totalOutstandingLoanAmount
        },
        contributions: {
          total: totalContributions,
          totalAmount: totalContributionAmount
        },
        penalties: {
          total: totalPenalties,
          unpaid: unpaidPenalties,
          totalAmount: totalPenaltyAmount
        },
        transactions: {
          total: totalTransactions
        },
        charts: {
          monthlyTransactions: monthlyData,
          fundDistribution,
          loanStatusDistribution
        },
        recentTransactions
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch dashboard statistics' },
      { status: 500 }
    );
  }
}
