import React, { useState, useEffect } from 'react';
import { relayManager } from '../utils/relay';

function ConnectionStatus() {
  const [status, setStatus] = useState({ total: 0, connected: 0, relays: [] });
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const updateStatus = () => {
      setStatus(relayManager.getConnectionStatus());
    };
    
    updateStatus();
    const interval = setInterval(updateStatus, 5000);
    
    return () => clearInterval(interval);
  }, []);

  const percentage = status.total > 0 ? (status.connected / status.total) * 100 : 0;
  const isHealthy = percentage >= 50;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div 
        onClick={() => setShowDetails(!showDetails)}
        className={`px-3 py-2 rounded-full text-xs font-mono backdrop-blur cursor-pointer transition ${
          isHealthy ? 'bg-[#00BA7C]/20 text-[#00BA7C]' : 'bg-yellow-500/20 text-yellow-500'
        }`}
      >
        {isHealthy ? '⚡' : '⚠️'} {status.connected}/{status.total} relays
      </div>
      
      {showDetails && (
        <div className="absolute bottom-full right-0 mb-2 w-64 bg-black border border-[#2F3336] rounded-xl p-3 shadow-xl">
          <h4 className="font-bold mb-2 text-sm">Connected Relays</h4>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {status.relays.map(relay => (
              <div key={relay} className="text-xs text-[#71767B] truncate">
                ✅ {relay.replace('wss://', '')}
              </div>
            ))}
            {status.total - status.connected > 0 && (
              <div className="text-xs text-red-500">
                ❌ {status.total - status.connected} relays offline
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ConnectionStatus;