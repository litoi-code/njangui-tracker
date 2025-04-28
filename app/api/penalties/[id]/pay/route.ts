import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Penalty, Member, Transaction } from '@/models';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    
    const penalty = await Penalty.findById(params.id);
    
    if (!penalty) {
      return NextResponse.json(
        { success: false, error: 'Penalty not found' },
        { status: 404 }
      );
    }
    
    if (penalty.status === 'paid') {
      return NextResponse.json(
        { success: false, error: 'This penalty has already been paid' },
        { status: 400 }
      );
    }
    
    // Get member
    const member = await Member.findById(penalty.member);
    
    if (!member) {
      return NextResponse.json(
        { success: false, error: 'Member not found' },
        { status: 404 }
      );
    }
    
    // Create transaction for penalty payment
    await Transaction.create({
      type: 'penalty',
      amount: penalty.amount,
      date: new Date(),
      description: `Penalty payment: ${penalty.reason}`,
      member: penalty.member
    });
    
    // Update member balance
    await member.updateBalance(-penalty.amount);
    
    // Mark penalty as paid
    await penalty.markAsPaid();
    
    // Refresh penalty data
    const updatedPenalty = await Penalty.findById(params.id)
      .populate('member', 'name phoneNumber');
    
    return NextResponse.json({ success: true, data: updatedPenalty });
  } catch (error) {
    console.error('Error processing penalty payment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process penalty payment' },
      { status: 500 }
    );
  }
}
