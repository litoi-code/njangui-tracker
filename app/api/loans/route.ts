import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Loan, Member, Fund, Transaction } from '@/models';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();

    // Get query parameters
    const url = new URL(req.url);
    const memberId = url.searchParams.get('member');
    const fundId = url.searchParams.get('fund');
    const status = url.searchParams.get('status');

    // Build query
    const query: any = {};
    if (memberId) query.member = memberId;
    if (fundId) query.fund = fundId;
    if (status) query.status = status;

    const loans = await Loan.find(query)
      .populate('member', 'name phoneNumber')
      .populate('fund', 'name type')
      .sort({ createdAt: -1 });

    return NextResponse.json({ success: true, data: loans });
  } catch (error) {
    console.error('Error fetching loans:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch loans' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    await connectToDatabase();

    // Validate member exists
    const member = await Member.findById(body.member);
    if (!member) {
      return NextResponse.json(
        { success: false, error: 'Member not found' },
        { status: 400 }
      );
    }

    // Validate fund exists
    const fund = await Fund.findById(body.fund);
    if (!fund) {
      return NextResponse.json(
        { success: false, error: 'Fund not found' },
        { status: 400 }
      );
    }

    // Check if fund is an investment fund
    if (fund.type !== 'investment') {
      return NextResponse.json(
        { success: false, error: 'Only investment funds can be used for loans' },
        { status: 400 }
      );
    }

    // Check if fund has enough balance
    if (fund.totalAmount < body.amount) {
      return NextResponse.json(
        { success: false, error: 'Fund does not have sufficient balance for this loan' },
        { status: 400 }
      );
    }

    // Create loan with updated fields
    const loan = await Loan.create({
      ...body,
      remainingPrincipal: body.amount,
      remainingInterest: 0,
      lastInterestCalculationDate: body.startDate || new Date()
    });

    // Create a transaction for the loan
    await Transaction.create({
      type: 'loan',
      amount: body.amount,
      date: body.startDate || new Date(),
      description: `Loan of ${body.amount} with ${body.interestRate}% interest from ${fund.name} fund`,
      member: body.member,
      fund: body.fund
    });

    // Update member balance
    await member.updateBalance(body.amount);

    // Update fund balance
    await fund.updateTotalAmount(-body.amount);

    // Populate references for response
    await loan.populate('member', 'name phoneNumber');
    await loan.populate('fund', 'name type');

    return NextResponse.json({ success: true, data: loan }, { status: 201 });
  } catch (error) {
    console.error('Error creating loan:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create loan' },
      { status: 500 }
    );
  }
}
