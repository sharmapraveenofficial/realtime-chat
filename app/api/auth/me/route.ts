import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { connectToMongoDB } from '@/lib/mongodb';
import User from '@/models/User';

export async function GET(req: NextRequest) {
  try {
    // Get token from Authorization header or cookie
    let token;
    const authHeader = req.headers.get('Authorization');
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else {
      token = req.cookies.get('token')?.value;
    }
    
    if (!token) {
      return NextResponse.json(
        { error: 'No token provided' },
        { status: 401 }
      );
    }
    
    // Verify token
    const decoded: { userId: string } = jwt.verify(
      token,
      process.env.JWT_SECRET || 'fallback_secret'
    ) as { userId: string };
    
    // Connect to database
    await connectToMongoDB();
    
    // Get user data
    const user = await User.findById(decoded.userId).select('-password -faceData');
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Return user data
    return NextResponse.json({
      userId: user._id,
      username: user.username,
      email: user.email
    });
    
  } catch (error) {
    console.error('User profile fetch error:', error);
    return NextResponse.json(
      { error: 'Invalid or expired token' },
      { status: 401 }
    );
  }
} 