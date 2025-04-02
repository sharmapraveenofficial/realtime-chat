import { NextRequest, NextResponse } from 'next/server';
import { connectToMongoDB } from '@/lib/mongodb';
import ChatRoom from '@/models/ChatRoom';
import { getUserFromToken } from '@/lib/auth';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string; inviteId: string }> }) {  try {
    await connectToMongoDB();

    const user = await getUserFromToken(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const { id: chatRoomId, inviteId: inviteIdToCancel } = resolvedParams;

    const chatRoom = await ChatRoom.findById(chatRoomId);

    if (!chatRoom) {
      return NextResponse.json({ error: 'Chat room not found' }, { status: 404 });
    }

    const isCurrentUserMember = chatRoom.participants.some(
      (p: string) => p.toString() === user.userId.toString()
    );

    if (!isCurrentUserMember) {
      return NextResponse.json(
        { error: 'You are not a member of this chat room' },
        { status: 403 }
      );
    }

    const inviteIndex = chatRoom.pendingInvites.findIndex(
      (invite: { _id: string; email: string }) =>
        invite._id.toString() === inviteIdToCancel || invite.email === inviteIdToCancel
    );

    if (inviteIndex === -1) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
    }

    chatRoom.pendingInvites.splice(inviteIndex, 1);
    await chatRoom.save();

    return NextResponse.json({
      success: true,
      message: 'Invitation cancelled successfully',
    });
  } catch (error) {
    console.error('Error cancelling invitation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}