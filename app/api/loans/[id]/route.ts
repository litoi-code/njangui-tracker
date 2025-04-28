import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Loan, Member, Fund, Transaction } from '@/models';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();

    // Find the loan and update any accrued interest before returning
    const loan = await Loan.findById(params.id);

    if (!loan) {
      return NextResponse.json(
        { success: false, error: 'Loan not found' },
        { status: 404 }
      );
    }

    // Update interest if loan is active
    if (loan.status === 'active') {
      await loan.updateInterest();
    }

    // Populate references
    await loan.populate('member', 'name phoneNumber');
    await loan.populate('fund', 'name type');

    return NextResponse.json({ success: true, data: loan });
  } catch (error) {
    console.error('Error fetching loan:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch loan' },
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

    const loan = await Loan.findById(params.id);

    if (!loan) {
      return NextResponse.json(
        { success: false, error: 'Loan not found' },
        { status: 404 }
      );
    }

    // Update interest before processing status changes
    if (loan.status === 'active') {
      await loan.updateInterest();
    }

    // Handle loan status changes
    if (body.status && body.status !== loan.status) {
      if (body.status === 'approved' && loan.status === 'pending') {
        // If approving a pending loan, no special action needed
      } else if (body.status === 'active' && loan.status === 'approved') {
        // If activating an approved loan, set the interest calculation date to now
        body.lastInterestCalculationDate = new Date();
      } else if (body.status === 'paid' && loan.status !== 'paid') {
        // If marking as paid, ensure remaining principal and interest are 0
        const totalDue = loan.calculateTotalDue();

        // Create a transaction for the final payment if there's a remaining balance
        if (totalDue > 0) {
          const member = await Member.findById(loan.member);
          const fund = await Fund.findById(loan.fund);

          if (member && fund) {
            // Create transaction for the payment
            await Transaction.create({
              type: 'repayment',
              amount: totalDue,
              date: new Date(),
              description: `Final payment for loan ID: ${loan._id}`,
              member: loan.member,
              fund: loan.fund
            });

            // Update member balance
            await member.updateBalance(-totalDue);

            // Update fund balance (principal goes back to fund)
            await fund.updateTotalAmount(loan.remainingPrincipal);

            // Update fund interest earned (interest portion)
            await fund.addInterestEarned(loan.remainingInterest);
          }
        }

        body.remainingPrincipal = 0;
        body.remainingInterest = 0;
        body.principalPaid = loan.amount;
        body.interestPaid = loan.amount * (loan.interestRate / 100);
      } else if (body.status === 'defaulted') {
        // Handle defaulted loan - could implement write-off logic here
      }
    }

    // Update loan
    const updatedLoan = await Loan.findByIdAndUpdate(
      params.id,
      body,
      { new: true, runValidators: true }
    );

    // Populate references for response
    await updatedLoan.populate('member', 'name phoneNumber');
    await updatedLoan.populate('fund', 'name type');

    return NextResponse.json({ success: true, data: updatedLoan });
  } catch (error) {
    console.error('Error updating loan:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update loan' },
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

    const loan = await Loan.findById(params.id);

    if (!loan) {
      return NextResponse.json(
        { success: false, error: 'Loan not found' },
        { status: 404 }
      );
    }

    // Only allow deletion of pending loans
    if (loan.status !== 'pending') {
      return NextResponse.json(
        {
          success: false,
          error: 'Only pending loans can be deleted. Consider updating the status instead.'
        },
        { status: 400 }
      );
    }

    // If the loan has already been disbursed (fund balance updated), restore the fund balance
    if (loan.fund) {
      const fund = await Fund.findById(loan.fund);
      if (fund) {
        // Return the loan amount to the fund
        await fund.updateTotalAmount(loan.amount);
      }

      // Find and delete any related transactions
      await Transaction.deleteOne({
        type: 'loan',
        member: loan.member,
        fund: loan.fund,
        amount: loan.amount
      });

      // Update member balance if needed
      const member = await Member.findById(loan.member);
      if (member) {
        await member.updateBalance(-loan.amount);
      }
    }

    await Loan.findByIdAndDelete(params.id);

    return NextResponse.json({ success: true, data: {} });
  } catch (error) {
    console.error('Error deleting loan:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete loan' },
      { status: 500 }
    );
  }
}
