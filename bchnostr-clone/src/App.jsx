import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Feed from './components/Feed';
import Layout from './components/Layout';
import { relayManager } from './utils/relay';

function App() {
  const [user, setUser] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('nostr_user');
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      connectToRelays();
    }
  }, []);

  const connectToRelays = async () => {
    const connected = await relayManager.connectToRelays();
    setIsConnected(connected);
    
    if (!connected) {
      console.warn('Failed to connect to some relays');
    }
  };

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('nostr_user', JSON.stringify(userData));
    connectToRelays();
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('nostr_user');
    relayManager.disconnect();
    setIsConnected(false);
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <Layout user={user} onLogout={handleLogout}>
      <Feed user={user} />
      
      {/* Connection status indicator */}
      <div className="fixed bottom-4 right-4 z-50">
        <div className={`px-3 py-1 rounded-full text-xs font-mono ${
          isConnected ? 'bg-x-green/20 text-x-green' : 'bg-x-red/20 text-x-red'
        }`}>
          {isConnected ? '● Connected' : '○ Disconnected'}
        </div>
      </div>
    </Layout>
  );
}

export default App;