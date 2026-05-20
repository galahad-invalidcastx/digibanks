I'll help you build Phase 1 step by step. Let's create a modern Nostr client with React + Vite.

Step 1: Project Setup

```bash
# Create a new Vite project with React
npm create vite@latest bchnostr-clone -- --template react

# Navigate to project
cd bchnostr-clone

# Install dependencies
npm install nostr-tools @nostr-dev-kit/ndk
npm install react-router-dom localforage
npm install -D tailwindcss postcss autoprefixer

# Initialize Tailwind CSS
npx tailwindcss init -p
```

Step 2: Configure Tailwind

tailwind.config.js

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

src/index.css

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply bg-black text-white;
  }
}
```

Step 3: Core Nostr Utilities

src/utils/nostr.js

```javascript
import { generateSecretKey, getPublicKey, finalizeEvent, nip19 } from 'nostr-tools';
import { bytesToHex } from '@noble/hashes/utils';

// Default relays - you can add more
export const DEFAULT_RELAYS = [
  'wss://relay.damus.io',
  'wss://relay.nostr.band',
  'wss://nos.lol',
  'wss://relay.primal.net'
];

// Key Management
export const generateNewKey = () => {
  const sk = generateSecretKey();
  const pk = getPublicKey(sk);
  return {
    privateKey: bytesToHex(sk),
    publicKey: pk,
    npub: nip19.npubEncode(pk)
  };
};

export const loginWithPrivateKey = (privateKey) => {
  try {
    const sk = hexToBytes(privateKey);
    const pk = getPublicKey(sk);
    return {
      privateKey: privateKey,
      publicKey: pk,
      npub: nip19.npubEncode(pk)
    };
  } catch (error) {
    console.error('Invalid private key:', error);
    return null;
  }
};

// Helper functions
export const hexToBytes = (hex) => {
  if (!hex) return null;
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes;
};

export const formatTimestamp = (timestamp) => {
  const date = new Date(timestamp * 1000);
  const now = new Date();
  const diff = now - date;
  
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
  return date.toLocaleDateString();
};

export const shortenKey = (key) => {
  if (!key) return '';
  return `${key.slice(0, 8)}...${key.slice(-8)}`;
};
```

src/utils/relay.js

```javascript
import { DEFAULT_RELAYS } from './nostr';

class RelayManager {
  constructor() {
    this.pools = new Map();
    this.subscriptions = new Map();
  }

  async connectToRelays(relays = DEFAULT_RELAYS) {
    const WebSocket = window.WebSocket;
    const connections = relays.map(async (url) => {
      try {
        const ws = new WebSocket(url);
        
        await new Promise((resolve, reject) => {
          ws.onopen = () => {
            console.log(`Connected to ${url}`);
            this.pools.set(url, ws);
            resolve();
          };
          ws.onerror = (error) => {
            console.error(`Failed to connect to ${url}:`, error);
            reject(error);
          };
          ws.onclose = () => {
            console.log(`Disconnected from ${url}`);
            this.pools.delete(url);
          };
        });
        
        return ws;
      } catch (error) {
        console.error(`Error connecting to ${url}:`, error);
        return null;
      }
    });
    
    await Promise.allSettled(connections);
    return this.pools.size > 0;
  }

  async publishEvent(event, relays = DEFAULT_RELAYS) {
    const publishPromises = [];
    
    for (const relay of relays) {
      const ws = this.pools.get(relay);
      if (ws && ws.readyState === WebSocket.OPEN) {
        publishPromises.push(
          new Promise((resolve) => {
            const message = JSON.stringify(['EVENT', event]);
            ws.send(message);
            
            // Listen for OK response
            const handler = (e) => {
              const data = JSON.parse(e.data);
              if (data[0] === 'OK' && data[1] === event.id) {
                ws.removeEventListener('message', handler);
                resolve(true);
              }
            };
            ws.addEventListener('message', handler);
            
            // Timeout after 5 seconds
            setTimeout(() => {
              ws.removeEventListener('message', handler);
              resolve(false);
            }, 5000);
          })
        );
      }
    }
    
    const results = await Promise.all(publishPromises);
    return results.some(result => result === true);
  }

  subscribe(filter, onEvent, relays = DEFAULT_RELAYS) {
    const subscriptionId = Math.random().toString(36);
    const activeSubscriptions = [];
    
    for (const relay of relays) {
      const ws = this.pools.get(relay);
      if (ws && ws.readyState === WebSocket.OPEN) {
        const subscribeMsg = JSON.stringify(['REQ', subscriptionId, filter]);
        ws.send(subscribeMsg);
        
        const messageHandler = (e) => {
          const data = JSON.parse(e.data);
          if (data[0] === 'EVENT' && data[1] === subscriptionId) {
            onEvent(data[2], relay);
          }
        };
        
        ws.addEventListener('message', messageHandler);
        activeSubscriptions.push({ ws, messageHandler, relay });
      }
    }
    
    this.subscriptions.set(subscriptionId, activeSubscriptions);
    
    // Return unsubscribe function
    return () => {
      const subs = this.subscriptions.get(subscriptionId);
      if (subs) {
        subs.forEach(({ ws, messageHandler, relay }) => {
          const closeMsg = JSON.stringify(['CLOSE', subscriptionId]);
          ws.send(closeMsg);
          ws.removeEventListener('message', messageHandler);
        });
        this.subscriptions.delete(subscriptionId);
      }
    };
  }

  disconnect() {
    this.pools.forEach((ws) => {
      ws.close();
    });
    this.pools.clear();
    this.subscriptions.clear();
  }
}

export const relayManager = new RelayManager();
```

Step 4: Create React Components

src/App.jsx

```jsx
import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Feed from './components/Feed';
import { relayManager } from './utils/relay';

function App() {
  const [user, setUser] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Check for saved user in localStorage
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
    <div className="min-h-screen bg-black">
      <div className="max-w-2xl mx-auto border-x border-gray-800">
        {/* Header */}
        <header className="sticky top-0 bg-black/80 backdrop-blur-sm border-b border-gray-800 p-4">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-bold">BCHNostr Clone</h1>
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-400">
                {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
              </div>
              <button
                onClick={handleLogout}
                className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded-full text-sm"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        {/* Feed */}
        {isConnected ? (
          <Feed user={user} />
        ) : (
          <div className="p-8 text-center text-gray-400">
            Connecting to relays...
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
```

src/components/Login.jsx

```jsx
import React, { useState } from 'react';
import { generateNewKey, loginWithPrivateKey } from '../utils/nostr';

function Login({ onLogin }) {
  const [loginMethod, setLoginMethod] = useState('generate');
  const [privateKey, setPrivateKey] = useState('');
  const [error, setError] = useState('');

  const handleGenerate = () => {
    const newUser = generateNewKey();
    onLogin(newUser);
  };

  const handleImport = () => {
    const user = loginWithPrivateKey(privateKey);
    if (user) {
      onLogin(user);
      setError('');
    } else {
      setError('Invalid private key');
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-gray-900 rounded-lg p-8">
        <h1 className="text-3xl font-bold mb-2">BCHNostr Clone</h1>
        <p className="text-gray-400 mb-8">
          A modern Nostr client with X + Threads UI
        </p>

        <div className="space-y-6">
          <div className="flex gap-2 border-b border-gray-700">
            <button
              className={`pb-2 px-4 ${loginMethod === 'generate' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-400'}`}
              onClick={() => setLoginMethod('generate')}
            >
              Generate New
            </button>
            <button
              className={`pb-2 px-4 ${loginMethod === 'import' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-400'}`}
              onClick={() => setLoginMethod('import')}
            >
              Import Key
            </button>
          </div>

          {loginMethod === 'generate' ? (
            <div className="space-y-4">
              <p className="text-gray-300">
                Create a new Nostr identity. Your private key will be saved locally.
              </p>
              <button
                onClick={handleGenerate}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition"
              >
                Generate New Account
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <input
                type="password"
                placeholder="Enter your private key (nsec or hex)"
                value={privateKey}
                onChange={(e) => setPrivateKey(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white placeholder-gray-500"
              />
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <button
                onClick={handleImport}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition"
              >
                Import Account
              </button>
            </div>
          )}

          <div className="pt-4 text-center text-gray-500 text-sm">
            <p>Your keys never leave your browser</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
```

src/components/Feed.jsx

```jsx
import React, { useState, useEffect } from 'react';
import Post from './Post';
import CreatePost from './CreatePost';
import { relayManager } from '../utils/relay';
import { DEFAULT_RELAYS } from '../utils/nostr';

function Feed({ user }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInitialPosts();
    
    // Subscribe to new posts
    const filter = {
      kinds: [1],
      limit: 50
    };
    
    const unsubscribe = relayManager.subscribe(filter, (event, relay) => {
      setPosts(prev => {
        // Check if post already exists
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
    
    // Collect events from all relays
    const eventPromise = new Promise((resolve) => {
      const timeout = setTimeout(() => resolve(), 5000);
      
      relayManager.subscribe(filter, (event) => {
        if (!postsMap.has(event.id)) {
          postsMap.set(event.id, event);
        }
      }, DEFAULT_RELAYS);
      
      setTimeout(() => {
        clearTimeout(timeout);
        resolve();
      }, 3000);
    });
    
    await eventPromise;
    
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
      <div className="p-8 text-center text-gray-400">
        Loading posts...
      </div>
    );
  }

  return (
    <div>
      <CreatePost user={user} onPostCreated={handleNewPost} />
      <div className="divide-y divide-gray-800">
        {posts.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            No posts yet. Be the first to post!
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
```

src/components/CreatePost.jsx

```jsx
import React, { useState } from 'react';
import { finalizeEvent } from 'nostr-tools';
import { hexToBytes, DEFAULT_RELAYS } from '../utils/nostr';
import { relayManager } from '../utils/relay';

function CreatePost({ user, onPostCreated }) {
  const [content, setContent] = useState('');
  const [isPosting, setIsPosting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() || isPosting) return;

    setIsPosting(true);

    try {
      const event = {
        kind: 1,
        created_at: Math.floor(Date.now() / 1000),
        tags: [],
        content: content.trim()
      };

      const privateKeyBytes = hexToBytes(user.privateKey);
      const signedEvent = finalizeEvent(event, privateKeyBytes);

      const success = await relayManager.publishEvent(signedEvent, DEFAULT_RELAYS);
      
      if (success) {
        onPostCreated(signedEvent);
        setContent('');
      } else {
        alert('Failed to publish post');
      }
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Error creating post');
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 border-b border-gray-800">
      <div className="flex gap-3">
        <div className="w-10 h-10 bg-gray-700 rounded-full flex-shrink-0 flex items-center justify-center">
          <span className="text-sm">👤</span>
        </div>
        <div className="flex-1">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's happening?"
            className="w-full bg-transparent text-white text-lg outline-none resize-none"
            rows="3"
          />
          <div className="flex justify-end mt-2">
            <button
              type="submit"
              disabled={!content.trim() || isPosting}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-full font-semibold transition"
            >
              {isPosting ? 'Posting...' : 'Post'}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}

export default CreatePost;
```

src/components/Post.jsx

```jsx
import React, { useState } from 'react';
import { formatTimestamp, shortenKey } from '../utils/nostr';

function Post({ post, currentUser }) {
  const [isLiking, setIsLiking] = useState(false);

  const handleLike = () => {
    // This will be implemented later with BCH tips
    setIsLiking(true);
    setTimeout(() => setIsLiking(false), 500);
  };

  return (
    <div className="p-4 hover:bg-white/5 transition">
      <div className="flex gap-3">
        <div className="w-10 h-10 bg-gray-700 rounded-full flex-shrink-0 flex items-center justify-center">
          <span className="text-sm">👤</span>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-bold">
              {shortenKey(post.pubkey)}
            </span>
            <span className="text-gray-500 text-sm">
              {formatTimestamp(post.created_at)}
            </span>
          </div>
          <p className="mt-1 text-white whitespace-pre-wrap">
            {post.content}
          </p>
          <div className="flex gap-4 mt-3 text-gray-500">
            <button className="hover:text-blue-500 transition">
              💬 {post.tags?.filter(t => t[0] === 'e').length || 0}
            </button>
            <button className="hover:text-green-500 transition">
              🔄 0
            </button>
            <button 
              onClick={handleLike}
              disabled={isLiking}
              className="hover:text-red-500 transition"
            >
              ❤️ 0
            </button>
            <button className="hover:text-gray-300 transition">
              📤
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Post;
```

Step 5: Run the App

```bash
npm run dev
```

Your Nostr client should now be running on localhost:5173! You can:

1. Generate a new Nostr account or import an existing private key
2. Create posts that will be published to multiple relays
3. View the feed of recent posts from the network
4. See real-time updates as new posts arrive

Next Steps for Phase 2

· Add proper error handling and reconnection logic
· Implement user profiles and avatars
· Add reply functionality
· Integrate BCH tipping
· Add proper post reactions

The basic infrastructure is now in place. Would you like me to proceed with implementing the Threads-like reply system or the BCH integration for Phase 2?