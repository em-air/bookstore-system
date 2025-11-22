import type { VercelRequest, VercelResponse } from '@vercel/node';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { storage } from '../../server/storage.js';
import { insertUserSchema } from '../../shared/schema.js';
import { z } from 'zod';

const JWT_SECRET = process.env.SESSION_SECRET || 'your-secret-key-change-in-production';

export default async function handler(req: VercelRequest, res: VercelResponse) {
	if (req.method !== 'POST') {
		res.setHeader('Allow', 'POST');
		return res.status(405).json({ message: 'Method Not Allowed' });
	}

	let body: any = req.body;
	if (typeof body === 'string') {
		try { body = JSON.parse(body); } catch { return res.status(400).json({ message: 'Invalid JSON' }); }
	}
	if (!body || typeof body !== 'object') {
		return res.status(400).json({ message: 'Invalid JSON' });
	}

	try {
		const data = insertUserSchema.parse(body);
		const existing = await storage.getUserByEmail(data.email);
		if (existing) return res.status(400).json({ message: 'Email already registered' });
		const role = (data as any).role || 'customer';
		if (!['customer','staff','admin'].includes(role)) {
			return res.status(400).json({ message: 'Invalid role' });
		}
		const hashedPassword = await bcrypt.hash(data.password, 10);
		const user = await storage.createUser({
			...data,
			password: hashedPassword,
			role: role as 'customer'|'staff'|'admin'
		});
		const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
		const { password, ...userWithoutPassword } = user;
		return res.status(200).json({ user: userWithoutPassword, token });
	} catch (e: any) {
		if (e instanceof z.ZodError) {
			return res.status(400).json({ message: e.errors[0].message });
		}
		console.error('Registration error:', e);
		return res.status(500).json({ message: 'Registration failed' });
	}
}
