"use client";

import { getCookie } from 'cookies-next';
import { useEffect, useState, useCallback } from 'react';
import io, { Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';

interface MessageType {
  id: string;
  content: string;
  sender: {
    id: string;
    username?: string;
  };
  createdAt: string;
  status?: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
}


export default function useSocket() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  useEffect(() => {    
    // Try to get token
    let token: string | undefined = getCookie('token') as string;
    
    if (!token) {
      token = localStorage.getItem('token') as string;
    }
    
    console.log("Token to be sent:", token ? `${token.substring(0, 20)}...` : "No token found");
    
    
    const socketInstance = io(SOCKET_URL, {
      withCredentials: true,
      transports: ['websocket'],
      auth: {
        token: token
      }
    });

    socketInstance.on('connect', () => {
      console.log('Socket connected: ', socketInstance.id);
      setConnected(true);
      setConnectionError(null);
    });

    socketInstance.on('disconnect', () => {
      console.log('Socket disconnected');
      setConnected(false);
    });

    socketInstance.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setConnectionError(error.message);
    });

    setSocket(socketInstance);

    return () => {
      console.log('Closing socket connection');
      socketInstance.disconnect();
    };
  }, []);

  const joinRoom = useCallback((roomId: string) => {
    if (socket && connected) {
      console.log(`Joining room: ${roomId}`);
      socket.emit('joinRoom', { roomId });
    } else {
      console.error('Cannot join room: socket not connected');
    }
  }, [socket, connected]);

  const leaveRoom = useCallback((roomId: string) => {
    if (socket && connected) {
      console.log(`Leaving room: ${roomId}`);
      socket.emit('leaveRoom', { roomId });
    }
  }, [socket, connected]);


  const onNewMessage = useCallback((callback: (message: MessageType) => void) => {
    if (socket) {
      console.log('Setting up new message listener');
      
      socket.off('newMessage');
      
      socket.on('newMessage', (message: MessageType) => {
        console.log('New message received:', message);
        callback(message);
      });
    }
  }, [socket]);

  return { socket, connected, connectionError, joinRoom, leaveRoom, onNewMessage };
} 