import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Fund, Contribution } from '@/models';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    const fund = await Fund.findById(params.id);
    
    if (!fund) {
      return NextResponse.json(
        { success: false, error: 'Fund not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true, data: fund });
  } catch (error) {
    console.error('Error fetching fund:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch fund' },
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
    
    // Check if updating name and if it already exists
    if (body.name) {
      const existingFund = await Fund.findOne({ 
        name: body.name,
        _id: { $ne: params.id }
      });
      
      if (existingFund) {
        return NextResponse.json(
          { success: false, error: 'Fund with this name already exists' },
          { status: 400 }
        );
      }
    }
    
    const fund = await Fund.findByIdAndUpdate(
      params.id,
      body,
      { new: true, runValidators: true }
    );
    
    if (!fund) {
      return NextResponse.json(
        { success: false, error: 'Fund not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true, data: fund });
  } catch (error) {
    console.error('Error updating fund:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update fund' },
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
    
    // Check if fund has any contributions
    const contributions = await Contribution.find({ fund: params.id });
    if (contributions.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Cannot delete fund with existing contributions' 
        },
        { status: 400 }
      );
    }
    
    const fund = await Fund.findByIdAndDelete(params.id);
    
    if (!fund) {
      return NextResponse.json(
        { success: false, error: 'Fund not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true, data: {} });
  } catch (error) {
    console.error('Error deleting fund:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete fund' },
      { status: 500 }
    );
  }
}
