import type { VercelRequest, VercelResponse } from '@vercel/node';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { storage } from '../../server/storage.js';

const JWT_SECRET = process.env.SESSION_SECRET || 'your-secret-key-change-in-production';

export default async function handler(req: VercelRequest, res: VercelResponse) {
	if (req.method !== 'POST') {
		res.setHeader('Allow', 'POST');
		return res.status(405).json({ message: 'Method Not Allowed' });
	}

	let body: any = (req as any).body;
	if (!body) {
		let raw = '';
		await new Promise<void>(resolve => {
			req.on('data', chunk => { raw += chunk; });
			req.on('end', () => resolve());
		});
		if (raw) {
			try { body = JSON.parse(raw); } catch {
				body = Object.fromEntries(new URLSearchParams(raw));
			}
		}
	} else if (typeof body === 'string') {
		try { body = JSON.parse(body); } catch { return res.status(400).json({ message: 'Invalid JSON' }); }
	}
	if (!body || typeof body !== 'object') {
		const q: any = (req as any).query || {};
		if (q.email && q.password) {
			body = { email: q.email, password: q.password };
		} else {
			return res.status(400).json({ message: 'Invalid JSON' });
		}
	}

	try {
		const { email, password } = body;
		if (!email || !password) return res.status(400).json({ message: 'Email and password required' });
		const user = await storage.getUserByEmail(email);
		if (!user) return res.status(401).json({ message: 'Invalid credentials' });
		const validPassword = await bcrypt.compare(password, user.password);
		if (!validPassword) return res.status(401).json({ message: 'Invalid credentials' });
		const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
		const { password: _, ...userWithoutPassword } = user;
		return res.status(200).json({ user: userWithoutPassword, token });
	} catch (e: any) {
		console.error('Login error:', e);
		return res.status(500).json({ message: 'Login failed' });
	}
}
