'use client';

import { useState, useRef } from 'react';
import { FaCamera, FaTimes, FaUserPlus, FaUserMinus, FaClock, FaPen } from 'react-icons/fa';
import Image from 'next/image';

interface RoomDetails {
  id: string;
  name: string;
  description: string;
  participants: { id: string; username: string }[];
  pendingInvites: { id: string; email: string }[];
  icon: string;
}

interface RoomSettingsProps {
  room: RoomDetails;
  currentUser: { id: string; username: string };
  onClose: () => void;
  onUpdate: (updatedRoom: RoomDetails) => void;
  roomId: string;
  setRoomDetails: (updatedRoom: RoomDetails) => void;
}

type TabType = 'info' | 'members' | 'invites';

const RoomSettings = ({ room, currentUser, onClose, onUpdate, roomId, setRoomDetails }: RoomSettingsProps) => {
  const [activeTab, setActiveTab] = useState<TabType>('info');
  const [editMode, setEditMode] = useState(false);
  const [roomName, setRoomName] = useState(room.name || '');
  const [roomDescription, setRoomDescription] = useState(room.description || '');
  const [roomIcon, setRoomIcon] = useState<File | null>(null);
  const [roomIconPreview, setRoomIconPreview] = useState<string | null>(room.icon || null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [inviteCount, setInviteCount] = useState(room.pendingInvites?.length || 0);

  const acceptedMembers = room.participants || [];
  const pendingMembers = room.pendingInvites || [];

  const handleIconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setRoomIcon(file);
      const reader = new FileReader();
      reader.onload = () => {
        setRoomIconPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveChanges = async () => {
    if (!roomName.trim()) {
      setError('Room name is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('name', roomName);
      formData.append('description', roomDescription);
      if (roomIcon) {
        formData.append('icon', roomIcon);
      }

      const response = await fetch(`/api/chatrooms/${roomId}`, {
        method: 'PUT',
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        onUpdate(data.room);
        setEditMode(false);
      } else {
        setError(data.message || 'Failed to update room');
      }
    } catch (error) {
      console.error('Error updating room:', error);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleInviteUser = async () => {
    if (!inviteEmail.trim()) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/invitations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          email: inviteEmail,
          roomId: roomId
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send invitation');
      }

      // Clear the input field
      setInviteEmail('');

      // Show success message
      setSuccessMessage('Invitation sent successfully');

      const updatedRoom = { ...room };

      if (!updatedRoom.pendingInvites) {
        updatedRoom.pendingInvites = [];
      }

      updatedRoom.pendingInvites.push({ id: data.user.id, email: data.user.username });

      // Update invites count and list if we're on the invites tab
      setRoomDetails(updatedRoom);
      setInviteCount(updatedRoom.pendingInvites.length);


      // Auto-hide the success message after a few seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (error) {
      console.error('Error inviting user:', error);
      setError((error as Error).message || 'Failed to invite user');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveUser = async (userId: string) => {
    setLoading(true);

    try {
      const response = await fetch(`/api/chatrooms/${roomId}/members/${userId}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        const updatedRoom = { ...room };

        // Remove the user from participants
        updatedRoom.participants = updatedRoom.participants.filter(
          participant => participant.id !== userId
        );  

        // Update local state
        setRoomDetails(updatedRoom);
        setInviteCount(updatedRoom.pendingInvites.length);

        setSuccessMessage('User removed successfully');
        setTimeout(() => {
          setSuccessMessage('');
        }, 3000);
      } else {
        setError(data.message || 'Failed to remove user');
      }
    } catch (error) {
      console.error('Error removing user:', error);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelInvite = async (inviteId: string) => {
    setLoading(true);

    try {
      const response = await fetch(`/api/chatrooms/${roomId}/invites/${inviteId}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to cancel invitation');
      }

      // Update local state immediately
      const updatedRoom = { ...room };

      // Remove the invitation from pendingInvites
      if (updatedRoom.pendingInvites) {
        updatedRoom.pendingInvites = updatedRoom.pendingInvites.filter(invite =>
          invite.id !== inviteId
        );

        // Update local state
        setRoomDetails(updatedRoom);
        setInviteCount(updatedRoom.pendingInvites.length);

        setSuccessMessage('Invitation cancelled successfully');
        setTimeout(() => {
          setSuccessMessage('');
        }, 3000);
      }
    } catch (error) {
      console.error('Error cancelling invitation:', error);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
      <div className="bg-[#0f172a] rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between p-5">
          <h2 className="text-xl font-medium text-white">Room Settings</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <FaTimes />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex">
          <button
            className={`flex-1 py-4 text-base font-medium transition-colors ${activeTab === 'info'
              ? 'text-[#8b5cf6] border-b-2 border-[#8b5cf6]'
              : 'text-gray-400 hover:text-gray-300'
              }`}
            onClick={() => setActiveTab('info')}
          >
            Information
          </button>
          <button
            className={`flex-1 py-4 text-base font-medium transition-colors ${activeTab === 'members'
              ? 'text-[#8b5cf6] border-b-2 border-[#8b5cf6]'
              : 'text-gray-400 hover:text-gray-300'
              }`}
            onClick={() => setActiveTab('members')}
          >
            Members ({acceptedMembers.length})
          </button>
          <button
            className={`flex-1 py-4 text-base font-medium transition-colors ${activeTab === 'invites'
              ? 'text-[#8b5cf6] border-b-2 border-[#8b5cf6]'
              : 'text-gray-400 hover:text-gray-300'
              }`}
            onClick={() => setActiveTab('invites')}
          >
            Invites ({inviteCount})
          </button>
        </div>

        <div className="p-5">
          {error && (
            <div className="mb-4 p-3 bg-red-900/20 border border-red-800/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3 bg-green-900/20 border border-green-800/30 rounded-lg text-green-400 text-sm">
              {successMessage}
            </div>
          )}

          {/* Room Info Tab */}
          {activeTab === 'info' && (
            <div className="space-y-6">
              <div className="flex justify-center">
                <div className="relative">
                  <div className="h-28 w-28 rounded-full bg-[#8b5cf6] flex items-center justify-center text-white text-4xl font-bold overflow-hidden">
                    {roomIconPreview ? (
                      <Image
                        src={roomIconPreview}
                        alt={room.name}
                        width={112}
                        height={112}
                        className="object-cover h-full w-full"
                      />
                    ) : (
                      room.name?.charAt(0).toUpperCase() || 'P'
                    )}
                  </div>

                  {editMode && (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-0 right-0 bg-[#1e293b] p-2.5 rounded-full border border-[#8b5cf6] text-[#8b5cf6] hover:bg-[#2d3748] transition-colors"
                    >
                      <FaCamera size={16} />
                      <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={handleIconChange}
                      />
                    </button>
                  )}
                </div>
              </div>

              {editMode ? (
                <div className="space-y-4">
                  <div>
                    <input
                      type="text"
                      value={roomName}
                      onChange={(e) => setRoomName(e.target.value)}
                      className="w-full px-4 py-3 bg-[#1e293b] border border-[#2d3748] rounded-lg text-white focus:outline-none focus:border-[#8b5cf6] text-lg font-medium"
                      placeholder="Room name"
                    />
                  </div>

                  <div>
                    <textarea
                      value={roomDescription}
                      onChange={(e) => setRoomDescription(e.target.value)}
                      className="w-full px-4 py-3 bg-[#1e293b] border border-[#2d3748] rounded-lg text-white focus:outline-none focus:border-[#8b5cf6] resize-none min-h-[100px]"
                      placeholder="Room description (optional)"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      onClick={() => {
                        setEditMode(false);
                        setRoomName(room.name || '');
                        setRoomDescription(room.description || '');
                        setRoomIconPreview(room.icon || null);
                        setRoomIcon(null);
                      }}
                      className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveChanges}
                      className="px-5 py-2.5 bg-[#8b5cf6] hover:bg-[#7c3aed] text-white rounded-lg transition-colors flex items-center gap-2"
                      disabled={loading}
                    >
                      {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <h3 className="text-2xl font-medium text-white mb-2">{room.name}</h3>
                  <p className="text-gray-400">{room.description || 'No description'}</p>

                  <button
                    onClick={() => setEditMode(true)}
                    className="mt-5 inline-flex items-center gap-2 px-4 py-2.5 bg-[#1e293b] hover:bg-[#2d3748] text-gray-300 hover:text-white rounded-lg transition-colors"
                  >
                    <FaPen size={14} /> Edit Room Info
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Members Tab */}
          {activeTab === 'members' && (
            <div className="space-y-5">
              <div className="space-y-3">
                {acceptedMembers.length === 0 ? (
                  <div className="text-center py-10 text-gray-500">
                    No members yet
                  </div>
                ) : (
                  <div className="space-y-2 max-h-72 overflow-y-auto">
                    {acceptedMembers.map((member: { id: string; username: string }) => (
                      <div key={member.id} className="flex items-center justify-between p-3 rounded-lg bg-[#1e293b] transition-transform hover:translate-x-1">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-[#8b5cf6] flex items-center justify-center text-white font-medium text-lg">
                            {member.username?.charAt(0).toUpperCase() || '?'}
                          </div>
                          <div className="ml-3">
                            <div className="text-white font-medium">{member.username}</div>
                          </div>
                        </div>

                        {/* Only show remove button if not the current user */}
                        {member.id !== currentUser?.id && (
                          <button
                            onClick={() => handleRemoveUser(member.id)}
                            className="p-2 text-gray-400 hover:text-red-400 transition-colors rounded-full hover:bg-[#2d3748]"
                            title="Remove from room"
                            disabled={loading}
                          >
                            <FaUserMinus size={16} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-[#1e293b]">
                <div className="flex gap-3 items-center">
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="Enter email address"
                    className="flex-1 px-4 py-3 bg-[#1e293b] border border-[#2d3748] rounded-lg text-white focus:outline-none focus:border-[#8b5cf6]"
                  />
                  <button
                    onClick={handleInviteUser}
                    className="p-3 bg-[#8b5cf6] text-white rounded-lg hover:bg-[#7c3aed] transition-colors"
                    disabled={loading || !inviteEmail.trim()}
                  >
                    <FaUserPlus size={18} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Pending Invitations Tab */}
          {activeTab === 'invites' && (
            <div className="space-y-5">
              <div className="space-y-3">
                {pendingMembers.length === 0 ? (
                  <div className="text-center py-10 text-gray-500">
                    No pending invitations
                  </div>
                ) : (
                  <div className="space-y-2 max-h-72 overflow-y-auto">
                    {pendingMembers.map((invite: { id: string; email: string }) => (
                      <div key={invite.id} className="flex items-center justify-between p-3 rounded-lg bg-[#1e293b] transition-transform hover:translate-x-1">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-[#475569] flex items-center justify-center text-white">
                            <FaClock size={18} />
                          </div>
                          <div className="ml-3">
                            <div className="text-white font-medium">{invite.email}</div>
                            <div className="text-yellow-500 text-xs flex items-center gap-1 mt-0.5">
                              <FaClock size={10} /> Awaiting response
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => handleCancelInvite(invite.id)}
                          className="p-2 text-gray-400 hover:text-red-400 transition-colors rounded-full hover:bg-[#2d3748]"
                          title="Cancel invitation"
                          disabled={loading}
                        >
                          <FaTimes size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-[#1e293b]">
                <div className="flex gap-3 items-center">
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="Enter email address"
                    className="flex-1 px-4 py-3 bg-[#1e293b] border border-[#2d3748] rounded-lg text-white focus:outline-none focus:border-[#8b5cf6]"
                  />
                  <button
                    onClick={handleInviteUser}
                    className="p-3 bg-[#8b5cf6] text-white rounded-lg hover:bg-[#7c3aed] transition-colors"
                    disabled={loading || !inviteEmail.trim()}
                  >
                    <FaUserPlus size={18} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RoomSettings; 