"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCookie } from 'cookies-next';
import Sidebar from '@/components/chat/Sidebar';
import ChatArea from '@/components/chat/ChatArea';
import useSocket from '@/hooks/useSocket';

interface User {
  email: string;
  userId: string;
  username: string;
}

export default function Dashboard() {
  const router = useRouter();
  const [activeRoom, setActiveRoom] = useState<string | null>(null);
  const [roomName, setRoomName] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const socket = useSocket();

  console.log(socket);

  useEffect(() => {
    let token = localStorage.getItem('token');
    
    if (!token) {
      token = getCookie('token') as string;
    }
    
    if (!token) {
      console.log("No token found, redirecting to login");
      router.push('/auth/login');
      return;
    }

    // Get user data from localStorage
    try {
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      
      // If user data not in localStorage, fetch from API using the token
      if (!userData.userId) {
        console.log("No user data in localStorage, fetching from API");
        fetchUserData(token);
        return;
      }

      setUser(userData);
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to parse user data:', error);
      router.push('/auth/login');
      return;
    }
  }, [router]);

  // Fetch user data using token if not in localStorage
  const fetchUserData = async (token: string) => {
    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch user data');
      }
      
      const userData = await response.json();
      
      // Store in localStorage for future use
      localStorage.setItem('user', JSON.stringify(userData));
      
      setUser(userData);
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to fetch user data:', error);
      localStorage.removeItem('token');
      router.push('/auth/login');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex">
      <Sidebar 
        activeRoom={activeRoom}
        setActiveRoom={setActiveRoom}
        setRoomName={setRoomName}
        userId={user?.userId || ''}
      />
      <ChatArea 
        roomId={activeRoom}
        userId={user?.userId || ''}
        username={user?.username || 'Guest'}
        roomName={roomName || ''}
      />
    </div>
  );
} 