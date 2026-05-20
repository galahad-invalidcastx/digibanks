import React, { useState, useEffect } from 'react';
import Post from '../components/Post';

function ThreadView({ post, user, onNavigate }) {
  const [replies, setReplies] = useState([]);
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading replies from Nostr
    const mockReplies = [
      { 
        id: 'reply1', 
        content: 'Great post! Thanks for sharing this information.', 
        pubkey: 'npub1reply1',
        created_at: Date.now() / 1000 - 300,
        tags: [['e', post.id]]
      },
      { 
        id: 'reply2', 
        content: 'I totally agree with this perspective on decentralization.', 
        pubkey: 'npub1reply2',
        created_at: Date.now() / 1000 - 600,
        tags: [['e', post.id]]
      },
      { 
        id: 'reply3', 
        content: 'This is exactly what the Nostr ecosystem needs! 🚀', 
        pubkey: 'npub1reply3',
        created_at: Date.now() / 1000 - 900,
        tags: [['e', post.id]]
      },
    ];
    setReplies(mockReplies);
    setLoading(false);
  }, [post.id]);

  const submitReply = () => {
    if (!replyText.trim()) return;
    
    const newReply = {
      id: Date.now().toString(),
      content: replyText,
      pubkey: user.publicKey,
      created_at: Date.now() / 1000,
      tags: [['e', post.id]]
    };
    
    setReplies([newReply, ...replies]);
    setReplyText('');
  };

  return (
    <div>
      {/* Thread Header */}
      <div className="sticky top-0 lg:top-[60px] bg-black/95 backdrop-blur-sm border-b border-[#2F3336] z-10">
        <div className="flex items-center gap-4 p-4">
          <button 
            onClick={() => onNavigate('home')}
            className="text-2xl hover:text-[#1D9BF0] transition"
          >
            ←
          </button>
          <div>
            <h1 className="text-xl font-bold">Thread</h1>
            <p className="text-xs text-[#71767B]">{replies.length} replies</p>
          </div>
        </div>
      </div>

      {/* Original Post */}
      <Post post={post} currentUser={user} onNavigate={onNavigate} isThread={true} />

      {/* Reply Form */}
      <div className="p-4 border-b border-[#2F3336]">
        <div className="flex gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-[#1D9BF0] to-[#00BA7C] rounded-full flex-shrink-0"></div>
          <div className="flex-1">
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Post your reply"
              className="w-full bg-transparent text-white outline-none resize-none"
              rows="3"
            />
            <div className="flex justify-end mt-2">
              <button 
                onClick={submitReply}
                disabled={!replyText.trim()}
                className="btn-primary px-6"
              >
                Reply
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Replies */}
      <div className="border-t border-[#2F3336]">
        <div className="p-4 border-b border-[#2F3336]">
          <h2 className="font-bold">Replies</h2>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1D9BF0]"></div>
          </div>
        ) : replies.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">💬</div>
            <div className="text-[#71767B]">No replies yet</div>
            <div className="text-[#71767B]">Be the first to reply!</div>
          </div>
        ) : (
          replies.map(reply => (
            <Post 
              key={reply.id} 
              post={reply} 
              currentUser={user} 
              onNavigate={onNavigate} 
              isThread={true}
            />
          ))
        )}
      </div>
    </div>
  );
}

export default ThreadView;