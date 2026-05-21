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

export const loginWithPrivateKey = async (privateKeyInput) => {
  try {
    await initNostr();
    
    console.log('=== DEBUG IMPORT ===');
    console.log('Key length:', privateKeyInput.length);
    console.log('Key prefix:', privateKeyInput.substring(0, 8));
    
    let sk;
    let privateKeyHex;
    
    if (privateKeyInput.startsWith('nsec1')) {
      try {
        const decoded = nip19.decode(privateKeyInput);
        console.log('Decoded type:', decoded?.type);
        
        if (decoded && decoded.data) {
          // Convert to Uint8Array if it's not already
          if (decoded.data instanceof Uint8Array) {
            sk = decoded.data;
          } else if (Array.isArray(decoded.data)) {
            sk = new Uint8Array(decoded.data);
          } else if (typeof decoded.data === 'object' && decoded.data.buffer) {
            sk = new Uint8Array(decoded.data);
          } else {
            // Try to convert from any array-like object
            sk = new Uint8Array(Object.values(decoded.data));
          }
          privateKeyHex = bytesToHex(sk);
          console.log('Decode successful! Private key hex length:', privateKeyHex.length);
        } else {
          console.error('Decode returned no data');
          return null;
        }
      } catch (decodeError) {
        console.error('Decode error:', decodeError.message);
        return null;
      }
    } 
    else if (/^[0-9a-f]{64}$/i.test(privateKeyInput)) {
      privateKeyHex = privateKeyInput.toLowerCase();
      sk = hexToBytes(privateKeyHex);
      console.log('Hex conversion successful');
    }
    else {
      console.error('Unknown format');
      return null;
    }
    
    if (!sk || sk.length === 0) {
      console.error('No private key generated');
      return null;
    }
    
    console.log('Private key bytes length:', sk.length);
    
    const pk = getPublicKey(sk);
    console.log('Public key generated:', pk.substring(0, 16) + '...');
    
    return {
      privateKey: privateKeyHex,
      publicKey: pk,
      npub: nip19.npubEncode(pk),
      nsec: nip19.nsecEncode(sk)
    };
  } catch (error) {
    console.error('Login error:', error);
    return null;
  }
};

export const hexToBytes = (hex) => {
  if (!hex) return null;
  if (typeof hex !== 'string') {
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