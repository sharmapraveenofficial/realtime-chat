"use client";

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Webcam from 'react-webcam';
import { setCookie } from 'cookies-next';

export default function LoginPage() {
  const router = useRouter();
  const webcamRef = useRef<Webcam>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [faceData, setFaceData] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [stage, setStage] = useState<'credentials' | 'face-verification'>('credentials');

  const captureImage = () => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      console.log('Captured image:', imageSrc);
      setFaceData(imageSrc);
      setIsCapturing(false);
    }
  };

  const startCapture = () => {
    setIsCapturing(true);
    setFaceData(null);
  };

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username || !password) {
      setError('Username and password are required');
      return;
    }

    // For demo purposes, move to face verification
    setStage('face-verification');
  };

  const handleFaceVerification = async () => {
    if (!faceData) {
      setError('Please capture your face for verification');
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username, 
          password,
          faceData 
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        // Save token in both localStorage and cookie
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        // Set cookie with proper options
        setCookie('token', data.token, {
          maxAge: 30 * 24 * 60 * 60, // 30 days
          path: '/',
          sameSite: 'strict',
          secure: process.env.NODE_ENV === 'production'
        });
        
        // Navigate to dashboard
        router.push('/dashboard');
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('An error occurred during login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-gray-800/50 backdrop-blur-sm p-8 rounded-xl border border-gray-700 shadow-xl">
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                <path d="M4.5 6.375a4.125 4.125 0 118.25 0 4.125 4.125 0 01-8.25 0zM14.25 8.625a3.375 3.375 0 116.75 0 3.375 3.375 0 01-6.75 0zM1.5 19.125a7.125 7.125 0 0114.25 0v.003l-.001.119a.75.75 0 01-.363.63 13.067 13.067 0 01-6.761 1.873c-2.472 0-4.786-.684-6.76-1.873a.75.75 0 01-.364-.63l-.001-.122zM17.25 19.128l-.001.144a2.25 2.25 0 01-.233.96 10.088 10.088 0 005.06-1.01.75.75 0 00.42-.643 4.875 4.875 0 00-6.957-4.611 8.586 8.586 0 011.71 5.157v.003z" />
              </svg>
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">ChatFace</span>
          </Link>
          <h1 className="text-2xl font-bold mt-4">Log In</h1>
          <p className="text-gray-400 mt-1">
            {stage === 'credentials' 
              ? 'Enter your credentials to continue' 
              : 'Verify your identity with face recognition'}
          </p>
        </div>
        
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-2 rounded-lg mb-6">
            {error}
          </div>
        )}
        
        {stage === 'credentials' ? (
          <form onSubmit={handleCredentialsSubmit} className="space-y-5">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-1">Username</label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Your username"
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Your password"
              />
            </div>
            
            <button
              type="submit"
              className="w-full py-3 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium transition-all duration-300"
            >
              Continue
            </button>
          </form>
        ) : (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Face Verification</label>
              <p className="text-xs text-gray-400 mb-2">Please look at the camera and take a selfie to verify your identity</p>
              
              {isCapturing ? (
                <div className="space-y-3">
                  <Webcam
                    audio={false}
                    ref={webcamRef}
                    screenshotFormat="image/jpeg"
                    className="w-full h-48 object-cover rounded-lg"
                    videoConstraints={{ facingMode: 'user' }}
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={captureImage}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition-colors"
                    >
                      Capture
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsCapturing(false)}
                      className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {faceData ? (
                    <div>
                      <div className="relative w-full h-48 rounded-lg overflow-hidden border-2 border-blue-500">
                        <img 
                          src={faceData} 
                          alt="Captured face" 
                          className="w-full h-full object-cover"
                        />
                        {/* Animated verification effect */}
                        <div className="absolute inset-0 border-2 border-blue-400/70 rounded-lg"></div>
                        <div className="absolute inset-0">
                          <div className="absolute top-0 left-0 w-full h-1 bg-blue-500/50 animate-[scanLine_2s_ease-in-out_infinite]"></div>
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 bg-blue-500/30 backdrop-blur-sm py-1 text-center text-xs text-white font-mono">
                          Verifying...
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={handleFaceVerification}
                          disabled={isLoading}
                          className={`flex-1 py-3 rounded-lg text-white font-medium ${
                            isLoading 
                              ? 'bg-blue-700/70 cursor-not-allowed' 
                              : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700'
                          } transition-all duration-300`}
                        >
                          {isLoading ? 'Verifying...' : 'Verify & Login'}
                        </button>
                        <button
                          type="button"
                          onClick={startCapture}
                          className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 rounded-lg transition-colors"
                          disabled={isLoading}
                        >
                          Retake
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <button
                        type="button"
                        onClick={startCapture}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                        </svg>
                        Take Selfie
                      </button>
                      <button
                        type="button"
                        onClick={() => setStage('credentials')}
                        className="w-full bg-gray-600 hover:bg-gray-700 text-white py-2 rounded-lg transition-colors"
                      >
                        Go Back
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
        
        <div className="mt-6 text-center text-sm text-gray-400">
          Don&apos;t have an account?{' '}
          <Link href="/auth/signup" className="text-blue-400 hover:text-blue-300 transition-colors">
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
} 