import { NextRequest, NextResponse } from 'next/server';
import ChatRoom from '@/models/ChatRoom';
import User from '@/models/User';
import { getUserFromToken } from '@/lib/auth';
import { connectToMongoDB } from '@/lib/mongodb';
import { sendEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    await connectToMongoDB();
    
    const user = await getUserFromToken(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { email, roomId } = await req.json();
    
    if (!email || !roomId) {
      return NextResponse.json({ error: 'Email and roomId are required' }, { status: 400 });
    }
    
    // Check if the room exists and the user is a participant
    const chatRoom = await ChatRoom.findOne({
      _id: roomId,
      participants: user.userId
    }).populate('creator', 'username');
    
    if (!chatRoom) {
      return NextResponse.json({ error: 'Chat room not found or you do not have access' }, { status: 404 });
    }
    
    // Check if the user being invited already exists
    const invitedUser = await User.findOne({ email: email.toLowerCase() });
    
    if (invitedUser) {
      // Check if they're already a participant
      if (chatRoom.participants.some((p: string) => p.toString() === invitedUser._id.toString())) {
        return NextResponse.json({ error: 'User is already a member of this chat room' }, { status: 400 });
      }
      
      // Add the user directly as a participant
      chatRoom.participants.push(invitedUser._id);
      await chatRoom.save();
      
      return NextResponse.json({ 
        message: 'User added to chat room',
        user: { id: invitedUser._id, username: invitedUser.username }
      });
    }
    
    // Check if there's already a pending invitation for this email
    const existingInviteIndex = chatRoom.pendingInvites.findIndex(
      (invite: { email: string; status: string }) => invite.email.toLowerCase() === email.toLowerCase() && invite.status === 'pending'
    );
    
    let token, invite;
    
    if (existingInviteIndex >= 0) {
      // Update the existing invitation's expiration date
      chatRoom.pendingInvites[existingInviteIndex].expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      token = chatRoom.pendingInvites[existingInviteIndex].token;
      await chatRoom.save();
      invite = chatRoom.pendingInvites[existingInviteIndex];
    } else {
      // Create a new invitation
      token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      const newInvite = {
        email: email.toLowerCase(),
        status: 'pending',
        token,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      };
      
      // Add to pendingInvites array
      chatRoom.pendingInvites.push(newInvite);
      
      await chatRoom.save();
      
      // Get the newly created invitation
      const updatedRoom = await ChatRoom.findById(roomId);
      const newInviteIndex = updatedRoom.pendingInvites.findIndex(
        (inv: { email: string; status: string }) => inv.email.toLowerCase() === email.toLowerCase() && inv.status === 'pending'
      );
      invite = updatedRoom.pendingInvites[newInviteIndex];
    }
    
    // Keep the existing mail sending logic
    const invitationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/join?token=${token}`;
    
    // Get inviter's username
    const inviterUsername = user.username || 'Someone';
    
    // Send invitation email
    await sendEmail({
      to: email,
      subject: `You've been invited to join ${chatRoom.name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Chat Invitation</h2>
          <p>${inviterUsername} has invited you to join the chat room "${chatRoom.name}".</p>
          <p>Click the button below to accept the invitation:</p>
          <a href="${invitationUrl}" style="display: inline-block; background-color: #8b5cf6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin: 20px 0;">
            Accept Invitation
          </a>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all;">${invitationUrl}</p>
          <p>This invitation will expire in 7 days.</p>
        </div>
      `
    });
    
    return NextResponse.json({ 
      message: existingInviteIndex >= 0 ? 'Invitation updated and resent' : 'Invitation sent successfully',
      invite: { 
        id: invite._id,
        email: invite.email,
        token: invite.token 
      }
    });
  } catch (error) {
    console.error('Create invitation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Get invitation by token
export async function GET(req: NextRequest) {
  try {
    await connectToMongoDB();
    
    const url = new URL(req.url);
    const token = url.searchParams.get('token');
    
    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }
    
    // Find chatroom with this invitation token
    const chatRoom = await ChatRoom.findOne({
      'pendingInvites.token': token,
      'pendingInvites.status': 'pending'
    });
    
    if (!chatRoom) {
      return NextResponse.json({ error: 'Invalid or expired invitation' }, { status: 404 });
    }
    
    // Find the specific invitation
    const invitation = chatRoom.pendingInvites.find(
      (invite: { token: string; status: string }) => invite.token === token && invite.status === 'pending'
    );
    
    if (!invitation) {
      return NextResponse.json({ error: 'Invalid or expired invitation' }, { status: 404 });
    }
    
    // Check if invitation has expired
    if (new Date() > invitation.expiresAt) {
      // Update status to expired
      invitation.status = 'expired';
      await chatRoom.save();
      
      return NextResponse.json({ error: 'Invitation has expired' }, { status: 400 });
    }
    
    return NextResponse.json({
      invitation: {
        id: invitation._id,
        email: invitation.email,
        token: invitation.token
      },
      chatRoom: {
        id: chatRoom._id,
        name: chatRoom.name
      }
    });
  } catch (error) {
    console.error('Get invitation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 