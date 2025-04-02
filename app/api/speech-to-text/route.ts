import { NextRequest, NextResponse } from 'next/server';
import { transcribeSpeech } from '@/lib/speechToText';
import { getUserFromToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromToken(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const formData = await req.formData();
    const audioFile = formData.get('audio') as File;
    
    if (!audioFile) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }
    
    const buffer = Buffer.from(await audioFile.arrayBuffer());
    const transcript = await transcribeSpeech(buffer);
    
    return NextResponse.json({ transcript });
  } catch (error) {
    console.error('Speech-to-text API error:', error);
    return NextResponse.json({ error: 'Speech-to-text processing failed' }, { status: 500 });
  }
} 