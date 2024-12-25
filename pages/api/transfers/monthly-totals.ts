import { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../lib/db';
import { Transfer } from '../../../lib/schemas';
import { startOfMonth, endOfMonth, format, eachMonthOfInterval } from 'date-fns';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    await dbConnect();

    if (req.method === 'GET') {
        try {
            const {startDate, endDate, accountId} = req.query;
            const start = new Date(startDate as string);
            const end = new Date(endDate as string);
            const months = eachMonthOfInterval({ start, end });

            const monthlyTotals = await Promise.all(
                months.map(async (month) => {
                    const startOfMonthDate = startOfMonth(month);
                    const endOfMonthDate = endOfMonth(month);

                    let matchQuery: any = {
                        transferDate: { $gte: startOfMonthDate, $lte: endOfMonthDate },
                    };
                     if (accountId) {
                        matchQuery.$or = [
                          { sourceAccountId: accountId },
                          { 'recipientAccounts.accountId': accountId },
                        ];
                      }

                    const transfers = await Transfer.aggregate([
                        {
                            $match: matchQuery,
                        },
                        {
                            $unwind: "$recipientAccounts",
                        },
                        {
                          $group: {
                            _id: "$recipientAccounts.accountId",
                            totalAmount: { $sum: "$recipientAccounts.amount" },
                          },
                        },
                          {
                            $lookup: {
                              from: "accounts",
                              localField: "_id",
                              foreignField: "_id",
                              as: "accountDetails"
                            }
                          },
                        {
                            $unwind: "$accountDetails"
                        },
                        {
                            $project: {
                              _id: 0,
                              month: format(month, 'MMM yyyy'),
                              accountId: "$_id",
                              accountName: "$accountDetails.name",
                              totalAmount: 1
                            }
                          }

                      ]);

                    return {
                        month: format(month, 'MMM yyyy'),
                         transfers,
                    };
                })
            );


            res.status(200).json(monthlyTotals);
        } catch (error) {
            console.error("Error fetching monthly totals:", error);
            res.status(500).json({ error: 'Failed to fetch monthly totals' });
        }
    } else {
        res.status(405).json({ error: 'Method Not Allowed' });
    }
}