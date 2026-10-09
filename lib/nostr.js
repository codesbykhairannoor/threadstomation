import WebSocket from 'ws';
globalThis.WebSocket = WebSocket;
import { Relay, finalizeEvent, getPublicKey, nip19 } from 'nostr-tools';

export const DEFAULT_RELAYS = [
  'wss://relay.damus.io',
  'wss://nos.lol',
  'wss://relay.primal.net',
  'wss://purplerelay.com',
  'wss://relay.snort.social',
  'wss://nostr.mom'
];

/**
 * Parses a private key in nsec1 bech32 format or 64-char hex format.
 * Returns Uint8Array(32).
 */
export function parsePrivateKey(keyString) {
  if (!keyString || typeof keyString !== 'string') {
    throw new Error('Nostr private key (nsec) is missing.');
  }
  const clean = keyString.trim();
  if (clean.startsWith('nsec1')) {
    const decoded = nip19.decode(clean);
    if (decoded.type !== 'nsec') {
      throw new Error(`Expected nsec key but got ${decoded.type}`);
    }
    return decoded.data;
  }
  if (/^[0-9a-fA-F]{64}$/.test(clean)) {
    return new Uint8Array(clean.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
  }
  throw new Error('Invalid private key format. Must start with "nsec1" or be a 64-character hex string.');
}

/**
 * Derives public key hex and npub from private key.
 */
export function deriveKeys(keyString) {
  const sk = parsePrivateKey(keyString);
  const pubkeyHex = getPublicKey(sk);
  const npub = nip19.npubEncode(pubkeyHex);
  return { sk, pubkeyHex, npub };
}

/**
 * Publishes a note (Kind 1) to Nostr relays.
 * @param {string} nsecString - The private key (nsec1... or 64-char hex)
 * @param {string} content - The text content of the note
 * @param {Array} tags - Optional NIP-01 tags (e.g. [['t', 'privacy'], ['r', 'https://...']])
 * @param {Array} relayUrls - List of relay URLs
 */
export async function publishNostrNote(nsecString, content, tags = [], relayUrls = DEFAULT_RELAYS) {
  const { sk, pubkeyHex } = deriveKeys(nsecString);

  const eventTemplate = {
    kind: 1,
    created_at: Math.floor(Date.now() / 1000),
    tags: Array.isArray(tags) ? tags : [],
    content: String(content).trim(),
  };

  const signedEvent = finalizeEvent(eventTemplate, sk);
  console.log(`[Nostr] Finalized note ${signedEvent.id} for pubkey ${pubkeyHex.substring(0, 8)}...`);

  const successfulRelays = [];
  const errors = [];

  // Broadcast to all relays concurrently with per-relay timeout
  await Promise.allSettled(
    relayUrls.map(async (url) => {
      try {
        const relay = await Promise.race([
          Relay.connect(url),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Connect timeout (6s)')), 6000))
        ]);

        await Promise.race([
          relay.publish(signedEvent),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Publish timeout (6s)')), 6000))
        ]);

        successfulRelays.push(url);
        relay.close();
      } catch (err) {
        errors.push({ relay: url, error: err.message });
      }
    })
  );

  console.log(`[Nostr] Broadcast result: ${successfulRelays.length}/${relayUrls.length} relays accepted note.`);

  if (successfulRelays.length === 0) {
    const errorDetails = errors.map(e => `${e.relay}: ${e.error}`).join('; ');
    throw new Error(`Failed to publish to any Nostr relay. Details: ${errorDetails}`);
  }

  return {
    publishId: signedEvent.id,
    pubkeyHex,
    successfulRelays,
    event: signedEvent
  };
}
