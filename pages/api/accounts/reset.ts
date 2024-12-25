import { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../lib/db';
import { Account } from '../../../lib/schemas';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();

  if (req.method === 'PUT') {
    try {
      const { id } = req.body;
      const account = await Account.findByIdAndUpdate(id, { balance: 0 }, { new: true });
      if (!account) {
        return res.status(404).json({ error: 'Account not found' });
      }
      res.status(200).json({ message: 'Account balance reset successfully', account });
    } catch (error) {
      console.error('Failed to reset account balance', error);
      res.status(500).json({ error: 'Failed to reset account balance' });
    }
  } else {
    res.status(405).json({ error: 'Method Not Allowed' });
  }
}