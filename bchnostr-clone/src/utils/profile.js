import { relayManager } from './relay';
import { DEFAULT_RELAYS } from './nostr';

// Cache for profile data
const profileCache = new Map();

// Fetch profile data for a pubkey
export async function fetchProfile(pubkey, relays = DEFAULT_RELAYS) {
  // Check cache first
  if (profileCache.has(pubkey)) {
    const cached = profileCache.get(pubkey);
    if (Date.now() - cached.timestamp < 300000) { // 5 minutes cache
      return cached.data;
    }
  }

  return new Promise((resolve) => {
    const filter = {
      kinds: [0], // Profile metadata kind
      authors: [pubkey],
      limit: 1
    };
    
    let timeout = setTimeout(() => {
      resolve(null);
    }, 3000);
    
    const unsubscribe = relayManager.subscribe(filter, (event) => {
      try {
        const profileData = JSON.parse(event.content);
        const profile = {
          name: profileData.name || '',
          display_name: profileData.display_name || profileData.name || '',
          about: profileData.about || '',
          picture: profileData.picture || '',
          banner: profileData.banner || '',
          nip05: profileData.nip05 || '',
          website: profileData.website || '',
          lud16: profileData.lud16 || '',
          pubkey: pubkey
        };
        
        // Cache the profile
        profileCache.set(pubkey, {
          data: profile,
          timestamp: Date.now()
        });
        
        clearTimeout(timeout);
        unsubscribe();
        resolve(profile);
      } catch (e) {
        clearTimeout(timeout);
        unsubscribe();
        resolve(null);
      }
    }, relays);
    
    setTimeout(() => {
      clearTimeout(timeout);
      unsubscribe();
      resolve(null);
    }, 3000);
  });
}

// Batch fetch multiple profiles
export async function fetchProfiles(pubkeys, relays = DEFAULT_RELAYS) {
  const uniquePubkeys = [...new Set(pubkeys)];
  const uncached = uniquePubkeys.filter(pk => !profileCache.has(pk));
  
  if (uncached.length === 0) {
    const result = {};
    uniquePubkeys.forEach(pk => {
      const cached = profileCache.get(pk);
      if (cached) result[pk] = cached.data;
    });
    return result;
  }
  
  return new Promise((resolve) => {
    const filter = {
      kinds: [0],
      authors: uncached,
      limit: uncached.length
    };
    
    const profiles = {};
    let timeout = setTimeout(() => {
      resolve(profiles);
    }, 5000);
    
    const unsubscribe = relayManager.subscribe(filter, (event) => {
      try {
        const profileData = JSON.parse(event.content);
        profiles[event.pubkey] = {
          name: profileData.name || '',
          display_name: profileData.display_name || profileData.name || '',
          about: profileData.about || '',
          picture: profileData.picture || '',
          banner: profileData.banner || '',
          nip05: profileData.nip05 || '',
          website: profileData.website || '',
          lud16: profileData.lud16 || '',
          pubkey: event.pubkey
        };
        
        // Cache each profile
        profileCache.set(event.pubkey, {
          data: profiles[event.pubkey],
          timestamp: Date.now()
        });
      } catch (e) {
        console.error('Error parsing profile:', e);
      }
    }, relays);
    
    setTimeout(() => {
      clearTimeout(timeout);
      unsubscribe();
      
      // Add cached profiles to result
      uniquePubkeys.forEach(pk => {
        if (profileCache.has(pk) && !profiles[pk]) {
          profiles[pk] = profileCache.get(pk).data;
        }
      });
      
      resolve(profiles);
    }, 5000);
  });
}

// Get display name for a pubkey (with caching)
export async function getDisplayName(pubkey) {
  const profile = await fetchProfile(pubkey);
  if (profile && profile.display_name) {
    return profile.display_name;
  }
  if (profile && profile.name) {
    return profile.name;
  }
  return null;
}

// Format pubkey for display (shortened if no profile)
export function formatPubkey(pubkey) {
  if (!pubkey) return '';
  return `${pubkey.slice(0, 8)}...${pubkey.slice(-8)}`;
}