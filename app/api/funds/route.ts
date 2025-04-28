import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Fund } from '@/models';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const funds = await Fund.find({}).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: funds });
  } catch (error) {
    console.error('Error fetching funds:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch funds' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    await connectToDatabase();
    
    // Check if fund with name already exists
    const existingFund = await Fund.findOne({ name: body.name });
    if (existingFund) {
      return NextResponse.json(
        { success: false, error: 'Fund with this name already exists' },
        { status: 400 }
      );
    }
    
    const fund = await Fund.create(body);
    return NextResponse.json({ success: true, data: fund }, { status: 201 });
  } catch (error) {
    console.error('Error creating fund:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create fund' },
      { status: 500 }
    );
  }
}
