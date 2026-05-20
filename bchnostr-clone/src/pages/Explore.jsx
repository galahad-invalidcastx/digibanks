import React from 'react';

function Explore({ user, onNavigate }) {
  const trendingTopics = [
    { topic: '#BitcoinCash', posts: '12.5K', category: 'Crypto' },
    { topic: '#Nostr', posts: '8.2K', category: 'Tech' },
    { topic: 'Decentralization', posts: '5.1K', category: 'Technology' },
    { topic: '#BCH', posts: '3.8K', category: 'Crypto' },
    { topic: 'Web3', posts: '2.9K', category: 'Technology' },
  ];

  return (
    <div>
      <div className="p-4 border-b border-[#2F3336]">
        <h1 className="text-xl font-bold">Explore</h1>
        <p className="text-[#71767B] text-sm">Discover trending content</p>
      </div>

      {/* Search */}
      <div className="p-4 border-b border-[#2F3336]">
        <input
          type="text"
          placeholder="Search topics, people, and more"
          className="w-full bg-[#2F3336] rounded-full py-3 px-4 text-white placeholder-[#71767B] focus:bg-black focus:border-[#1D9BF0] focus:border focus:outline-none transition"
        />
      </div>

      {/* Trending */}
      <div className="p-4">
        <h2 className="font-bold text-lg mb-4">Trending now</h2>
        {trendingTopics.map((item, i) => (
          <div key={i} className="mb-4 p-3 hover:bg-white/5 rounded-lg cursor-pointer transition">
            <div className="text-[#71767B] text-sm">{item.category}</div>
            <div className="font-bold">{item.topic}</div>
            <div className="text-[#71767B] text-sm">{item.posts} posts</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Explore;