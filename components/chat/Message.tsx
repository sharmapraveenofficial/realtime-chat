"use client";

interface MessageProps {
  message: {
    id: string;
    content: string;
    sender: {
      id: string;
      username?: string;
    };
    createdAt: string;
  };
  isCurrentUser: boolean;
}

export default function Message({ message, isCurrentUser }: MessageProps) {
  const formattedTime = new Date(message.createdAt).toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  return (
    <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div 
        className={`rounded-lg py-2 px-4 max-w-xs lg:max-w-md ${
          isCurrentUser 
            ? 'bg-blue-600 text-white' 
            : 'bg-gray-700 text-white'
        }`}
      >
        {!isCurrentUser && (
          <div className="font-bold text-xs text-blue-300">
            {message.sender.username || 'User'}
          </div>
        )}
        <p>{message.content}</p>
        <div className={`text-xs mt-1 ${isCurrentUser ? 'text-blue-200' : 'text-gray-400'}`}>
          {formattedTime}
        </div>
      </div>
    </div>
  );
} 