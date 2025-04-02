import AWS from 'aws-sdk';
import { RekognitionClient, DetectFacesCommand, CompareFacesCommand, DetectFacesCommandInput } from '@aws-sdk/client-rekognition';

// Configure AWS SDK
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-1',
});


// Initialize AWS Rekognition client
const rekognition = new RekognitionClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
  }
});

/**
 * Verifies if the provided face data is valid and contains a detectable face
 * @param faceData - Base64 encoded image data
 * @returns Boolean indicating if valid face was detected
 */
export async function verifyFaceData(faceData: string): Promise<boolean> {
  try {
    // Remove data:image/jpeg;base64, prefix if present
    const base64Image = faceData.replace(/^data:image\/\w+;base64,/, '');
    
    // Decode the base64 string
    const buffer = Buffer.from(base64Image, 'base64');
    
    // Set up the params for face detection
    const params = {
      Image: {
        Bytes: buffer
      },
      Attributes: ['DEFAULT']
    };
    
    // Check if face is detectable
    const command = new DetectFacesCommand(params as DetectFacesCommandInput);
    const response = await rekognition.send(command);
    
    // Return true if at least one face was detected
    return Array.isArray(response.FaceDetails) && response.FaceDetails.length > 0;
  } catch (error) {
    console.error('Face verification error:', error);
    return false;
  }
}

/**
 * Compares two face images to determine if they are the same person
 * @param sourceImage - Base64 encoded source image
 * @param targetImage - Base64 encoded target image to compare against
 * @returns Boolean indicating if the faces match
 */
export async function compareFaces(sourceImage: string, targetImage: string): Promise<boolean> {
  try {
    // Remove data:image/jpeg;base64, prefix if present
    const sourceBase64 = sourceImage.replace(/^data:image\/\w+;base64,/, '');
    const targetBase64 = targetImage.replace(/^data:image\/\w+;base64,/, '');
    
    // Decode base64 strings
    const sourceBuffer = Buffer.from(sourceBase64, 'base64');
    const targetBuffer = Buffer.from(targetBase64, 'base64');
    
    // Set up the params for face comparison
    const params = {
      SourceImage: {
        Bytes: sourceBuffer
      },
      TargetImage: {
        Bytes: targetBuffer
      },
      SimilarityThreshold: 90
    };
    
    // Compare faces
    const command = new CompareFacesCommand(params);
    const response = await rekognition.send(command);
    
    // Return true if at least one match with high similarity
    return Array.isArray(response.FaceMatches) && response.FaceMatches.length > 0;
  } catch (error) {
    console.error('Face comparison error:', error);
    return false;
  }
} 