'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

// Define the type for invitation
interface Invitation {
  email: string;
  roomId: string;
  roomName: string;
  userExists: boolean;
}

export default function JoinPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  
  useEffect(() => {
    if (!token) {
      setError('No invitation token provided');
      setLoading(false);
      return;
    }
    
    // Verify the invitation token
    const verifyInvitation = async () => {
      try {
        const response = await fetch('/api/invitations/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token })
        });
        
        const data = await response.json();
        
        console.log('Verify Invitation Response:', data);
        if (data.success) {
          setInvitation(data.invitation);
          
          // Check if user is already logged in
          const storedUser = localStorage.getItem('user');
          const storedToken = localStorage.getItem('token');
          
          if (storedUser && storedToken) {
            const user = JSON.parse(storedUser);
            
            // Check if the logged-in user matches the invitation email
            if (user.email === data.invitation.email) {
              // Accept the invitation automatically
              acceptInvitation(user.id || user.userId);
            } else {
              // User is logged in but with a different account
              setError(`You're logged in as ${user.email} but the invitation is for ${data.invitation.email}`);
            }
          }
        } else {
          setError(data.error || 'Invalid invitation');
        }
      } catch (err) {
        console.error('Error verifying invitation:', err);
        setError('Failed to verify invitation');
      } finally {
        setLoading(false);
      }
    };
    
    verifyInvitation();
  }, [token, router]);
  
  const acceptInvitation = async (userId: string) => {
    try {
      const response = await fetch('/api/invitations/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, userId })
      });
      
      const data = await response.json();
      
      console.log('Accept Invitation Response:', data);
      if (data.success) {
        // Successfully accepted - redirect to the room
        router.push(`/dashboard?room=${data.roomId}`);
      } else if (data.userExists !== undefined) {
        // API is telling us if user exists or not - handle redirection
        if (data.userExists) {
          // User exists, redirect to login
          router.push(`/auth/login?invitation=${token}&email=${encodeURIComponent(data.email)}`);
        } else {
          // User doesn't exist, redirect to signup
          router.push(`/auth/signup?invitation=${token}&email=${encodeURIComponent(data.email)}`);
        }
      } else if (data.redirectToSignup) {
        // Need to create account first
        router.push(`/auth/signup?invitation=${token}&email=${encodeURIComponent(data.email)}`);
      } else {
        setError(data.error || 'Failed to accept invitation');
      }
    } catch (err) {
      console.error('Error accepting invitation:', err);
      setError('Failed to accept invitation');
    }
  };
  
  const handleLogin = () => {
    // Redirect to login page with invitation token and ensure email is never empty
    const email = invitation?.email || '';
    console.log('Redirecting to login with email:', email);
    router.push(`/auth/login?invitation=${token}&email=${encodeURIComponent(email)}`);
  };
  
  const handleSignup = () => {
    // Redirect to signup page with invitation token and ensure email is never empty
    const email = invitation?.email || '';
    console.log('Redirecting to signup with email:', email);
    router.push(`/auth/signup?invitation=${token}&email=${encodeURIComponent(email)}`);
  };
  
  const handleLogout = () => {
    // Clear current session
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    
    // Redirect to login with invitation
    router.push(`/auth/login?invitation=${token}&email=${encodeURIComponent(invitation?.email || '')}`);
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Invitation Error</h1>
          <p className="mb-6 text-gray-700">{error}</p>
          
          {error.includes("You're logged in as") && (
            <div className="flex flex-col gap-4">
              <button
                onClick={handleLogout}
                className="bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600 transition"
              >
                Logout and Join with Invited Email
              </button>
              
              <Link href="/dashboard" className="text-center py-2 px-4 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 transition">
                Stay Logged In and Go to Dashboard
              </Link>
            </div>
          )}
          
          {!error.includes("You're logged in as") && (
            <Link href="/dashboard" className="block text-center bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700 transition">
              Go to Dashboard
            </Link>
          )}
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-bold text-indigo-600 mb-4">You&apos;re Invited!</h1>
        
        <div className="mb-6">
          <p className="text-gray-700 mb-2">
            You&apos;ve been invited to join:
          </p>
          <div className="bg-gray-50 p-4 rounded">
            <h2 className="font-semibold text-xl">{invitation?.roomName}</h2>
            <p className="text-gray-500">{invitation?.email}</p>
          </div>
        </div>
        
        {invitation?.userExists ? (
          <div className="space-y-4">
            <p className="text-gray-700">
              You already have an account with this email. Please login to accept the invitation.
            </p>
            <button
              onClick={handleLogin}
              className="w-full bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700 transition"
            >
              Login Now
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-gray-700">
              You need an account to join this room. Please sign up with the invited email.
            </p>
            <button
              onClick={handleSignup}
              className="w-full bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700 transition"
            >
              Sign Up Now
            </button>
            <p className="text-sm text-gray-500 text-center">
              Already have an account with a different email?{' '}
              <button 
                onClick={handleLogin}
                className="text-indigo-600 hover:underline"
              >
                Login instead
              </button>
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 