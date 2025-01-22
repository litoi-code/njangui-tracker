import { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../lib/db';
import { AccountModel } from '../../../models/Account';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ message: 'Missing or invalid account ID' });
  }

  try {
    await dbConnect();
    const account = await AccountModel.findById(id);

    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }

    return res.status(200).json(account);
  } catch (error) {
    console.error('Error fetching account:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
