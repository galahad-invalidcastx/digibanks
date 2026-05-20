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
        alert('Failed to publish post to most relays');
      }
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Error creating post');
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <div className="post-card p-4">
      <form onSubmit={handleSubmit}>
        <div className="flex gap-3">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-gradient-to-br from-x-blue to-x-green rounded-full flex items-center justify-center">
              👤
            </div>
          </div>

          {/* Input Area */}
          <div className="flex-1">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's happening?"
              className="w-full bg-transparent text-white text-xl outline-none resize-none placeholder-x-light-gray"
              rows="3"
              maxLength="280"
            />
            
            {/* Character counter */}
            {content.length > 240 && (
              <div className={`text-right text-sm mt-1 ${
                content.length > 280 ? 'text-x-red' : 'text-x-light-gray'
              }`}>
                {content.length}/280
              </div>
            )}

            {/* Action buttons */}
            <div className="flex justify-between items-center mt-2 pt-2 border-t border-x-gray">
              <div className="flex gap-1">
                <button type="button" className="p-2 rounded-full hover:bg-x-blue/10 text-x-blue transition">
                  📷
                </button>
                <button type="button" className="p-2 rounded-full hover:bg-x-blue/10 text-x-blue transition">
                  🎥
                </button>
                <button type="button" className="p-2 rounded-full hover:bg-x-blue/10 text-x-blue transition">
                  📊
                </button>
                <button type="button" className="p-2 rounded-full hover:bg-x-blue/10 text-x-blue transition">
                  😊
                </button>
              </div>
              
              <button
                type="submit"
                disabled={!content.trim() || isPosting || content.length > 280}
                className="btn-primary px-6 disabled:opacity-50"
              >
                {isPosting ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white"></div>
                    Posting...
                  </div>
                ) : (
                  'Post'
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

export default CreatePost;