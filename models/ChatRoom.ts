import mongoose, { Schema, Document } from 'mongoose';
import { connectToMongoDB } from '@/lib/mongodb';

interface PendingInvite {
  email: string;
  status: 'pending' | 'accepted' | 'expired';
  token?: string;
  createdAt: Date;
  expiresAt: Date;
}

export interface IChatRoom extends Document {
  name: string;
  creator: mongoose.Types.ObjectId;
  participants: mongoose.Types.ObjectId[];
  pendingInvites: PendingInvite[];
  createdAt: Date;
  updatedAt: Date;
  icon: string;
  description: string;
}

const PendingInviteSchema: Schema = new Schema({
  email: { type: String, required: true, lowercase: true },
  status: { type: String, enum: ['pending', 'accepted', 'expired'], default: 'pending' },
  token: { type: String, sparse: true },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true }
});

const ChatRoomSchema: Schema = new Schema({
  name: { type: String, required: true },
  creator: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  participants: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  pendingInvites: [PendingInviteSchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  icon: { type: String, default: null }, 
  description: { type: String, default: '' },
});

ChatRoomSchema.index({ 'pendingInvites.token': 1 }, { 
  unique: false,
  sparse: true, 
  background: true 
});

// Connect to MongoDB before accessing the model
connectToMongoDB();

export default mongoose.models.ChatRoom || mongoose.model<IChatRoom>('ChatRoom', ChatRoomSchema); 