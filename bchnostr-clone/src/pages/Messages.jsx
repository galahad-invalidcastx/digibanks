import React, { useState } from 'react';

function Messages({ user, onNavigate }) {
  const [selectedChat, setSelectedChat] = useState(null);
  const [messageInput, setMessageInput] = useState('');
  
  const chats = [
    { id: 1, name: 'alice', avatar: '👩', lastMessage: 'Hey! How are you?', time: '2m ago', unread: 2, online: true },
    { id: 2, name: 'bob', avatar: '👨', lastMessage: 'Check out this post', time: '1h ago', unread: 0, online: false },
    { id: 3, name: 'charlie', avatar: '👨‍💻', lastMessage: 'Thanks for the follow', time: '1d ago', unread: 0, online: true },
  ];

  const messages = {
    1: [
      { id: 1, text: 'Hey! How are you?', sender: 'alice', time: '10:30 AM', own: false },
      { id: 2, text: 'Im good, thanks! Working on some Nostr stuff', sender: 'me', time: '10:32 AM', own: true },
      { id: 3, text: 'Cool! Let me know if you need help', sender: 'alice', time: '10:33 AM', own: false },
    ]
  };

  const sendMessage = () => {
    if (!messageInput.trim()) return;
    // Send message logic here
    setMessageInput('');
  };

  if (selectedChat) {
    const chat = chats.find(c => c.id === selectedChat.id);
    const chatMessages = messages[selectedChat.id] || [];
    
    return (
      <div className="h-screen flex flex-col">
        {/* Chat Header */}
        <div className="sticky top-0 bg-black/95 backdrop-blur-sm border-b border-[#2F3336] p-4 flex items-center gap-4">
          <button onClick={() => setSelectedChat(null)} className="text-2xl hover:text-[#1D9BF0]">
            ←
          </button>
          <div className="w-10 h-10 bg-gradient-to-br from-[#1D9BF0] to-[#00BA7C] rounded-full flex items-center justify-center text-xl">
            {chat.avatar}
          </div>
          <div>
            <div className="font-bold">@{chat.name}</div>
            <div className="text-xs text-[#71767B]">{chat.online ? 'Online' : 'Offline'}</div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {chatMessages.map(msg => (
            <div key={msg.id} className={`flex ${msg.own ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[70%] rounded-2xl p-3 ${msg.own ? 'bg-[#1D9BF0] text-white' : 'bg-[#2F3336] text-white'}`}>
                <p>{msg.text}</p>
                <div className={`text-xs mt-1 ${msg.own ? 'text-blue-200' : 'text-[#71767B]'}`}>
                  {msg.time}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Message Input */}
        <div className="border-t border-[#2F3336] p-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Type a message..."
              className="flex-1 bg-[#2F3336] rounded-full px-4 py-2 text-white placeholder-[#71767B] focus:outline-none focus:border-[#1D9BF0] focus:border"
            />
            <button onClick={sendMessage} className="bg-[#1D9BF0] px-4 py-2 rounded-full font-semibold">
              Send
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="p-4 border-b border-[#2F3336]">
        <h1 className="text-xl font-bold">Messages</h1>
      </div>

      <div className="divide-y divide-[#2F3336]">
        {chats.map(chat => (
          <div 
            key={chat.id} 
            onClick={() => setSelectedChat(chat)}
            className="p-4 hover:bg-white/5 cursor-pointer transition"
          >
            <div className="flex gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-[#1D9BF0] to-[#00BA7C] rounded-full flex items-center justify-center text-xl">
                {chat.avatar}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-center">
                  <span className="font-bold">@{chat.name}</span>
                  <span className="text-xs text-[#71767B]">{chat.time}</span>
                </div>
                <div className="text-[#71767B] text-sm truncate">{chat.lastMessage}</div>
              </div>
              {chat.unread > 0 && (
                <div className="bg-[#1D9BF0] rounded-full min-w-[20px] h-5 px-1 text-xs flex items-center justify-center">
                  {chat.unread}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Messages;