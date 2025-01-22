import { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../lib/db';
import { Transfer, Account } from '../../../lib/schemas';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    await dbConnect();

    if (req.method === 'POST') {
        try {
            const { sourceAccountId, recipientAccounts, transferDate, description } = req.body;
            const sourceAccount = await Account.findOne({ _id: sourceAccountId, accountType: 'checking' });

            if (!sourceAccount) {
                return res.status(400).json({ error: 'Source account does not exist or is not a checking account' });
            }

            interface RecipientAccount {
                accountId: string;
                amount: number;
            }

            interface TransferRequestBody {
                sourceAccountId: string;
                recipientAccounts: RecipientAccount[];
                transferDate: string;
            }

            const totalTransferAmount: number = (req.body as TransferRequestBody).recipientAccounts.reduce((sum: number, rec: RecipientAccount) => sum + rec.amount, 0);

            // Update source account balance
            sourceAccount.balance -= totalTransferAmount;
            await sourceAccount.save();

            // Update recipient account balances
            await Promise.all(recipientAccounts.map(async (rec: RecipientAccount) => {
                try {
                    const recipientAccount = await Account.findById(rec.accountId);
                    if (recipientAccount) {
                        recipientAccount.balance += rec.amount;
                        await recipientAccount.save();
                    } else {
                        console.error(`Recipient account not found: ${rec.accountId}`);
                    }
                } catch (error) {
                    console.error(`Error updating recipient account ${rec.accountId}:`, error);
                    // Optionally, you could throw the error here to rollback the entire transaction
                }
            }));

            const transfer = new Transfer({
                sourceAccountId,
                recipientAccounts,
                transferDate: new Date(transferDate),
                description
            });
            await transfer.save();
            res.status(201).json({ message: 'Transfer created successfully', transfer });
        } catch (error) {
            console.error('Failed to create transfer', error);
            res.status(500).json({ error: 'Failed to create transfer' });
        }
    } else {
        res.status(405).json({ error: 'Method Not Allowed' });
    }
}
