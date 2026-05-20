import React, { useState, useEffect } from 'react';
import { Menu, X, Home, Compass, Bell, Mail, Bookmark, User, Plus, LogOut } from 'lucide-react';
import StatusBar from './StatusBar';
import { fetchProfile } from '../utils/profile';
import { shortenKey } from '../utils/nostr';

function Layout({ children, user, onLogout, currentPage, onNavigate }) {
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showCompose, setShowCompose] = useState(false);
  const [composeText, setComposeText] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [scrollDirection, setScrollDirection] = useState('up');
  const [lastScrollY, setLastScrollY] = useState(0);
  const [userProfile, setUserProfile] = useState(null);
  const [profilePicture, setProfilePicture] = useState(null);

  // Fetch user profile for display name
  useEffect(() => {
    const loadUserProfile = async () => {
      if (user?.publicKey) {
        const profile = await fetchProfile(user.publicKey);
        setUserProfile(profile);
        if (profile?.picture) {
          setProfilePicture(profile.picture);
        }
      }
    };
    loadUserProfile();
  }, [user?.publicKey]);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setScrollDirection('down');
      } else {
        setScrollDirection('up');
      }
      setLastScrollY(currentScrollY);
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const navItems = [
    { id: 'home', label: 'Home', icon: Home, activeIcon: Home },
    { id: 'explore', label: 'Explore', icon: Compass, activeIcon: Compass },
    { id: 'notifications', label: 'Notifications', icon: Bell, activeIcon: Bell },
    { id: 'messages', label: 'Messages', icon: Mail, activeIcon: Mail },
    { id: 'bookmarks', label: 'Bookmarks', icon: Bookmark, activeIcon: Bookmark },
    { id: 'profile', label: 'Profile', icon: User, activeIcon: User },
  ];

  const handlePost = async () => {
    if (!composeText.trim()) return;
    setIsPosting(true);
    setTimeout(() => {
      setComposeText('');
      setShowCompose(false);
      setIsPosting(false);
    }, 1000);
  };

  const handleViewProfile = () => {
    onNavigate('profile');
    setShowMobileMenu(false);
  };

  // Get display name from profile
  const getDisplayName = () => {
    if (userProfile?.display_name) return userProfile.display_name;
    if (userProfile?.name) return userProfile.name;
    return shortenKey(user?.publicKey || '');
  };

  const displayName = getDisplayName();
  const avatarInitial = displayName?.[0]?.toUpperCase() || user?.npub?.[6]?.toUpperCase() || 'U';

  return (
    <div className="min-h-screen-dynamic bg-black pb-[70px] lg:pb-0">
      {/* Mobile Header with Leaf Branding */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-black/95 backdrop-blur-md border-b border-[#2F3336] z-50 safe-top">
        <div className="flex items-center justify-between px-4 py-2">
          <button 
            onClick={() => setShowMobileMenu(true)}
            className="p-2 -ml-2 active:bg-white/10 rounded-full transition"
          >
            <Menu size={22} />
          </button>
          
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1">
              <span className="text-2xl">🍃</span>
              <span className="text-lg font-bold text-[#00BA7C]">Leaf</span>
            </div>
            <div className="mt-0.5">
              <StatusBar />
            </div>
          </div>
          
          <button 
            onClick={() => setShowCompose(true)}
            className="p-2 -mr-2 active:bg-white/10 rounded-full transition"
          >
            <Plus size={22} className="text-[#00BA7C]" />
          </button>
        </div>
      </div>

      {/* Desktop Header with Leaf Branding */}
      <div className="hidden lg:block fixed top-0 left-0 right-0 bg-black/95 backdrop-blur-md border-b border-[#2F3336] z-50">
        <div className="max-w-[1400px] mx-auto px-4 py-2">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="text-3xl">🍃</span>
              <span className="text-2xl font-bold text-[#00BA7C]">Leaf</span>
              <span className="text-xs text-[#71767B] ml-2">Nostr on Bitcoin Cash</span>
            </div>
            <StatusBar />
          </div>
        </div>
      </div>

      {/* Mobile Sidebar Menu */}
      {showMobileMenu && (
        <>
          <div 
            className="fixed inset-0 bg-black/80 z-[100] lg:hidden"
            onClick={() => setShowMobileMenu(false)}
          />
          <div className="fixed left-0 top-0 bottom-0 w-80 bg-black border-r border-[#2F3336] z-[101] overflow-y-auto safe-top">
            <div className="p-4 border-b border-[#2F3336] flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="text-3xl">🍃</span>
                <span className="text-2xl font-bold text-[#00BA7C]">Leaf</span>
              </div>
              <button 
                onClick={() => setShowMobileMenu(false)}
                className="p-2 active:bg-white/10 rounded-full"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="p-4">
              {/* User Info - Now shows display name */}
              <button 
                onClick={handleViewProfile}
                className="w-full flex items-center gap-3 mb-8 p-3 bg-white/5 rounded-2xl active:bg-white/10 transition"
              >
                {profilePicture ? (
                  <img 
                    src={profilePicture} 
                    alt={displayName}
                    className="w-12 h-12 rounded-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.parentElement.innerHTML = `<div class="w-12 h-12 bg-gradient-to-br from-[#00BA7C] to-[#1D9BF0] rounded-full flex items-center justify-center text-xl font-bold">${avatarInitial}</div>`;
                    }}
                  />
                ) : (
                  <div className="w-12 h-12 bg-gradient-to-br from-[#00BA7C] to-[#1D9BF0] rounded-full flex items-center justify-center text-xl font-bold">
                    {avatarInitial}
                  </div>
                )}
                <div className="flex-1 text-left">
                  <div className="font-bold">{displayName}</div>
                  <div className="text-[#71767B] text-sm">Tap to view profile →</div>
                </div>
              </button>
              
              {/* Navigation */}
              <div className="space-y-2">
                {navItems.map(item => (
                  <button
                    key={item.id}
                    onClick={() => {
                      onNavigate(item.id);
                      setShowMobileMenu(false);
                    }}
                    className={`w-full flex items-center gap-4 p-3 rounded-xl active:bg-white/10 transition ${
                      currentPage === item.id ? 'bg-white/5 text-[#00BA7C]' : 'text-white'
                    }`}
                  >
                    <item.icon size={24} />
                    <span className="font-medium">{item.label}</span>
                  </button>
                ))}
              </div>
              
              {/* Logout */}
              <button 
                onClick={onLogout}
                className="w-full flex items-center gap-4 p-3 rounded-xl active:bg-white/10 text-red-500 mt-8"
              >
                <LogOut size={24} />
                <span className="font-medium">Logout</span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* Main Content */}
      <div className="pt-[60px] lg:pt-[52px]">
        <div className="max-w-2xl mx-auto">
          {children}
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className={`lg:hidden fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur-md border-t border-[#2F3336] z-50 safe-bottom transition-transform duration-300 ${
        scrollDirection === 'down' ? 'translate-y-full' : 'translate-y-0'
      }`}>
        <div className="flex justify-around py-2">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`flex flex-col items-center gap-1 px-4 py-2 rounded-full active:scale-95 transition ${
                  isActive ? 'text-[#00BA7C]' : 'text-[#71767B]'
                }`}
              >
                <Icon size={22} />
                <span className="text-xs">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Mobile Compose Modal */}
      {showCompose && (
        <div className="fixed inset-0 bg-black/95 z-[200] flex flex-col safe-top safe-bottom">
          <div className="flex justify-between items-center p-4 border-b border-[#2F3336]">
            <button 
              onClick={() => setShowCompose(false)}
              className="p-2 active:bg-white/10 rounded-full"
            >
              ✕
            </button>
            <div className="flex items-center gap-1">
              <span className="text-xl">🍃</span>
              <span className="font-bold text-[#00BA7C]">Leaf</span>
            </div>
            <div className="w-10"></div>
          </div>
          
          <div className="flex-1 p-4">
            <div className="flex gap-3">
              {profilePicture ? (
                <img 
                  src={profilePicture} 
                  alt={displayName}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 bg-gradient-to-br from-[#00BA7C] to-[#1D9BF0] rounded-full flex items-center justify-center text-sm font-bold">
                  {avatarInitial}
                </div>
              )}
              <textarea
                value={composeText}
                onChange={(e) => setComposeText(e.target.value)}
                placeholder="What's happening?"
                className="flex-1 bg-transparent text-white text-base outline-none resize-none"
                rows="6"
                autoFocus
                maxLength="280"
              />
            </div>
            <div className="text-right text-xs text-[#71767B] mt-2">
              {composeText.length}/280
            </div>
          </div>
          
          <div className="p-4 border-t border-[#2F3336]">
            <button 
              onClick={handlePost}
              disabled={!composeText.trim() || isPosting}
              className="w-full bg-[#00BA7C] disabled:opacity-50 text-white font-bold py-3 rounded-full active:scale-95 transition"
            >
              {isPosting ? 'Posting...' : 'Post'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Layout;