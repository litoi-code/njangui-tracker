import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Loan, Member, Fund, Transaction } from '@/models';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { amount } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Please provide a valid amount' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const loan = await Loan.findById(params.id);

    if (!loan) {
      return NextResponse.json(
        { success: false, error: 'Loan not found' },
        { status: 404 }
      );
    }

    if (loan.status === 'paid') {
      return NextResponse.json(
        { success: false, error: 'This loan has already been fully paid' },
        { status: 400 }
      );
    }

    // Get member
    const member = await Member.findById(loan.member);

    if (!member) {
      return NextResponse.json(
        { success: false, error: 'Member not found' },
        { status: 404 }
      );
    }

    // Get fund
    const fund = await Fund.findById(loan.fund);

    if (!fund) {
      return NextResponse.json(
        { success: false, error: 'Fund not found' },
        { status: 404 }
      );
    }

    // First, update any accrued interest
    await loan.updateInterest();

    // Calculate how much of the payment goes to interest vs principal
    const interestPayment = Math.min(amount, loan.remainingInterest);
    const principalPayment = amount - interestPayment;

    // Create repayment transaction
    await Transaction.create({
      type: 'repayment',
      amount,
      date: new Date(),
      description: `Repayment for loan ID: ${loan._id} (Interest: $${interestPayment.toFixed(2)}, Principal: $${principalPayment.toFixed(2)})`,
      member: loan.member,
      fund: loan.fund
    });

    // Update member balance
    await member.updateBalance(-amount);

    // Update loan with payment
    await loan.makePayment(amount);

    // Update fund balance (principal goes back to fund)
    if (principalPayment > 0) {
      await fund.updateTotalAmount(principalPayment);
    }

    // Refresh loan data
    const updatedLoan = await Loan.findById(params.id)
      .populate('member', 'name phoneNumber')
      .populate('fund', 'name type');

    return NextResponse.json({ success: true, data: updatedLoan });
  } catch (error) {
    console.error('Error processing loan repayment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process loan repayment' },
      { status: 500 }
    );
  }
}
