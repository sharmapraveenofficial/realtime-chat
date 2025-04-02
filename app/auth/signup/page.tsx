"use client";

import { useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Webcam from 'react-webcam';

export default function SignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const invitationToken = searchParams.get('invitation');
  const emailFromUrl = searchParams.get('email');
  
  const token = searchParams.get('token');
  const email = searchParams.get('email') || '';
  const webcamRef = useRef<Webcam>(null);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [faceData, setFaceData] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    username: '',
    email: emailFromUrl || '',
    password: '',
    confirmPassword: ''
  });

  useEffect(() => {
    if (emailFromUrl) {
      console.log('Prefilling email from URL:', emailFromUrl);
      setFormData(prev => ({ ...prev, email: emailFromUrl }));
    }
  }, [emailFromUrl]);

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    // Only allow changing email if not from invitation
    if (name === 'email' && invitationToken && emailFromUrl) {
      return; // Don't allow changing email from invitation
    }
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate form
    if (!formData.username || !formData.email || !formData.password || !confirmPassword) {
      setError('All fields are required');
      return;
    }

    if (formData.password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!faceData) {
      setError('Please capture your face image for authentication');
      return;
    }

    setIsLoading(true);
    
    try {
      // Call the signup API endpoint
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          faceData,
          invitationToken
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong');
      }
      
      // If signup is successful and there's an invitation token,
      // accept the invitation and redirect
      if (token) {
        try {
          const acceptResponse = await fetch('/api/invitations/accept', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${data.token}` // Use the token from signup response
            },
            body: JSON.stringify({ token })
          });
          
          const acceptData = await acceptResponse.json();
          
          if (acceptData.success) {
            // Update localStorage with the fresh tokens and user data
            localStorage.setItem('token', acceptData.token);
            localStorage.setItem('refreshToken', acceptData.refreshToken);
            localStorage.setItem('user', JSON.stringify(acceptData.user));
            
            // Redirect to dashboard
            router.push('/dashboard');
          } else {
            console.error('Failed to accept invitation:', acceptData.error);
            router.push('/dashboard');
          }
        } catch (err) {
          console.error('Error accepting invitation:', err);
          router.push('/dashboard');
        }
      } else {
        // Success without invitation token
        router.push('/auth/login?signup=success');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during signup. Please try again.');
      console.error(err);
      // Redirect to dashboard even on error
      router.push('/dashboard');
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
          <h1 className="text-2xl font-bold mt-4">Create Your Account</h1>
          <p className="text-gray-400 mt-1">Join secure conversations with face recognition</p>
          {invitationToken && emailFromUrl && (
            <p className="text-green-400 mt-2">
              You are signing up with an invitation to join a room
            </p>
          )}
        </div>
        
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-2 rounded-lg mb-6">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">Email</label>
            <input
              id="email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                invitationToken && emailFromUrl ? 'bg-gray-100' : ''
              }`}
              placeholder="your@email.com"
              disabled={!!(invitationToken && emailFromUrl)}
            />
            {email && (
              <p className="text-xs text-gray-400 mt-1">
                Email is pre-filled from your invitation and cannot be changed.
              </p>
            )}
          </div>
          
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-1">Username</label>
            <input
              id="username"
              type="text"
              value={formData.username}
              onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
              className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Choose a username"
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">Password</label>
            <input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Create a strong password"
            />
          </div>
          
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-1">Confirm Password</label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Confirm your password"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Face Recognition</label>
            <p className="text-xs text-gray-400 mb-2">Your face will be used to verify your identity during login</p>
            
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
                  <div className="space-y-3">
                    <div className="relative w-full h-48 rounded-lg overflow-hidden border-2 border-blue-500">
                      <img 
                        src={faceData} 
                        alt="Captured face" 
                        className="w-full h-full object-cover"
                      />
                      {/* Face scan overlay effect */}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <svg className="w-3/4 h-3/4 text-blue-400/70" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                          {/* Eyes */}
                          <circle cx="35" cy="40" r="3" stroke="currentColor" strokeWidth="1" />
                          <circle cx="65" cy="40" r="3" stroke="currentColor" strokeWidth="1" />
                          
                          {/* Nose */}
                          <line x1="50" y1="40" x2="50" y2="55" stroke="currentColor" strokeWidth="1" />
                          
                          {/* Mouth */}
                          <path d="M35,65 Q50,75 65,65" stroke="currentColor" strokeWidth="1" fill="none" />
                          
                          {/* Face contour */}
                          <ellipse cx="50" cy="50" rx="30" ry="35" stroke="currentColor" strokeWidth="1" strokeDasharray="4 2" />
                        </svg>
                      </div>
                      <div className="absolute inset-0 border-2 border-blue-400/70 rounded-lg"></div>
                      <div className="absolute bottom-0 left-0 right-0 bg-blue-500/30 backdrop-blur-sm py-1 text-center text-xs text-white font-mono">
                        Face Captured
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={startCapture}
                      className="w-full bg-gray-600 hover:bg-gray-700 text-white py-2 rounded-lg transition-colors"
                    >
                      Retake
                    </button>
                  </div>
                ) : (
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
                )}
              </div>
            )}
          </div>
          
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-3 rounded-lg text-white font-medium ${
              isLoading 
                ? 'bg-blue-700/70 cursor-not-allowed' 
                : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700'
            } transition-all duration-300`}
          >
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>
        
        <div className="mt-6 text-center text-sm text-gray-400">
          Already have an account?{' '}
          <Link 
            href={token ? `/auth/login?token=${token}&email=${formData.email}` : '/auth/login'}
            className="text-blue-400 hover:text-blue-300 transition-colors"
          >
            Log in
          </Link>
        </div>
      </div>
    </div>
  );
} 