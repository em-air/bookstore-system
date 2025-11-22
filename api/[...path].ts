import type { VercelRequest, VercelResponse } from '@vercel/node';
import app from '../server/index.js';

// Bridge Express app to Vercel catch-all function.
export default function handler(req: VercelRequest, res: VercelResponse) {
  // Ensure original path (rewrites keep /api/<rest>) is passed through untouched.
  return (app as any)(req, res);
}
