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
  const [error, setError] = useState(null);
  
  const isLoadingMoreRef = useRef(false);
  const isRefreshingRef = useRef(false);
  const mountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Load initial posts
  const fetchInitialPosts = useCallback(async () => {
    if (isRefreshingRef.current || !mountedRef.current) return;
    
    setError(null);
    setLoading(true);
    
    try {
      const filter = {
        kinds: [1],
        limit: 20
      };
      
      const postsMap = new Map();
      
      const subscription = relayManager.subscribe(filter, (event) => {
        if (!mountedRef.current) return;
        if (event.kind === 1 && !postsMap.has(event.id)) {
          postsMap.set(event.id, event);
        }
      }, DEFAULT_RELAYS);
      
      // Wait for posts to load
      await new Promise((resolve) => {
        setTimeout(() => {
          if (subscription) subscription();
          resolve();
        }, 3000);
      });
      
      if (!mountedRef.current) return;
      
      const fetchedPosts = Array.from(postsMap.values());
      fetchedPosts.sort((a, b) => b.created_at - a.created_at);
      
      setPosts(fetchedPosts);
      
      if (fetchedPosts.length > 0) {
        const oldestPost = fetchedPosts[fetchedPosts.length - 1];
        setSince(oldestPost.created_at);
      }
      
      setHasMore(fetchedPosts.length === 20);
    } catch (err) {
      console.error('Error fetching posts:', err);
      if (mountedRef.current) {
        setError('Failed to load posts. Please refresh.');
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
        setRefreshing(false);
        isRefreshingRef.current = false;
      }
    }
  }, []);

  // Load more posts
  const loadMorePosts = useCallback(async () => {
    if (isLoadingMoreRef.current || loadingMore || !hasMore || refreshing || !mountedRef.current) return;
    
    isLoadingMoreRef.current = true;
    setLoadingMore(true);
    
    try {
      const filter = {
        kinds: [1],
        limit: 10,
        until: since
      };
      
      const postsMap = new Map();
      const existingIds = new Set(posts.map(p => p.id));
      
      const subscription = relayManager.subscribe(filter, (event) => {
        if (!mountedRef.current) return;
        if (event.kind === 1 && !existingIds.has(event.id) && !postsMap.has(event.id)) {
          postsMap.set(event.id, event);
        }
      }, DEFAULT_RELAYS);
      
      await new Promise((resolve) => {
        setTimeout(() => {
          if (subscription) subscription();
          resolve();
        }, 3000);
      });
      
      if (!mountedRef.current) return;
      
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
    } catch (err) {
      console.error('Error loading more:', err);
    } finally {
      if (mountedRef.current) {
        setLoadingMore(false);
        isLoadingMoreRef.current = false;
      }
    }
  }, [since, hasMore, loadingMore, refreshing, posts]);

  // Refresh
  const handleRefresh = useCallback(async () => {
    if (isRefreshingRef.current || loadingMore) return;
    
    isRefreshingRef.current = true;
    setRefreshing(true);
    
    await fetchInitialPosts();
  }, [fetchInitialPosts, loadingMore]);

  // Intersection Observer
  const observer = useRef();
  const lastPostRef = useCallback((node) => {
    if (loading || loadingMore || refreshing) return;
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && !loadingMore && !refreshing && !isLoadingMoreRef.current) {
        loadMorePosts();
      }
    }, { threshold: 0.1 });
    
    if (node) observer.current.observe(node);
  }, [loading, loadingMore, hasMore, loadMorePosts, refreshing]);

  // Initial load
  useEffect(() => {
    fetchInitialPosts();
    
    return () => {
      if (observer.current) observer.current.disconnect();
    };
  }, [fetchInitialPosts]);

  const handleNewPost = (newPost) => {
    setPosts(prev => [newPost, ...prev]);
  };

  if (error && posts.length === 0 && !loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <p className="text-[#71767B] text-base mb-2">{error}</p>
          <button 
            onClick={fetchInitialPosts}
            className="bg-[#00BA7C] text-white px-6 py-2 rounded-full text-sm font-semibold"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

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
    <div>
      {/* Refresh Indicator */}
      {refreshing && (
        <div className="flex justify-center py-2 bg-black/95">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#00BA7C]"></div>
          <span className="ml-2 text-xs text-[#71767B]">Refreshing...</span>
        </div>
      )}

      {/* Feed Tabs */}
      <div className="sticky top-[60px] lg:top-0 bg-black/95 backdrop-blur-sm border-b border-[#2F3336] z-10">
        <div className="flex">
          <button
            onClick={() => {
              setFeedType('for-you');
              fetchInitialPosts();
            }}
            className={`flex-1 py-3 font-semibold text-sm relative ${
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
            className={`flex-1 py-3 font-semibold text-sm relative ${
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

      {posts.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">🍃</div>
          <div className="text-[#71767B] text-base">No posts yet</div>
          <div className="text-[#71767B] text-sm mt-1">Pull down to refresh</div>
        </div>
      ) : (
        posts.map((post, index) => {
          if (index === posts.length - 1) {
            return (
              <div ref={lastPostRef} key={post.id}>
                <Post post={post} currentUser={user} onNavigate={onNavigate} />
              </div>
            );
          }
          return <Post key={post.id} post={post} currentUser={user} onNavigate={onNavigate} />;
        })
      )}

      {loadingMore && (
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#00BA7C]"></div>
          <span className="ml-2 text-sm text-[#71767B]">Loading more...</span>
        </div>
      )}

      {!hasMore && posts.length > 0 && !loadingMore && (
        <div className="text-center py-6">
          <p className="text-[#71767B] text-sm">🍃 You've reached the end</p>
        </div>
      )}
    </div>
  );
}

export default Feed;