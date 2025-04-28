import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Contribution, Member, Fund, Transaction } from '@/models';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    const contribution = await Contribution.findById(params.id)
      .populate('member', 'name phoneNumber')
      .populate('fund', 'name type');

    if (!contribution) {
      return NextResponse.json(
        { success: false, error: 'Contribution not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: contribution });
  } catch (error) {
    console.error('Error fetching contribution:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch contribution' },
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

    const contribution = await Contribution.findById(params.id);

    if (!contribution) {
      return NextResponse.json(
        { success: false, error: 'Contribution not found' },
        { status: 404 }
      );
    }

    try {
      // Find related transaction
      const transaction = await Transaction.findOne({
        type: 'contribution',
        member: contribution.member,
        fund: contribution.fund,
        amount: contribution.amount,
        date: contribution.date
      });

      // Delete transaction if found
      if (transaction) {
        await Transaction.findByIdAndDelete(transaction._id);
      }

      // Reverse the effect on fund total amount
      const fund = await Fund.findById(contribution.fund);
      if (fund) {
        await fund.updateTotalAmount(-contribution.amount);
      }

      // Reverse the effect on member balance
      const member = await Member.findById(contribution.member);
      if (member) {
        await member.updateBalance(contribution.amount);
      }

      // Delete the contribution
      await Contribution.findByIdAndDelete(params.id);

      return NextResponse.json({ success: true, data: {} });
    } catch (error) {
      console.error('Error during contribution deletion process:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error deleting contribution:', error);
    return NextResponse.json(
      { success: false, error: `Failed to delete contribution: ${error.message}` },
      { status: 500 }
    );
  }
}
