"use client";

import { useState } from 'react';

interface InviteUserModalProps {
  roomId: string | null;
  onClose: () => void;
}

export default function InviteUserModal({ roomId, onClose }: InviteUserModalProps) {
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim() || !roomId) return;
    
    setSending(true);
    setError(null);
    
    try {
      const response = await fetch('/api/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), roomId })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess(true);
        // Close after 2 seconds on success
        setTimeout(() => onClose(), 2000);
      } else {
        setError(data.error || 'Failed to send invitation');
      }
    } catch (err) {
      setError('An error occurred while sending the invitation');
      console.error(err);
    } finally {
      setSending(false);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">Invite User to Chat</h2>
        
        {success ? (
          <div className="bg-green-900 text-green-100 p-3 rounded-md">
            Invitation sent successfully!
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="email" className="block text-sm font-medium mb-1">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-gray-700 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="user@example.com"
                required
              />
            </div>
            
            {error && (
              <div className="mb-4 text-red-500 text-sm">
                {error}
              </div>
            )}
            
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={sending || !email.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50"
              >
                {sending ? 'Sending...' : 'Send Invitation'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
} 