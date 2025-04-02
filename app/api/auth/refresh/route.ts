import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { connectToMongoDB } from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(req: NextRequest) {
  try {
    // Get the refresh token from cookies
    const refreshToken = req.cookies.get('refreshToken')?.value;
    
    if (!refreshToken) {
      return NextResponse.json(
        { error: 'No refresh token provided' },
        { status: 401 }
      );
    }
    
    // Verify the refresh token
    const decoded: { userId: string } = jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET || 'refresh_fallback_secret'
    ) as { userId: string };
    
    // Connect to database
    await connectToMongoDB();
    
    // Find the user
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 401 }
      );
    }
    
    // Generate a new access token
    const newToken = jwt.sign(
      { 
        userId: user._id,
        username: user.username 
      },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '1d' }
    );
    
    // Set the new token in a cookie and return it
    const response = NextResponse.json(
      { 
        message: 'Token refreshed successfully',
        token: newToken
      },
      { status: 200 }
    );
    
    response.cookies.set({
      name: 'token',
      value: newToken,
      httpOnly: true,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 // 1 day
    });
    
    return response;
    
  } catch (error) {
    console.error('Token refresh error:', error);
    return NextResponse.json(
      { error: 'Invalid or expired refresh token' },
      { status: 401 }
    );
  }
} 