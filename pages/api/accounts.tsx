import { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../lib/db';
import { AccountModel } from '../../models/Account'; // Corrected named import for Account model

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  await dbConnect(); // Establish database connection

  if (req.method === 'GET') {
    try {
      const accounts = await AccountModel.find({}); // Use the Account model to fetch accounts
      res.status(200).json(accounts);
    } catch (error) {
      console.error('Error fetching accounts:', error);
      console.error('Error object:', error); // Log the error object
      res.status(500).json({ error: 'Failed to fetch accounts' });
    }
  } else {
    res.status(405).json({ error: 'Method Not Allowed' });
  }
}
