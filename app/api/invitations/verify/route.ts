import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import User from '@/models/User';
import ChatRoom from '@/models/ChatRoom';
import { connectToMongoDB } from '@/lib/mongodb';

export async function POST(request: Request) {
  await connectToMongoDB();
  
  try {
    const { token } = await request.json();
    
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Token is required' },
        { status: 400 }
      );
    }
    
    // Verify JWT token and get data
    let invitationData;
    try {
      invitationData = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
      console.log('Decoded invitation data:', JSON.stringify(invitationData));
    } catch (error) {
      console.error('Invalid token:', error);
      
      // If JWT fails, try to find the invitation by the plain token in pendingInvites
      const chatRoomWithInvite = await ChatRoom.findOne({
        'pendingInvites.token': token,
        'pendingInvites.status': 'pending',
        'pendingInvites.expiresAt': { $gt: new Date() }
      });
      
      if (!chatRoomWithInvite) {
        return NextResponse.json(
          { success: false, error: 'Invalid or expired invitation token' },
          { status: 400 }
        );
      }
      
      // Get the invitation from pendingInvites
      const invite = chatRoomWithInvite.pendingInvites.find(
        (invite: { token: string; status: string }) => invite.token === token && invite.status === 'pending'
      );
      
      if (!invite) {
        return NextResponse.json(
          { success: false, error: 'Invalid or expired invitation' },
          { status: 400 }
        );
      }
      
      // Check if a user with this email already exists
      const existingUser = await User.findOne({ email: invite.email.toLowerCase() });
      
      return NextResponse.json({
        success: true,
        invitation: {
          email: invite.email,
          roomId: chatRoomWithInvite._id,
          roomName: chatRoomWithInvite.name,
          userExists: !!existingUser
        },
        token
      });
    }
    
    // If we got here, the JWT was valid, continue with validation
    // Validate invitation data
    if (!invitationData || typeof invitationData !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Invalid invitation format: not an object' },
        { status: 400 }
      );
    }
    
    if (!invitationData.email) {
      console.error('Missing email in invitation data:', invitationData);
      return NextResponse.json(
        { success: false, error: 'Invalid invitation format: missing email' },
        { status: 400 }
      );
    }
    
    if (!invitationData.roomId) {
      console.error('Missing roomId in invitation data:', invitationData);
      return NextResponse.json(
        { success: false, error: 'Invalid invitation format: missing roomId' },
        { status: 400 }
      );
    }
    
    // Find the chatroom and the matching invitation in pendingInvites
    const chatRoom = await ChatRoom.findOne({
      _id: invitationData.roomId,
      'pendingInvites.email': invitationData.email,
      'pendingInvites.status': 'pending',
      'pendingInvites.expiresAt': { $gt: new Date() }
    });
    
    if (!chatRoom) {
      return NextResponse.json(
        { success: false, error: 'The chat room no longer exists or invitation has expired' },
        { status: 404 }
      );
    }
    
    // Get the invitation from pendingInvites
    const invitation = chatRoom.pendingInvites.find(
      (invite: { email: string; status: string }) => invite.email.toLowerCase() === invitationData.email.toLowerCase() && 
               invite.status === 'pending'
    );
    
    if (!invitation) {
      return NextResponse.json(
        { success: false, error: 'Invitation not found or expired' },
        { status: 404 }
      );
    }
    
    // Extract email from the invitation
    const email = invitation.email;
    
    // Check if a user with this email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    
    const responseData = {
      success: true,
      invitation: {
        email: email,
        roomId: chatRoom._id,
        roomName: chatRoom.name,
        userExists: !!existingUser
      },
      token
    };
    
    console.log('Sending response:', JSON.stringify(responseData));
    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Verification error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to verify invitation' },
      { status: 500 }
    );
  }
} 