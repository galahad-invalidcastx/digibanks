import React, { useState } from 'react';
import Post from '../components/Post';

function Bookmarks({ user, onNavigate }) {
  const [bookmarks, setBookmarks] = useState([]);

  return (
    <div>
      <div className="p-4 border-b border-[#2F3336]">
        <h1 className="text-xl font-bold">Bookmarks</h1>
        <p className="text-[#71767B] text-sm">Saved posts for later</p>
      </div>

      {bookmarks.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">🔖</div>
          <div className="text-[#71767B] text-lg">No bookmarks yet</div>
          <div className="text-[#71767B]">Save posts to read them later</div>
        </div>
      ) : (
        bookmarks.map(post => (
          <Post key={post.id} post={post} currentUser={user} onNavigate={onNavigate} />
        ))
      )}
    </div>
  );
}

export default Bookmarks;