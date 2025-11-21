import type { VercelRequest, VercelResponse } from '@vercel/node';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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
    // Debug: check what files exist
    const serverPath = path.join(process.cwd(), 'server');
    const serverExists = fs.existsSync(serverPath);
    console.log('Server folder exists:', serverExists);
    if (serverExists) {
      const files = fs.readdirSync(serverPath);
      console.log('Server folder contents:', files);
    }
    
    // Lazy load the app
    if (!app) {
      console.log('Loading app from server/index...');
      app = (await import('../server/index')).default;
      console.log('App loaded successfully');
    }
    
    return app(req, res);
  } catch (error: any) {
    console.error('Handler error:', error);
    console.error('Error stack:', error.stack);
    console.error('CWD:', process.cwd());
    console.error('__dirname would be:', __dirname);
    
    return res.status(500).json({ 
      message: 'Internal server error',
      error: error.message,
      cwd: process.cwd(),
      stack: error.stack
    });
  }
}
