import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Contribution, Member, Fund, Transaction } from '@/models';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();

    // Get query parameters
    const url = new URL(req.url);
    const memberId = url.searchParams.get('member');
    const fundId = url.searchParams.get('fund');

    // Build query
    const query: any = {};
    if (memberId) query.member = memberId;
    if (fundId) query.fund = fundId;

    const contributions = await Contribution.find(query)
      .populate('member', 'name phoneNumber')
      .populate('fund', 'name type')
      .sort({ date: -1 });

    return NextResponse.json({ success: true, data: contributions });
  } catch (error) {
    console.error('Error fetching contributions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch contributions' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    await connectToDatabase();

    // Check if we're receiving a single contribution or multiple contributions
    const isMultipleContributions = Array.isArray(body);
    const contributionsData = isMultipleContributions ? body : [body];

    // Validate all contributions before processing
    for (const contribution of contributionsData) {
      // Validate member exists
      const member = await Member.findById(contribution.member);
      if (!member) {
        return NextResponse.json(
          { success: false, error: 'Member not found' },
          { status: 400 }
        );
      }

      // Validate fund exists
      const fund = await Fund.findById(contribution.fund);
      if (!fund) {
        return NextResponse.json(
          { success: false, error: `Fund not found: ${contribution.fund}` },
          { status: 400 }
        );
      }
    }

    // Process all contributions without using transactions
    try {
      const createdContributions = [];
      let totalContributionAmount = 0;
      const memberId = contributionsData[0].member; // All contributions should be for the same member

      // Create each contribution
      for (const contributionData of contributionsData) {
        // Create contribution
        const contribution = await Contribution.create(contributionData);

        // Find the fund for this contribution
        const fund = await Fund.findById(contributionData.fund);

        // Update fund total amount
        if (fund) {
          await fund.updateTotalAmount(contributionData.amount);
        }

        // Create a transaction for the contribution
        await Transaction.create({
          type: 'contribution',
          amount: contributionData.amount,
          date: contributionData.date || new Date(),
          description: `Contribution to ${fund ? fund.name : 'Unknown Fund'}`,
          member: contributionData.member,
          fund: contributionData.fund
        });

        // Populate references for response
        await contribution.populate('member', 'name phoneNumber');
        await contribution.populate('fund', 'name type');

        createdContributions.push(contribution);
        totalContributionAmount += contributionData.amount;
      }

      // Update member balance once for all contributions
      const member = await Member.findById(memberId);
      if (member) {
        await member.updateBalance(-totalContributionAmount);
      }

      // Return the appropriate response based on the request type
      if (isMultipleContributions) {
        return NextResponse.json({ success: true, data: createdContributions }, { status: 201 });
      } else {
        return NextResponse.json({ success: true, data: createdContributions[0] }, { status: 201 });
      }
    } catch (error) {
      // If an error occurs, we need to handle it but we can't roll back changes
      // since we're not using transactions
      console.error('Error during contribution creation:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error creating contribution:', error);
    return NextResponse.json(
      { success: false, error: `Failed to create contribution: ${error.message}` },
      { status: 500 }
    );
  }
}
