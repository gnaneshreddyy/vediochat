import { useState } from 'react';
import RoomChat from './components/RoomChat';
import RandomChat from './components/RandomChat';

function App() {
  const [mode, setMode] = useState(null); // null, 'room', or 'random'

  if (mode === null) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <h1 className="text-2xl font-semibold mb-6 text-center text-gray-800">
            Chat App
          </h1>
          <div className="space-y-4">
            <button
              onClick={() => setMode('room')}
              className="w-full bg-gray-700 text-white py-3 px-4 rounded hover:bg-gray-600 transition"
            >
              Talk to Someone You Know
            </button>
            <button
              onClick={() => setMode('random')}
              className="w-full bg-gray-700 text-white py-3 px-4 rounded hover:bg-gray-600 transition"
            >
              Talk to Random People
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white border-b border-gray-200 p-4">
        <button
          onClick={() => setMode(null)}
          className="text-gray-600 hover:text-gray-800"
        >
          ← Back
        </button>
      </div>
      {mode === 'room' && <RoomChat />}
      {mode === 'random' && <RandomChat />}
    </div>
  );
}

export default App;
