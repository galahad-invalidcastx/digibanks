import React, { useState, useEffect } from 'react';
import Post from '../components/Post';
import ProfileEditor from '../components/ProfileEditor';
import { relayManager } from '../utils/relay';
import { DEFAULT_RELAYS, shortenKey } from '../utils/nostr';
import { fetchProfile } from '../utils/profile';

function Profile({ user, onNavigate }) {
  const [activeTab, setActiveTab] = useState('posts');
  const [userPosts, setUserPosts] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [followersCount] = useState(1234);
  const [followingCount] = useState(567);

  const loadProfileAndPosts = async () => {
    setLoading(true);
    
    const profileData = await fetchProfile(user.publicKey);
    setProfile(profileData);
    
    const filter = {
      kinds: [1],
      authors: [user.publicKey],
      limit: 50
    };
    
    const postsMap = new Map();
    
    await new Promise((resolve) => {
      const timeout = setTimeout(() => resolve(), 5000);
      
      const subscription = relayManager.subscribe(filter, (event) => {
        if (!postsMap.has(event.id)) {
          postsMap.set(event.id, event);
        }
      }, DEFAULT_RELAYS);
      
      setTimeout(() => {
        clearTimeout(timeout);
        subscription?.();
        resolve();
      }, 3000);
    });
    
    const fetchedPosts = Array.from(postsMap.values());
    fetchedPosts.sort((a, b) => b.created_at - a.created_at);
    setUserPosts(fetchedPosts);
    setLoading(false);
  };

  useEffect(() => {
    loadProfileAndPosts();
  }, [user.publicKey]);

  const handleProfileUpdate = (updatedProfile) => {
    setProfile(updatedProfile);
    loadProfileAndPosts();
  };

  const displayName = profile?.display_name || profile?.name || shortenKey(user.publicKey);
  const isVerified = profile?.nip05?.includes('@');
  const joinedDate = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <>
      <div>
        {/* Cover Photo */}
        <div className="relative">
          {profile?.banner ? (
            <img 
              src={profile.banner} 
              alt="Cover" 
              className="h-48 w-full object-cover"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.parentElement.className = 'h-48 bg-gradient-to-r from-[#00BA7C] to-[#1D9BF0]';
              }}
            />
          ) : (
            <div className="h-48 bg-gradient-to-r from-[#00BA7C] to-[#1D9BF0]" />
          )}
          <button 
            onClick={() => setShowEditor(true)}
            className="absolute top-4 right-4 bg-black/60 backdrop-blur px-3 py-1.5 rounded-full text-sm flex items-center gap-1 active:scale-95 transition"
          >
            <span>✏️</span>
            Edit cover
          </button>
        </div>
        
        {/* Avatar */}
        <div className="px-4">
          <div className="relative -mt-16 mb-4">
            {profile?.picture ? (
              <img 
                src={profile.picture} 
                alt={displayName}
                className="w-32 h-32 rounded-full border-4 border-black object-cover"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.parentElement.innerHTML = `<div class="w-32 h-32 bg-gradient-to-br from-[#00BA7C] to-[#1D9BF0] rounded-full border-4 border-black flex items-center justify-center text-4xl font-bold">${(displayName?.[0] || 'U').toUpperCase()}</div>`;
                }}
              />
            ) : (
              <div className="w-32 h-32 bg-gradient-to-br from-[#00BA7C] to-[#1D9BF0] rounded-full border-4 border-black flex items-center justify-center text-4xl font-bold">
                {(displayName?.[0] || 'U').toUpperCase()}
              </div>
            )}
            <button 
              onClick={() => setShowEditor(true)}
              className="absolute bottom-2 right-2 bg-black border border-[#2F3336] p-2 rounded-full active:scale-95 transition"
            >
              <span>📷</span>
            </button>
          </div>

          {/* Profile Info */}
          <div className="mb-4">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold">{displayName}</h1>
                  {isVerified && <span className="text-[#00BA7C] text-lg">✓</span>}
                </div>
                <p className="text-[#71767B]">@{shortenKey(user.publicKey)}</p>
              </div>
              <button 
                onClick={() => setShowEditor(true)}
                className="btn-outline flex items-center gap-2 text-sm"
              >
                <span>✏️</span>
                Edit profile
              </button>
            </div>
            
            {profile?.about && (
              <p className="mt-2 text-[15px]">{profile.about}</p>
            )}
            
            <div className="flex flex-wrap gap-4 mt-2 text-[#71767B] text-sm">
              {profile?.website && (
                <a href={profile.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:underline">
                  <span>🔗</span>
                  {profile.website.replace('https://', '').replace('http://', '')}
                </a>
              )}
              <div className="flex items-center gap-1">
                <span>📅</span>
                Joined {joinedDate}
              </div>
            </div>
            
            <div className="flex gap-4 mt-4">
              <button className="font-bold hover:underline">{followingCount} <span className="text-[#71767B] font-normal">Following</span></button>
              <button className="font-bold hover:underline">{followersCount} <span className="text-[#71767B] font-normal">Followers</span></button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-[#2F3336]">
            {['posts', 'replies', 'media', 'likes'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-4 font-semibold transition ${
                  activeTab === tab 
                    ? 'text-[#00BA7C] border-b-2 border-[#00BA7C]' 
                    : 'text-[#71767B] hover:text-white'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Content */}
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00BA7C]"></div>
            </div>
          ) : (
            <div>
              {activeTab === 'posts' && (
                userPosts.length === 0 ? (
                  <div className="text-center py-20">
                    <div className="text-6xl mb-4">🍃</div>
                    <div className="text-[#71767B]">No posts yet</div>
                    <div className="text-[#71767B] text-sm mt-1">Your posts will appear here</div>
                  </div>
                ) : (
                  userPosts.map(post => (
                    <Post key={post.id} post={post} currentUser={user} onNavigate={onNavigate} />
                  ))
                )
              )}
              {activeTab === 'replies' && (
                <div className="text-center py-20">
                  <div className="text-6xl mb-4">💬</div>
                  <div className="text-[#71767B]">No replies yet</div>
                </div>
              )}
              {activeTab === 'media' && (
                <div className="text-center py-20">
                  <div className="text-6xl mb-4">📷</div>
                  <div className="text-[#71767B]">No media yet</div>
                </div>
              )}
              {activeTab === 'likes' && (
                <div className="text-center py-20">
                  <div className="text-6xl mb-4">❤️</div>
                  <div className="text-[#71767B]">No likes yet</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Profile Editor Modal */}
      {showEditor && (
        <ProfileEditor
          user={user}
          profile={profile}
          onClose={() => setShowEditor(false)}
          onUpdate={handleProfileUpdate}
        />
      )}
    </>
  );
}

export default Profile;