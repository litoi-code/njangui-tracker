import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../lib/dbConnect';
import LoanModel from '../../../models/Loan';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    await dbConnect();

    try {
        const loans = await LoanModel.find({ status: 'ACTIVE' });
        
        for (const loan of loans) {
            const monthsSinceLastUpdate = Math.floor(
                (new Date().getTime() - loan.lastInterestUpdate.getTime()) / (30 * 24 * 60 * 60 * 1000)
            );

            if (monthsSinceLastUpdate >= 1) {
                const monthlyRate = loan.interestRate / 12 / 100;
                const newBalance = loan.currentBalance * (1 + monthlyRate * monthsSinceLastUpdate);

                await LoanModel.findByIdAndUpdate(loan._id, {
                    currentBalance: newBalance,
                    lastInterestUpdate: new Date(),
                    updatedAt: new Date()
                });
            }
        }

        return res.status(200).json({ message: 'Interest updated successfully' });
    } catch (error) {
        return res.status(500).json({ error: 'Failed to update interest' });
    }
}
