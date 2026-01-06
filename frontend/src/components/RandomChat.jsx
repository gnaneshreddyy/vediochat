import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:3001';

function RandomChat() {
  const [socket, setSocket] = useState(null);
  const [isMatched, setIsMatched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [username, setUsername] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);

    newSocket.on('waiting-for-match', () => {
      setIsSearching(true);
      setIsMatched(false);
    });

    newSocket.on('random-matched', () => {
      setIsMatched(true);
      setIsSearching(false);
      setMessages(prev => [...prev, { 
        message: 'You have been matched! Start chatting.', 
        username: 'System', 
        isSystem: true 
      }]);
    });

    newSocket.on('random-message', ({ message, username, userId }) => {
      setMessages(prev => [...prev, { message, username, userId, isOwn: false }]);
    });

    newSocket.on('partner-left', () => {
      setIsMatched(false);
      setIsSearching(false);
      setMessages(prev => [...prev, { 
        message: 'Your partner has left. Click "Find New Match" to chat with someone else.', 
        username: 'System', 
        isSystem: true 
      }]);
    });

    return () => {
      if (isMatched || isSearching) {
        newSocket.emit('leave-random');
      }
      newSocket.close();
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const findMatch = () => {
    if (socket) {
      setIsSearching(true);
      setIsMatched(false);
      setMessages([]);
      socket.emit('find-random');
    }
  };

  const leaveChat = () => {
    if (socket) {
      socket.emit('leave-random');
      setIsMatched(false);
      setIsSearching(false);
      setMessages([]);
    }
  };

  const sendMessage = () => {
    if (socket && messageInput.trim() && isMatched) {
      socket.emit('random-message', {
        message: messageInput.trim(),
        username: username || 'Anonymous'
      });
      setMessages(prev => [...prev, { 
        message: messageInput.trim(), 
        username: username || 'Anonymous', 
        isOwn: true 
      }]);
      setMessageInput('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-screen flex flex-col">
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-800">Random Chat</h2>
          {!isMatched && !isSearching && (
            <button
              onClick={findMatch}
              className="bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-600 transition"
            >
              Find Match
            </button>
          )}
          {isMatched && (
            <button
              onClick={leaveChat}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition"
            >
              Leave Chat
            </button>
          )}
          {isSearching && (
            <div className="text-gray-600">
              Searching for match...
            </div>
          )}
        </div>
      </div>

      {!isMatched && !isSearching && (
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-center space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Name (optional)
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your name"
                className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-gray-500"
              />
            </div>
            <p className="text-gray-600">Click "Find Match" to start chatting with a random person</p>
          </div>
        </div>
      )}

      {isSearching && (
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <p className="text-gray-600 mb-2">Searching for someone to chat with...</p>
            <div className="animate-pulse text-gray-400">● ● ●</div>
          </div>
        </div>
      )}

      {isMatched && (
        <>
          <div className="flex-1 overflow-y-auto bg-gray-50 p-4">
            <div className="space-y-2">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.isOwn ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded ${
                      msg.isSystem
                        ? 'bg-gray-200 text-gray-600 text-center mx-auto text-sm'
                        : msg.isOwn
                        ? 'bg-gray-700 text-white'
                        : 'bg-white border border-gray-200'
                    }`}
                  >
                    {!msg.isSystem && (
                      <p className="text-xs font-medium mb-1 opacity-70">
                        {msg.username}
                      </p>
                    )}
                    <p className="text-sm">{msg.message}</p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>

          <div className="bg-white border-t border-gray-200 p-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type a message..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-gray-500"
              />
              <button
                onClick={sendMessage}
                className="bg-gray-700 text-white px-6 py-2 rounded hover:bg-gray-600 transition"
              >
                Send
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default RandomChat;
