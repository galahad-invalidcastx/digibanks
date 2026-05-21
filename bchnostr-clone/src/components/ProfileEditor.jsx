import React, { useState, useRef } from 'react';
import { finalizeEvent } from 'nostr-tools';
import { hexToBytes, DEFAULT_RELAYS } from '../utils/nostr';
import { relayManager } from '../utils/relay';

function ProfileEditor({ user, profile, onClose, onUpdate }) {
  const [formData, setFormData] = useState({
    name: profile?.name || '',
    display_name: profile?.display_name || '',
    about: profile?.about || '',
    picture: profile?.picture || '',
    banner: profile?.banner || '',
    nip05: profile?.nip05 || '',
    website: profile?.website || '',
    lud16: profile?.lud16 || ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [previewPicture, setPreviewPicture] = useState(formData.picture);
  const [previewBanner, setPreviewBanner] = useState(formData.banner);
  
  const pictureInputRef = useRef(null);
  const bannerInputRef = useRef(null);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = (file, type) => {
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB');
      return;
    }
    
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }
    
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result;
      if (type === 'picture') {
        setPreviewPicture(base64String);
        handleChange('picture', base64String);
      } else {
        setPreviewBanner(base64String);
        handleChange('banner', base64String);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const profileEvent = {
        kind: 0,
        created_at: Math.floor(Date.now() / 1000),
        tags: [],
        content: JSON.stringify({
          name: formData.name,
          display_name: formData.display_name,
          about: formData.about,
          picture: formData.picture,
          banner: formData.banner,
          nip05: formData.nip05,
          website: formData.website,
          lud16: formData.lud16
        })
      };

      const privateKeyBytes = hexToBytes(user.privateKey);
      const signedEvent = finalizeEvent(profileEvent, privateKeyBytes);
      
      const successCount = await relayManager.publishEvent(signedEvent, DEFAULT_RELAYS);
      
      if (successCount > 0) {
        setSuccess('Profile updated successfully!');
        setTimeout(() => {
          onUpdate(formData);
          onClose();
        }, 1500);
      } else {
        setError('Failed to update profile. Please try again.');
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Error updating profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/95 z-[300] flex flex-col safe-top safe-bottom">
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b border-[#2F3336]">
        <button 
          onClick={onClose}
          className="p-2 active:bg-white/10 rounded-full transition text-xl"
        >
          ✕
        </button>
        <h2 className="text-xl font-bold">Edit profile</h2>
        <button 
          onClick={handleSubmit}
          disabled={loading}
          className="bg-[#00BA7C] disabled:opacity-50 px-4 py-2 rounded-full font-semibold text-sm active:scale-95 transition"
        >
          {loading ? 'Saving...' : 'Save'}
        </button>
      </div>

      {/* Form Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Cover Photo */}
        <div className="relative h-48 bg-gradient-to-r from-[#00BA7C] to-[#1D9BF0]">
          {previewBanner && (
            <img 
              src={previewBanner} 
              alt="Cover" 
              className="w-full h-full object-cover"
            />
          )}
          <button
            onClick={() => bannerInputRef.current?.click()}
            className="absolute bottom-4 right-4 bg-black/60 backdrop-blur p-2 rounded-full active:scale-95 transition text-xl"
          >
            📷
          </button>
          <input
            ref={bannerInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleImageUpload(e.target.files[0], 'banner')}
          />
        </div>

        {/* Avatar */}
        <div className="px-4">
          <div className="relative -mt-12 mb-4">
            <div className="w-24 h-24 rounded-full border-4 border-black overflow-hidden bg-gradient-to-br from-[#00BA7C] to-[#1D9BF0]">
              {previewPicture ? (
                <img 
                  src={previewPicture} 
                  alt="Avatar" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-3xl font-bold">
                  {(formData.display_name?.[0] || formData.name?.[0] || 'U').toUpperCase()}
                </div>
              )}
            </div>
            <button
              onClick={() => pictureInputRef.current?.click()}
              className="absolute bottom-0 right-0 bg-[#00BA7C] p-2 rounded-full active:scale-95 transition text-sm"
            >
              📷
            </button>
            <input
              ref={pictureInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleImageUpload(e.target.files[0], 'picture')}
            />
          </div>
        </div>

        {/* Form Fields */}
        <div className="px-4 space-y-4 pb-8">
          <div>
            <label className="block text-sm font-medium mb-1 text-[#71767B]">
              <span className="inline mr-1">👤</span> Display name
            </label>
            <input
              type="text"
              value={formData.display_name}
              onChange={(e) => handleChange('display_name', e.target.value)}
              placeholder="Your display name"
              className="w-full bg-[#2F3336] rounded-lg p-3 text-white placeholder-[#71767B] focus:border-[#00BA7C] focus:outline-none transition"
              maxLength="50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-[#71767B]">
              <span className="inline mr-1">@</span> Name / Username
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Your name"
              className="w-full bg-[#2F3336] rounded-lg p-3 text-white placeholder-[#71767B] focus:border-[#00BA7C] focus:outline-none transition"
              maxLength="50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-[#71767B]">
              <span className="inline mr-1">ℹ️</span> Bio
            </label>
            <textarea
              value={formData.about}
              onChange={(e) => handleChange('about', e.target.value)}
              placeholder="Tell us about yourself"
              rows="4"
              className="w-full bg-[#2F3336] rounded-lg p-3 text-white placeholder-[#71767B] focus:border-[#00BA7C] focus:outline-none transition resize-none"
              maxLength="160"
            />
            <div className="text-right text-xs text-[#71767B] mt-1">
              {formData.about.length}/160
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-[#71767B]">
              <span className="inline mr-1">🔗</span> NIP-05 Identifier
            </label>
            <input
              type="text"
              value={formData.nip05}
              onChange={(e) => handleChange('nip05', e.target.value)}
              placeholder="user@example.com"
              className="w-full bg-[#2F3336] rounded-lg p-3 text-white placeholder-[#71767B] focus:border-[#00BA7C] focus:outline-none transition"
            />
            <p className="text-xs text-[#71767B] mt-1">
              Get verified by setting up a nostr.json file on your domain
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-[#71767B]">
              <span className="inline mr-1">🌐</span> Website
            </label>
            <input
              type="url"
              value={formData.website}
              onChange={(e) => handleChange('website', e.target.value)}
              placeholder="https://your-website.com"
              className="w-full bg-[#2F3336] rounded-lg p-3 text-white placeholder-[#71767B] focus:border-[#00BA7C] focus:outline-none transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-[#71767B]">
              <span className="inline mr-1">⚡</span> Lightning Address (BCH)
            </label>
            <input
              type="text"
              value={formData.lud16}
              onChange={(e) => handleChange('lud16', e.target.value)}
              placeholder="you@getalby.com"
              className="w-full bg-[#2F3336] rounded-lg p-3 text-white placeholder-[#71767B] focus:border-[#00BA7C] focus:outline-none transition"
            />
            <p className="text-xs text-[#71767B] mt-1">
              Receive Bitcoin Cash tips with your Lightning address
            </p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500 rounded-lg p-3 text-red-500 text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-[#00BA7C]/10 border border-[#00BA7C] rounded-lg p-3 text-[#00BA7C] text-sm">
              {success}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProfileEditor;