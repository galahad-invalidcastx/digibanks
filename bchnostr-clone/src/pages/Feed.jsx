import React, { useState, useEffect, useCallback, useRef } from 'react';
import Post from '../components/Post';
import CreatePost from '../components/CreatePost';
import { relayManager } from '../utils/relay';
import { DEFAULT_RELAYS } from '../utils/nostr';

function Feed({ user, onNavigate }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [since, setSince] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [feedType, setFeedType] = useState('for-you');
  const containerRef = useRef(null);
  const touchStartY = useRef(0);

  // Pull to refresh
  const handleTouchStart = (e) => {
    if (window.scrollY === 0) {
      touchStartY.current = e.touches[0].clientY;
    }
  };

  const handleTouchMove = (e) => {
    if (window.scrollY === 0 && touchStartY.current) {
      const deltaY = e.touches[0].clientY - touchStartY.current;
      if (deltaY > 50 && !refreshing) {
        handleRefresh();
      }
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchInitialPosts();
    setRefreshing(false);
  };

  const fetchInitialPosts = useCallback(async () => {
    setLoading(true);
    const filter = {
      kinds: [1],
      limit: 20
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
    setPosts(fetchedPosts);
    
    if (fetchedPosts.length > 0) {
      const oldestPost = fetchedPosts[fetchedPosts.length - 1];
      setSince(oldestPost.created_at);
    }
    
    setHasMore(fetchedPosts.length === 20);
    setLoading(false);
  }, []);

  const loadMorePosts = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    
    setLoadingMore(true);
    
    const filter = {
      kinds: [1],
      limit: 10,
      until: since
    };
    
    const postsMap = new Map();
    const existingIds = new Set(posts.map(p => p.id));
    
    await new Promise((resolve) => {
      const timeout = setTimeout(() => resolve(), 5000);
      
      const subscription = relayManager.subscribe(filter, (event) => {
        if (!existingIds.has(event.id) && !postsMap.has(event.id)) {
          postsMap.set(event.id, event);
        }
      }, DEFAULT_RELAYS);
      
      setTimeout(() => {
        clearTimeout(timeout);
        subscription?.();
        resolve();
      }, 3000);
    });
    
    const newPosts = Array.from(postsMap.values());
    newPosts.sort((a, b) => b.created_at - a.created_at);
    
    if (newPosts.length > 0) {
      setPosts(prev => [...prev, ...newPosts]);
      const oldestNewPost = newPosts[newPosts.length - 1];
      setSince(oldestNewPost.created_at);
      setHasMore(newPosts.length === 10);
    } else {
      setHasMore(false);
    }
    
    setLoadingMore(false);
  }, [since, hasMore, loadingMore, posts]);

  useEffect(() => {
    fetchInitialPosts();
    
    const filter = { kinds: [1], limit: 5 };
    const unsubscribe = relayManager.subscribe(filter, (event) => {
      setPosts(prev => {
        const exists = prev.some(p => p.id === event.id);
        if (!exists) {
          return [event, ...prev.slice(0, 99)];
        }
        return prev;
      });
    }, DEFAULT_RELAYS);
    
    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchmove', handleTouchMove);
    
    return () => {
      if (unsubscribe) unsubscribe();
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
    };
  }, [fetchInitialPosts]);

  const handleNewPost = (newPost) => {
    setPosts(prev => [newPost, ...prev]);
  };

  const observer = useRef();
  const lastPostRef = useCallback((node) => {
    if (loading || loadingMore) return;
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore) {
        loadMorePosts();
      }
    }, { threshold: 0.1 });
    
    if (node) observer.current.observe(node);
  }, [loading, loadingMore, hasMore, loadMorePosts]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00BA7C] mx-auto mb-4"></div>
          <p className="text-[#71767B] text-sm">Loading posts...</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef}>
      {refreshing && (
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#00BA7C]"></div>
          <span className="ml-2 text-sm text-[#71767B]">Refreshing...</span>
        </div>
      )}

      <div className="sticky top-[60px] lg:top-0 bg-black/95 backdrop-blur-sm border-b border-[#2F3336] z-10">
        <div className="flex">
          <button
            onClick={() => {
              setFeedType('for-you');
              fetchInitialPosts();
            }}
            className={`flex-1 py-3 font-semibold text-sm relative transition active:scale-95 ${
              feedType === 'for-you' ? 'text-white' : 'text-[#71767B]'
            }`}
          >
            For you
            {feedType === 'for-you' && (
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-12 h-1 bg-[#00BA7C] rounded-full"></div>
            )}
          </button>
          <button
            onClick={() => setFeedType('following')}
            className={`flex-1 py-3 font-semibold text-sm relative transition active:scale-95 ${
              feedType === 'following' ? 'text-white' : 'text-[#71767B]'
            }`}
          >
            Following
            {feedType === 'following' && (
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-12 h-1 bg-[#00BA7C] rounded-full"></div>
            )}
          </button>
        </div>
      </div>

      <CreatePost user={user} onPostCreated={handleNewPost} />

      <div>
        {posts.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🍃</div>
            <div className="text-[#71767B] text-base">No posts yet</div>
            <div className="text-[#71767B] text-sm mt-1">Be the first to post!</div>
          </div>
        ) : (
          posts.map((post, index) => {
            if (index === posts.length - 1) {
              return (
                <div ref={lastPostRef} key={post.id}>
                  <Post 
                    post={post} 
                    currentUser={user} 
                    onNavigate={onNavigate}
                  />
                </div>
              );
            }
            return (
              <Post 
                key={post.id} 
                post={post} 
                currentUser={user} 
                onNavigate={onNavigate}
              />
            );
          })
        )}
        
        {loadingMore && (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00BA7C]"></div>
          </div>
        )}
        
        {!hasMore && posts.length > 0 && (
          <div className="text-center py-8">
            <p className="text-[#71767B] text-sm">🍃 You're all caught up!</p>
          </div>
        )}
      </div>

      {posts.length > 5 && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-20 right-4 bg-[#00BA7C] p-3 rounded-full shadow-lg active:scale-95 transition z-40 lg:bottom-4"
        >
          ↑
        </button>
      )}
    </div>
  );
}

export default Feed;