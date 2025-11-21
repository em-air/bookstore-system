import type { VercelRequest, VercelResponse } from '@vercel/node';

// Check environment variables
if (!process.env.DATABASE_URL) {
  console.error('ERROR: DATABASE_URL is not set');
}
if (!process.env.SESSION_SECRET) {
  console.error('ERROR: SESSION_SECRET is not set');
}

let app: any;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Lazy load the app
    if (!app) {
      app = (await import('../server/index')).default;
    }
    
    return app(req, res);
  } catch (error: any) {
    console.error('Handler error:', error);
    return res.status(500).json({ 
      message: 'Internal server error',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
