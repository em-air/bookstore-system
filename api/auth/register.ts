import type { VercelRequest, VercelResponse } from '@vercel/node';

// Dynamic import ensures build doesn't fail on path or extension issues.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const mod = await import('../../server/index.ts');
    const app = mod.default;
    return (app as any)(req, res);
  } catch (e: any) {
    console.error('Auth register handler failed:', e);
    res.status(500).json({ message: 'Server init failed', error: e?.message });
  }
}
