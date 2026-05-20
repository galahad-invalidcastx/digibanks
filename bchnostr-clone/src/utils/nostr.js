import { generateSecretKey, getPublicKey, finalizeEvent, nip19 } from 'nostr-tools';
import { bytesToHex } from '@noble/hashes/utils';

// Default relays - you can add more
export const DEFAULT_RELAYS = [
  'wss://relay.damus.io',
  'wss://relay.nostr.band',
  'wss://nos.lol',
  'wss://relay.primal.net'
];

// Key Management
export const generateNewKey = () => {
  const sk = generateSecretKey();
  const pk = getPublicKey(sk);
  return {
    privateKey: bytesToHex(sk),
    publicKey: pk,
    npub: nip19.npubEncode(pk)
  };
};

export const loginWithPrivateKey = (privateKey) => {
  try {
    const sk = hexToBytes(privateKey);
    const pk = getPublicKey(sk);
    return {
      privateKey: privateKey,
      publicKey: pk,
      npub: nip19.npubEncode(pk)
    };
  } catch (error) {
    console.error('Invalid private key:', error);
    return null;
  }
};

// Helper functions
export const hexToBytes = (hex) => {
  if (!hex) return null;
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
  
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
  return date.toLocaleDateString();
};

export const shortenKey = (key) => {
  if (!key) return '';
  return `${key.slice(0, 8)}...${key.slice(-8)}`;
};