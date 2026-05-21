import { generateSecretKey, getPublicKey, finalizeEvent } from 'nostr-tools';
import { nip19 } from 'nostr-tools';
import { bytesToHex } from '@noble/hashes/utils';

export const DEFAULT_RELAYS = [
  'wss://relay.damus.io',
  'wss://nos.lol',
  'wss://relay.primal.net',
  'wss://relay.nostr.band',
  'wss://purplepag.es',
  'wss://relay.snort.social',
  'wss://nostr.wine'
];

export const generateNewKey = () => {
  const sk = generateSecretKey();
  const pk = getPublicKey(sk);
  const privateKeyHex = bytesToHex(sk);
  return {
    privateKey: privateKeyHex,
    publicKey: pk,
    npub: nip19.npubEncode(pk),
    nsec: nip19.nsecEncode(sk)
  };
};

export const loginWithPrivateKey = (privateKeyInput) => {
  try {
    let sk;
    let privateKeyHex;
    
    console.log('Attempting to login with key:', privateKeyInput.substring(0, 10) + '...');
    
    // Check if it's an nsec key
    if (privateKeyInput.startsWith('nsec')) {
      console.log('Detected nsec key format');
      const decoded = nip19.decode(privateKeyInput);
      sk = decoded.data;
      privateKeyHex = bytesToHex(sk);
      console.log('Successfully decoded nsec, public key generated');
    } 
    // Check if it's a hex private key (64 characters hex)
    else if (/^[0-9a-f]{64}$/i.test(privateKeyInput)) {
      console.log('Detected hex key format');
      privateKeyHex = privateKeyInput.toLowerCase();
      sk = hexToBytes(privateKeyHex);
      if (!sk || sk.length === 0) {
        throw new Error('Invalid hex key');
      }
      console.log('Successfully converted hex key');
    }
    else {
      console.error('Invalid key format - must start with nsec or be 64 hex chars');
      return null;
    }
    
    // Generate public key from private key
    const pk = getPublicKey(sk);
    console.log('Generated public key:', pk.substring(0, 10) + '...');
    
    return {
      privateKey: privateKeyHex,
      publicKey: pk,
      npub: nip19.npubEncode(pk),
      nsec: nip19.nsecEncode(sk)
    };
  } catch (error) {
    console.error('Login error details:', error);
    return null;
  }
};

export const hexToBytes = (hex) => {
  if (!hex) return null;
  
  // Remove any spaces or newlines
  hex = hex.trim().replace(/\s/g, '');
  
  // Ensure even length
  if (hex.length % 2 !== 0) {
    hex = '0' + hex;
  }
  
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