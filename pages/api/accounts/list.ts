import { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../lib/db';
import { Account } from '../../../lib/schemas';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    await dbConnect();

    if (req.method === 'GET') {
        try {
            const { accountType, name } = req.query;
            let query: any = {};

            if (accountType) {
                 if (Array.isArray(accountType)) {
                     query.accountType = { $in: accountType };
                } else {
                     query.accountType = accountType;
                 }
            }

            if (name) {
                query.name = { $regex: name, $options: 'i' }; // Case-insensitive search
            }

            const accounts = await Account.find(query);
            res.status(200).json(accounts);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch accounts' });
        }
    } else {
        res.status(405).json({ error: 'Method Not Allowed' });
    }
}