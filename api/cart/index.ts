import type { VercelRequest, VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';
import { storage } from '../../server/storage.js';

const JWT_SECRET = process.env.SESSION_SECRET || 'your-secret-key-change-in-production';

function authenticate(req: VercelRequest): { userId?: number; role?: string } {
  const auth = req.headers['authorization'];
  if (!auth || !auth.startsWith('Bearer ')) return {};
  try {
    const token = auth.slice(7);
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number; role: string };
    return { userId: decoded.userId, role: decoded.role };
  } catch { return {}; }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ message: 'Method Not Allowed' });
  }
  const { userId } = authenticate(req);
  if (!userId) return res.status(401).json({ message: 'Authentication required' });
  try {
    const items = await storage.getCartItems(userId);
    return res.status(200).json(items);
  } catch {
    return res.status(500).json({ message: 'Failed to fetch cart' });
  }
}
