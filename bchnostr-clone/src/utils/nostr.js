import { bytesToHex } from '@noble/hashes/utils';
import { bech32 } from 'bech32';

// Manual bech32 decoder for nsec keys (same as bchnostr)
const decodeNsec = (nsecKey) => {
  try {
    if (!nsecKey || !nsecKey.startsWith('nsec1')) {
      throw new Error('Invalid nsec key format');
    }
    
    // Decode bech32
    const decoded = bech32.decode(nsecKey);
    const data = bech32.fromWords(decoded.words);
    
    // Should be 32 bytes (private key)
    if (data.length !== 32) {
      console.error('Expected 32 bytes, got', data.length);
      return null;
    }
    
    return new Uint8Array(data);
  } catch (error) {
    console.error('Bech32 decode error:', error);
    return null;
  }
};

// Import nostr-tools for other functions
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
    const sk = new Uint8Array(32);
    crypto.getRandomValues(sk);
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
    return null;
  }
};

export const loginWithPrivateKey = async (privateKeyInput) => {
  try {
    await initNostr();
    
    console.log('=== DEBUG IMPORT ===');
    console.log('Key type:', privateKeyInput.startsWith('nsec') ? 'nsec' : 'hex');
    console.log('Key length:', privateKeyInput.length);
    
    let sk;
    let privateKeyHex;
    
    if (privateKeyInput.startsWith('nsec1')) {
      // Use our manual bech32 decoder (same as bchnostr)
      const decoded = decodeNsec(privateKeyInput);
      if (decoded && decoded.length === 32) {
        sk = decoded;
        privateKeyHex = bytesToHex(sk);
        console.log('✅ nsec decoded successfully using bech32');
        console.log('Private key hex:', privateKeyHex.substring(0, 20) + '...');
      } else {
        console.error('❌ Failed to decode nsec key');
        return null;
      }
    } 
    else if (/^[0-9a-f]{64}$/i.test(privateKeyInput)) {
      privateKeyHex = privateKeyInput.toLowerCase();
      sk = hexToBytes(privateKeyHex);
      console.log('✅ Hex key accepted');
    }
    else {
      console.error('❌ Unknown format');
      return null;
    }
    
    if (!sk || sk.length !== 32) {
      console.error('Invalid private key length:', sk?.length);
      return null;
    }
    
    const pk = getPublicKey(sk);
    console.log('✅ Public key generated:', pk.substring(0, 16) + '...');
    
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