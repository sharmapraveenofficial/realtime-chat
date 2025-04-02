import { NextRequest, NextResponse } from 'next/server';
import { connectToMongoDB } from '@/lib/mongodb';
import User from '@/models/User';
import { verifyFaceData } from '@/lib/faceRecognition';

export async function POST(req: NextRequest) {
  try {
    const { username, email, password, faceData } = await req.json();

    // Validate inputs
    if (!username || !email || !password || !faceData) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify face data
    const isFaceValid = await verifyFaceData(faceData);
    if (!isFaceValid) {
      return NextResponse.json(
        { error: 'Invalid face data. Please capture a clearer image.' },
        { status: 400 }
      );
    }

    // Connect to database
    await connectToMongoDB();

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists with this email or username' },
        { status: 409 }
      );
    }

    // Create new user - DON'T hash the password here!
    // The pre-save hook in your User model will hash it
    const newUser = new User({
      username,
      email,
      password, // Pass the plain password - model will hash it
      faceData,
      createdAt: new Date()
    });

    await newUser.save();

    // Return success without sensitive data
    return NextResponse.json(
      { 
        message: 'User registered successfully',
        user: {
          userId: newUser._id,
          username: newUser.username,
          email: newUser.email
        }
      },
      { status: 201 }
    );
    
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'An error occurred during signup' },
      { status: 500 }
    );
  }
} 