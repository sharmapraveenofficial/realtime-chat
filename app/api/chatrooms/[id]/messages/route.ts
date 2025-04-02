import { NextRequest, NextResponse } from 'next/server';
import { connectToMongoDB } from '@/lib/mongodb';
import Message from '@/models/Message';
import ChatRoom from '@/models/ChatRoom';
import { getUserFromToken } from '@/lib/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToMongoDB();
    
    const user = await getUserFromToken(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { id: chatRoomId } = await Promise.resolve(params);
    
    // Check if user is a participant in the chat room and get room details
    const chatRoom = await ChatRoom.findOne({
      _id: chatRoomId,
      participants: user.userId
    }).populate({
      path: 'participants',
      select: 'username _id'
    });
    
    if (!chatRoom) {
      return NextResponse.json({ error: 'Chat room not found or access denied' }, { status: 404 });
    }
    
    // Format room details
    const roomDetails = {
      id: chatRoom._id.toString(),
      name: chatRoom.name,
      description: chatRoom.description,
      icon: chatRoom.icon,
      participants: chatRoom.participants.map((participant: { id: string; username: string }) => ({
        id: participant.id,
        username: participant.username
      })),
      pendingInvites: chatRoom.pendingInvites.map((invite: { id: string; email: string }) => ({
        id: invite.id,
        email: invite.email
      }))
    };
    
    // Get messages with pagination
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '50');
    const before = req.nextUrl.searchParams.get('before');
    
    let query: { chatRoom: string; createdAt?: { $lt: Date } } = { chatRoom: chatRoomId };
    
    if (before) {
      query = { ...query, createdAt: { $lt: new Date(before) } };
    }
    
    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('sender', 'username');
    
    // Format messages
    const formattedMessages = messages.reverse().map(msg => ({
      id: msg._id.toString(),
      content: msg.content,
      sender: {
        id: msg.sender._id.toString(),
        username: msg.sender.username
      },
      createdAt: msg.createdAt
    }));
    
    // Return both room details and messages
    return NextResponse.json({
      success: true,
      roomDetails,
      messages: formattedMessages
    });
  } catch (error) {
    console.error('Get messages error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 