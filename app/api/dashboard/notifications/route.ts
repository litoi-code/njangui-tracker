import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Loan, Penalty, Member, Fund } from '@/models';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    
    // Get query parameters
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get('limit') || '10', 10);
    
    const notifications = [];
    
    // Check for loans approaching due date (within 7 days)
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    
    const today = new Date();
    
    const loansApproachingDueDate = await Loan.find({
      status: 'active',
      dueDate: { $lte: sevenDaysFromNow, $gte: today }
    }).populate('member', 'name');
    
    loansApproachingDueDate.forEach(loan => {
      const daysRemaining = Math.ceil((new Date(loan.dueDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      notifications.push({
        id: `loan-due-${loan._id}`,
        title: `Loan Payment Due Soon`,
        message: `${loan.member.name}'s loan of $${loan.amount} is due in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}.`,
        type: daysRemaining <= 3 ? 'warning' : 'info',
        date: new Date().toISOString(),
        isRead: false,
        link: {
          href: `/loans/${loan._id}`,
          label: 'View Loan'
        }
      });
    });
    
    // Check for overdue loans
    const overdueLoans = await Loan.find({
      status: 'active',
      dueDate: { $lt: today }
    }).populate('member', 'name');
    
    overdueLoans.forEach(loan => {
      const daysOverdue = Math.ceil((today.getTime() - new Date(loan.dueDate).getTime()) / (1000 * 60 * 60 * 24));
      
      notifications.push({
        id: `loan-overdue-${loan._id}`,
        title: `Loan Payment Overdue`,
        message: `${loan.member.name}'s loan of $${loan.amount} is overdue by ${daysOverdue} day${daysOverdue !== 1 ? 's' : ''}.`,
        type: 'error',
        date: new Date().toISOString(),
        isRead: false,
        link: {
          href: `/loans/${loan._id}`,
          label: 'View Loan'
        }
      });
    });
    
    // Check for unpaid penalties
    const unpaidPenalties = await Penalty.find({
      status: 'pending'
    }).populate('member', 'name');
    
    unpaidPenalties.forEach(penalty => {
      notifications.push({
        id: `penalty-unpaid-${penalty._id}`,
        title: `Unpaid Penalty`,
        message: `${penalty.member.name} has an unpaid penalty of $${penalty.amount} for ${penalty.reason}.`,
        type: 'warning',
        date: new Date().toISOString(),
        isRead: false,
        link: {
          href: `/penalties?id=${penalty._id}`,
          label: 'View Penalty'
        }
      });
    });
    
    // Check for low fund balances (less than 10% of total)
    const funds = await Fund.find();
    const totalFundsAmount = funds.reduce((sum, fund) => sum + fund.totalAmount, 0);
    const lowBalanceFunds = funds.filter(fund => fund.totalAmount < (totalFundsAmount * 0.1));
    
    lowBalanceFunds.forEach(fund => {
      notifications.push({
        id: `fund-low-${fund._id}`,
        title: `Low Fund Balance`,
        message: `${fund.name} fund has a low balance of $${fund.totalAmount.toFixed(2)}.`,
        type: 'warning',
        date: new Date().toISOString(),
        isRead: false,
        link: {
          href: `/funds/${fund._id}`,
          label: 'View Fund'
        }
      });
    });
    
    // Check for inactive members
    const inactiveMembers = await Member.find({
      status: 'inactive'
    });
    
    if (inactiveMembers.length > 0) {
      notifications.push({
        id: `inactive-members`,
        title: `Inactive Members`,
        message: `There are ${inactiveMembers.length} inactive members in the system.`,
        type: 'info',
        date: new Date().toISOString(),
        isRead: false,
        link: {
          href: `/members?status=inactive`,
          label: 'View Members'
        }
      });
    }
    
    // Sort notifications by date (newest first) and limit
    const sortedNotifications = notifications
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit);
    
    return NextResponse.json({
      success: true,
      data: sortedNotifications
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}
