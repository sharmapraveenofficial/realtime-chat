import { NextRequest, NextResponse } from 'next/server';
import ChatRoom from '@/models/ChatRoom';
import User from '@/models/User';
import Invitation from '@/models/Invitation';
import { getUserFromToken } from '@/lib/auth';
import { connectToMongoDB } from '@/lib/mongodb';
import { sendEmail } from '@/lib/email';

// Get all chat rooms for the user
export async function GET(req: NextRequest) {
  try {
    await connectToMongoDB();
    
    const user = await getUserFromToken(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Find all chat rooms where the user is a participant
    const chatRooms = await ChatRoom.find({
      participants: user.userId
    }).populate('creator', 'username').sort({ createdAt: -1 });

    // Enhance each chatroom with pending invitations
    const enhancedChatRooms = await Promise.all(chatRooms.map(async (room) => {
      // Find all pending invitations for this chat room
      const pendingInvites = await Invitation.find({
        chatRoom: room._id,
        status: 'pending'
      });
      
      // Convert to plain object to add the pendingInvites field
      const roomObj = room.toObject();
      roomObj.pendingInvites = pendingInvites.map(invite => ({
        id: invite._id,
        email: invite.email,
        token: invite.token
      }));
      
      return roomObj;
    }));
    
    return NextResponse.json(enhancedChatRooms);
  } catch (error) {
    console.error('Get chat rooms error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Create a new chat room
export async function POST(req: NextRequest) {
  try {
    await connectToMongoDB();
    
    const user = await getUserFromToken(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { name, invites } = await req.json();
    
    if (!name) {
      return NextResponse.json({ error: 'Room name is required' }, { status: 400 });
    }
    
    // Process invites
    const participants = [user.userId];
    const pendingInvites = [];
    
    if (invites && invites.length > 0) {
      for (const invite of invites) {
        // Check if it's an email or username
        const existingUser = await User.findOne({
          $or: [{ email: invite }, { username: invite }]
        });
        
        if (existingUser) {
          // Add to participants if not already included
          if (!participants.includes(existingUser._id)) {
            participants.push(existingUser._id);
          }
        } else {
          // Add to pending invites with the proper format
          // Generate a token for the invitation
          const token = Math.random().toString(36).substring(2, 15) + 
                        Math.random().toString(36).substring(2, 15);
          
          // Add the properly formatted invitation object
          pendingInvites.push({
            email: invite.toLowerCase(),
            status: 'pending',
            token: token,
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days expiry
          });
        }
      }
    }
    
    // Create new chat room
    const chatRoom = new ChatRoom({
      name,
      creator: user.userId,
      participants,
      pendingInvites
    });
    
    await chatRoom.save();
    
    // Send email invites to pendingInvites
    if (pendingInvites.length > 0) {
      try {        
        for (const invite of pendingInvites) {
          const invitationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/join?token=${invite.token}`;
          
          await sendEmail({
            to: invite.email,
            subject: `You've been invited to join ${name}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>Chat Invitation</h2>
                <p>${user.username} has invited you to join the chat room "${name}".</p>
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
        }
      } catch (emailError) {
        console.error('Error sending invitation emails:', emailError);
        // Don't fail the entire request if emails fail
      }
    }
    
    return NextResponse.json(chatRoom, { status: 201 });
  } catch (error) {
    console.error('Create chat room error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 