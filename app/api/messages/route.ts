import { NextResponse } from 'next/server';
import Message from '@/models/Message';
import mongoose from 'mongoose';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const roomId = searchParams.get('roomId');

  if (!roomId) {
    return NextResponse.json({ success: false, error: 'Room ID is required' }, { status: 400 });
  }

  try {
    const messages = await Message.find({ chatRoom: new mongoose.Types.ObjectId(roomId) })
      .populate('sender', 'username')
      .sort({ createdAt: 1 })
      .limit(100);
    
    // Transform to format expected by frontend
    const formattedMessages = messages.map(msg => ({
      id: msg._id.toString(),
      content: msg.content,
      sender: {
        id: msg.sender._id.toString(),
        username: msg.sender.username
      },
      createdAt: msg.createdAt.toISOString()
    }));
    
    return NextResponse.json({ success: true, messages: formattedMessages });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch messages' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { roomId, content, userId } = await request.json();
    
    if (!roomId || !content || !userId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' }, 
        { status: 400 }
      );
    }
    
    const newMessage = new Message({
      content: content.trim(),
      sender: new mongoose.Types.ObjectId(userId),
      chatRoom: new mongoose.Types.ObjectId(roomId),
      createdAt: new Date()
    });
    
    const savedMessage = await newMessage.save();
    const populatedMessage = await Message.findById(savedMessage._id)
      .populate('sender', 'username');
    
    // Transform to format expected by frontend
    const formattedMessage = {
      id: populatedMessage._id.toString(),
      content: populatedMessage.content,
      sender: {
        id: populatedMessage.sender._id.toString(),
        username: populatedMessage.sender.username
      },
      createdAt: populatedMessage.createdAt.toISOString()
    };
    
    return NextResponse.json({ 
      success: true, 
      message: formattedMessage 
    });
  } catch (error) {
    console.error('Error saving message:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save message' }, 
      { status: 500 }
    );
  }
} 