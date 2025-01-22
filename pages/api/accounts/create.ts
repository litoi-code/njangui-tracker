import { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../lib/db';
import { Account } from '../../../lib/schemas';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();

  if (req.method === 'POST') {
    try {
      const { name, accountType } = req.body;
      const account = new Account({ name, accountType });
      await account.save();
      res.status(201).json({ message: 'Account created successfully', account });
    } catch (error) {
      res.status(500).json({ error: 'Failed to create account' });
    }
  } else {
    res.status(405).json({ error: 'Method Not Allowed' });
  }
}