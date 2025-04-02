import { NextRequest, NextResponse } from 'next/server';
import { connectToMongoDB } from '@/lib/mongodb';
import ChatRoom from '@/models/ChatRoom';
import { getUserFromToken } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

interface Participant {
  _id: {
    toString(): string;
  };
  username: string;
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToMongoDB();
    
    const user = await getUserFromToken(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const chatRoomId = params.id;
    
    // Find the chat room and ensure user is a participant
    const chatRoom = await ChatRoom.findOne({
      _id: chatRoomId,
      participants: user.userId
    }).populate('creator', 'username').populate('participants', 'username');
    
    if (!chatRoom) {
      return NextResponse.json({ error: 'Chat room not found or access denied' }, { status: 404 });
    }
    
    console.log(chatRoom); 
    return NextResponse.json(chatRoom);
  } catch (error) {
    console.error('Get chat room error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToMongoDB();
    
    const user = await getUserFromToken(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const chatRoomId = params.id;
    const chatRoom = await ChatRoom.findById(chatRoomId).populate('participants', 'username');
    
    if (!chatRoom) {
      return NextResponse.json({ error: 'Chat room not found' }, { status: 404 });
    }
    
    // Check if the user is a participant in the room
    if (!chatRoom.participants.some((p: Participant) => p._id.toString() === user.userId.toString())) {
      return NextResponse.json({ error: 'You are not a member of this chat room' }, { status: 403 });
    }
    
    const formData = await req.formData();
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const iconFile = formData.get('icon') as File | null;
    
    // Process icon if provided
    let iconPath = chatRoom.icon; // Keep existing icon by default
    
    if (iconFile) {
      const bytes = await iconFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      
      // Generate a unique filename
      const filename = `room-${chatRoomId}-${uuidv4()}${path.extname(iconFile.name)}`;
      const uploadDir = path.join(process.cwd(), 'public', 'uploads');
      
      // Create uploads directory if it doesn't exist
      await mkdir(uploadDir, { recursive: true });
      
      const filePath = path.join(uploadDir, filename);
      await writeFile(filePath, buffer);
      iconPath = `/uploads/${filename}`;
    }
    
    // Update the chat room
    chatRoom.name = name;
    chatRoom.description = description;
    if (iconPath) chatRoom.icon = iconPath;
    
    await chatRoom.save();
    
    // Format the response
    const roomDetails = {
      id: chatRoom._id.toString(),
      name: chatRoom.name,
      description: chatRoom.description,
      participants: chatRoom.participants.map((p: Participant) => ({
        id: p._id.toString(),
        username: p.username
      })),
      pendingInvites: chatRoom.pendingInvites || [],
      icon: chatRoom.icon || null
    };
    
    return NextResponse.json({
      success: true,
      room: roomDetails
    });
  } catch (error) {
    console.error('Update chat room error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 