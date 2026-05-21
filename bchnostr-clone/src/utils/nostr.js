import { bytesToHex } from '@noble/hashes/utils';

const generateRandomBytes = () => {
  const bytes = new Uint8Array(32);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < 32; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  return bytes;
};

let nostrTools = null;
let getPublicKey = null;
let finalizeEvent = null;
let nip19 = null;

const initNostr = async () => {
  if (!nostrTools) {
    nostrTools = await import('nostr-tools');
    getPublicKey = nostrTools.getPublicKey;
    finalizeEvent = nostrTools.finalizeEvent;
    nip19 = nostrTools.nip19;
  }
  return { getPublicKey, finalizeEvent, nip19 };
};

export const DEFAULT_RELAYS = [
  'wss://relay.damus.io',
  'wss://nos.lol',
  'wss://relay.primal.net',
  'wss://relay.nostr.band',
  'wss://purplepag.es',
  'wss://relay.snort.social',
  'wss://nostr.wine'
];

export const generateNewKey = async () => {
  try {
    await initNostr();
    const sk = generateRandomBytes();
    const privateKeyHex = bytesToHex(sk);
    const pk = getPublicKey(sk);
    
    return {
      privateKey: privateKeyHex,
      publicKey: pk,
      npub: nip19.npubEncode(pk),
      nsec: nip19.nsecEncode(sk)
    };
  } catch (error) {
    console.error('Generation error:', error);
    const sk = generateRandomBytes();
    return {
      privateKey: bytesToHex(sk),
      publicKey: 'error',
      npub: '',
      nsec: ''
    };
  }
};


export const hexToBytes = (hex) => {
  if (!hex) return null;
  if (typeof hex !== 'string') {
    console.error('hexToBytes: expected string, got', typeof hex);
    return null;
  }
  hex = hex.trim().replace(/\s/g, '');
  if (hex.length % 2 !== 0) hex = '0' + hex;
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes;
};

export const formatTimestamp = (timestamp) => {
  const date = new Date(timestamp * 1000);
  const now = new Date();
  const diff = now - date;
  
  if (diff < 60000) return 'now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}d`;
  return date.toLocaleDateString();
};

export const shortenKey = (key) => {
  if (!key) return '';
  if (key.startsWith('npub')) {
    return `${key.slice(0, 12)}...${key.slice(-8)}`;
  }
  return `${key.slice(0, 8)}...${key.slice(-8)}`;
};

// Manual bech32 decoder for nsec keys (fallback)
const manualDecodeNsec = (nsecKey) => {
  try {
    console.log('Attempting manual decode of:', nsecKey.substring(0, 20) + '...');
    
    // Remove 'nsec1' prefix
    const data = nsecKey.slice(5);
    console.log('Data portion length:', data.length);
    
    // Convert from bech32 to bytes (simplified - this is a placeholder)
    // In reality, we need proper bech32 decoding
    
    // For now, return null and let the main decoder handle it
    return null;
  } catch (e) {
    console.error('Manual decode error:', e);
    return null;
  }
};

export const loginWithPrivateKey = async (privateKeyInput) => {
  try {
    await initNostr();
    
    console.log('=== DEBUG IMPORT ===');
    console.log('Full key:', privateKeyInput);
    console.log('Key length:', privateKeyInput.length);
    
    let sk;
    let privateKeyHex;
    
    // Try direct decode first
    if (privateKeyInput.startsWith('nsec1')) {
      try {
        // Log the exact key we're trying to decode
        console.log('Attempting to decode:', privateKeyInput);
        
        const decoded = nip19.decode(privateKeyInput);
        console.log('Decode result type:', decoded?.type);
        console.log('Decode result has data:', !!decoded?.data);
        
        if (decoded && decoded.data) {
          sk = decoded.data;
          privateKeyHex = bytesToHex(sk);
          console.log('Decode successful!');
        } else {
          console.error('Decode returned null data');
          return null;
        }
      } catch (decodeError) {
        console.error('Decode error name:', decodeError.name);
        console.error('Decode error message:', decodeError.message);
        console.error('Full decode error:', decodeError);
        
        // Try manual decode as fallback
        const manualResult = manualDecodeNsec(privateKeyInput);
        if (manualResult) {
          sk = manualResult;
          privateKeyHex = bytesToHex(sk);
          console.log('Manual decode successful!');
        } else {
          return null;
        }
      }
    } 
    else if (/^[0-9a-f]{64}$/i.test(privateKeyInput)) {
      privateKeyHex = privateKeyInput.toLowerCase();
      sk = hexToBytes(privateKeyHex);
    }
    else {
      console.error('Unknown format');
      return null;
    }
    
    if (!sk || sk.length === 0) {
      return null;
    }
    
    const pk = getPublicKey(sk);
    console.log('Public key generated:', pk.substring(0, 16) + '...');
    
    return {
      privateKey: privateKeyHex,
      publicKey: pk,
      npub: nip19.npubEncode(pk),
      nsec: nip19.nsecEncode(sk)
    };
  } catch (error) {
    console.error('Outer error:', error);
    return null;
  }
};