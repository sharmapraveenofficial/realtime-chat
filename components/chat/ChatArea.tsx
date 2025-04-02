"use client";

import React, { useState, useEffect, useRef } from 'react';
import useSocket from '@/hooks/useSocket';
import InviteUserModal from '@/components/chat/InviteUserModal';
import RoomSettings from '@/components/chat/RoomSettings';
import ChatInput from '@/components/chat/ChatInput';
import { FaUserCircle, FaCog, FaCheck, FaCheckDouble } from 'react-icons/fa';
import { format } from 'date-fns';
import { Socket } from 'socket.io-client';

interface ChatAreaProps {
  roomId: string | null;
  userId: string;
  username: string;
  roomName: string;
}

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

// Add the interface for room details
interface RoomDetails {
  id: string;
  name: string;
  description: string;
  participants: {
    id: string;
    username: string;
  }[];
  pendingInvites: {
    id: string;
    email: string;
  }[];
  icon: string;
}

const ChatArea = ({ roomId, userId, username, roomName }: ChatAreaProps) => {
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [loading, setLoading] = useState(false);
  const [messagesLoaded, setMessagesLoaded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { socket, connectionError, joinRoom, leaveRoom, onNewMessage } = useSocket();
  const [showInviteModal, setShowInviteModal] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [roomDetails, setRoomDetails] = useState<RoomDetails | null>(null);
  const [showRoomSettings, setShowRoomSettings] = useState(false);
  const [typingUsers, setTypingUsers] = useState<{ id: string; username: string }[]>([]);
  const [currentUser, ] = useState({ id: userId, username: username });

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Fetch messages when room changes
  useEffect(() => {
    if (roomId) {
      setLoading(true);
      setMessagesLoaded(false);
      
      // Clear messages when changing rooms
      setMessages([]);
      
      // Fetch previous messages via API
      fetch(`/api/chatrooms/${roomId}/messages`)
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            setMessages(data.messages);
            setRoomDetails(data.roomDetails);
          } else if (data.error) {
            console.error("Failed to load messages:", data.error);
          }
        })
        .catch(error => {
          console.error("Error fetching messages:", error);
        })
        .finally(() => {
          setLoading(false);
          setMessagesLoaded(true);
        });
    }
  }, [roomId]);

  // Join room via socket when connected
  useEffect(() => {
    if (roomId && socket) {
      // Join the room when component mounts
      joinRoom(roomId);
      
      // Set up listener for new messages
      onNewMessage((message) => {
        console.log('New message received in component:', message);
        
        // Prevent duplicate messages (check if we already have this message in state)
        setMessages(prevMessages => {
          // Check if message already exists
          const messageExists = prevMessages.some(msg => msg.id === message.id);
          if (messageExists) {
            return prevMessages;
          }
          return [...prevMessages, message];
        });
      });
      
      // Leave room when component unmounts or room changes
      return () => {
        leaveRoom(roomId);
      };
    }
  }, [roomId, socket, joinRoom, leaveRoom, onNewMessage]);

  // Add this debug logging
  useEffect(() => {
    if (socket) {
      socket.on('roomJoined', ({ roomId }) => {
        console.log(`✅ Successfully joined room: ${roomId}`);
      });
      
      return () => {
        socket.off('roomJoined');
      };
    }
  }, [socket]);

  // Set up socket for typing indicators - simplified approach
  useEffect(() => {
    if (!socket) return;
    
    // Listen for typing events
    socket.on('userTyping', (data) => {
      console.log("Typing event received:", data);
      const { user, isTyping } = data;
      
      // Make sure it's not our own typing event
      if (user.id === currentUser.id) return;
      
      setTypingUsers(prev => {
        if (isTyping) {
          // Only add if not already in the array
          if (!prev.some(u => u.id === user.id)) {
            console.log("Adding typing user:", user.username);
            return [...prev, user];
          }
        } else {
          // Remove user when they stop typing
          console.log("Removing typing user:", user.username);
          return prev.filter(u => u.id !== user.id);
        }
        return prev;
      });
    });
    
    // When a new message is received, clear that user's typing status
    socket.on('newMessage', (message) => {
      console.log("New message received, clearing typing status for sender");
      if (message.sender) {
        setTypingUsers(prev => prev.filter(user => user.id !== message.sender.id));
      }
    });
    
    return () => {
      socket.off('userTyping');
      socket.off('newMessage');
    };
  }, [socket, currentUser.id]);

  // Send a message
  const sendMessage = async (content: string) => {
    if (!socket || !roomId || !content.trim()) return;
    
    try {
      // Generate temp ID
      const tempId = `temp-${Date.now()}`;
      
      // Create a temporary message for immediate display
      const tempMessage = {
        id: tempId,
        content: content.trim(),
        sender: {
          id: userId,
          username: username
        },
        createdAt: new Date().toISOString(),
        status: 'pending'
      };
      
      // Add to UI immediately
      setMessages(prev => [...prev, tempMessage as MessageType]);
      
      // Save via API
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId,
          content: content.trim(),
          userId
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to save message');
      }
      
      const data = await response.json();
      
      if (data.success) {
        // After successfully saving, emit the broadcast event
        socket.emit('broadcastMessage', { 
          roomId, 
          message: data.message 
        });
        
        // Update the local temporary message with the real one
        setMessages(prev => 
          prev.map(msg => 
            msg.id === tempId ? {...data.message, status: 'sent'} : msg
          )
        );
      } else {
        throw new Error(data.error || 'Unknown error');
      }
      
    } catch (error) {
      console.error('Error sending message:', error);
      // Update failed status on temp message
      setMessages(prev => 
        prev.map(msg => 
          msg.id === `temp-${Date.now()}` ? {...msg, status: 'failed'} : msg
        )
      );
    }
    
    // Also clear typing users when sending a message
    setTypingUsers([]);
  };

  // Handler for room updates
  const handleRoomUpdate = (updatedRoom: RoomDetails) => {
    if (updatedRoom) {
      // Update the roomDetails state with new information
      setRoomDetails({
        ...roomDetails!,
        name: updatedRoom.name,
        description: updatedRoom.description,
        participants: updatedRoom.participants || roomDetails?.participants || []
      });
    }
  };

  // Make sure to join the socket room when entering
  useEffect(() => {
    if (socket && roomId) {
      console.log("Joining room:", roomId);
      socket.emit('joinRoom', { roomId });
      
      return () => {
        console.log("Leaving room:", roomId);
        socket.emit('leaveRoom', { roomId });
      };
    }
  }, [socket, roomId]);

  if (connectionError) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-900">
        <div className="text-center p-4">
          <p className="text-red-500 mb-2">Connection error: {connectionError}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 rounded-md hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!roomId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-900">
        <p className="text-gray-500">Select a chat to start messaging</p>
      </div>
    );
  }

  // Display typing indicator
  const renderTypingIndicator = () => {
    if (typingUsers.length === 0) return null;
    
    let message = '';
    if (typingUsers.length === 1) {
      message = `${typingUsers[0].username} is typing...`;
    } else if (typingUsers.length === 2) {
      message = `${typingUsers[0].username} and ${typingUsers[1].username} are typing...`;
    } else {
      message = `${typingUsers[0].username} and ${typingUsers.length - 1} others are typing...`;
    }
    
    return (
      <div className="px-4 py-2 text-sm text-gray-400">
        <div className="flex items-center">
          <div className="flex space-x-1 mr-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#8b5cf6] animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-1.5 h-1.5 rounded-full bg-[#8b5cf6] animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-1.5 h-1.5 rounded-full bg-[#8b5cf6] animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
          <span>{message}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-[calc(100vh-10px)] w-full bg-gradient-to-b from-[#0f172a] to-[#111827]">
      {/* Header - Enhanced with gradient and better typography */}
      <div className="flex-none p-4 border-b border-[#1e293b] bg-gradient-to-r from-[#111827] to-[#1e293b] z-10 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-semibold shadow-lg">
              {roomName ? roomName.charAt(0) : '?'}
            </div>
            <div className="ml-3">
              <h3 className="text-white font-medium">{roomName || 'Chat'}</h3>
              <p className="text-xs text-gray-400 flex items-center gap-1">
                <span className="inline-block h-2 w-2 rounded-full bg-green-500"></span>
                Secure chat • Face authenticated
              </p>
            </div>
          </div>
          <button 
            onClick={() => setShowRoomSettings(true)}
            className="text-gray-400 hover:text-white p-2 rounded-full hover:bg-[#1e293b] transition-all"
            title="Room settings"
          >
            <FaCog className="h-5 w-5" />
          </button>
        </div>
      </div>
      
      {/* Messages container - Improved styling and spacing */}
      <div 
        className="flex-1 overflow-y-auto py-4 px-4 bg-[#0f172a]/50"
        ref={messagesContainerRef}
      >
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-t-purple-500 border-r-transparent border-b-transparent border-l-transparent"></div>
          </div>
        ) : messagesLoaded && messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <div className="bg-[#1a2335] p-8 rounded-2xl text-center shadow-lg max-w-md mx-auto border border-[#1e293b]/50">
              <div className="inline-block p-4 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full mb-6 shadow-md">
                <FaUserCircle className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-white font-medium text-xl mb-3">No messages yet</h3>
              <p className="text-gray-400 mb-6">Start a secure conversation with face-verified encryption</p>
              <button 
                onClick={() => document.querySelector('input')?.focus()}
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full text-white font-medium shadow-lg hover:shadow-xl transition-all"
              >
                Start chatting
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {messages.map((msg, index) => {
              const isOwnMessage = msg.sender.id === userId;
              const showAvatar = !isOwnMessage && (index === 0 || messages[index - 1]?.sender.id !== msg.sender.id);
              
              return (
                <div key={msg.id} className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} group`}>
                  {!isOwnMessage && showAvatar && (
                    <div className="flex-shrink-0 mr-3 mt-1">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center text-white font-medium shadow-md">
                        {msg.sender.username?.charAt(0) || 'U'}
                      </div>
                    </div>
                  )}
                  {!isOwnMessage && !showAvatar && <div className="w-11"></div>}
                  <div className={`max-w-[75%] ${isOwnMessage ? 'text-right' : ''}`}>
                    <div className={`px-4 py-2.5 rounded-2xl inline-block text-left relative ${
                      isOwnMessage 
                        ? 'bg-gradient-to-br from-purple-500 to-indigo-600 text-white' 
                        : 'bg-[#1e293b] text-gray-200'
                    } shadow-md`}>
                      {/* Triangle for user message */}
                      {isOwnMessage && (
                        <div className="absolute right-[-8px] top-[50%] transform translate-y-[-50%] w-0 h-0 border-t-[8px] border-t-transparent border-l-[8px] border-l-indigo-600 border-b-[8px] border-b-transparent"></div>
                      )}
                      
                      {/* Triangle for other person message */}
                      {!isOwnMessage && showAvatar && (
                        <div className="absolute left-[-8px] top-[50%] transform translate-y-[-50%] w-0 h-0 border-t-[8px] border-t-transparent border-r-[8px] border-r-[#1e293b] border-b-[8px] border-b-transparent"></div>
                      )}
                      
                      {/* Show the name on the first message from this sender */}
                      {!isOwnMessage && showAvatar && (
                        <div className="text-xs text-blue-400 font-medium mb-1">
                          {msg.sender.username || 'User'}
                        </div>
                      )}
                      
                      <div className="break-words">{msg.content}</div>
                    </div>
                    
                    <div className={`mt-1 text-[11px] text-gray-500 flex items-center gap-1 ${isOwnMessage ? 'justify-end pr-1' : 'justify-start pl-1'}`}>
                      <span>{format(new Date(msg.createdAt), 'HH:mm')}</span>
                      
                      {/* Status indicators for own messages */}
                      {isOwnMessage && (
                        <span>
                          {msg.status === 'pending' && <span className="h-2 w-2 bg-gray-400 rounded-full inline-block"></span>}
                          {msg.status === 'sent' && <FaCheck className="text-gray-400 h-3 w-3" />}
                          {msg.status === 'delivered' && <FaCheckDouble className="text-gray-400 h-3 w-3" />}
                          {msg.status === 'read' && <FaCheckDouble className="text-blue-500 h-3 w-3" />}
                          {msg.status === 'failed' && <span className="text-red-500">!</span>}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            
            {/* Auto-scroll anchor */}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
      
      {/* Input - enhanced with modern styling */}
      <div className="flex-none bg-[#111827] border-t border-[#1e293b] z-10 p-3">
        <div className="bg-[#1e293b] rounded-full shadow-inner">
          <ChatInput 
            onSendMessage={sendMessage}
            placeholder="Type a message or use voice input..."
            disabled={loading}
            roomId={roomId}
            socket={socket as Socket}
            currentUser={{ id: userId, username: username }}
          />
        </div>
      </div>
      
      {showInviteModal && (
        <InviteUserModal
          roomId={roomId}
          onClose={() => setShowInviteModal(false)}
        />
      )}
      
      {/* Room Settings Modal */}
      {showRoomSettings && roomDetails && (
        <RoomSettings
          room={roomDetails}
          currentUser={{ id: userId, username: username }}
          onClose={() => setShowRoomSettings(false)}
          onUpdate={handleRoomUpdate}
          roomId={roomId}
          setRoomDetails={setRoomDetails}
        />
      )}
      
      {/* Inline typing indicator */}
      {renderTypingIndicator()}
    </div>
  );
};

export default ChatArea; 