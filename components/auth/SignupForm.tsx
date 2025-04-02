import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import Webcam from 'react-webcam';
import { useRouter } from 'next/navigation';

const signupSchema = z.object({
  username: z.string().min(3).max(20),
  email: z.string().email(),
  password: z.string().min(6),
});

type SignupFormValues = z.infer<typeof signupSchema>;

export default function SignupForm() {
  const router = useRouter();
  const webcamRef = useRef<Webcam>(null);
  const [faceData, setFaceData] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
  });
  
  const captureImage = () => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      setFaceData(imageSrc);
      setIsCapturing(false);
    }
  };
  
  const startCapture = () => {
    setIsCapturing(true);
    setFaceData(null);
  };
  
  const onSubmit = async (data: SignupFormValues) => {
    if (!faceData) {
      setError('Please capture your face image for authentication');
      return;
    }
    
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          faceData,
        }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Signup failed');
      }
      
      // Redirect to login page on success
      router.push('/auth/login');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signup failed');
    }
  };
  
  return (
    <div className="max-w-md w-full mx-auto bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">Sign Up</h2>
      
      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-4 rounded mb-6">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Username</label>
          <input
            {...register('username')}
            className="w-full p-2 border rounded"
            placeholder="Username"
          />
          {errors.username && (
            <p className="text-red-600 text-sm mt-1">{errors.username.message}</p>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            {...register('email')}
            type="email"
            className="w-full p-2 border rounded"
            placeholder="Email"
          />
          {errors.email && (
            <p className="text-red-600 text-sm mt-1">{errors.email.message}</p>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Password</label>
          <input
            {...register('password')}
            type="password"
            className="w-full p-2 border rounded"
            placeholder="Password"
          />
          {errors.password && (
            <p className="text-red-600 text-sm mt-1">{errors.password.message}</p>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Face Recognition</label>
          {isCapturing ? (
            <div className="space-y-2">
              <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                className="w-full rounded"
                videoConstraints={{ facingMode: 'user' }}
              />
              <button
                type="button"
                onClick={captureImage}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded"
              >
                Capture
              </button>
              <button
                type="button"
                onClick={() => setIsCapturing(false)}
                className="w-full bg-gray-300 hover:bg-gray-400 py-2 rounded"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {faceData ? (
                <div className="space-y-2">
                  <img src={faceData} alt="Captured face" className="w-full rounded" />
                  <button
                    type="button"
                    onClick={startCapture}
                    className="w-full bg-gray-300 hover:bg-gray-400 py-2 rounded"
                  >
                    Retake
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={startCapture}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded"
                >
                  Take Selfie
                </button>
              )}
            </div>
          )}
        </div>
        
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded disabled:bg-green-400"
        >
          {isSubmitting ? 'Signing up...' : 'Sign Up'}
        </button>
      </form>
    </div>
  );
} 