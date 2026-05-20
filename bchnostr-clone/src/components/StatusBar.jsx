import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, Zap } from 'lucide-react';
import { relayManager } from '../utils/relay';
import { DEFAULT_RELAYS } from '../utils/nostr';

function StatusBar() {
  const [status, setStatus] = useState({ total: 0, connected: 0, relays: [] });
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const updateStatus = () => {
      setStatus(relayManager.getConnectionStatus());
    };
    
    updateStatus();
    const interval = setInterval(updateStatus, 10000);
    
    return () => clearInterval(interval);
  }, []);

  const isConnected = status.connected > 0;
  const quality = status.connected >= 4 ? 'good' : status.connected >= 2 ? 'fair' : 'poor';

  const getQualityColor = () => {
    switch(quality) {
      case 'good': return 'text-[#00BA7C]';
      case 'fair': return 'text-yellow-500';
      case 'poor': return 'text-[#F4212E]';
      default: return 'text-[#71767B]';
    }
  };

  const getQualityText = () => {
    switch(quality) {
      case 'good': return 'Excellent';
      case 'fair': return 'Fair';
      case 'poor': return 'Poor';
      default: return 'Offline';
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 transition text-xs"
      >
        {isConnected ? (
          <>
            <Wifi size={12} className={getQualityColor()} />
            <span className="text-[#71767B]">{status.connected}/{status.total}</span>
            <Zap size={10} className="text-yellow-500" />
          </>
        ) : (
          <>
            <WifiOff size={12} className="text-[#F4212E]" />
            <span className="text-[#F4212E]">Offline</span>
          </>
        )}
      </button>

      {showDetails && (
        <>
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setShowDetails(false)}
          />
          <div className="absolute top-full right-0 mt-2 w-80 bg-black border border-[#2F3336] rounded-xl shadow-2xl z-50 overflow-hidden">
            <div className="p-3 border-b border-[#2F3336] bg-white/5">
              <div className="flex justify-between items-center">
                <h4 className="font-semibold text-sm">🍃 Relay Connection</h4>
                <div className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  quality === 'good' ? 'bg-[#00BA7C]/20 text-[#00BA7C]' :
                  quality === 'fair' ? 'bg-yellow-500/20 text-yellow-500' :
                  'bg-red-500/20 text-red-500'
                }`}>
                  {getQualityText()}
                </div>
              </div>
            </div>
            
            <div className="p-3 max-h-64 overflow-y-auto">
              <div className="space-y-2">
                {status.relays.map(relay => (
                  <div key={relay} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 flex-1">
                      <div className="w-1.5 h-1.5 bg-[#00BA7C] rounded-full"></div>
                      <span className="text-[#71767B] truncate">{relay.replace('wss://', '')}</span>
                    </div>
                    <span className="text-[#00BA7C] text-[10px]">Connected</span>
                  </div>
                ))}
                {DEFAULT_RELAYS.filter(r => !status.relays.includes(r)).length > 0 && (
                  <div className="border-t border-[#2F3336] pt-2 mt-2">
                    <div className="text-[#71767B] text-[10px] mb-1">Offline Relays:</div>
                    {DEFAULT_RELAYS.filter(r => !status.relays.includes(r)).map(relay => (
                      <div key={relay} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 flex-1">
                          <div className="w-1.5 h-1.5 bg-[#71767B] rounded-full"></div>
                          <span className="text-[#71767B] truncate">{relay.replace('wss://', '')}</span>
                        </div>
                        <span className="text-[#71767B] text-[10px]">Offline</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            <div className="p-3 border-t border-[#2F3336] bg-white/5">
              <div className="text-[10px] text-[#71767B] text-center">
                🍃 Connected to {status.connected} of {status.total} relays
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default StatusBar;