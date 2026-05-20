import React, { useState, useEffect } from 'react';
import Post from './Post';
import CreatePost from './CreatePost';
import { relayManager } from '../utils/relay';
import { DEFAULT_RELAYS } from '../utils/nostr';

function Feed({ user }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedType, setFeedType] = useState('for-you');

  useEffect(() => {
    fetchInitialPosts();
    
    const filter = {
      kinds: [1],
      limit: 50
    };
    
    const unsubscribe = relayManager.subscribe(filter, (event) => {
      setPosts(prev => {
        const exists = prev.some(p => p.id === event.id);
        if (!exists) {
          return [event, ...prev];
        }
        return prev;
      });
    }, DEFAULT_RELAYS);
    
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const fetchInitialPosts = async () => {
    setLoading(true);
    const filter = {
      kinds: [1],
      limit: 50
    };
    
    const postsMap = new Map();
    
    await new Promise((resolve) => {
      setTimeout(() => resolve(), 3000);
      
      relayManager.subscribe(filter, (event) => {
        if (!postsMap.has(event.id)) {
          postsMap.set(event.id, event);
        }
      }, DEFAULT_RELAYS);
    });
    
    const fetchedPosts = Array.from(postsMap.values());
    fetchedPosts.sort((a, b) => b.created_at - a.created_at);
    setPosts(fetchedPosts);
    setLoading(false);
  };

  const handleNewPost = (newPost) => {
    setPosts(prev => [newPost, ...prev]);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-x-blue"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Feed Header - X.com style */}
      <div className="sticky top-0 bg-black/95 backdrop-blur-sm border-b border-x-gray z-10">
        <div className="flex">
          <button 
            onClick={() => setFeedType('for-you')}
            className={`flex-1 py-4 font-bold relative transition ${
              feedType === 'for-you' ? 'text-white' : 'text-x-light-gray hover:text-white'
            }`}
          >
            For you
            {feedType === 'for-you' && (
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-14 h-1 bg-x-blue rounded-full"></div>
            )}
          </button>
          <button 
            onClick={() => setFeedType('following')}
            className={`flex-1 py-4 font-bold relative transition ${
              feedType === 'following' ? 'text-white' : 'text-x-light-gray hover:text-white'
            }`}
          >
            Following
            {feedType === 'following' && (
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-14 h-1 bg-x-blue rounded-full"></div>
            )}
          </button>
        </div>
      </div>

      <CreatePost user={user} onPostCreated={handleNewPost} />
      
      <div>
        {posts.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-4xl mb-4">📝</div>
            <div className="text-x-light-gray">No posts yet. Be the first to post!</div>
          </div>
        ) : (
          posts.map(post => (
            <Post key={post.id} post={post} currentUser={user} />
          ))
        )}
      </div>
    </div>
  );
}

export default Feed;