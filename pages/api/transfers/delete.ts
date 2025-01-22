import { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../lib/db';
import { ObjectId } from 'mongodb';
import mongoose from 'mongoose';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'DELETE') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        const { transferId } = req.query;

        if (!transferId || typeof transferId !== 'string') {
            return res.status(400).json({ message: 'Invalid transfer ID' });
        }

        await dbConnect();
        const db = mongoose.connection.db;
        if (!db) {
            return res.status(500).json({ message: 'Database connection not established' });
        }
        const transfersCollection = db.collection('transfers');
        const accountsCollection = db.collection('accounts');

        const transfer = await transfersCollection.findOne({ _id: new ObjectId(transferId) });
        if (!transfer) {
            return res.status(404).json({ message: 'Transfer not found' });
        }

        const sourceAccountId = transfer.sourceAccountId;
        const recipientAccounts = transfer.recipientAccounts;

        // Calculate total transfer amount
        const totalTransferAmount = recipientAccounts.reduce((sum: number, recipient: { amount: number }) => sum + recipient.amount, 0);

        // Update source account balance
        const updateSourceResult = await accountsCollection.updateOne(
            { _id: new ObjectId(sourceAccountId) },
            { $inc: { balance: totalTransferAmount } }
        );

        if (updateSourceResult.modifiedCount !== 1) {
            console.error('Error updating source account balance');
            return res.status(500).json({ message: 'Failed to update source account balance' });
        }

        // Update recipient account balances
        for (const recipient of recipientAccounts) {
            const updateRecipientResult = await accountsCollection.updateOne(
                { _id: new ObjectId(recipient.accountId) },
                { $inc: { balance: -recipient.amount } }
            );

            if (updateRecipientResult.modifiedCount !== 1) {
                console.error('Error updating recipient account balance:', recipient.accountId);
                return res.status(500).json({ message: 'Failed to update recipient account balance' });
            }
        }

        // Delete the transfer
        const deleteResult = await transfersCollection.deleteOne({ _id: new ObjectId(transferId) });
        if (deleteResult.deletedCount !== 1) {
            console.error('Error deleting transfer');
            return res.status(500).json({ message: 'Failed to delete transfer' });
        }

        res.status(200).json({ message: 'Transfer deleted and accounts updated successfully' });
    } catch (error) {
        console.error('Error deleting transfer:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}
