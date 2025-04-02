import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';
import { connectToMongoDB } from '@/lib/mongodb';

export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  faceData: string; // Base64 encoded face data
  pendingInvites: string[];
  comparePassword: (candidatePassword: string) => Promise<boolean>;
}

const UserSchema: Schema = new Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
  },
  faceData: {
    type: String,
    required: true
  },
  pendingInvites: [{ type: Schema.Types.ObjectId, ref: 'ChatRoom' }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
UserSchema.pre<IUser>('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: unknown) {
    next(error as Error);
  }
});

// Compare password method
UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Connect to MongoDB before accessing the model
connectToMongoDB();

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema); 