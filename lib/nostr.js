import WebSocket from 'ws';

class SafeWebSocket extends WebSocket {
  constructor(...args) {
    super(...args);
    this.on('error', (err) => {
      // Prevent Node unhandled error event crash on disconnected/closed relays
      console.warn('[Nostr-WS] Handled relay/bunker websocket error:', err.message);
    });
  }
}

globalThis.WebSocket = SafeWebSocket;
import { Relay, finalizeEvent, getPublicKey, nip19, generateSecretKey, SimplePool } from 'nostr-tools';
import { BunkerSigner, parseBunkerInput } from 'nostr-tools/nip46';

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
    throw new Error('Nostr credential is missing.');
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
  throw new Error('Invalid private key format. Must start with "nsec1", "bunker://", or be a 64-character hex string.');
}

/**
 * Derives public key hex and npub from private key or bunker.
 */
export async function deriveKeys(credential) {
  if (!credential) throw new Error('Missing credential');
  const clean = credential.trim();
  if (clean.startsWith('bunker://')) {
    const clientSk = generateSecretKey();
    const pool = new SimplePool();
    const bp = await parseBunkerInput(clean);
    const signer = BunkerSigner.fromBunker(clientSk, bp, { pool });
    await signer.connect({ name: 'Threadstomation' });
    const pubkeyHex = await signer.getPublicKey();
    pool.close(bp.relays);
    const npub = nip19.npubEncode(pubkeyHex);
    return { pubkeyHex, npub, isBunker: true };
  }

  const sk = parsePrivateKey(clean);
  const pubkeyHex = getPublicKey(sk);
  const npub = nip19.npubEncode(pubkeyHex);
  return { sk, pubkeyHex, npub, isBunker: false };
}

/**
 * Publishes a note (Kind 1) to Nostr relays using either raw nsec or NIP-46 Bunker.
 * @param {string} credential - nsec1... or bunker://...
 * @param {string} content - The text content of the note
 * @param {Array} tags - Optional NIP-01 tags (e.g. [['t', 'privacy'], ['r', 'https://...']])
 * @param {Array} relayUrls - List of relay URLs
 */
export async function publishNostrNote(credential, content, tags = [], relayUrls = DEFAULT_RELAYS) {
  if (!credential || !credential.trim()) {
    throw new Error('Nostr signing credential (nsec or bunker:// URI) is missing.');
  }

  const cleanCred = credential.trim();
  let signedEvent;
  let pubkeyHex;

  const eventTemplate = {
    kind: 1,
    created_at: Math.floor(Date.now() / 1000),
    tags: Array.isArray(tags) ? tags : [],
    content: String(content).trim(),
  };

  if (cleanCred.startsWith('bunker://')) {
    console.log('[Nostr] ⚡ Signing note via NIP-46 Remote Bunker Signer...');
    const clientSk = generateSecretKey();
    const pool = new SimplePool();
    const bp = await parseBunkerInput(cleanCred);
    const signer = BunkerSigner.fromBunker(clientSk, bp, { pool });
    
    // Connect with 6s timeout
    await Promise.race([
      signer.connect({ name: 'Threadstomation', url: 'https://threadstomation.vercel.app' }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Bunker connection timeout (6s)')), 6000))
    ]);

    pubkeyHex = await signer.getPublicKey();
    console.log(`[Nostr] Bunker authorized for pubkey: ${pubkeyHex.substring(0, 8)}...`);

    signedEvent = await Promise.race([
      signer.signEvent(eventTemplate),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Bunker signing timeout (8s)')), 8000))
    ]);

    pool.close(bp.relays);
  } else {
    const keys = await deriveKeys(cleanCred);
    pubkeyHex = keys.pubkeyHex;
    signedEvent = finalizeEvent(eventTemplate, keys.sk);
  }

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
