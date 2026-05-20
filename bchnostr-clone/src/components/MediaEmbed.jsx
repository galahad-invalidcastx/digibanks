import React, { useState, useEffect } from 'react';

function MediaEmbed({ content }) {
  const [mediaItems, setMediaItems] = useState([]);

  useEffect(() => {
    if (!content || typeof content !== 'string') {
      setMediaItems([]);
      return;
    }
    
    const extractMedia = () => {
      const urls = [];
      
      // Image patterns
      const imagePattern = /https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?[^\s]*)?/gi;
      const matches = content.match(imagePattern);
      
      if (matches) {
        matches.forEach(url => {
          urls.push({ type: 'image', url: url });
        });
      }
      
      setMediaItems(urls);
    };
    
    extractMedia();
  }, [content]);

  if (!mediaItems || mediaItems.length === 0) return null;

  return (
    <div className="mt-3 space-y-3">
      {mediaItems.map((item, index) => (
        <div key={index} className="rounded-2xl overflow-hidden border border-[#2F3336] bg-black">
          {item.type === 'image' && (
            <img 
              src={item.url} 
              alt="Post content"
              className="w-full max-h-[400px] object-contain"
              loading="lazy"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          )}
        </div>
      ))}
    </div>
  );
}

export default MediaEmbed;