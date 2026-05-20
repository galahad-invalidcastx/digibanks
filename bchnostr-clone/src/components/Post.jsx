import React, { useState, useEffect } from 'react';
import { formatTimestamp, shortenKey } from '../utils/nostr';
import { fetchProfile } from '../utils/profile';
import MediaEmbed from './MediaEmbed';

function Post({ post, currentUser, onNavigate, isThread = false }) {
  const [profile, setProfile] = useState(null);
  const [isLiking, setIsLiking] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(Math.floor(Math.random() * 500));
  const [repostCount] = useState(Math.floor(Math.random() * 100));
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isBookmarked, setIsBookmarked] = useState(false);
  const mountedRef = useState(true)[0];

  // Fetch profile for the post author
  useEffect(() => {
    const loadProfile = async () => {
      if (mountedRef) {
        const profileData = await fetchProfile(post.pubkey);
        setProfile(profileData);
      }
    };
    loadProfile();
  }, [post.pubkey, mountedRef]);

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

  const handleReply = () => {
    setShowReplyForm(!showReplyForm);
  };

  const handlePostClick = () => {
    if (!isThread) {
      onNavigate('thread', post);
    }
  };

  const submitReply = () => {
    if (!replyText.trim()) return;
    setReplyText('');
    setShowReplyForm(false);
  };

  const getDisplayName = () => {
    if (profile?.display_name) return profile.display_name;
    if (profile?.name) return profile.name;
    return null;
  };

  const displayName = getDisplayName();
  const isVerified = profile?.nip05?.includes('@');

  // Clean content by removing media URLs
  const cleanContent = (content) => {
    let cleaned = content.replace(/https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?[^\s]*)?/gi, '');
    cleaned = cleaned.replace(/https?:\/\/[^\s]+\.(mp4|webm|ogg|mov)(\?[^\s]*)?/gi, '');
    cleaned = cleaned.replace(/https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)[a-zA-Z0-9_-]+/gi, '');
    cleaned = cleaned.replace(/https?:\/\/(?:www\.)?vimeo\.com\/\d+/gi, '');
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    return cleaned;
  };

  const displayContent = cleanContent(post.content);

  return (
    <div 
      className={`border-b border-[#2F3336] active:bg-white/[0.03] transition-colors ${!isThread ? 'cursor-pointer' : ''}`}
      onClick={handlePostClick}
    >
      <div className="p-4">
        <div className="flex gap-3">
          {/* Avatar */}
          <div className="flex-shrink-0">
            {profile?.picture ? (
              <img 
                src={profile.picture} 
                alt={displayName || 'User'}
                className="w-12 h-12 rounded-full object-cover active:scale-95 transition"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.parentElement.innerHTML = `<div class="w-12 h-12 bg-gradient-to-br from-[#00BA7C] to-[#1D9BF0] rounded-full flex items-center justify-center text-xl font-bold">${(displayName?.[0] || post.pubkey[6] || 'U').toUpperCase()}</div>`;
                }}
              />
            ) : (
              <div className="w-12 h-12 bg-gradient-to-br from-[#00BA7C] to-[#1D9BF0] rounded-full flex items-center justify-center text-xl font-bold">
                {(displayName?.[0] || post.pubkey[6] || 'U').toUpperCase()}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-1">
              <div className="flex items-center gap-2 flex-wrap">
                {displayName ? (
                  <>
                    <span className="font-bold hover:underline text-[15px]">
                      {displayName}
                    </span>
                    {isVerified && <span className="text-[#00BA7C] text-sm">✓</span>}
                    <span className="text-[#71767B] text-sm">
                      @{shortenKey(post.pubkey)}
                    </span>
                  </>
                ) : (
                  <span className="font-bold text-[15px]">
                    {shortenKey(post.pubkey)}
                  </span>
                )}
                <span className="text-[#71767B] text-sm">·</span>
                <span className="text-[#71767B] text-sm">
                  {formatTimestamp(post.created_at)}
                </span>
              </div>
              
              <button className="text-[#71767B] p-2 -mr-2 active:bg-white/10 rounded-full transition text-lg">
                ⋯
              </button>
            </div>

            {/* Content Text */}
            {displayContent && (
              <p className="mt-1 text-white whitespace-pre-wrap break-words leading-relaxed text-[15px]">
                {displayContent}
              </p>
            )}

            {/* Media Embed */}
            <MediaEmbed content={post.content} />

            {/* Action Buttons */}
            <div className="flex justify-between max-w-md mt-3 -ml-2">
              <button 
                onClick={(e) => { e.stopPropagation(); handleReply(); }}
                className="flex items-center gap-1 px-3 py-2 rounded-full active:bg-[#00BA7C]/10 transition group touch-manipulation"
              >
                <span className="text-xl group-hover:text-[#00BA7C]">💬</span>
                <span className="text-sm text-[#71767B] group-hover:text-[#00BA7C]">
                  {post.tags?.filter(t => t[0] === 'e').length || 0}
                </span>
              </button>

              <button 
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1 px-3 py-2 rounded-full active:bg-[#00BA7C]/10 transition group touch-manipulation"
              >
                <span className="text-xl group-hover:text-[#00BA7C]">🔄</span>
                <span className="text-sm text-[#71767B] group-hover:text-[#00BA7C]">{repostCount}</span>
              </button>

              <button
                onClick={(e) => { e.stopPropagation(); handleLike(); }}
                disabled={isLiking}
                className={`flex items-center gap-1 px-3 py-2 rounded-full active:scale-95 transition touch-manipulation`}
              >
                <span className={`text-xl ${liked ? 'text-red-500' : 'hover:text-red-500'}`}>
                  {liked ? '❤️' : '🤍'}
                </span>
                <span className="text-sm">{likeCount}</span>
              </button>

              <button 
                onClick={(e) => { e.stopPropagation(); setIsBookmarked(!isBookmarked); }}
                className={`flex items-center gap-1 px-3 py-2 rounded-full active:bg-[#00BA7C]/10 transition touch-manipulation`}
              >
                <span className={`text-xl ${isBookmarked ? 'text-[#00BA7C]' : ''}`}>
                  {isBookmarked ? '🔖' : '📑'}
                </span>
              </button>

              <button 
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1 px-3 py-2 rounded-full active:bg-yellow-500/10 transition touch-manipulation"
              >
                <span className="text-xl hover:text-yellow-500">⚡</span>
              </button>
            </div>

            {/* Reply Form */}
            {showReplyForm && (
              <div className="mt-4 pt-4 border-t border-[#2F3336]" onClick={(e) => e.stopPropagation()}>
                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-[#2F3336] rounded-full flex-shrink-0"></div>
                  <div className="flex-1">
                    <textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Post your reply"
                      className="w-full bg-transparent text-white outline-none resize-none text-[15px]"
                      rows="3"
                      autoFocus
                    />
                    <div className="flex justify-end mt-2">
                      <button 
                        onClick={submitReply}
                        disabled={!replyText.trim()}
                        className="bg-[#00BA7C] disabled:opacity-50 px-6 py-2 rounded-full text-sm font-semibold active:scale-95 transition"
                      >
                        Reply
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Post;