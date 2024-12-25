import { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../lib/db';
import { Account } from '../../../lib/schemas';
import mongoose from 'mongoose';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();

  if (req.method === 'PUT') {
    try {
      const { id, name, accountType } = req.body;
      const accountId = new mongoose.Types.ObjectId(id); // Convert ID to ObjectId

      console.log("Update request received: ", { id, name, accountType });

      const account = await Account.findByIdAndUpdate(accountId, { name, accountType }, { new: true });
      if (!account) {
        return res.status(404).json({ error: 'Account not found' });
      }
      res.status(200).json({ message: 'Account updated successfully', account });
      console.log("Update Successful: ", account);
    } catch (error) {
      console.error('Failed to update account', error);
      res.status(500).json({ error: 'Failed to update account' });
    }
  } else {
    res.status(405).json({ error: 'Method Not Allowed' });
  }
}