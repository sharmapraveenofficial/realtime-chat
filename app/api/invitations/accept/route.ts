import { NextResponse } from 'next/server';
import ChatRoom from '@/models/ChatRoom';
import User from '@/models/User';
import { connectToMongoDB } from '@/lib/mongodb';

export async function POST(request: Request) {
  await connectToMongoDB();
  
  try {
    const { token, userId } = await request.json();
    
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Invitation token is required' },
        { status: 400 }
      );
    }
    
    // Find chatroom with the pending invitation
    const chatRoom = await ChatRoom.findOne({
      'pendingInvites.token': token,
      'pendingInvites.status': 'pending',
      'pendingInvites.expiresAt': { $gt: new Date() }
    });
    
    if (!chatRoom) {
      return NextResponse.json(
        { success: false, error: 'Invitation not found or expired' },
        { status: 404 }
      );
    }
    
    // Find the specific invitation
    const inviteIndex = chatRoom.pendingInvites.findIndex(
      (invite: { token: string; status: string }) => invite.token === token && invite.status === 'pending'
    );
    
    if (inviteIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Invitation not found or expired' },
        { status: 404 }
      );
    }
    
    const invitation = chatRoom.pendingInvites[inviteIndex];
    console.log('Found invitation:', invitation);
    
    // If userId is provided, try to find the user
    if (userId) {
      const user = await User.findById(userId);
      if (!user) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'User not found', 
            redirectToSignup: true,
            email: invitation.email,
            roomId: chatRoom._id,
            roomName: chatRoom.name
          },
          { status: 404 }
        );
      }
      
      // Add user to room participants
      if (!chatRoom.participants.includes(userId)) {
        chatRoom.participants.push(userId);
      }
      
      // Remove invitation completely instead of just marking as accepted
      chatRoom.pendingInvites.splice(inviteIndex, 1);
      await chatRoom.save();
      
      return NextResponse.json({
        success: true,
        message: 'Invitation accepted successfully',
        roomId: chatRoom._id,
        roomName: chatRoom.name
      });
    } else {
      // Check if user exists by email
      const existingUser = await User.findOne({ email: invitation.email });
      
      if (existingUser) {
        // User exists, redirect to login
        return NextResponse.json({
          success: false,
          userExists: true,
          email: invitation.email,
          message: 'User exists, redirect to login',
          roomId: chatRoom._id,
          roomName: chatRoom.name
        });
      } else {
        // User doesn't exist, redirect to signup
        return NextResponse.json({
          success: false,
          userExists: false,
          email: invitation.email,
          message: 'User does not exist, redirect to signup',
          roomId: chatRoom._id,
          roomName: chatRoom.name
        });
      }
    }
  } catch (error) {
    console.error('Error accepting invitation:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process invitation' },
      { status: 500 }
    );
  }
} 