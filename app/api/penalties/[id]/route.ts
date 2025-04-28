import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Penalty, Member, Transaction } from '@/models';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    const penalty = await Penalty.findById(params.id)
      .populate('member', 'name phoneNumber');
    
    if (!penalty) {
      return NextResponse.json(
        { success: false, error: 'Penalty not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true, data: penalty });
  } catch (error) {
    console.error('Error fetching penalty:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch penalty' },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    await connectToDatabase();
    
    const penalty = await Penalty.findById(params.id);
    
    if (!penalty) {
      return NextResponse.json(
        { success: false, error: 'Penalty not found' },
        { status: 404 }
      );
    }
    
    // Handle status change from pending to paid
    if (body.status === 'paid' && penalty.status === 'pending') {
      // Create a transaction for the penalty payment
      await Transaction.create({
        type: 'penalty',
        amount: penalty.amount,
        date: new Date(),
        description: `Penalty payment: ${penalty.reason}`,
        member: penalty.member
      });
      
      // Update member balance
      const member = await Member.findById(penalty.member);
      if (member) {
        await member.updateBalance(-penalty.amount);
      }
    }
    
    // Update penalty
    const updatedPenalty = await Penalty.findByIdAndUpdate(
      params.id,
      body,
      { new: true, runValidators: true }
    );
    
    // Populate references for response
    await updatedPenalty.populate('member', 'name phoneNumber');
    
    return NextResponse.json({ success: true, data: updatedPenalty });
  } catch (error) {
    console.error('Error updating penalty:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update penalty' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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
    
    // If penalty was paid, reverse the effect on member balance
    if (penalty.status === 'paid') {
      const member = await Member.findById(penalty.member);
      if (member) {
        await member.updateBalance(penalty.amount);
      }
      
      // Find and delete related transaction
      await Transaction.deleteOne({
        type: 'penalty',
        amount: penalty.amount,
        member: penalty.member,
        description: { $regex: penalty.reason }
      });
    }
    
    // Delete the penalty
    await Penalty.findByIdAndDelete(params.id);
    
    return NextResponse.json({ success: true, data: {} });
  } catch (error) {
    console.error('Error deleting penalty:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete penalty' },
      { status: 500 }
    );
  }
}
