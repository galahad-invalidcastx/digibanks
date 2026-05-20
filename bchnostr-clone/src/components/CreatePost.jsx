import React, { useState } from 'react';
import * as nostrTools from 'nostr-tools';
import { hexToBytes, DEFAULT_RELAYS } from '../utils/nostr';
import { relayManager } from '../utils/relay';

const { finalizeEvent } = nostrTools;

function CreatePost({ user, onPostCreated }) {
  const [content, setContent] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

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

      const successCount = await relayManager.publishEvent(signedEvent, DEFAULT_RELAYS);
      
      if (successCount > 0) {
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

  const commonEmojis = ['😀', '😂', '🤣', '😊', '😍', '🤔', '🚀', '💎', '🪙', '⚡', '❤️', '🔥', '🍃', '🌿'];

  return (
    <div className="border-b border-[#2F3336] p-4">
      <form onSubmit={handleSubmit}>
        <div className="flex gap-3">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-gradient-to-br from-[#00BA7C] to-[#1D9BF0] rounded-full flex items-center justify-center text-sm font-bold">
              {user.npub?.[6]?.toUpperCase() || 'U'}
            </div>
          </div>

          <div className="flex-1">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's happening?"
              className="w-full bg-transparent text-white text-[15px] outline-none resize-none placeholder-[#71767B]"
              rows="2"
              maxLength="280"
            />
            
            {content.length > 240 && (
              <div className={`text-right text-xs mt-1 ${
                content.length > 280 ? 'text-red-500' : 'text-[#71767B]'
              }`}>
                {content.length}/280
              </div>
            )}

            <div className="flex justify-between items-center mt-2">
              <div className="flex gap-1 relative">
                <button 
                  type="button" 
                  className="p-2 rounded-full active:bg-[#00BA7C]/10 text-[#00BA7C] transition text-xl"
                >
                  📷
                </button>
                
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="p-2 rounded-full active:bg-[#00BA7C]/10 text-[#00BA7C] transition text-xl"
                  >
                    😊
                  </button>
                  
                  {showEmojiPicker && (
                    <div className="absolute bottom-full left-0 mb-2 bg-black border border-[#2F3336] rounded-xl p-2 z-50">
                      <div className="grid grid-cols-7 gap-1">
                        {commonEmojis.map(emoji => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => {
                              setContent(content + emoji);
                              setShowEmojiPicker(false);
                            }}
                            className="w-10 h-10 hover:bg-white/10 rounded-lg transition text-xl active:scale-95"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <button
                type="submit"
                disabled={!content.trim() || isPosting || content.length > 280}
                className="bg-[#00BA7C] disabled:opacity-50 px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-1 active:scale-95 transition"
              >
                {isPosting ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white"></div>
                ) : (
                  <span>✨</span>
                )}
                <span>{isPosting ? '' : 'Post'}</span>
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

export default CreatePost;