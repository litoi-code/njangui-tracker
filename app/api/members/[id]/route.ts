import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Member, Transaction } from '@/models';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    const member = await Member.findById(params.id);
    
    if (!member) {
      return NextResponse.json(
        { success: false, error: 'Member not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true, data: member });
  } catch (error) {
    console.error('Error fetching member:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch member' },
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
    
    // Check if updating phone number and if it already exists
    if (body.phoneNumber) {
      const existingMember = await Member.findOne({ 
        phoneNumber: body.phoneNumber,
        _id: { $ne: params.id }
      });
      
      if (existingMember) {
        return NextResponse.json(
          { success: false, error: 'Member with this phone number already exists' },
          { status: 400 }
        );
      }
    }
    
    const member = await Member.findByIdAndUpdate(
      params.id,
      body,
      { new: true, runValidators: true }
    );
    
    if (!member) {
      return NextResponse.json(
        { success: false, error: 'Member not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true, data: member });
  } catch (error) {
    console.error('Error updating member:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update member' },
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
    
    // Check if member has any transactions
    const transactions = await Transaction.find({ member: params.id });
    if (transactions.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Cannot delete member with existing transactions. Consider marking as inactive instead.' 
        },
        { status: 400 }
      );
    }
    
    const member = await Member.findByIdAndDelete(params.id);
    
    if (!member) {
      return NextResponse.json(
        { success: false, error: 'Member not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true, data: {} });
  } catch (error) {
    console.error('Error deleting member:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete member' },
      { status: 500 }
    );
  }
}
