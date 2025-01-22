import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    res.status(200).json({ message: 'Loans create endpoint hit' });
  } else {
    res.status(405).json({ message: 'Method Not Allowed' });
  }
}
