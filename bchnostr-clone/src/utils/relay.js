import { DEFAULT_RELAYS } from './nostr';

class RelayManager {
  constructor() {
    this.pools = new Map();
    this.subscriptions = new Map();
  }

  async connectToRelays(relays = DEFAULT_RELAYS) {
    const WebSocket = window.WebSocket;
    const connections = relays.map(async (url) => {
      try {
        const ws = new WebSocket(url);
        
        await new Promise((resolve, reject) => {
          ws.onopen = () => {
            console.log(`Connected to ${url}`);
            this.pools.set(url, ws);
            resolve();
          };
          ws.onerror = (error) => {
            console.error(`Failed to connect to ${url}:`, error);
            reject(error);
          };
          ws.onclose = () => {
            console.log(`Disconnected from ${url}`);
            this.pools.delete(url);
          };
        });
        
        return ws;
      } catch (error) {
        console.error(`Error connecting to ${url}:`, error);
        return null;
      }
    });
    
    await Promise.allSettled(connections);
    return this.pools.size > 0;
  }

  async publishEvent(event, relays = DEFAULT_RELAYS) {
    const publishPromises = [];
    
    for (const relay of relays) {
      const ws = this.pools.get(relay);
      if (ws && ws.readyState === WebSocket.OPEN) {
        publishPromises.push(
          new Promise((resolve) => {
            const message = JSON.stringify(['EVENT', event]);
            ws.send(message);
            
            // Listen for OK response
            const handler = (e) => {
              const data = JSON.parse(e.data);
              if (data[0] === 'OK' && data[1] === event.id) {
                ws.removeEventListener('message', handler);
                resolve(true);
              }
            };
            ws.addEventListener('message', handler);
            
            // Timeout after 5 seconds
            setTimeout(() => {
              ws.removeEventListener('message', handler);
              resolve(false);
            }, 5000);
          })
        );
      }
    }
    
    const results = await Promise.all(publishPromises);
    return results.some(result => result === true);
  }

  subscribe(filter, onEvent, relays = DEFAULT_RELAYS) {
    const subscriptionId = Math.random().toString(36);
    const activeSubscriptions = [];
    
    for (const relay of relays) {
      const ws = this.pools.get(relay);
      if (ws && ws.readyState === WebSocket.OPEN) {
        const subscribeMsg = JSON.stringify(['REQ', subscriptionId, filter]);
        ws.send(subscribeMsg);
        
        const messageHandler = (e) => {
          const data = JSON.parse(e.data);
          if (data[0] === 'EVENT' && data[1] === subscriptionId) {
            onEvent(data[2], relay);
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
        subs.forEach(({ ws, messageHandler, relay }) => {
          const closeMsg = JSON.stringify(['CLOSE', subscriptionId]);
          ws.send(closeMsg);
          ws.removeEventListener('message', messageHandler);
        });
        this.subscriptions.delete(subscriptionId);
      }
    };
  }

  disconnect() {
    this.pools.forEach((ws) => {
      ws.close();
    });
    this.pools.clear();
    this.subscriptions.clear();
  }
}

export const relayManager = new RelayManager();