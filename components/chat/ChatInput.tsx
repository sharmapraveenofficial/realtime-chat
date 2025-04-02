'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { FaMicrophone, FaStop, FaPaperPlane } from 'react-icons/fa';
import { BsEmojiSmile } from 'react-icons/bs';
import { debounce } from 'lodash';
import { Socket } from 'socket.io-client';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  placeholder?: string;
  disabled?: boolean;
  roomId: string;
  socket: Socket;
  currentUser: { id: string; username: string };
}

// Common emojis that don't require any external library
const commonEmojis = [
  '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇',
  '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚',
  '👍', '👎', '👏', '🙌', '👌', '✌️', '🤞', '🤟', '🤘', '👊',
  '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '❣️', '💕', '💞',
  '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶',
  '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥'
];

const ChatInput = ({ onSendMessage, placeholder = 'Type a message or use voice input...', disabled = false, roomId, socket, currentUser }: ChatInputProps) => {
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcribedText, setTranscribedText] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isTyping, ] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  
  // Create debounced function for typing events
  const emitTypingEvent = useCallback(
    debounce((typing) => {
      if (socket && roomId && currentUser) {
        socket.emit('typing', { 
          roomId, 
          user: { 
            id: currentUser.id, 
            username: currentUser.username 
          }, 
          isTyping: typing 
        });
      }
    }, 500),
    [roomId, currentUser, socket]
  );
  
  // Handle typing notification
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setMessage(newValue);
    
    // Only emit if socket and room are available
    if (socket && roomId && currentUser) {
      // Send typing indicator - true if text exists
      socket.emit('typing', {
        roomId,
        user: {
          id: currentUser.id,
          username: currentUser.username
        },
        isTyping: newValue.length > 0
      });
    }
  };
  
  // Clean up when component unmounts
  useEffect(() => {
    return () => {
      // Only emit stopped typing if was typing
      if (isTyping) {
        socket.emit('typing', { 
          roomId, 
          user: { 
            id: currentUser.id, 
            username: currentUser.username 
          }, 
          isTyping: false 
        });
      }
      emitTypingEvent.cancel();
    };
  }, [emitTypingEvent, isTyping, socket, roomId, currentUser]);
  
  // Start recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = handleRecordingStop;
      
      // Start recording
      mediaRecorder.start();
      setIsRecording(true);
      setTranscribedText('');
      setIsEditing(false);
      
      // Start timer
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Could not access microphone. Please check your permissions.');
    }
  };
  
  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };
  
  // Handle when recording stops
  const handleRecordingStop = async () => {
    setIsTranscribing(true);
    
    try {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      
      // Create FormData to send the audio file
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      
      // Use the existing speech-to-text endpoint
      const response = await fetch('/api/speech-to-text', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Failed to transcribe audio');
      }
      
      const data = await response.json();
      
      if (data.transcript) {
        setTranscribedText(data.transcript);
        setIsEditing(true); // Enter edit mode to review transcription
      } else {
        throw new Error(data.error || 'No transcription returned');
      }
    } catch (error) {
      console.error('Transcription error:', error);
      alert('Error transcribing your message. Please try again.');
    } finally {
      setIsTranscribing(false);
    }
  };
  
  // Send the edited transcription
  const sendTranscribedMessage = () => {
    if (transcribedText.trim()) {
      onSendMessage(transcribedText.trim());
      setTranscribedText('');
      setIsEditing(false);
    }
  };
  
  // Format recording time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Handle normal text input submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedMessage = message.trim();
    if (trimmedMessage) {
      onSendMessage(trimmedMessage);
      setMessage('');
      
      // Reset typing status when message is sent
      if (socket && roomId && currentUser) {
        socket.emit('typing', {
          roomId,
          user: {
            id: currentUser.id,
            username: currentUser.username
          },
          isTyping: false
        });
      }
    }
  };
  
  // Handle Enter key press
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };
  
  // Auto-resize textarea as content grows
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 120)}px`;
    }
  }, [message]);
  
  // Handle clicks outside the emoji picker to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        emojiPickerRef.current && 
        !emojiPickerRef.current.contains(event.target as Node) &&
        buttonRef.current && 
        !buttonRef.current.contains(event.target as Node)
      ) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleEmojiClick = (emoji: string) => {
    // Get cursor position
    const cursorPos = inputRef.current?.selectionStart || message.length;
    const textBeforeCursor = message.slice(0, cursorPos);
    const textAfterCursor = message.slice(cursorPos);
    
    // Insert emoji at cursor position
    setMessage(textBeforeCursor + emoji + textAfterCursor);
    
    // Set focus back to input and move cursor after the inserted emoji
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        const newCursorPos = cursorPos + emoji.length;
        inputRef.current.selectionStart = newCursorPos;
        inputRef.current.selectionEnd = newCursorPos;
      }
    }, 10);
  };

  const toggleEmojiPicker = () => {
    console.log("Toggle emoji picker, current state:", !showEmojiPicker);
    setShowEmojiPicker(!showEmojiPicker);
  };

  return (
    <div className="p-4">
      {isEditing ? (
        <div className="rounded-lg border border-[#8b5cf6]">
          <div className="px-4 pt-4 pb-2 text-[#8b5cf6] text-sm flex items-center">
            <span className="mr-2">•</span>
            <span>Review and edit your transcribed message:</span>
          </div>
          <div className="p-3 relative">
            <textarea
              value={transcribedText}
              onChange={(e) => setTranscribedText(e.target.value)}
              className="w-full bg-[#0c1221] rounded-md p-3 text-white resize-none focus:outline-none min-h-[100px] border-none"
              autoFocus
            />
            <button
              type="button"
              onClick={sendTranscribedMessage}
              className="absolute bottom-6 right-6 p-3 rounded-full bg-[#8b5cf6] hover:bg-[#7c3aed] transition-colors"
              title="Send message"
            >
              <FaPaperPlane className="text-white" size={16} />
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex items-center gap-3">
          <div className="relative flex-1">
            <input
              ref={inputRef}
              type="text"
              value={message}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={isTranscribing ? "Transcribing your message..." : placeholder}
              disabled={disabled || isRecording || isTranscribing}
              className="w-full p-3 pl-4 pr-10 rounded-md bg-[#1e293b] text-white focus:outline-none focus:ring-1 focus:ring-[#8b5cf6] placeholder-gray-500"
            />
            <button
              ref={buttonRef}
              type="button"
              onClick={toggleEmojiPicker}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
              title="Add emoji"
            >
              <BsEmojiSmile size={18} />
            </button>
          </div>
          
          <button
            type="button"
            onClick={isRecording ? stopRecording : startRecording}
            disabled={disabled || isTranscribing}
            className={`p-3 rounded-full ${
              isRecording 
                ? 'bg-red-500 hover:bg-red-600' 
                : 'bg-[#8b5cf6] hover:bg-[#7c3aed]'
            } ${isTranscribing ? 'opacity-50 cursor-not-allowed' : ''} transition-colors`}
            title={isRecording ? "Stop recording" : "Voice message"}
          >
            {isRecording ? <FaStop className="text-white" size={14} /> : <FaMicrophone className="text-white" size={16} />}
          </button>
        </form>
      )}
      
      {isRecording && (
        <div className="mt-2 ml-2 text-sm text-red-400 flex items-center">
          <span className="animate-pulse w-2 h-2 rounded-full bg-red-500 mr-2"></span>
          Recording {formatTime(recordingTime)}
        </div>
      )}
      
      {isTranscribing && (
        <div className="mt-2 ml-2 text-sm text-[#8b5cf6] flex items-center">
          <span className="animate-pulse w-2 h-2 rounded-full bg-[#8b5cf6] mr-2"></span>
          Transcribing audio...
        </div>
      )}
      
      {showEmojiPicker && (
        <div 
          ref={emojiPickerRef} 
          className="absolute bottom-full right-0 mb-2 bg-gray-700 rounded-lg p-2 shadow-lg"
          style={{ 
            zIndex: 9999, 
            width: '320px',
            maxHeight: '300px',
            overflowY: 'auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(8, 1fr)',
            gap: '8px',
          }}
        >
          {commonEmojis.map((emoji, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleEmojiClick(emoji)}
              className="w-8 h-8 flex items-center justify-center hover:bg-gray-600 rounded cursor-pointer text-xl"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ChatInput; 