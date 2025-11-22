import type { VercelRequest, VercelResponse } from '@vercel/node';
// Dynamic import to avoid extension stripping issues in ESM compilation
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const mod = await import('../server/index.js');
    const app = mod.default;
    return (app as any)(req, res);
  } catch (e: any) {
    console.error('Failed to load express app:', e);
    res.status(500).json({ message: 'Server init failed', error: e?.message });
  }
}
