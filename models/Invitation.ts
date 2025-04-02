import mongoose, { Schema, Document } from 'mongoose';
import { connectToMongoDB } from '@/lib/mongodb';

export interface IInvitation extends Document {
  email: string;
  chatRoom: mongoose.Types.ObjectId;
  token: string;
  status: 'pending' | 'accepted' | 'expired';
  createdAt: Date;
  expiresAt: Date;
}

const InvitationSchema: Schema = new Schema({
  email: { type: String, required: true, lowercase: true },
  chatRoom: { type: Schema.Types.ObjectId, ref: 'ChatRoom', required: true },
  token: { type: String, required: true, unique: true },
  status: { type: String, enum: ['pending', 'accepted', 'expired'], default: 'pending' },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true }
});

// Add index to make lookup faster and let token expire
InvitationSchema.index({ token: 1 });
InvitationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Connect to MongoDB before accessing the model
connectToMongoDB();

export default mongoose.models.Invitation || mongoose.model<IInvitation>('Invitation', InvitationSchema); 