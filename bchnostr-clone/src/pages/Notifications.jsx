import React, { useState, useEffect } from 'react';

function Notifications({ user, onNavigate }) {
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    // Mock notifications data
    const mockNotifications = [
      { id: 1, type: 'like', user: 'alice', content: 'liked your post', time: '2h ago', read: false },
      { id: 2, type: 'reply', user: 'bob', content: 'replied to your thread', time: '5h ago', read: false },
      { id: 3, type: 'follow', user: 'charlie', content: 'started following you', time: '1d ago', read: true },
      { id: 4, type: 'zap', user: 'david', content: 'sent you 1000 sats', time: '2d ago', read: true },
      { id: 5, type: 'repost', user: 'eve', content: 'reposted your post', time: '3d ago', read: true },
    ];
    setNotifications(mockNotifications);
  }, []);

  const getIcon = (type) => {
    switch(type) {
      case 'like': return '❤️';
      case 'reply': return '💬';
      case 'follow': return '👤';
      case 'zap': return '⚡';
      case 'repost': return '🔄';
      default: return '📢';
    }
  };

  const filteredNotifications = filter === 'all' 
    ? notifications 
    : notifications.filter(n => n.type === filter);

  return (
    <div>
      <div className="p-4 border-b border-[#2F3336]">
        <h1 className="text-xl font-bold">Notifications</h1>
      </div>

      {/* Filter Tabs */}
      <div className="flex border-b border-[#2F3336]">
        {['all', 'likes', 'replies', 'follows'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex-1 py-3 font-semibold transition ${
              filter === f ? 'text-[#1D9BF0] border-b-2 border-[#1D9BF0]' : 'text-[#71767B]'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div className="divide-y divide-[#2F3336]">
        {filteredNotifications.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🔔</div>
            <div className="text-[#71767B] text-lg">No notifications yet</div>
            <div className="text-[#71767B]">When someone interacts with you, it'll show up here</div>
          </div>
        ) : (
          filteredNotifications.map(notif => (
            <div key={notif.id} className={`p-4 hover:bg-white/5 cursor-pointer transition ${!notif.read ? 'bg-[#1D9BF0]/5' : ''}`}>
              <div className="flex gap-3">
                <div className="text-2xl">{getIcon(notif.type)}</div>
                <div className="flex-1">
                  <div>
                    <span className="font-bold">@{notif.user}</span>
                    <span className="text-[#71767B]"> {notif.content}</span>
                  </div>
                  <div className="text-xs text-[#71767B] mt-1">{notif.time}</div>
                </div>
                {!notif.read && (
                  <div className="w-2 h-2 bg-[#1D9BF0] rounded-full"></div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Notifications;