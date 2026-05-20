import React from 'react';

function Layout({ children, user, onLogout }) {
  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-[1280px] mx-auto flex">
        {/* Left Sidebar - X.com style navigation */}
        <div className="fixed w-64 h-screen border-r border-x-gray p-4 hidden lg:block">
          <div className="sticky top-0">
            {/* Logo */}
            <div className="text-3xl mb-6 p-3 hover:bg-white/10 rounded-full w-fit cursor-pointer transition">
              ⚡ BCH
            </div>

            {/* Navigation */}
            <nav className="space-y-2">
              <a href="#" className="sidebar-link">
                <span className="text-2xl">🏠</span>
                <span className="font-medium">Home</span>
              </a>
              <a href="#" className="sidebar-link">
                <span className="text-2xl">🔍</span>
                <span className="font-medium">Explore</span>
              </a>
              <a href="#" className="sidebar-link">
                <span className="text-2xl">🔔</span>
                <span className="font-medium">Notifications</span>
              </a>
              <a href="#" className="sidebar-link">
                <span className="text-2xl">💬</span>
                <span className="font-medium">Messages</span>
              </a>
              <a href="#" className="sidebar-link">
                <span className="text-2xl">📌</span>
                <span className="font-medium">Bookmarks</span>
              </a>
              <a href="#" className="sidebar-link">
                <span className="text-2xl">👤</span>
                <span className="font-medium">Profile</span>
              </a>
            </nav>

            {/* Post Button */}
            <button className="btn-primary w-full mt-4 py-3 text-lg">
              Post
            </button>

            {/* User Info */}
            {user && (
              <div className="absolute bottom-8 w-full">
                <button 
                  onClick={onLogout}
                  className="flex items-center gap-3 hover:bg-white/10 rounded-full p-3 transition w-full"
                >
                  <div className="w-10 h-10 bg-x-gray rounded-full flex items-center justify-center">
                    👤
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-bold text-sm">{user.npub?.slice(0, 12)}...</div>
                    <div className="text-x-light-gray text-sm">Logout →</div>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 lg:ml-64">
          <div className="max-w-2xl mx-auto">
            {children}
          </div>
        </div>

        {/* Right Sidebar - Trends & suggestions */}
        <div className="fixed right-0 w-96 h-screen border-l border-x-gray p-4 hidden xl:block">
          <div className="sticky top-0">
            {/* Search Bar */}
            <div className="relative mb-4">
              <input 
                type="text" 
                placeholder="Search" 
                className="w-full bg-x-gray rounded-full py-3 px-12 text-white placeholder-x-light-gray focus:bg-black focus:border-x-blue focus:border"
              />
              <span className="absolute left-4 top-3 text-x-light-gray text-xl">🔍</span>
            </div>

            {/* Trending Section */}
            <div className="bg-white/5 rounded-2xl p-4">
              <h2 className="text-xl font-bold mb-4">Trending for you</h2>
              <div className="space-y-4">
                <div>
                  <div className="text-x-light-gray text-sm">Trending in Crypto</div>
                  <div className="font-bold">#BitcoinCash</div>
                  <div className="text-x-light-gray text-sm">12.5K posts</div>
                </div>
                <div>
                  <div className="text-x-light-gray text-sm">Technology · Trending</div>
                  <div className="font-bold">Nostr</div>
                  <div className="text-x-light-gray text-sm">8.2K posts</div>
                </div>
                <div>
                  <div className="text-x-light-gray text-sm">Trending</div>
                  <div className="font-bold">Decentralization</div>
                  <div className="text-x-light-gray text-sm">5.1K posts</div>
                </div>
              </div>
            </div>

            {/* Suggested Follows */}
            <div className="bg-white/5 rounded-2xl p-4 mt-4">
              <h2 className="text-xl font-bold mb-4">Who to follow</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-x-gray rounded-full"></div>
                    <div>
                      <div className="font-bold">Nostr Official</div>
                      <div className="text-x-light-gray text-sm">@nostr</div>
                    </div>
                  </div>
                  <button className="btn-outline text-sm py-1 px-4">Follow</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Layout;