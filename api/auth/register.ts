import type { VercelRequest, VercelResponse } from '@vercel/node';

// Direct bridge for /api/auth/register to Express app
import app from '../../../server/index.js';

export default function handler(req: VercelRequest, res: VercelResponse) {
  (app as any)(req, res);
}
