import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Penalty, Member, Transaction } from '@/models';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    
    // Get query parameters
    const url = new URL(req.url);
    const memberId = url.searchParams.get('member');
    const status = url.searchParams.get('status');
    
    // Build query
    const query: any = {};
    if (memberId) query.member = memberId;
    if (status) query.status = status;
    
    const penalties = await Penalty.find(query)
      .populate('member', 'name phoneNumber')
      .sort({ date: -1 });
      
    return NextResponse.json({ success: true, data: penalties });
  } catch (error) {
    console.error('Error fetching penalties:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch penalties' },
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
    
    // Create penalty
    const penalty = await Penalty.create(body);
    
    // If penalty is marked as paid immediately, create a transaction and update member balance
    if (body.status === 'paid') {
      // Create a transaction for the penalty payment
      await Transaction.create({
        type: 'penalty',
        amount: body.amount,
        date: body.date || new Date(),
        description: `Penalty payment: ${body.reason}`,
        member: body.member
      });
      
      // Update member balance
      await member.updateBalance(-body.amount);
    }
    
    // Populate references for response
    await penalty.populate('member', 'name phoneNumber');
    
    return NextResponse.json({ success: true, data: penalty }, { status: 201 });
  } catch (error) {
    console.error('Error creating penalty:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create penalty' },
      { status: 500 }
    );
  }
}
