import React, { useState, useEffect } from 'react';

function DebugPanel({ logs = [] }) {
  const [isVisible, setIsVisible] = useState(false);
  const [debugLogs, setDebugLogs] = useState([]);

  useEffect(() => {
    setDebugLogs(logs);
  }, [logs]);

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 left-4 bg-[#2F3336] text-white px-3 py-1 rounded-full text-xs z-50"
      >
        🐛 Debug
      </button>
    );
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-black/95 border-t border-[#00BA7C] z-50 max-h-64 overflow-y-auto">
      <div className="sticky top-0 bg-[#1a1a1a] p-2 flex justify-between items-center border-b border-[#2F3336]">
        <span className="text-[#00BA7C] text-sm font-bold">🐛 Debug Console</span>
        <button onClick={() => setIsVisible(false)} className="text-white text-lg px-2">
          ✕
        </button>
      </div>
      <div className="p-2 space-y-1">
        {debugLogs.length === 0 ? (
          <p className="text-[#71767B] text-xs p-2">No logs yet. Try importing a key...</p>
        ) : (
          debugLogs.map((log, index) => (
            <div key={index} className={`text-xs p-1 font-mono break-all ${
              log.type === 'error' ? 'text-red-400' : 
              log.type === 'success' ? 'text-[#00BA7C]' : 
              'text-[#71767B]'
            }`}>
              <span className="text-[#71767B]">[{log.timestamp}]</span> {log.message}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default DebugPanel;