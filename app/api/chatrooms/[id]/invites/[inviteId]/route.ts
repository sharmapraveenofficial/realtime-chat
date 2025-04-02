import { NextRequest, NextResponse } from 'next/server';
import { connectToMongoDB } from '@/lib/mongodb';
import ChatRoom from '@/models/ChatRoom';
import { getUserFromToken } from '@/lib/auth';
import mongoose from 'mongoose';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; inviteId: string }> }
) {
  try {
    await connectToMongoDB();
    
    const user = await getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const resolvedParams = await params;
    const { id: chatRoomId, inviteId: inviteIdToCancel } = resolvedParams;
        
    // First check if the user has permission (is a participant)
    const chatRoomCheck = await ChatRoom.findOne({
      _id: chatRoomId,
      participants: user.userId
    });
    
    if (!chatRoomCheck) {
      return NextResponse.json({ 
        error: 'Chat room not found or you are not a member' 
      }, { status: 403 });
    }
    
    // Use MongoDB's atomic $pull operator to remove the element directly from the array
    let updateQuery;
    
    // If it's a valid MongoDB ObjectId
    if (mongoose.Types.ObjectId.isValid(inviteIdToCancel)) {
      updateQuery = {
        $pull: { 
          pendingInvites: { 
            _id: new mongoose.Types.ObjectId(inviteIdToCancel) 
          } 
        }
      };
    } else {
      // Try to match by email or token
      updateQuery = {
        $pull: { 
          pendingInvites: { 
            $or: [
              { email: inviteIdToCancel },
              { token: inviteIdToCancel }
            ]
          } 
        }
      };
    }
    
    // Use the atomic update operation to directly remove the matching invite
    const result = await ChatRoom.updateOne(
      { _id: chatRoomId },
      updateQuery
    );
        
    if (result.modifiedCount === 0) {
      return NextResponse.json({ 
        error: 'Invitation not found or already cancelled' 
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Invitation cancelled successfully'
    });
    
  } catch (error) {
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}