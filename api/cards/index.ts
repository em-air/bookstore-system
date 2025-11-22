import type { VercelRequest, VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';
import { storage } from '../../server/storage.js';
import { insertCardSchema } from '../../shared/schema.js';
import { z } from 'zod';
const JWT_SECRET = process.env.SESSION_SECRET || 'your-secret-key-change-in-production';
function auth(req: VercelRequest){const h=req.headers['authorization'];if(!h||!h.startsWith('Bearer '))return null;try{return jwt.verify(h.slice(7),JWT_SECRET) as {userId:number;role:string};}catch{return null;}}
export default async function handler(req: VercelRequest,res: VercelResponse){
  const user=auth(req); if(!user) return res.status(401).json({message:'Authentication required'});
  if(req.method==='GET'){ try{ const cards=await storage.getUserCards(user.userId); return res.status(200).json(cards);}catch{ return res.status(500).json({message:'Failed to fetch cards'});} }
  if(req.method==='POST'){
    let raw=''; await new Promise<void>(r=>{req.on('data',c=>raw+=c);req.on('end',r);});
    let body:any={}; if(raw){ try{ body=JSON.parse(raw);}catch{ body=Object.fromEntries(new URLSearchParams(raw)); }}
    try{ const data = insertCardSchema.parse({ ...body, userId: user.userId }); const card=await storage.createCard(data); return res.status(200).json(card);}catch(e:any){ if(e instanceof z.ZodError) return res.status(400).json({message:e.errors[0].message}); return res.status(500).json({message:'Failed to create card'});} }
  res.setHeader('Allow','GET, POST'); return res.status(405).json({message:'Method Not Allowed'});
}
