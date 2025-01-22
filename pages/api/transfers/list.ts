import { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../lib/db';
import { Transfer } from '../../../lib/schemas';
import mongoose from 'mongoose';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    await dbConnect();

    if (req.method === 'GET') {
        try {
            const { startDate, endDate, accountId, transferType } = req.query;
            let query: any = {};

            if (startDate && endDate) {
                query.transferDate = {
                    $gte: new Date(startDate as string),
                    $lte: new Date(endDate as string),
                };
            }

            if (accountId) {
                if (!mongoose.isValidObjectId(accountId as string)) {
                    return res.status(400).json({ error: 'Invalid accountId' });
                }
                const objectId = new mongoose.Types.ObjectId(accountId as string);
                if (transferType === 'in') {
                    query.recipientAccounts = { $elemMatch: { accountId: objectId } };
                } else if (transferType === 'out') {
                    query.sourceAccountId = objectId;
                } else {
                    query['$or'] = [
                        { sourceAccountId: objectId },
                        { recipientAccounts: { $elemMatch: { accountId: objectId } } },
                    ];
                }
            }

            const transfers = await Transfer.find(query)
                .populate('sourceAccountId')
                .populate('recipientAccounts.accountId');
            res.status(200).json(transfers);
        } catch (error: any) {
            console.error("Error fetching transfers:", error);
            res.status(500).json({ error: 'Failed to fetch transfers', message: error.message });
        }
    } else {
        res.status(405).json({ error: 'Method Not Allowed' });
    }
}
