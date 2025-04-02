import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

interface UserData {
  userId: string;
  username: string;
}

export async function getUserFromToken(req: NextRequest): Promise<UserData | null> {
  const token = req.cookies.get('token')?.value || '';
  
  if (!token) return null;
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret') as UserData;
    return decoded;
  } catch (error: unknown) {
    console.error('Token verification error:', error);
    return null;
  }
} 