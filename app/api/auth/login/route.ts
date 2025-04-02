import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { connectToMongoDB } from '@/lib/mongodb';
import User from '@/models/User';
import { compareFaces } from '@/lib/faceRecognition';
import ChatRoom from '@/models/ChatRoom';

export async function POST(req: NextRequest) {
  try {
    const { username, password, faceData } = await req.json();

    // Validate inputs
    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    // Connect to database
    await connectToMongoDB();

    // Find user
    const user = await User.findOne({ username });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);

    console.log('isPasswordValid:', isPasswordValid);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Verify face if provided
    if (faceData) {
      const isFaceMatch = await compareFaces(faceData, user.faceData);
      if (!isFaceMatch) {
        return NextResponse.json(
          { error: 'Face verification failed' },
          { status: 401 }
        );
      }
    } else {
      return NextResponse.json(
        { error: 'Face data is required for authentication' },
        { status: 400 }
      );
    }

    // After successful authentication, check for pending invites by user's email
    const roomsWithInvites = await ChatRoom.find({
      'pendingInvites.email': user.email.toLowerCase(),
      'pendingInvites.status': 'pending'
    });

    // Add user to these rooms and remove pendingInvites
    for (const room of roomsWithInvites) {
      // Add user to participants if not already there
      if (!room.participants.some((p: string) => p.toString() === user._id.toString())) {
        room.participants.push(user._id);
      }
      
      // Remove matching invitations from pendingInvites
      room.pendingInvites = room.pendingInvites.filter((invite: { email: string; status: string }) => 
        !(invite.email.toLowerCase() === user.email.toLowerCase() && 
          invite.status === 'pending')
      );
      
      await room.save();
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user._id,
        username: user.username 
      },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '1d' }
    );

    // Generate refresh token
    const refreshToken = jwt.sign(
      { userId: user._id },
      process.env.REFRESH_TOKEN_SECRET || 'refresh_fallback_secret',
      { expiresIn: '7d' }
    );

    // Set cookie with the token
    const response = NextResponse.json(
      { 
        message: 'Login successful',
        token: token,
        refreshToken: refreshToken,
        user: {
          userId: user._id,
          username: user.username,
          email: user.email
        }
      },
      { status: 200 }
    );

    // Set HTTP-only cookies
    response.cookies.set({
      name: 'token',
      value: token,
      httpOnly: true,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 // 1 day
    });

    response.cookies.set({
      name: 'refreshToken',
      value: refreshToken,
      httpOnly: true,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    });

    return response;
    
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'An error occurred during login' },
      { status: 500 }
    );
  }
} 