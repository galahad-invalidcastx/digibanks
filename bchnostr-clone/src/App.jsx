import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Layout from './components/Layout';
// Remove ConnectionStatus import
import Feed from './pages/Feed';
import Explore from './pages/Explore';
import Notifications from './pages/Notifications';
import Messages from './pages/Messages';
import Bookmarks from './pages/Bookmarks';
import Profile from './pages/Profile';
import ThreadView from './pages/ThreadView';
import { relayManager } from './utils/relay';

function App() {
  const [user, setUser] = useState(null);
  const [currentPage, setCurrentPage] = useState('home');
  const [selectedPost, setSelectedPost] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('nostr_user');
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      connectToRelays();
    }
  }, []);

  const connectToRelays = async () => {
    const count = await relayManager.connectToRelays();
    console.log(`Connected to ${count} relays`);
  };

  const handleLogin = async (userData) => {
    setUser(userData);
    localStorage.setItem('nostr_user', JSON.stringify(userData));
    await connectToRelays();
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('nostr_user');
    relayManager.disconnect();
    setCurrentPage('home');
  };

  const navigateTo = (page, post = null) => {
    setCurrentPage(page);
    if (post) setSelectedPost(post);
    window.scrollTo(0, 0);
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  const renderPage = () => {
    switch(currentPage) {
      case 'home':
        return <Feed user={user} onNavigate={navigateTo} />;
      case 'explore':
        return <Explore user={user} onNavigate={navigateTo} />;
      case 'notifications':
        return <Notifications user={user} onNavigate={navigateTo} />;
      case 'messages':
        return <Messages user={user} onNavigate={navigateTo} />;
      case 'bookmarks':
        return <Bookmarks user={user} onNavigate={navigateTo} />;
      case 'profile':
        return <Profile user={user} onNavigate={navigateTo} />;
      case 'thread':
        return <ThreadView post={selectedPost} user={user} onNavigate={navigateTo} />;
      default:
        return <Feed user={user} onNavigate={navigateTo} />;
    }
  };

  return (
    <Layout 
      user={user} 
      onLogout={handleLogout} 
      currentPage={currentPage}
      onNavigate={navigateTo}
    >
      {renderPage()}
    </Layout>
  );
}

export default App;