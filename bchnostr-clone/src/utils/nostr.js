import { bytesToHex } from '@noble/hashes/utils';

const generateRandomBytes = () => {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
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
};

export const loginWithPrivateKey = async (privateKeyInput) => {
  await initNostr();
  
  let sk;
  let privateKeyHex;
  
  if (privateKeyInput.startsWith('nsec')) {
    const decoded = nip19.decode(privateKeyInput);
    sk = decoded.data;
    privateKeyHex = bytesToHex(sk);
  } else if (/^[0-9a-f]{64}$/i.test(privateKeyInput)) {
    privateKeyHex = privateKeyInput.toLowerCase();
    sk = hexToBytes(privateKeyHex);
  } else {
    return null;
  }
  
  const pk = getPublicKey(sk);
  return {
    privateKey: privateKeyHex,
    publicKey: pk,
    npub: nip19.npubEncode(pk),
    nsec: nip19.nsecEncode(sk)
  };
};

export const hexToBytes = (hex) => {
  if (!hex) return null;
  hex = hex.trim();
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