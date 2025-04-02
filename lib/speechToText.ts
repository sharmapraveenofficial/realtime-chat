import { SpeechClient } from '@google-cloud/speech';
import { protos } from '@google-cloud/speech';

// Initialize Google Cloud Speech-to-Text client
const credentials = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON || '{}');
const speechClient = new SpeechClient({ credentials });

export async function transcribeSpeech(audioBuffer: Buffer): Promise<string> {
  try {
    const audio = {
      content: audioBuffer.toString('base64'),
    };
    
    const config = {
      encoding: protos.google.cloud.speech.v1.RecognitionConfig.AudioEncoding.WEBM_OPUS,
      sampleRateHertz: 48000,
      languageCode: 'en-US',
    };
    
    const request = {
      audio: audio,
      config: config,
    };
    
    const response = await speechClient.recognize(request);
    const transcription = response[0].results
      ?.map(result => result.alternatives?.[0].transcript)
      .join('\n');
    
    return transcription || '';
  } catch (error) {
    console.error('Speech-to-text error:', error);
    throw new Error('Failed to transcribe speech');
  }
} 