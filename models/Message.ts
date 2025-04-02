import mongoose, { Schema, Document } from 'mongoose';
import { connectToMongoDB } from '@/lib/mongodb';

export interface IMessage extends Document {
  content: string;
  sender: mongoose.Types.ObjectId;
  chatRoom: mongoose.Types.ObjectId;
  createdAt: Date;
}

const MessageSchema: Schema = new Schema({
  content: { type: String, required: true },
  sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  chatRoom: { type: Schema.Types.ObjectId, ref: 'ChatRoom', required: true },
  createdAt: { type: Date, default: Date.now },
});

// Connect to MongoDB before accessing the model
connectToMongoDB();

export default mongoose.models.Message || mongoose.model<IMessage>('Message', MessageSchema); 