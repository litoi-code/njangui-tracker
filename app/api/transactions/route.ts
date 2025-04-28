import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Transaction, Member, Fund } from '@/models';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();

    // Get query parameters
    const url = new URL(req.url);
    const memberId = url.searchParams.get('member');
    const fundId = url.searchParams.get('fund');
    const type = url.searchParams.get('type');

    // Build query
    const query: any = {};
    if (memberId) query.member = memberId;
    if (fundId) query.fund = fundId;
    if (type) query.type = type;

    const transactions = await Transaction.find(query)
      .populate('member', 'name phoneNumber')
      .populate('recipient', 'name phoneNumber')
      .populate('fund', 'name type')
      .sort({ date: -1 });

    return NextResponse.json({ success: true, data: transactions });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch transactions' },
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

    // Validate fund exists if provided
    if (body.fund) {
      const fund = await Fund.findById(body.fund);
      if (!fund) {
        return NextResponse.json(
          { success: false, error: 'Fund not found' },
          { status: 400 }
        );
      }
    }

    // Handle member-to-member transfers
    if (body.type === 'transfer' && body.recipient) {
      // Validate recipient exists
      const recipient = await Member.findById(body.recipient);
      if (!recipient) {
        return NextResponse.json(
          { success: false, error: 'Recipient member not found' },
          { status: 400 }
        );
      }

      // Create the sender's transaction (outgoing)
      const senderTransaction = await Transaction.create({
        ...body,
        description: body.description || `Transfer to ${recipient.name}`,
      });

      // Update sender's balance (deduct amount)
      await member.updateBalance(-body.amount);

      // Create the recipient's transaction (incoming)
      const recipientTransaction = await Transaction.create({
        type: 'deposit',
        amount: body.amount,
        date: body.date,
        description: `Transfer from ${member.name}`,
        member: body.recipient,
        relatedTransaction: senderTransaction._id
      });

      // Update recipient's balance (add amount)
      await recipient.updateBalance(body.amount);

      // Link the transactions
      senderTransaction.relatedTransaction = recipientTransaction._id;
      await senderTransaction.save();

      // Populate references for response
      await senderTransaction.populate('member', 'name phoneNumber');
      await senderTransaction.populate('recipient', 'name phoneNumber');

      return NextResponse.json({ success: true, data: senderTransaction }, { status: 201 });
    }

    // For non-transfer transactions
    const transaction = await Transaction.create(body);

    // Update member balance based on transaction type
    let balanceChange = 0;

    switch (body.type) {
      case 'deposit':
        balanceChange = body.amount;
        break;
      case 'withdrawal':
        balanceChange = -body.amount;
        break;
      case 'loan':
        balanceChange = body.amount;
        break;
      case 'repayment':
        balanceChange = -body.amount;
        break;
      case 'contribution':
        // Contributions are handled by the Contribution model
        break;
      case 'penalty':
        // Penalties are handled by the Penalty model
        break;
    }

    if (balanceChange !== 0) {
      await member.updateBalance(balanceChange);
    }

    // Populate references for response
    await transaction.populate('member', 'name phoneNumber');
    if (body.fund) {
      await transaction.populate('fund', 'name type');
    }

    return NextResponse.json({ success: true, data: transaction }, { status: 201 });
  } catch (error) {
    console.error('Error creating transaction:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create transaction' },
      { status: 500 }
    );
  }
}
