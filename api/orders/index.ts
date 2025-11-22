import type { VercelRequest, VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';
import { storage } from '../../server/storage.js';
const JWT_SECRET=process.env.SESSION_SECRET||'your-secret-key-change-in-production';
function auth(req:VercelRequest){const h=req.headers['authorization'];if(!h||!h.startsWith('Bearer '))return null;try{return jwt.verify(h.slice(7),JWT_SECRET) as {userId:number;role:string};}catch{return null;}}
export default async function handler(req:VercelRequest,res:VercelResponse){
 const user=auth(req); if(!user) return res.status(401).json({message:'Authentication required'});
 if(req.method==='GET'){ try{ const orders=await storage.getUserOrders(user.userId); return res.status(200).json(orders);}catch{ return res.status(500).json({message:'Failed to fetch orders'});} }
 if(req.method==='POST'){
  let raw=''; await new Promise<void>(r=>{req.on('data',c=>raw+=c);req.on('end',r);});
  let body:any={}; if(raw){ try{ body=JSON.parse(raw);}catch{ body=Object.fromEntries(new URLSearchParams(raw)); }}
  const cardId=body.cardId?parseInt(body.cardId,10):undefined;
  try{ const cartItems=await storage.getCartItems(user.userId); if(cartItems.length===0) return res.status(400).json({message:'Cart is empty'}); const order=await storage.createOrder(user.userId,cartItems,cardId); return res.status(200).json(order);}catch{ return res.status(500).json({message:'Failed to create order'});} }
 res.setHeader('Allow','GET, POST'); return res.status(405).json({message:'Method Not Allowed'});
}
