import type { VercelRequest, VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';
import { storage } from '../../../server/storage.js';
const JWT_SECRET = process.env.SESSION_SECRET || 'your-secret-key-change-in-production';
function auth(req: VercelRequest){const h=req.headers['authorization'];if(!h||!h.startsWith('Bearer '))return null;try{return jwt.verify(h.slice(7),JWT_SECRET) as {userId:number;role:string};}catch{return null;}}
export default async function handler(req: VercelRequest,res: VercelResponse){
  const user=auth(req); if(!user || (user.role!=='staff' && user.role!=='admin')) return res.status(403).json({message:'Staff access required'});
  if(req.method==='GET'){ try{ const refunds=await storage.getAllRefunds(); return res.status(200).json(refunds);}catch{ return res.status(500).json({message:'Failed to fetch refunds'});} }
  res.setHeader('Allow','GET'); return res.status(405).json({message:'Method Not Allowed'});
}
