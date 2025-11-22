import type { VercelRequest, VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';
import { storage } from '../../../server/storage.js';
const JWT_SECRET = process.env.SESSION_SECRET || 'your-secret-key-change-in-production';
function auth(req: VercelRequest){const h=req.headers['authorization'];if(!h||!h.startsWith('Bearer '))return null;try{return jwt.verify(h.slice(7),JWT_SECRET) as {userId:number;role:string};}catch{return null;}}
export default async function handler(req: VercelRequest,res: VercelResponse){
  const user=auth(req); if(!user || (user.role!=='staff' && user.role!=='admin')) return res.status(403).json({message:'Staff access required'});
  const id=parseInt((req.query as any).id,10); if(Number.isNaN(id)) return res.status(400).json({message:'Invalid id'});
  if(req.method==='PATCH'){
    let raw=''; await new Promise<void>(r=>{req.on('data',c=>raw+=c);req.on('end',r);});
    let body:any={}; if(raw){ try{ body=JSON.parse(raw);}catch{ body=Object.fromEntries(new URLSearchParams(raw)); }}
    const status=body.status; if(!['pending','processing','completed','cancelled','shipped'].includes(status)) return res.status(400).json({message:'Invalid status'});
    try{ const order=await storage.updateOrderStatus(id,status); if(!order) return res.status(404).json({message:'Order not found'}); return res.status(200).json(order);}catch{ return res.status(500).json({message:'Failed to update order'});}
  }
  res.setHeader('Allow','PATCH'); return res.status(405).json({message:'Method Not Allowed'});
}
