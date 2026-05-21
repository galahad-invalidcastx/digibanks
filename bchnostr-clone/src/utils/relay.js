import { DEFAULT_RELAYS } from './nostr';

// Make sure WebSocket is available
const WebSocket = typeof window !== 'undefined' ? window.WebSocket : require('ws');

class RelayManager {
  constructor() {
    this.pools = new Map();
    this.subscriptions = new Map();
    this.eventCache = new Map();
    this.connectedRelays = new Set();
  }

  async connectToRelays(relays = DEFAULT_RELAYS) {
    const connectionPromises = relays.map(async (url) => {
      try {
        const ws = new WebSocket(url);
        
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => reject(new Error('Connection timeout')), 10000);
          
          ws.onopen = () => {
            clearTimeout(timeout);
            console.log(`✅ Connected to ${url}`);
            this.pools.set(url, ws);
            this.connectedRelays.add(url);
            resolve();
          };
          
          ws.onerror = (error) => {
            clearTimeout(timeout);
            console.error(`❌ Failed to connect to ${url}:`, error);
            reject(error);
          };
          
          ws.onclose = () => {
            console.log(`🔌 Disconnected from ${url}`);
            this.pools.delete(url);
            this.connectedRelays.delete(url);
          };
        });
        
        return ws;
      } catch (error) {
        console.error(`Error connecting to ${url}:`, error);
        return null;
      }
    });
    
    const results = await Promise.allSettled(connectionPromises);
    const connectedCount = results.filter(r => r.status === 'fulfilled' && r.value !== null).length;
    console.log(`Connected to ${connectedCount}/${relays.length} relays`);
    return connectedCount;
  }

  async publishEvent(event, relays = DEFAULT_RELAYS) {
    const publishPromises = [];
    let successCount = 0;
    
    for (const relay of relays) {
      const ws = this.pools.get(relay);
      if (ws && ws.readyState === WebSocket.OPEN) {
        const promise = new Promise((resolve) => {
          const message = JSON.stringify(['EVENT', event]);
          ws.send(message);
          
          const handler = (e) => {
            const data = JSON.parse(e.data);
            if (data[0] === 'OK' && data[1] === event.id) {
              ws.removeEventListener('message', handler);
              successCount++;
              resolve(true);
            }
          };
          
          ws.addEventListener('message', handler);
          setTimeout(() => {
            ws.removeEventListener('message', handler);
            resolve(false);
          }, 5000);
        });
        
        publishPromises.push(promise);
      }
    }
    
    await Promise.all(publishPromises);
    return successCount;
  }

  subscribe(filter, onEvent, relays = DEFAULT_RELAYS) {
    const subscriptionId = Math.random().toString(36).substring(2, 15);
    const activeSubscriptions = [];
    let eventCount = 0;
    
    for (const relay of relays) {
      const ws = this.pools.get(relay);
      if (ws && ws.readyState === WebSocket.OPEN) {
        const subscribeMsg = JSON.stringify(['REQ', subscriptionId, filter]);
        ws.send(subscribeMsg);
        
        const messageHandler = (e) => {
          const data = JSON.parse(e.data);
          if (data[0] === 'EVENT' && data[1] === subscriptionId) {
            if (!this.eventCache.has(data[2].id)) {
              this.eventCache.set(data[2].id, data[2]);
              eventCount++;
              onEvent(data[2], relay);
            }
          }
        };
        
        ws.addEventListener('message', messageHandler);
        activeSubscriptions.push({ ws, messageHandler, relay });
      }
    }
    
    this.subscriptions.set(subscriptionId, activeSubscriptions);
    
    // Return unsubscribe function
    return () => {
      const subs = this.subscriptions.get(subscriptionId);
      if (subs) {
        subs.forEach(({ ws, messageHandler }) => {
          const closeMsg = JSON.stringify(['CLOSE', subscriptionId]);
          ws.send(closeMsg);
          ws.removeEventListener('message', messageHandler);
        });
        this.subscriptions.delete(subscriptionId);
      }
    };
  }

  getConnectionStatus() {
    return {
      total: DEFAULT_RELAYS.length,
      connected: this.connectedRelays.size,
      relays: Array.from(this.connectedRelays)
    };
  }

  disconnect() {
    this.pools.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    });
    this.pools.clear();
    this.connectedRelays.clear();
    this.subscriptions.clear();
    this.eventCache.clear();
  }
}

export const relayManager = new RelayManager();