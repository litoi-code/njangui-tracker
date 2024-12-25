import { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../lib/db';
import { Account, Transfer } from '../../../lib/schemas';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();

  if (req.method === 'DELETE') {
    try {
      const { id } = req.query;
       // Check if there are any transfers associated with the account
      const transfers = await Transfer.find({
        $or: [{ sourceAccountId: id }, { 'recipientAccounts.accountId': id }],
      });

      if (transfers.length > 0) {
        return res
          .status(400)
          .json({ error: "Cannot delete account with existing transfers" });
      }


      const account = await Account.findByIdAndDelete(id);
      if (!account) {
        return res.status(404).json({ error: 'Account not found' });
      }
      res.status(200).json({ message: 'Account deleted successfully', account });
    } catch (error) {
      console.error('Failed to delete account', error);
      res.status(500).json({ error: 'Failed to delete account' });
    }
  } else {
    res.status(405).json({ error: 'Method Not Allowed' });
  }
}