import { NextRequest, NextResponse } from 'next/server';
import { connectToMongoDB } from '@/lib/mongodb';
import ChatRoom from '@/models/ChatRoom';
import { getUserFromToken } from '@/lib/auth';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    await connectToMongoDB();
    
    const user = await getUserFromToken(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const resolvedParams = await params;
    const { id: chatRoomId, userId: memberIdToRemove } = resolvedParams;
    
    const chatRoom = await ChatRoom.findById(chatRoomId);
    
    if (!chatRoom) {
      return NextResponse.json({ error: 'Chat room not found' }, { status: 404 });
    }
    
    // Check if the current user is a member of the room
    const isCurrentUserMember = chatRoom.participants.some(
      (p: string) => p.toString() === user.userId.toString()
    );
    
    if (!isCurrentUserMember) {
      return NextResponse.json({ error: 'You are not a member of this chat room' }, { status: 403 });
    }
    
    // Remove the member
    chatRoom.participants = chatRoom.participants.filter(
      (id: string) => id.toString() !== memberIdToRemove
    );
    
    await chatRoom.save();
    
    return NextResponse.json({
      success: true,
      message: 'Member removed successfully'
    });
  } catch (error) {
    console.error('Error removing member:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 