import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../lib/dbConnect';
import LoanModel from '../../../models/Loan';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    await dbConnect();

    if (req.method === 'GET') {
        try {
            const loans = await LoanModel.find({});
            return res.status(200).json(loans);
        } catch (error) {
            return res.status(500).json({ error: 'Failed to fetch loans' });
        }
    }

    if (req.method === 'POST') {
        try {
            const newLoan = await LoanModel.create({
                ...req.body,
                currentBalance: req.body.principal,
                lastInterestUpdate: new Date()
            });
            return res.status(201).json(newLoan);
        } catch (error) {
            return res.status(500).json({ error: 'Failed to create loan' });
        }
    }
}
