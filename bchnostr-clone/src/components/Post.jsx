import React, { useState } from 'react';
import { formatTimestamp, shortenKey } from '../utils/nostr';

function Post({ post, currentUser }) {
  const [isLiking, setIsLiking] = useState(false);
  const [liked, setLiked] = useState(false);
  const [repostCount] = useState(Math.floor(Math.random() * 100));
  const [likeCount, setLikeCount] = useState(Math.floor(Math.random() * 500));

  const handleLike = () => {
    setIsLiking(true);
    if (liked) {
      setLikeCount(likeCount - 1);
      setLiked(false);
    } else {
      setLikeCount(likeCount + 1);
      setLiked(true);
    }
    setTimeout(() => setIsLiking(false), 200);
  };

  return (
    <div className="post-card p-4 cursor-pointer hover:bg-white/[0.03]">
      <div className="flex gap-3">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <div className="w-12 h-12 bg-gradient-to-br from-x-blue to-x-green rounded-full flex items-center justify-center text-xl">
            {post.pubkey ? post.pubkey[0].toUpperCase() : '👤'}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold hover:underline cursor-pointer">
              {shortenKey(post.pubkey)}
            </span>
            <span className="text-x-light-gray text-sm">
              @{shortenKey(post.pubkey)}
            </span>
            <span className="text-x-light-gray text-sm">·</span>
            <span className="text-x-light-gray text-sm hover:underline cursor-pointer">
              {formatTimestamp(post.created_at)}
            </span>
          </div>

          {/* Content */}
          <p className="mt-1 text-white whitespace-pre-wrap break-words">
            {post.content}
          </p>

          {/* Images placeholder - will be implemented later */}
          {post.tags?.some(t => t[0] === 'imeta') && (
            <div className="mt-3 rounded-2xl overflow-hidden border border-x-gray">
              <div className="bg-x-gray h-64 flex items-center justify-center">
                <span className="text-x-light-gray">🖼️ Image preview</span>
              </div>
            </div>
          )}

          {/* Action Buttons - X.com style */}
          <div className="flex justify-between max-w-md mt-3 text-x-light-gray">
            {/* Reply */}
            <button className="flex items-center gap-2 hover:text-x-blue transition group">
              <div className="p-2 rounded-full group-hover:bg-x-blue/10 transition">
                💬
              </div>
              <span className="text-sm">{post.tags?.filter(t => t[0] === 'e').length || 0}</span>
            </button>

            {/* Repost */}
            <button className="flex items-center gap-2 hover:text-x-green transition group">
              <div className="p-2 rounded-full group-hover:bg-x-green/10 transition">
                🔄
              </div>
              <span className="text-sm">{repostCount}</span>
            </button>

            {/* Like */}
            <button 
              onClick={handleLike}
              disabled={isLiking}
              className={`flex items-center gap-2 transition group ${
                liked ? 'text-x-red' : 'hover:text-x-red'
              }`}
            >
              <div className={`p-2 rounded-full transition ${
                liked ? 'bg-x-red/10' : 'group-hover:bg-x-red/10'
              }`}>
                {liked ? '❤️' : '🤍'}
              </div>
              <span className="text-sm">{likeCount}</span>
            </button>

            {/* Share */}
            <button className="flex items-center gap-2 hover:text-x-blue transition group">
              <div className="p-2 rounded-full group-hover:bg-x-blue/10 transition">
                📤
              </div>
            </button>

            {/* Zap (BCH tip) */}
            <button className="flex items-center gap-2 hover:text-yellow-500 transition group">
              <div className="p-2 rounded-full group-hover:bg-yellow-500/10 transition">
                ⚡
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Post;