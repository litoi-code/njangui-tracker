import { NextApiRequest, NextApiResponse } from 'next';
import { Account, createLoan, getRepaymentSchedule } from '../../models/Account';

// ...existing code...

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    // ...existing code...
    if (req.method === 'POST' && req.body.action === 'createLoan') {
        const { principal, interestRate, term } = req.body;
        const loan = createLoan(principal, interestRate, term);
        const account: Account = { loan }; // Define the account variable
        res.status(200).json({ loan });
    } else if (req.method === 'GET' && req.query.action === 'getRepaymentSchedule') {
        const account: Account = {}; // Define the account variable
        const schedule = getRepaymentSchedule(account);
        res.status(200).json({ schedule });
    } else {
        res.status(405).end(); // Method Not Allowed
    }
}
