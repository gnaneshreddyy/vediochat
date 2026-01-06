import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:3001';

function RoomChat() {
  const [socket, setSocket] = useState(null);
  const [roomId, setRoomId] = useState('');
  const [isHost, setIsHost] = useState(false);
  const [isJoined, setIsJoined] = useState(false);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [username, setUsername] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);

    newSocket.on('room-created', ({ roomId }) => {
      setRoomId(roomId);
      setIsHost(true);
      setIsJoined(true);
    });

    newSocket.on('room-joined', ({ roomId }) => {
      setIsJoined(true);
    });

    newSocket.on('room-error', ({ message }) => {
      alert(message);
    });

    newSocket.on('room-message', ({ message, username, userId }) => {
      setMessages(prev => [...prev, { message, username, userId, isOwn: false }]);
    });

    newSocket.on('user-joined', ({ userId }) => {
      setMessages(prev => [...prev, { 
        message: 'User joined the room', 
        username: 'System', 
        isSystem: true 
      }]);
    });

    newSocket.on('user-left', ({ userId }) => {
      setMessages(prev => [...prev, { 
        message: 'User left the room', 
        username: 'System', 
        isSystem: true 
      }]);
    });

    return () => {
      if (isJoined && roomId) {
        newSocket.emit('leave-room', { roomId });
      }
      newSocket.close();
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const createRoom = () => {
    if (socket) {
      socket.emit('create-room');
    }
  };

  const joinRoom = () => {
    if (socket && roomId.trim()) {
      socket.emit('join-room', { roomId: roomId.trim().toUpperCase() });
    } else {
      alert('Please enter a room ID');
    }
  };

  const sendMessage = () => {
    if (socket && messageInput.trim() && isJoined) {
      socket.emit('room-message', {
        roomId,
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

  if (!isJoined) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Create or Join Room</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Name (optional)
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-gray-500"
                />
              </div>
              <div>
                <button
                  onClick={createRoom}
                  className="w-full bg-gray-700 text-white py-2 px-4 rounded hover:bg-gray-600 transition mb-3"
                >
                  Create Room
                </button>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                    placeholder="Enter Room ID"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-gray-500"
                  />
                  <button
                    onClick={joinRoom}
                    className="bg-gray-700 text-white py-2 px-4 rounded hover:bg-gray-600 transition"
                  >
                    Join
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto h-screen flex flex-col">
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Room: {roomId}</h2>
            {isHost && <p className="text-sm text-gray-500">You are the host</p>}
          </div>
          {isHost && (
            <div className="bg-gray-100 px-3 py-1 rounded">
              <p className="text-sm text-gray-700">Share Room ID: <span className="font-mono font-bold">{roomId}</span></p>
            </div>
          )}
        </div>
      </div>

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
    </div>
  );
}

export default RoomChat;
