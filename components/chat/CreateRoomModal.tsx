"use client";

import { useState } from 'react';

interface CreateRoomModalProps {
  onClose: () => void;
  onRoomCreated: () => void;
}

export default function CreateRoomModal({ onClose, onRoomCreated }: CreateRoomModalProps) {
  const [roomName, setRoomName] = useState('');
  const [invites, setInvites] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!roomName.trim()) {
      setError('Room name is required');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Parse emails/usernames to invite
      const inviteList = invites
        .split(',')
        .map(invite => invite.trim())
        .filter(invite => invite);
      
      const response = await fetch('/api/chatrooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          name: roomName,
          invites: inviteList
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create room');
      }
      
      // Success
      onRoomCreated();
      onClose();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Create New Chat Room</h2>
        
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-2 rounded-lg mb-4">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="roomName" className="block text-sm font-medium text-gray-300 mb-1">
              Room Name
            </label>
            <input
              id="roomName"
              type="text"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g. Project Discussion"
            />
          </div>
          
          <div className="mb-6">
            <label htmlFor="invites" className="block text-sm font-medium text-gray-300 mb-1">
              Invite Users (optional)
            </label>
            <textarea
              id="invites"
              value={invites}
              onChange={(e) => setInvites(e.target.value)}
              className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter emails or usernames, separated by commas"
              rows={3}
            />
            <p className="text-xs text-gray-400 mt-1">
              Non-registered users will receive an invitation to join
            </p>
          </div>
          
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className={`px-4 py-2 rounded-lg ${
                isLoading 
                  ? 'bg-blue-700/70 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700'
              } transition-colors`}
            >
              {isLoading ? 'Creating...' : 'Create Room'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 