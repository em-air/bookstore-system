import type { VercelRequest, VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';
import { storage } from '../../server/storage.js';
import { insertReviewSchema } from '../../shared/schema.js';
import { z } from 'zod';
const JWT_SECRET=process.env.SESSION_SECRET||'your-secret-key-change-in-production';
function auth(req:VercelRequest){const h=req.headers['authorization'];if(!h||!h.startsWith('Bearer '))return null;try{return jwt.verify(h.slice(7),JWT_SECRET) as {userId:number;role:string};}catch{return null;}}
export default async function handler(req:VercelRequest,res:VercelResponse){
  const user=auth(req); if(!user) return res.status(401).json({message:'Authentication required'});
  if(req.method==='POST'){
    let raw=''; await new Promise<void>(r=>{req.on('data',c=>raw+=c);req.on('end',r);});
    let body:any={}; if(raw){ try{ body=JSON.parse(raw);}catch{ body=Object.fromEntries(new URLSearchParams(raw)); }}
    try{ const data=insertReviewSchema.parse({ ...body, userId:user.userId }); const purchased=await storage.hasUserPurchasedBook(user.userId,data.bookId); if(!purchased) return res.status(403).json({message:'You can only review books you have purchased'}); const review=await storage.createReview(data); return res.status(200).json(review);}catch(e:any){ if(e instanceof z.ZodError) return res.status(400).json({message:e.errors[0].message}); return res.status(500).json({message:'Failed to create review'});} }
  res.setHeader('Allow','POST'); return res.status(405).json({message:'Method Not Allowed'});
}
