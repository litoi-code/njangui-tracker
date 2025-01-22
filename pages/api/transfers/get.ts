import { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../lib/db';
import { Transfer } from '../../../lib/schemas';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    await dbConnect();

    if (req.method === 'GET') {
        try {
            const { startDate, endDate, accountId } = req.query;

            const query: any = {
                transferDate: {
                    $gte: new Date(startDate as string),
                    $lte: new Date(endDate as string),
                },
            };

            if (accountId) {
                query.$or = [
                    { sourceAccountId: accountId },
                    { 'recipientAccounts.accountId': accountId },
                ];
            }

            const transfers = await Transfer.find(query).populate('sourceAccountId recipientAccounts.accountId');
            res.status(200).json(transfers);
        } catch (error) {
            console.error('Failed to fetch transfers', error);
            res.status(500).json({ error: 'Failed to fetch transfers' });
        }
    } else {
        res.status(405).json({ error: 'Method Not Allowed' });
    }
}