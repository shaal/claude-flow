# MeshWave TDD Test Specification

## Test-Driven Development Strategy

All MeshWave components follow strict TDD methodology:

1. **Red**: Write failing test that defines expected behavior
2. **Green**: Write minimal implementation to pass test
3. **Refactor**: Improve code quality while maintaining green tests

---

## Test Suite Organization

```
meshwave/
├── __tests__/
│   ├── unit/
│   │   ├── core/
│   │   │   ├── encryption.test.ts
│   │   │   ├── message-format.test.ts
│   │   │   └── identity.test.ts
│   │   ├── protocols/
│   │   │   ├── ble-mesh.test.ts
│   │   │   ├── wifi-direct.test.ts
│   │   │   ├── ultrasonic.test.ts
│   │   │   ├── nfc.test.ts
│   │   │   └── vlc.test.ts
│   │   ├── routing/
│   │   │   ├── routing-table.test.ts
│   │   │   ├── path-finder.test.ts
│   │   │   ├── byzantine-detector.test.ts
│   │   │   └── hop-optimizer.test.ts
│   │   ├── sync/
│   │   │   ├── crdt-message.test.ts
│   │   │   ├── vector-clock.test.ts
│   │   │   └── conflict-resolver.test.ts
│   │   └── channel/
│   │       ├── channel-selector.test.ts
│   │       ├── failover.test.ts
│   │       └── load-balancer.test.ts
│   ├── integration/
│   │   ├── multi-hop-delivery.test.ts
│   │   ├── mesh-formation.test.ts
│   │   ├── protocol-switching.test.ts
│   │   ├── partition-healing.test.ts
│   │   └── emergency-broadcast.test.ts
│   ├── e2e/
│   │   ├── two-device-chat.test.ts
│   │   ├── group-messaging.test.ts
│   │   ├── offline-sync.test.ts
│   │   ├── stress-test.test.ts
│   │   └── attack-scenarios.test.ts
│   └── performance/
│       ├── latency.bench.ts
│       ├── throughput.bench.ts
│       ├── battery.bench.ts
│       └── memory.bench.ts
└── __mocks__/
    ├── ble-module.ts
    ├── wifi-direct-module.ts
    ├── audio-module.ts
    └── native-bridge.ts
```

---

## Unit Tests

### 1. Encryption Module Tests

```typescript
// __tests__/unit/core/encryption.test.ts

import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  generateKeyPair,
  deriveSharedSecret,
  encrypt,
  decrypt,
  DoubleRatchet,
  OnionRouter
} from '../../../src/core/encryption';

describe('X25519 Key Exchange', () => {
  describe('generateKeyPair', () => {
    it('should generate a valid key pair with 32-byte keys', () => {
      const keyPair = generateKeyPair();

      expect(keyPair.publicKey).toHaveLength(32);
      expect(keyPair.privateKey).toHaveLength(32);
    });

    it('should generate unique key pairs on each call', () => {
      const pair1 = generateKeyPair();
      const pair2 = generateKeyPair();

      expect(pair1.publicKey).not.toEqual(pair2.publicKey);
      expect(pair1.privateKey).not.toEqual(pair2.privateKey);
    });

    it('should produce deterministic keys from seed', () => {
      const seed = Buffer.alloc(32, 0x42);

      const pair1 = generateKeyPair(seed);
      const pair2 = generateKeyPair(seed);

      expect(pair1.publicKey).toEqual(pair2.publicKey);
    });
  });

  describe('deriveSharedSecret', () => {
    it('should derive identical secrets for both parties', () => {
      const alice = generateKeyPair();
      const bob = generateKeyPair();

      const aliceSecret = deriveSharedSecret(alice.privateKey, bob.publicKey);
      const bobSecret = deriveSharedSecret(bob.privateKey, alice.publicKey);

      expect(aliceSecret).toEqual(bobSecret);
    });

    it('should derive 32-byte shared secret', () => {
      const alice = generateKeyPair();
      const bob = generateKeyPair();

      const secret = deriveSharedSecret(alice.privateKey, bob.publicKey);

      expect(secret).toHaveLength(32);
    });
  });
});

describe('ChaCha20-Poly1305 Encryption', () => {
  const testKey = Buffer.alloc(32, 0xAB);
  const testNonce = Buffer.alloc(24, 0xCD);

  describe('encrypt', () => {
    it('should encrypt plaintext to ciphertext with auth tag', () => {
      const plaintext = Buffer.from('Hello, MeshWave!');

      const ciphertext = encrypt(plaintext, testKey, testNonce);

      expect(ciphertext).not.toEqual(plaintext);
      expect(ciphertext.length).toBe(plaintext.length + 16); // +16 for auth tag
    });

    it('should produce different ciphertext with different nonces', () => {
      const plaintext = Buffer.from('Same message');
      const nonce1 = Buffer.alloc(24, 0x01);
      const nonce2 = Buffer.alloc(24, 0x02);

      const cipher1 = encrypt(plaintext, testKey, nonce1);
      const cipher2 = encrypt(plaintext, testKey, nonce2);

      expect(cipher1).not.toEqual(cipher2);
    });
  });

  describe('decrypt', () => {
    it('should decrypt ciphertext back to original plaintext', () => {
      const plaintext = Buffer.from('Decryption test');
      const ciphertext = encrypt(plaintext, testKey, testNonce);

      const decrypted = decrypt(ciphertext, testKey, testNonce);

      expect(decrypted).toEqual(plaintext);
    });

    it('should throw on tampered ciphertext', () => {
      const plaintext = Buffer.from('Tamper test');
      const ciphertext = encrypt(plaintext, testKey, testNonce);

      // Tamper with ciphertext
      ciphertext[5] ^= 0xFF;

      expect(() => decrypt(ciphertext, testKey, testNonce))
        .toThrow('Authentication failed');
    });

    it('should throw on wrong key', () => {
      const plaintext = Buffer.from('Wrong key test');
      const ciphertext = encrypt(plaintext, testKey, testNonce);
      const wrongKey = Buffer.alloc(32, 0xFF);

      expect(() => decrypt(ciphertext, wrongKey, testNonce))
        .toThrow('Authentication failed');
    });
  });
});

describe('Double Ratchet Protocol', () => {
  let aliceRatchet: DoubleRatchet;
  let bobRatchet: DoubleRatchet;

  beforeEach(async () => {
    const aliceIdentity = generateKeyPair();
    const bobIdentity = generateKeyPair();

    // Alice initiates, Bob responds
    aliceRatchet = await DoubleRatchet.initiate(aliceIdentity, bobIdentity.publicKey);
    bobRatchet = await DoubleRatchet.respond(bobIdentity, aliceIdentity.publicKey);
  });

  it('should enable bidirectional encrypted communication', async () => {
    const message1 = 'Hello Bob!';
    const encrypted1 = await aliceRatchet.encrypt(Buffer.from(message1));
    const decrypted1 = await bobRatchet.decrypt(encrypted1);

    expect(decrypted1.toString()).toBe(message1);

    const message2 = 'Hello Alice!';
    const encrypted2 = await bobRatchet.encrypt(Buffer.from(message2));
    const decrypted2 = await aliceRatchet.decrypt(encrypted2);

    expect(decrypted2.toString()).toBe(message2);
  });

  it('should provide forward secrecy (past messages secure if key compromised)', async () => {
    // Send several messages
    const messages = ['Message 1', 'Message 2', 'Message 3'];
    const encryptedMessages = [];

    for (const msg of messages) {
      encryptedMessages.push(await aliceRatchet.encrypt(Buffer.from(msg)));
    }

    // Simulate key compromise by extracting current state
    const compromisedState = aliceRatchet.exportState();

    // Old messages should NOT be decryptable with current state
    // (chain keys have ratcheted forward)
    const attacker = DoubleRatchet.fromState(compromisedState);

    expect(() => attacker.decryptWithCurrentKey(encryptedMessages[0]))
      .toThrow('Cannot decrypt past messages');
  });

  it('should handle out-of-order message delivery', async () => {
    const msg1 = await aliceRatchet.encrypt(Buffer.from('First'));
    const msg2 = await aliceRatchet.encrypt(Buffer.from('Second'));
    const msg3 = await aliceRatchet.encrypt(Buffer.from('Third'));

    // Deliver out of order: 3, 1, 2
    const dec3 = await bobRatchet.decrypt(msg3);
    const dec1 = await bobRatchet.decrypt(msg1);
    const dec2 = await bobRatchet.decrypt(msg2);

    expect(dec1.toString()).toBe('First');
    expect(dec2.toString()).toBe('Second');
    expect(dec3.toString()).toBe('Third');
  });
});

describe('Onion Routing', () => {
  it('should create layered encryption for multi-hop paths', async () => {
    const nodes = [generateKeyPair(), generateKeyPair(), generateKeyPair()];
    const publicKeys = nodes.map(n => n.publicKey);
    const payload = Buffer.from('Secret message');

    const onion = await OnionRouter.wrap(payload, publicKeys);

    // Each layer should increase size
    expect(onion.length).toBeGreaterThan(payload.length + 32 * 3);
  });

  it('should allow each node to peel one layer', async () => {
    const node1 = generateKeyPair();
    const node2 = generateKeyPair();
    const node3 = generateKeyPair();
    const payload = Buffer.from('Final destination');

    const onion = await OnionRouter.wrap(payload, [
      node1.publicKey,
      node2.publicKey,
      node3.publicKey
    ]);

    // Node 1 peels
    const { nextLayer: layer2, nextHop: hop1 } =
      await OnionRouter.peel(onion, node1.privateKey);
    expect(hop1).toEqual(node2.publicKey);

    // Node 2 peels
    const { nextLayer: layer3, nextHop: hop2 } =
      await OnionRouter.peel(layer2, node2.privateKey);
    expect(hop2).toEqual(node3.publicKey);

    // Node 3 peels (final)
    const { payload: revealed, nextHop: hop3 } =
      await OnionRouter.peel(layer3, node3.privateKey);
    expect(hop3).toBeNull(); // No more hops
    expect(revealed).toEqual(payload);
  });

  it('should prevent intermediate nodes from seeing final payload', async () => {
    const node1 = generateKeyPair();
    const node2 = generateKeyPair();
    const payload = Buffer.from('Cannot see this');

    const onion = await OnionRouter.wrap(payload, [
      node1.publicKey,
      node2.publicKey
    ]);

    // Node 1 tries to read payload directly
    const { nextLayer } = await OnionRouter.peel(onion, node1.privateKey);

    // nextLayer is still encrypted for node2
    expect(nextLayer.toString()).not.toContain('Cannot see this');
  });
});
```

### 2. Ultrasonic Protocol Tests

```typescript
// __tests__/unit/protocols/ultrasonic.test.ts

import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  UltrasonicEncoder,
  UltrasonicDecoder,
  FrequencyAnalyzer,
  NoiseFilter,
  ULTRASONIC_CONFIG
} from '../../../src/protocols/ultrasonic';

describe('UltrasonicEncoder', () => {
  let encoder: UltrasonicEncoder;

  beforeEach(() => {
    encoder = new UltrasonicEncoder(ULTRASONIC_CONFIG);
  });

  describe('encode', () => {
    it('should encode data to audio samples', () => {
      const data = Buffer.from('Hi');
      const samples = encoder.encode(data);

      expect(samples).toBeInstanceOf(Float32Array);
      expect(samples.length).toBeGreaterThan(0);
    });

    it('should produce frequencies in 18-22kHz range', () => {
      const data = Buffer.from('Test');
      const samples = encoder.encode(data);

      const analyzer = new FrequencyAnalyzer(ULTRASONIC_CONFIG.sampleRate);
      const frequencies = analyzer.analyze(samples);

      expect(frequencies.min).toBeGreaterThanOrEqual(18000);
      expect(frequencies.max).toBeLessThanOrEqual(22000);
    });

    it('should include synchronization preamble', () => {
      const data = Buffer.from('X');
      const samples = encoder.encode(data);

      const analyzer = new FrequencyAnalyzer(ULTRASONIC_CONFIG.sampleRate);
      const preamble = analyzer.extractPreamble(samples);

      expect(preamble).toEqual([18500, 19500, 18500, 19500]);
    });

    it('should append CRC16 checksum', () => {
      const data = Buffer.from('Checksum');
      const samples = encoder.encode(data);

      // Last 2 symbols should be checksum (4 frequencies for 2 bytes)
      const analyzer = new FrequencyAnalyzer(ULTRASONIC_CONFIG.sampleRate);
      const checksumSymbols = analyzer.extractTail(samples, 4);

      expect(checksumSymbols).toHaveLength(4);
    });

    it('should use FSK with 16 frequency levels', () => {
      // Encode all possible nibble values
      const allNibbles = Buffer.from([0x01, 0x23, 0x45, 0x67, 0x89, 0xAB, 0xCD, 0xEF]);
      const samples = encoder.encode(allNibbles);

      const analyzer = new FrequencyAnalyzer(ULTRASONIC_CONFIG.sampleRate);
      const uniqueFreqs = analyzer.getUniqueFrequencies(samples);

      // Should see 16 distinct frequencies (0x0 through 0xF)
      expect(uniqueFreqs.size).toBe(16);
    });

    it('should respect symbol duration of 50ms', () => {
      const data = Buffer.from('AB'); // 4 nibbles = 4 symbols

      const samples = encoder.encode(data);
      const expectedDuration = (4 + 4 + 4) * 0.05; // 4 preamble + 4 data + 4 checksum
      const actualDuration = samples.length / ULTRASONIC_CONFIG.sampleRate;

      expect(actualDuration).toBeCloseTo(expectedDuration, 2);
    });
  });
});

describe('UltrasonicDecoder', () => {
  let encoder: UltrasonicEncoder;
  let decoder: UltrasonicDecoder;

  beforeEach(() => {
    encoder = new UltrasonicEncoder(ULTRASONIC_CONFIG);
    decoder = new UltrasonicDecoder(ULTRASONIC_CONFIG);
  });

  describe('decode', () => {
    it('should decode encoded signal back to original data', () => {
      const original = Buffer.from('Hello MeshWave');
      const signal = encoder.encode(original);

      const decoded = decoder.decode(signal);

      expect(decoded.data).toEqual(original);
      expect(decoded.checksumValid).toBe(true);
    });

    it('should throw on signal without preamble', () => {
      const noise = new Float32Array(44100).map(() => Math.random() * 2 - 1);

      expect(() => decoder.decode(noise))
        .toThrow('No preamble detected');
    });

    it('should throw on corrupted checksum', () => {
      const data = Buffer.from('Corrupt me');
      const signal = encoder.encode(data);

      // Corrupt a symbol in the middle
      const corruptionStart = Math.floor(signal.length * 0.5);
      for (let i = 0; i < 100; i++) {
        signal[corruptionStart + i] = 0;
      }

      expect(() => decoder.decode(signal))
        .toThrow('Checksum verification failed');
    });

    it('should decode under 40dB ambient noise', () => {
      const original = Buffer.from('Noisy test');
      const signal = encoder.encode(original);

      const noisy = addWhiteNoise(signal, 40); // 40dB SNR

      const decoded = decoder.decode(noisy);

      expect(decoded.data).toEqual(original);
    });

    it('should decode under 50dB ambient noise', () => {
      const original = Buffer.from('Very noisy');
      const signal = encoder.encode(original);

      const noisy = addWhiteNoise(signal, 50);

      const decoded = decoder.decode(noisy);

      expect(decoded.data).toEqual(original);
    });

    it('should fail gracefully at 70dB noise', () => {
      const original = Buffer.from('Too noisy');
      const signal = encoder.encode(original);

      const extremeNoise = addWhiteNoise(signal, 70);

      expect(() => decoder.decode(extremeNoise))
        .toThrow(/preamble|checksum/i);
    });
  });

  describe('real-time decoding', () => {
    it('should decode streaming audio chunks', async () => {
      const original = Buffer.from('Streaming');
      const signal = encoder.encode(original);

      // Split into 1024-sample chunks (simulating real-time)
      const chunks: Float32Array[] = [];
      for (let i = 0; i < signal.length; i += 1024) {
        chunks.push(signal.slice(i, i + 1024));
      }

      const streamDecoder = decoder.createStream();
      let result: Buffer | null = null;

      for (const chunk of chunks) {
        const decoded = streamDecoder.process(chunk);
        if (decoded) {
          result = decoded.data;
          break;
        }
      }

      expect(result).toEqual(original);
    });
  });
});

describe('NoiseFilter', () => {
  it('should apply bandpass filter for 17-23kHz', () => {
    const filter = new NoiseFilter(ULTRASONIC_CONFIG);

    // Create signal with ultrasonic and audible components
    const mixedSignal = generateMixedSignal([
      { freq: 1000, amplitude: 1.0 },   // Audible
      { freq: 19000, amplitude: 0.5 },  // Ultrasonic (keep)
      { freq: 30000, amplitude: 0.8 }   // Too high (remove)
    ], ULTRASONIC_CONFIG.sampleRate);

    const filtered = filter.apply(mixedSignal);
    const analyzer = new FrequencyAnalyzer(ULTRASONIC_CONFIG.sampleRate);

    const freqs = analyzer.analyze(filtered);

    // Should only have 19kHz component
    expect(freqs.dominant).toBeCloseTo(19000, -2);
    expect(freqs.power[1000]).toBeLessThan(0.1);
    expect(freqs.power[30000]).toBeLessThan(0.1);
  });

  it('should apply echo cancellation', () => {
    const filter = new NoiseFilter(ULTRASONIC_CONFIG);

    const original = encoder.encode(Buffer.from('Echo'));
    const withEcho = addEcho(original, 0.3, 100); // 30% echo at 100ms delay

    const cleaned = filter.cancelEcho(withEcho, original);
    const correlation = crossCorrelate(cleaned, original);

    expect(correlation).toBeGreaterThan(0.95);
  });
});

// Helper functions
function addWhiteNoise(signal: Float32Array, snrDb: number): Float32Array {
  const signalPower = signal.reduce((sum, s) => sum + s * s, 0) / signal.length;
  const noisePower = signalPower / Math.pow(10, snrDb / 10);
  const noiseStd = Math.sqrt(noisePower);

  return signal.map(s => s + (Math.random() * 2 - 1) * noiseStd);
}

function generateMixedSignal(
  components: { freq: number; amplitude: number }[],
  sampleRate: number
): Float32Array {
  const duration = 0.1; // 100ms
  const samples = new Float32Array(Math.floor(sampleRate * duration));

  for (let i = 0; i < samples.length; i++) {
    const t = i / sampleRate;
    for (const { freq, amplitude } of components) {
      samples[i] += amplitude * Math.sin(2 * Math.PI * freq * t);
    }
  }

  return samples;
}

function addEcho(signal: Float32Array, echoLevel: number, delayMs: number): Float32Array {
  const delaySamples = Math.floor(ULTRASONIC_CONFIG.sampleRate * delayMs / 1000);
  const result = new Float32Array(signal.length);

  for (let i = 0; i < signal.length; i++) {
    result[i] = signal[i];
    if (i >= delaySamples) {
      result[i] += signal[i - delaySamples] * echoLevel;
    }
  }

  return result;
}

function crossCorrelate(a: Float32Array, b: Float32Array): number {
  let sum = 0;
  let sumA2 = 0;
  let sumB2 = 0;

  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    sum += a[i] * b[i];
    sumA2 += a[i] * a[i];
    sumB2 += b[i] * b[i];
  }

  return sum / Math.sqrt(sumA2 * sumB2);
}
```

### 3. Byzantine Routing Tests

```typescript
// __tests__/unit/routing/byzantine-detector.test.ts

import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  ByzantineDetector,
  RouteValidator,
  ReputationTracker,
  MaliciousBehavior
} from '../../../src/routing/byzantine';

describe('ByzantineDetector', () => {
  let detector: ByzantineDetector;

  beforeEach(() => {
    detector = new ByzantineDetector({
      faultyTolerance: 2,        // Tolerate up to 2 faulty nodes
      suspicionThreshold: 0.3,   // 30% failure rate triggers suspicion
      maliciousThreshold: 5,     // 5 suspicion points = malicious
      historyWindow: 100         // Analyze last 100 messages
    });
  });

  describe('detectMessageDropping', () => {
    it('should flag node dropping >70% of messages', async () => {
      const nodeId = 'node-suspicious';

      // Simulate 100 messages, 75 dropped
      for (let i = 0; i < 100; i++) {
        const delivered = i < 25;
        await detector.recordDelivery(nodeId, delivered);
      }

      const status = await detector.evaluateNode(nodeId);

      expect(status.suspicious).toBe(true);
      expect(status.deliveryRate).toBeLessThan(0.3);
    });

    it('should not flag healthy nodes', async () => {
      const nodeId = 'node-healthy';

      // Simulate 100 messages, 95 delivered
      for (let i = 0; i < 100; i++) {
        const delivered = i < 95;
        await detector.recordDelivery(nodeId, delivered);
      }

      const status = await detector.evaluateNode(nodeId);

      expect(status.suspicious).toBe(false);
      expect(status.deliveryRate).toBeGreaterThan(0.9);
    });

    it('should escalate to malicious after repeated offenses', async () => {
      const nodeId = 'node-malicious';

      // Generate 5 suspicion events
      for (let round = 0; round < 5; round++) {
        for (let i = 0; i < 20; i++) {
          await detector.recordDelivery(nodeId, false); // All dropped
        }
        await detector.runAnalysis();
      }

      const status = await detector.evaluateNode(nodeId);

      expect(status.malicious).toBe(true);
    });
  });

  describe('detectDelayAttack', () => {
    it('should detect artificial message delays', async () => {
      const nodeId = 'node-delayer';

      // Normal latency is 50ms, attacker adds 2000ms
      for (let i = 0; i < 50; i++) {
        await detector.recordLatency(nodeId, 50 + Math.random() * 10);
      }

      for (let i = 0; i < 50; i++) {
        await detector.recordLatency(nodeId, 2050 + Math.random() * 100);
      }

      const status = await detector.evaluateNode(nodeId);

      expect(status.behaviors).toContain(MaliciousBehavior.DELAY_ATTACK);
    });
  });

  describe('detectModificationAttempt', () => {
    it('should detect message content modification', async () => {
      const nodeId = 'node-modifier';

      const originalHash = 'abc123';
      const modifiedHash = 'xyz789';

      await detector.recordIntegrityCheck(nodeId, originalHash, modifiedHash);

      const status = await detector.evaluateNode(nodeId);

      expect(status.malicious).toBe(true);
      expect(status.behaviors).toContain(MaliciousBehavior.CONTENT_MODIFICATION);
    });
  });
});

describe('RouteValidator', () => {
  let validator: RouteValidator;

  beforeEach(() => {
    validator = new RouteValidator({
      faultyTolerance: 2,
      maxRouteAge: 60000 // 1 minute
    });
  });

  describe('validateRouteProposal', () => {
    it('should accept route with 2f+1 valid signatures', async () => {
      const route = createSignedRoute(['A', 'B', 'C', 'D', 'E'], 5); // 5 sigs for f=2

      const result = await validator.validate(route);

      expect(result.valid).toBe(true);
    });

    it('should reject route with insufficient signatures', async () => {
      const route = createSignedRoute(['A', 'B', 'C'], 2); // Only 2 sigs

      const result = await validator.validate(route);

      expect(result.valid).toBe(false);
      expect(result.reason).toContain('Insufficient signatures');
    });

    it('should reject route with invalid signature', async () => {
      const route = createSignedRoute(['A', 'B', 'C', 'D', 'E'], 5);
      route.signatures[2] = 'invalid-signature';

      const result = await validator.validate(route);

      expect(result.valid).toBe(false);
      expect(result.reason).toContain('Invalid signature');
    });

    it('should reject route with loop', async () => {
      const route = createSignedRoute(['A', 'B', 'C', 'B', 'D'], 5); // B appears twice

      const result = await validator.validate(route);

      expect(result.valid).toBe(false);
      expect(result.reason).toContain('Routing loop');
    });

    it('should reject stale routes', async () => {
      const route = createSignedRoute(['A', 'B', 'C', 'D', 'E'], 5);
      route.timestamp = Date.now() - 120000; // 2 minutes ago

      const result = await validator.validate(route);

      expect(result.valid).toBe(false);
      expect(result.reason).toContain('Stale route');
    });
  });
});

describe('ReputationTracker', () => {
  let tracker: ReputationTracker;

  beforeEach(() => {
    tracker = new ReputationTracker();
  });

  it('should start new nodes at neutral reputation', () => {
    const rep = tracker.getReputation('new-node');

    expect(rep.score).toBe(0.5); // Neutral
    expect(rep.confidence).toBe(0); // No data
  });

  it('should increase reputation for successful deliveries', async () => {
    const nodeId = 'good-node';

    for (let i = 0; i < 100; i++) {
      await tracker.recordSuccess(nodeId);
    }

    const rep = tracker.getReputation(nodeId);

    expect(rep.score).toBeGreaterThan(0.8);
    expect(rep.confidence).toBeGreaterThan(0.9);
  });

  it('should decrease reputation for failures', async () => {
    const nodeId = 'failing-node';

    for (let i = 0; i < 100; i++) {
      await tracker.recordFailure(nodeId);
    }

    const rep = tracker.getReputation(nodeId);

    expect(rep.score).toBeLessThan(0.2);
  });

  it('should decay old data over time', async () => {
    const nodeId = 'old-node';

    // Good behavior long ago
    await tracker.recordSuccess(nodeId, Date.now() - 86400000); // 1 day ago

    // Recent bad behavior
    await tracker.recordFailure(nodeId);

    const rep = tracker.getReputation(nodeId);

    // Recent failure should weigh more than old success
    expect(rep.score).toBeLessThan(0.5);
  });
});

// Helper function
function createSignedRoute(
  path: string[],
  signatureCount: number
): { path: string[]; signatures: string[]; timestamp: number } {
  return {
    path,
    signatures: Array(signatureCount).fill(null).map((_, i) =>
      `valid-sig-${path[i % path.length]}`
    ),
    timestamp: Date.now()
  };
}
```

---

## Integration Tests

```typescript
// __tests__/integration/multi-hop-delivery.test.ts

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { SimulatedMeshNetwork, SimulatedNode } from '../helpers/network-simulator';
import { Message, MessagePriority } from '../../src/core/message';

describe('Multi-Hop Message Delivery', () => {
  let network: SimulatedMeshNetwork;

  beforeEach(async () => {
    network = new SimulatedMeshNetwork({
      simulatedLatency: { min: 10, max: 50 },
      packetLoss: 0.01
    });

    // Create 7-node linear topology
    // A -- B -- C -- D -- E -- F -- G
    for (const id of ['A', 'B', 'C', 'D', 'E', 'F', 'G']) {
      await network.addNode(id);
    }

    await network.connect('A', 'B');
    await network.connect('B', 'C');
    await network.connect('C', 'D');
    await network.connect('D', 'E');
    await network.connect('E', 'F');
    await network.connect('F', 'G');
  });

  afterEach(async () => {
    await network.shutdown();
  });

  it('should deliver message across maximum 7 hops', async () => {
    const message = Message.create({
      from: 'A',
      to: 'G',
      content: Buffer.from('7-hop test'),
      priority: MessagePriority.NORMAL
    });

    const result = await network.send(message, { timeout: 10000 });

    expect(result.delivered).toBe(true);
    expect(result.hops).toBe(6); // A->B->C->D->E->F->G = 6 hops
    expect(result.latency).toBeLessThan(5000);
  });

  it('should reject messages requiring >7 hops', async () => {
    // Add 8th node
    await network.addNode('H');
    await network.connect('G', 'H');

    const message = Message.create({
      from: 'A',
      to: 'H',
      ttl: 7 // Max TTL
    });

    const result = await network.send(message, { timeout: 5000 });

    expect(result.delivered).toBe(false);
    expect(result.reason).toContain('TTL exceeded');
  });

  it('should maintain E2EE through all relay nodes', async () => {
    const secret = 'Confidential information';
    const message = Message.create({
      from: 'A',
      to: 'G',
      content: Buffer.from(secret)
    });

    const deliveryLog = await network.sendWithInterception(message);

    // Intermediate nodes should NOT see plaintext
    for (const nodeId of ['B', 'C', 'D', 'E', 'F']) {
      const intercepted = deliveryLog.get(nodeId);
      expect(intercepted.payload.toString()).not.toContain(secret);
    }

    // Recipient should see plaintext
    expect(deliveryLog.get('G').decrypted.toString()).toBe(secret);
  });

  it('should reroute around failed intermediate node', async () => {
    // Add alternate path: A -- B -- X -- F -- G
    await network.addNode('X');
    await network.connect('B', 'X');
    await network.connect('X', 'F');

    // Fail node D
    await network.failNode('D');

    const message = Message.create({
      from: 'A',
      to: 'G',
      content: Buffer.from('Reroute test')
    });

    const result = await network.send(message);

    expect(result.delivered).toBe(true);
    expect(result.path).not.toContain('D');
    expect(result.path).toContain('X');
  });

  it('should handle concurrent messages without collision', async () => {
    const messageCount = 100;
    const messages = Array(messageCount).fill(null).map((_, i) =>
      Message.create({
        from: 'A',
        to: 'G',
        content: Buffer.from(`Message ${i}`)
      })
    );

    const results = await Promise.all(
      messages.map(m => network.send(m))
    );

    const delivered = results.filter(r => r.delivered).length;
    expect(delivered / messageCount).toBeGreaterThan(0.98);
  });

  it('should prioritize emergency broadcasts', async () => {
    // Queue 10 normal messages
    const normalMessages = Array(10).fill(null).map((_, i) =>
      Message.create({
        from: 'A',
        to: 'G',
        content: Buffer.from(`Normal ${i}`),
        priority: MessagePriority.NORMAL
      })
    );

    // Add network congestion
    network.setThroughputLimit(1); // 1 message per second

    // Start sending normal messages
    const normalPromises = normalMessages.map(m => network.send(m));

    // Send emergency after 100ms
    await delay(100);
    const emergency = Message.create({
      from: 'A',
      to: 'G',
      content: Buffer.from('EMERGENCY'),
      priority: MessagePriority.EMERGENCY
    });
    const emergencyResult = await network.send(emergency);

    // Emergency should arrive before normal messages complete
    expect(emergencyResult.delivered).toBe(true);
    expect(emergencyResult.latency).toBeLessThan(1000);
  });
});

// __tests__/integration/protocol-switching.test.ts

describe('Protocol Auto-Switching', () => {
  let orchestrator: ChannelOrchestrator;

  beforeEach(() => {
    orchestrator = new ChannelOrchestrator({
      protocols: ['ble', 'wifi-direct', 'ultrasonic'],
      selectionStrategy: 'optimal'
    });
  });

  it('should select BLE for small messages', async () => {
    const smallMessage = Buffer.from('Hi');

    const channel = await orchestrator.selectChannel(smallMessage);

    expect(channel.protocol).toBe('ble');
    expect(channel.reason).toContain('low overhead');
  });

  it('should select WiFi Direct for large files', async () => {
    const largeFile = Buffer.alloc(500 * 1024); // 500KB

    const channel = await orchestrator.selectChannel(largeFile);

    expect(channel.protocol).toBe('wifi-direct');
    expect(channel.reason).toContain('high bandwidth');
  });

  it('should select ultrasonic for covert messages', async () => {
    const covertMessage = Buffer.from('Secret');

    const channel = await orchestrator.selectChannel(covertMessage, {
      covert: true
    });

    expect(channel.protocol).toBe('ultrasonic');
  });

  it('should failover when primary protocol unavailable', async () => {
    // Disable WiFi Direct
    orchestrator.disableProtocol('wifi-direct');

    const largeFile = Buffer.alloc(100 * 1024);

    const channel = await orchestrator.selectChannel(largeFile);

    // Should fall back to BLE with chunking
    expect(channel.protocol).toBe('ble');
    expect(channel.chunking).toBe(true);
  });

  it('should automatically switch on transmission failure', async () => {
    const message = Buffer.from('Failover test');

    // First attempt on BLE fails
    orchestrator.simulateFailure('ble');

    const result = await orchestrator.transmit(message, 'peer-123');

    expect(result.success).toBe(true);
    expect(result.protocol).not.toBe('ble');
    expect(result.failoverOccurred).toBe(true);
  });
});

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
```

---

## E2E Tests

```typescript
// __tests__/e2e/attack-scenarios.test.ts

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { TestDevice, TestNetwork } from '../helpers/e2e-framework';

describe('Security: Attack Resistance', () => {
  let network: TestNetwork;
  let alice: TestDevice;
  let bob: TestDevice;
  let attacker: TestDevice;

  beforeAll(async () => {
    network = await TestNetwork.create();
    alice = await network.addDevice('alice');
    bob = await network.addDevice('bob');
    attacker = await network.addDevice('attacker', { malicious: true });

    // Alice and Bob exchange keys
    await alice.pairWith(bob);
  });

  afterAll(async () => {
    await network.teardown();
  });

  describe('Replay Attacks', () => {
    it('should reject replayed messages', async () => {
      // Alice sends legitimate message
      const original = await alice.send(bob.id, 'Hello Bob');

      // Attacker captures and replays 5 minutes later
      await attacker.capture(original.rawPacket);
      await delay(5 * 60 * 1000);

      const replay = await attacker.replay(original.rawPacket);

      expect(replay.accepted).toBe(false);
      expect(replay.reason).toBe('Timestamp expired');
    });

    it('should reject duplicate message IDs', async () => {
      const msg = await alice.send(bob.id, 'Unique message');

      // Attacker immediately replays
      const replay = await attacker.replay(msg.rawPacket);

      expect(replay.accepted).toBe(false);
      expect(replay.reason).toBe('Duplicate message ID');
    });
  });

  describe('Man-in-the-Middle', () => {
    it('should detect key substitution attempt', async () => {
      // Attacker tries to intercept key exchange
      const attackerKey = attacker.generateKeyPair();

      // Alice tries to pair with "Bob" (actually attacker)
      attacker.impersonate(bob.id);

      const pairResult = await alice.pairWith(attacker.id);

      // Should fail signature verification
      expect(pairResult.success).toBe(false);
      expect(pairResult.reason).toContain('signature');
    });

    it('should maintain secrecy even if attacker relays', async () => {
      // Attacker positions as relay between Alice and Bob
      await network.forceRoute(alice.id, bob.id, [attacker.id]);

      const secret = 'Confidential data';
      await alice.send(bob.id, secret);

      // Attacker logs everything but should not see plaintext
      expect(attacker.logs.find(l => l.includes(secret))).toBeUndefined();

      // Bob should receive correctly
      const received = bob.getLastMessage();
      expect(received.content).toBe(secret);
    });
  });

  describe('Sybil Attacks', () => {
    it('should resist fake identity flood', async () => {
      // Attacker creates 100 fake identities
      const fakes = await Promise.all(
        Array(100).fill(null).map((_, i) =>
          attacker.createFakeIdentity(`fake-${i}`)
        )
      );

      // Try to dominate routing
      for (const fake of fakes) {
        await network.addNode(fake);
      }

      // Measure routing quality
      const routeQuality = await network.analyzeRoutes();

      // Legitimate nodes should still handle >70% of traffic
      expect(routeQuality.legitimateNodeUsage).toBeGreaterThan(0.7);
    });

    it('should detect coordinated fake nodes', async () => {
      const fakes = await Promise.all(
        Array(20).fill(null).map(() => attacker.createFakeIdentity())
      );

      // Fakes behave identically (suspicious)
      for (const fake of fakes) {
        await fake.sendPattern([1, 2, 3, 4, 5]); // Same timing pattern
      }

      const detection = await network.runAnomalyDetection();

      expect(detection.sybilClusters).toHaveLength(1);
      expect(detection.sybilClusters[0].nodes).toHaveLength(20);
    });
  });

  describe('Traffic Analysis', () => {
    it('should pad messages to uniform size', async () => {
      const short = 'Hi';
      const long = 'This is a much longer message with more content';

      const packet1 = await alice.createPacket(bob.id, short);
      const packet2 = await alice.createPacket(bob.id, long);

      // Packets should be similar size (within 20%)
      const ratio = packet1.length / packet2.length;
      expect(ratio).toBeGreaterThan(0.8);
      expect(ratio).toBeLessThan(1.2);
    });

    it('should randomize timing patterns', async () => {
      // Send 100 messages
      const timings: number[] = [];
      let lastTime = Date.now();

      for (let i = 0; i < 100; i++) {
        await alice.send(bob.id, `Message ${i}`);
        timings.push(Date.now() - lastTime);
        lastTime = Date.now();
      }

      // Timing should not be uniform (indicates randomization)
      const variance = calculateVariance(timings);
      expect(variance).toBeGreaterThan(100); // ms variance
    });
  });

  describe('Denial of Service', () => {
    it('should rate-limit message flood from single node', async () => {
      // Attacker floods network
      const floodPromises = Array(1000).fill(null).map(() =>
        attacker.send(bob.id, 'Flood')
      );

      const results = await Promise.all(floodPromises);
      const accepted = results.filter(r => r.accepted).length;

      // Most should be rate-limited
      expect(accepted).toBeLessThan(100);
    });

    it('should maintain service for legitimate users during attack', async () => {
      // Start flood in background
      attacker.startFlood(bob.id, 100); // 100 msg/sec

      // Alice tries to communicate
      const result = await alice.send(bob.id, 'Legitimate message');

      expect(result.delivered).toBe(true);
      expect(result.latency).toBeLessThan(5000);
    });
  });
});

function calculateVariance(values: number[]): number {
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  return values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
```

---

## Performance Benchmarks

```typescript
// __tests__/performance/latency.bench.ts

import { describe, bench } from 'vitest';
import { UltrasonicEncoder, UltrasonicDecoder } from '../../src/protocols/ultrasonic';
import { DoubleRatchet } from '../../src/core/encryption';

describe('Latency Benchmarks', () => {
  const encoder = new UltrasonicEncoder();
  const decoder = new UltrasonicDecoder();

  bench('ultrasonic encode 32 bytes', () => {
    const data = Buffer.alloc(32, 0x42);
    encoder.encode(data);
  });

  bench('ultrasonic decode 32 bytes', () => {
    const data = Buffer.alloc(32, 0x42);
    const signal = encoder.encode(data);
    decoder.decode(signal);
  });

  bench('double ratchet encrypt', async () => {
    const ratchet = await DoubleRatchet.createTest();
    const plaintext = Buffer.alloc(256, 0x00);
    await ratchet.encrypt(plaintext);
  });

  bench('double ratchet decrypt', async () => {
    const ratchet = await DoubleRatchet.createTest();
    const plaintext = Buffer.alloc(256, 0x00);
    const ciphertext = await ratchet.encrypt(plaintext);
    await ratchet.decrypt(ciphertext);
  });

  bench('route calculation (100 nodes)', () => {
    const router = createTestRouter(100);
    router.findPath('node-0', 'node-99');
  });

  bench('byzantine validation (5 signatures)', () => {
    const validator = new RouteValidator({ faultyTolerance: 2 });
    const route = createSignedRoute(5);
    validator.validate(route);
  });
});
```

---

## Test Coverage Requirements

| Component | Min Coverage | Critical Paths |
|-----------|--------------|----------------|
| Encryption | 95% | Key exchange, E2EE, forward secrecy |
| Routing | 90% | Path finding, Byzantine detection |
| Ultrasonic | 85% | Encode/decode, noise handling |
| BLE Mesh | 80% | Discovery, relay, reconnection |
| WiFi Direct | 80% | Group formation, data transfer |
| CRDT Sync | 90% | Merge, conflict resolution |
| Channel Orchestrator | 85% | Selection, failover |

---

*TDD Specification v1.0 | MeshWave Protocol*
*Generated by Claude Flow V3 SPARC System*
