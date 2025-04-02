"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import CreateRoomModal from '@/components/chat/CreateRoomModal';
import { FaPlus, FaSignOutAlt, FaHashtag } from 'react-icons/fa';

interface SidebarProps {
  activeRoom: string | null;
  setActiveRoom: (roomId: string) => void;
  userId: string;
  setRoomName: (roomName: string) => void;
}

interface ChatRoom {
  _id: string;
  name: string;
  creator: {
    _id: string;
    username: string;
  };
  participants: string[];
  createdAt: string;
}

export default function Sidebar({ activeRoom, setActiveRoom, setRoomName }: SidebarProps) {
  const router = useRouter();
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchChatRooms();
  }, []);

  const fetchChatRooms = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/chatrooms', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch chat rooms');
      }
      
      const data = await response.json();
      setChatRooms(data);
      
      // If no active room is set but we have rooms, set the first one as active
      if (!activeRoom && data.length > 0) {
        console.log('Setting active room:', data[0]);
        setActiveRoom(data[0]._id);
        setRoomName(data[0].name);
      }
    } catch (error) {
      console.error('Error fetching chat rooms:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/auth/login');
  };

  // Create the general room if no rooms exist
  const createGeneralRoom = async () => {
    try {
      const response = await fetch('/api/chatrooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          name: 'General',
          participants: []
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to create general room');
      }
      
      fetchChatRooms();
    } catch (error) {
      console.error('Error creating general room:', error);
    }
  };

  // Create general room if no rooms exist after initial load
  useEffect(() => {
    if (!isLoading && chatRooms.length === 0) {
      createGeneralRoom();
    }
  }, [isLoading, chatRooms]);

  const username = localStorage.getItem('user') 
    ? JSON.parse(localStorage.getItem('user') || '{}').username 
    : 'User';

  return (
    <div className="w-64 bg-[#0f172a] border-r border-[#1e293b] flex flex-col h-screen">
      <div className="p-5 border-b border-[#1e293b]">
        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#8b5cf6] to-[#6366f1]">ChatFace</h1>
        <p className="text-sm text-gray-400 mt-1">Welcome, {username}</p>
      </div>
      
      <div className="flex-1 overflow-y-auto px-3 py-4">
        <div className="flex justify-between items-center px-2 mb-3">
          <h2 className="text-xs font-medium text-gray-400 uppercase tracking-wider">Chat Rooms</h2>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="w-6 h-6 rounded flex items-center justify-center text-gray-400 hover:text-[#8b5cf6] hover:bg-[#1e293b] transition-colors"
            title="Create new room"
          >
            <FaPlus size={12} />
          </button>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-t-transparent border-[#8b5cf6]"></div>
          </div>
        ) : (
          <div className="space-y-1 mt-2">
            {chatRooms.map(room => (
              <button
                key={room._id}
                  onClick={() => {
                  setActiveRoom(room._id);
                  setRoomName(room.name);
                }}
                className={`w-full text-left px-3 py-2 rounded-md flex items-center gap-2 transition-all ${
                  activeRoom === room._id
                    ? 'bg-[#8b5cf6]/10 text-[#8b5cf6] font-medium'
                    : 'text-gray-300 hover:bg-[#1e293b] hover:text-gray-100'
                }`}
              >
                <FaHashtag size={12} className={activeRoom === room._id ? 'text-[#8b5cf6]' : 'text-gray-500'} />
                <span className="truncate">{room.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      
      <div className="p-3 border-t border-[#1e293b]">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-[#1e293b] hover:bg-[#2d3748] text-gray-300 hover:text-white rounded-md transition-colors text-sm"
        >
          <FaSignOutAlt size={14} />
          <span>Sign out</span>
        </button>
      </div>
      
      {showCreateModal && (
        <CreateRoomModal 
          onClose={() => setShowCreateModal(false)}
          onRoomCreated={fetchChatRooms}
        />
      )}
    </div>
  );
} 