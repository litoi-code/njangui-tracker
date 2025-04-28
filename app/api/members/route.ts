import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Member } from '@/models';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const members = await Member.find({}).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: members });
  } catch (error) {
    console.error('Error fetching members:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch members' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    await connectToDatabase();
    
    // Check if member with phone number already exists
    const existingMember = await Member.findOne({ phoneNumber: body.phoneNumber });
    if (existingMember) {
      return NextResponse.json(
        { success: false, error: 'Member with this phone number already exists' },
        { status: 400 }
      );
    }
    
    const member = await Member.create(body);
    return NextResponse.json({ success: true, data: member }, { status: 201 });
  } catch (error) {
    console.error('Error creating member:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create member' },
      { status: 500 }
    );
  }
}
