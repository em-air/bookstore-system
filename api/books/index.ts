import type { VercelRequest, VercelResponse } from '@vercel/node';
import { storage } from '../../server/storage.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ message: 'Method Not Allowed' });
  }
  try {
    const books = await storage.getAllBooks();
    return res.status(200).json(books);
  } catch (e: any) {
    return res.status(500).json({ message: 'Failed to fetch books' });
  }
}
