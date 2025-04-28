import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Transaction, Member } from '@/models';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    const transaction = await Transaction.findById(params.id)
      .populate('member', 'name phoneNumber')
      .populate('recipient', 'name phoneNumber')
      .populate('fund', 'name type')
      .populate('relatedTransaction');

    if (!transaction) {
      return NextResponse.json(
        { success: false, error: 'Transaction not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: transaction });
  } catch (error) {
    console.error('Error fetching transaction:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch transaction' },
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

    // Find the transaction
    const transaction = await Transaction.findById(params.id);

    if (!transaction) {
      return NextResponse.json(
        { success: false, error: 'Transaction not found' },
        { status: 404 }
      );
    }

    // Reverse the effect on member balance
    const member = await Member.findById(transaction.member);
    if (member) {
      let balanceChange = 0;

      switch (transaction.type) {
        case 'deposit':
          balanceChange = -transaction.amount;
          break;
        case 'withdrawal':
          balanceChange = transaction.amount;
          break;
        case 'loan':
          balanceChange = -transaction.amount;
          break;
        case 'repayment':
          balanceChange = transaction.amount;
          break;
      }

      if (balanceChange !== 0) {
        await member.updateBalance(balanceChange);
      }
    }

    // Delete the transaction
    await Transaction.findByIdAndDelete(params.id);

    return NextResponse.json({ success: true, data: {} });
  } catch (error) {
    console.error('Error deleting transaction:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete transaction' },
      { status: 500 }
    );
  }
}
