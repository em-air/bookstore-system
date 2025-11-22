import type { VercelRequest, VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';
import { storage } from '../../server/storage.js';
const JWT_SECRET=process.env.SESSION_SECRET||'your-secret-key-change-in-production';
function auth(req:VercelRequest){const h=req.headers['authorization'];if(!h||!h.startsWith('Bearer '))return null;try{return jwt.verify(h.slice(7),JWT_SECRET) as {userId:number;role:string};}catch{return null;}}
export default async function handler(req:VercelRequest,res:VercelResponse){
  const user=auth(req); if(!user) return res.status(401).json({message:'Authentication required'});
  const id=parseInt((req.query as any).id,10); if(Number.isNaN(id)) return res.status(400).json({message:'Invalid id'});
  if(req.method==='DELETE'){ try{ await storage.deleteCard(id); return res.status(200).json({message:'Card deleted'});}catch{ return res.status(500).json({message:'Failed to delete card'});} }
  res.setHeader('Allow','DELETE'); return res.status(405).json({message:'Method Not Allowed'});
}
