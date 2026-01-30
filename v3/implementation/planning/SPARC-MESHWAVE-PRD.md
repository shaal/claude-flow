# MeshWave: Off-Network Mobile Communication Protocol

## Product Requirements Document (PRD)
### Using SPARC Methodology with TDD

**Version**: 1.0.0-alpha
**Date**: 2026-01-30
**Status**: Proposed
**Author**: Claude Flow V3 System

---

## Executive Summary

**MeshWave** is a revolutionary peer-to-peer mobile communication protocol that enables devices to communicate without traditional cellular networks or WiFi infrastructure. Using a hybrid approach combining **Bluetooth Low Energy (BLE) Mesh**, **WiFi Direct**, **Ultrasonic Audio Data Transmission**, and **Visual Light Communication (VLC)**, MeshWave creates a resilient, decentralized communication network among devices running the application.

### Key Innovation: Multi-Modal Mesh Architecture

Unlike existing solutions that rely on single protocols, MeshWave dynamically selects and combines communication channels based on:
- Environmental conditions (noise, lighting, obstacles)
- Distance between devices
- Battery levels
- Message priority and size
- Privacy requirements

---

## SPARC Phase 1: Specification

### 1.1 Problem Statement

Current mobile communication requires:
- Cellular network infrastructure (limited in remote areas, disasters, or authoritarian regions)
- WiFi access points (centralized, trackable, vulnerable to outages)
- Internet connectivity (surveillance-capable, censorship-prone)

**Target Users**:
- Emergency responders in disaster zones
- Activists in regions with communication restrictions
- Festival/event attendees in overloaded network areas
- Hikers/adventurers in remote locations
- Privacy-conscious communities
- Mesh network enthusiasts

### 1.2 Functional Requirements

#### FR-001: Multi-Protocol Communication Layer

| ID | Requirement | Priority | Protocol |
|----|-------------|----------|----------|
| FR-001.1 | BLE Mesh networking for device discovery and low-bandwidth messaging | P0 | BLE 5.0+ |
| FR-001.2 | WiFi Direct for high-bandwidth data transfer | P0 | WiFi Direct |
| FR-001.3 | Ultrasonic audio for covert data transmission | P1 | 18-22kHz audio |
| FR-001.4 | Visual Light Communication via camera/flash | P2 | Camera/LED |
| FR-001.5 | NFC tap-to-connect for secure key exchange | P1 | NFC |

#### FR-002: Mesh Topology Management

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-002.1 | Self-organizing mesh with automatic node discovery | P0 |
| FR-002.2 | Dynamic routing with hop optimization (max 7 hops) | P0 |
| FR-002.3 | Store-and-forward for offline message delivery | P0 |
| FR-002.4 | Byzantine fault tolerance for malicious node detection | P1 |
| FR-002.5 | Network partitioning and healing | P1 |

#### FR-003: Message Types & Protocols

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-003.1 | Text messages (max 32KB compressed) | P0 |
| FR-003.2 | Voice notes (compressed opus, max 2 min) | P1 |
| FR-003.3 | Images (compressed, max 500KB) | P1 |
| FR-003.4 | Location sharing (encrypted coordinates) | P1 |
| FR-003.5 | Emergency broadcasts (high-priority flood) | P0 |
| FR-003.6 | Group messaging with CRDT sync | P1 |

#### FR-004: Security & Privacy

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-004.1 | End-to-end encryption (X25519 + ChaCha20-Poly1305) | P0 |
| FR-004.2 | Perfect forward secrecy via Double Ratchet | P0 |
| FR-004.3 | Anonymous routing (onion-like layered encryption) | P1 |
| FR-004.4 | Plausible deniability message destruction | P2 |
| FR-004.5 | Zero-knowledge proof of membership | P2 |

### 1.3 Non-Functional Requirements

| Category | Requirement | Target |
|----------|-------------|--------|
| Latency | Message delivery (single hop) | < 500ms |
| Latency | Message delivery (7 hops) | < 5s |
| Throughput | Text messages per minute | 100+ |
| Range | BLE mesh effective range | 100m per hop |
| Range | WiFi Direct range | 200m line-of-sight |
| Range | Ultrasonic range | 10m indoor |
| Battery | Idle power consumption | < 5% per hour |
| Battery | Active mesh participation | < 15% per hour |
| Storage | Message queue capacity | 10,000 messages |
| Reliability | Message delivery rate | > 99.5% |

### 1.4 Constraints

1. **Platform**: iOS 14+ and Android 10+ (React Native with native modules)
2. **Permissions**: Bluetooth, WiFi, Microphone, Camera, Location (for ranging)
3. **No Internet**: Must function with zero internet connectivity
4. **Battery**: Must include aggressive power management
5. **Legal**: Ultrasonic transmission must stay within legal audio limits

### 1.5 User Stories & Acceptance Criteria

```gherkin
Feature: Off-Network Messaging

  Scenario: Send message to nearby user
    Given two devices running MeshWave within BLE range
    And both users have exchanged keys via NFC tap
    When User A sends "Hello" to User B
    Then User B receives "Hello" within 2 seconds
    And the message is end-to-end encrypted
    And no network traffic leaves either device

  Scenario: Multi-hop message relay
    Given Device A, B, C in a chain (A-B, B-C connected, A-C not in range)
    When User A sends a message to User C
    Then Device B relays the message automatically
    And User C receives it within 5 seconds
    And Device B cannot read the message content

  Scenario: Emergency broadcast
    Given a mesh network of 50 devices
    When User A triggers an emergency broadcast
    Then all 50 devices receive the alert within 30 seconds
    And the broadcast bypasses normal queue priority

  Scenario: Network partition healing
    Given two mesh networks that were previously connected
    When a bridge device reconnects them
    Then pending messages are synchronized within 60 seconds
    And CRDT conflicts are resolved automatically
```

---

## SPARC Phase 2: Pseudocode

### 2.1 Core Protocol State Machine

```
PROTOCOL MeshWaveCore:

  STATES:
    IDLE          // App backgrounded, minimal scanning
    DISCOVERING   // Active scanning for peers
    CONNECTED     // Established connections
    RELAYING      // Acting as mesh relay node
    EMERGENCY     // High-priority broadcast mode

  INITIALIZE():
    state = IDLE
    nodeId = generateSecureNodeId()
    keyPair = generateX25519KeyPair()
    routingTable = new RoutingTable(maxHops=7)
    messageQueue = new PriorityQueue()

  TRANSITION(newState):
    IF newState == EMERGENCY:
      enableAllProtocols()
      setHighPowerMode()
    ELSE IF newState == IDLE:
      reduceScanInterval()
      pauseNonEssentialProtocols()

    state = newState
    emit("stateChange", newState)
```

### 2.2 Multi-Protocol Channel Selection Algorithm

```
ALGORITHM SelectOptimalChannel(message, targetNode):

  INPUT:
    message: MessagePayload
    targetNode: NodeIdentifier

  OUTPUT:
    channel: CommunicationChannel

  channels = getAvailableChannels(targetNode)
  scores = []

  FOR EACH channel IN channels:
    score = 0

    // Bandwidth score (0-30 points)
    IF message.size > 100KB:
      score += channel.bandwidth / maxBandwidth * 30
    ELSE:
      score += 30  // Small messages work on any channel

    // Latency score (0-25 points)
    score += (1 - channel.latency / maxLatency) * 25

    // Battery efficiency (0-20 points)
    score += (1 - channel.powerDraw / maxPower) * 20

    // Reliability score (0-15 points)
    score += channel.successRate * 15

    // Privacy score (0-10 points)
    IF message.requiresCovert AND channel.isCovert:
      score += 10

    scores.append((channel, score))

  RETURN maxBy(scores, score).channel
```

### 2.3 Ultrasonic Data Transmission Protocol

```
PROTOCOL UltrasonicTransmission:

  CONSTANTS:
    BASE_FREQ = 18000  // Hz (above most adult hearing)
    FREQ_STEP = 100    // Hz per symbol
    SYMBOL_DURATION = 50  // ms
    PREAMBLE = [18500, 19500, 18500, 19500]  // Sync pattern

  ENCODE(data: bytes) -> audioSignal:
    symbols = []

    // Add preamble for synchronization
    FOR freq IN PREAMBLE:
      symbols.append(generateTone(freq, SYMBOL_DURATION))

    // Encode data using FSK (Frequency Shift Keying)
    FOR byte IN data:
      // 4 bits per symbol (16 frequencies)
      highNibble = (byte >> 4) & 0x0F
      lowNibble = byte & 0x0F

      symbols.append(generateTone(BASE_FREQ + highNibble * FREQ_STEP, SYMBOL_DURATION))
      symbols.append(generateTone(BASE_FREQ + lowNibble * FREQ_STEP, SYMBOL_DURATION))

    // Add checksum
    checksum = crc16(data)
    symbols.append(encodeChecksum(checksum))

    RETURN concatenate(symbols)

  DECODE(audioSignal) -> bytes:
    // Apply bandpass filter (17-23kHz)
    filtered = bandpassFilter(audioSignal, 17000, 23000)

    // Detect preamble
    preamblePos = detectPreamble(filtered)
    IF preamblePos == NOT_FOUND:
      RETURN ERROR("No preamble detected")

    // Extract symbols using FFT
    data = []
    pos = preamblePos + len(PREAMBLE) * SYMBOL_DURATION

    WHILE pos < len(filtered) - SYMBOL_DURATION:
      freq = dominantFrequency(filtered[pos:pos+SYMBOL_DURATION])
      symbol = (freq - BASE_FREQ) / FREQ_STEP
      data.append(symbol)
      pos += SYMBOL_DURATION

    // Reconstruct bytes and verify checksum
    bytes = reconstructBytes(data)
    IF NOT verifyChecksum(bytes):
      RETURN ERROR("Checksum failed")

    RETURN bytes
```

### 2.4 Byzantine Fault-Tolerant Routing

```
ALGORITHM ByzantineRouter:

  STRUCT RouteProposal:
    path: NodeId[]
    signatures: Signature[]
    timestamp: int64

  VALIDATE_ROUTE(proposal):
    // Require 2f+1 signatures for f faulty nodes tolerance
    requiredSignatures = (knownMaliciousCount * 2) + 1

    IF len(proposal.signatures) < requiredSignatures:
      RETURN REJECT("Insufficient signatures")

    // Verify all signatures
    FOR i, sig IN enumerate(proposal.signatures):
      IF NOT verify(sig, proposal.path[i], proposal.path):
        RETURN REJECT("Invalid signature at hop " + i)

    // Check for routing loops
    IF hasDuplicates(proposal.path):
      RETURN REJECT("Routing loop detected")

    // Verify timestamp freshness (prevent replay)
    IF abs(now() - proposal.timestamp) > MAX_ROUTE_AGE:
      RETURN REJECT("Stale route proposal")

    RETURN ACCEPT

  DETECT_MALICIOUS_NODE(routeHistory):
    // Statistical analysis of message delivery failures
    FOR node IN knownNodes:
      deliveryRate = calculateDeliveryRate(node, routeHistory)

      IF deliveryRate < THRESHOLD_SUSPICIOUS:
        incrementSuspicionScore(node)

        IF node.suspicionScore > THRESHOLD_MALICIOUS:
          markAsMalicious(node)
          broadcastMaliciousNodeAlert(node)
```

### 2.5 CRDT-Based Message Synchronization

```
DATATYPE MessageCRDT:
  // Conflict-free Replicated Data Type for message ordering

  STRUCT MessageEntry:
    id: UUID
    vectorClock: Map<NodeId, int>
    content: EncryptedPayload
    tombstone: boolean

  MERGE(local: Set<MessageEntry>, remote: Set<MessageEntry>):
    result = new Set()

    allIds = union(local.ids, remote.ids)

    FOR id IN allIds:
      localEntry = local.get(id)
      remoteEntry = remote.get(id)

      IF localEntry == NULL:
        result.add(remoteEntry)
      ELSE IF remoteEntry == NULL:
        result.add(localEntry)
      ELSE:
        // Both exist - merge using vector clock
        merged = new MessageEntry()
        merged.id = id
        merged.vectorClock = maxVectorClock(localEntry.vectorClock, remoteEntry.vectorClock)
        merged.content = localEntry.content  // Content immutable
        merged.tombstone = localEntry.tombstone OR remoteEntry.tombstone
        result.add(merged)

    RETURN result
```

---

## SPARC Phase 3: Architecture

### 3.1 High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              MeshWave Application                            │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────────┐  │
│  │   UI Layer      │  │   State Mgmt    │  │    Notification Service     │  │
│  │  (React Native) │  │  (Zustand/CRDT) │  │    (Local + Push)           │  │
│  └────────┬────────┘  └────────┬────────┘  └─────────────┬───────────────┘  │
│           │                    │                         │                   │
│  ┌────────┴────────────────────┴─────────────────────────┴───────────────┐  │
│  │                     MeshWave Core Engine (Rust + WASM)                │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌───────────┐  │  │
│  │  │  Encryption  │  │   Routing    │  │   Message    │  │  Identity │  │  │
│  │  │    Engine    │  │    Engine    │  │    Queue     │  │   Vault   │  │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  └───────────┘  │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                      │                                       │
│  ┌───────────────────────────────────┴───────────────────────────────────┐  │
│  │                    Protocol Abstraction Layer                          │  │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────────┐  │  │
│  │  │   BLE   │  │  WiFi   │  │ Ultra-  │  │   NFC   │  │    VLC      │  │  │
│  │  │  Mesh   │  │ Direct  │  │  sonic  │  │         │  │  (Camera)   │  │  │
│  │  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘  └──────┬──────┘  │  │
│  └───────┼────────────┼────────────┼────────────┼──────────────┼─────────┘  │
└──────────┼────────────┼────────────┼────────────┼──────────────┼───────────┘
           │            │            │            │              │
┌──────────┴────────────┴────────────┴────────────┴──────────────┴───────────┐
│                          Native Platform Layer                              │
│  ┌─────────────────────────────┐  ┌────────────────────────────────────┐   │
│  │         iOS Module          │  │          Android Module             │   │
│  │  • CoreBluetooth           │  │  • Android BLE                      │   │
│  │  • MultipeerConnectivity   │  │  • WiFi P2P                         │   │
│  │  • AVAudioEngine           │  │  • AudioRecord/AudioTrack           │   │
│  │  • CoreNFC                 │  │  • NFC                              │   │
│  │  • AVFoundation            │  │  • Camera2                          │   │
│  └─────────────────────────────┘  └────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Component Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    MeshWave Core Components                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                  Channel Orchestrator                     │   │
│  │  • Dynamic channel selection based on conditions          │   │
│  │  • Automatic failover between protocols                   │   │
│  │  • Load balancing across available channels               │   │
│  │  • Power-aware channel scheduling                         │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              │                                   │
│           ┌──────────────────┼──────────────────┐               │
│           ▼                  ▼                  ▼               │
│  ┌────────────────┐ ┌────────────────┐ ┌────────────────┐      │
│  │  BLE Mesh      │ │  WiFi Direct   │ │  Ultrasonic    │      │
│  │  Controller    │ │  Controller    │ │  Controller    │      │
│  ├────────────────┤ ├────────────────┤ ├────────────────┤      │
│  │ • Advertising  │ │ • Group Owner  │ │ • FSK Encoder  │      │
│  │ • Scanning     │ │ • Client Mode  │ │ • FFT Decoder  │      │
│  │ • GATT Server  │ │ • Discovery    │ │ • Echo Cancel  │      │
│  │ • Mesh Relay   │ │ • File Xfer    │ │ • Noise Filter │      │
│  └────────────────┘ └────────────────┘ └────────────────┘      │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    Routing Engine                         │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐   │   │
│  │  │   Routing   │  │  Byzantine  │  │    Gossip       │   │   │
│  │  │    Table    │  │  Detector   │  │   Protocol      │   │   │
│  │  └─────────────┘  └─────────────┘  └─────────────────┘   │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                   Security Layer                          │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐   │   │
│  │  │   X25519    │  │   Double    │  │    Onion        │   │   │
│  │  │   KeyEx     │  │   Ratchet   │  │   Routing       │   │   │
│  │  └─────────────┘  └─────────────┘  └─────────────────┘   │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                   Storage Layer                           │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐   │   │
│  │  │   SQLite    │  │   CRDT      │  │    Vector       │   │   │
│  │  │   (Local)   │  │   Store     │  │   Index (HNSW)  │   │   │
│  │  └─────────────┘  └─────────────┘  └─────────────────┘   │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 3.3 Data Flow Architecture

```
Message Send Flow:
┌─────────┐    ┌──────────┐    ┌──────────┐    ┌────────────┐
│  User   │───▶│ Encrypt  │───▶│ Route    │───▶│  Channel   │
│  Input  │    │ (E2EE)   │    │ Select   │    │  Transmit  │
└─────────┘    └──────────┘    └──────────┘    └────────────┘
                    │                               │
                    ▼                               ▼
              ┌──────────┐                   ┌────────────┐
              │ Sign &   │                   │  Protocol  │
              │ Timestamp│                   │   Layer    │
              └──────────┘                   └────────────┘

Message Receive Flow:
┌─────────────┐    ┌──────────┐    ┌──────────┐    ┌─────────┐
│  Protocol   │───▶│ Validate │───▶│ Decrypt  │───▶│ Deliver │
│  Receive    │    │ & Route  │    │ (E2EE)   │    │ to User │
└─────────────┘    └──────────┘    └──────────┘    └─────────┘
      │                 │
      ▼                 ▼
┌─────────────┐   ┌──────────┐
│  If Relay:  │   │  Store   │
│  Forward    │   │  & Sync  │
└─────────────┘   └──────────┘
```

### 3.4 Technology Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| UI | React Native | Cross-platform, native performance |
| State | Zustand + CRDT | Lightweight, CRDT for offline sync |
| Core Engine | Rust + WASM | Performance, security, portability |
| Encryption | libsodium | Audited, X25519 + ChaCha20 |
| BLE | CoreBluetooth / Android BLE | Native mesh support |
| WiFi Direct | MultipeerConnectivity / WiFi P2P | High bandwidth P2P |
| Audio | AVAudioEngine / AudioTrack | Low-latency audio processing |
| Storage | SQLite + RuVector | Local + vector search |
| Testing | Jest + Detox + Rust tests | Unit + E2E + Native |

### 3.5 Integration with RuVector

```typescript
// Using RuVector for intelligent message routing and pattern learning
import { RuVector, SONA, HNSW } from '@ruvnet/ruvector';

class MeshWaveIntelligence {
  private vectorDb: RuVector;
  private learner: SONA;

  constructor() {
    this.vectorDb = new RuVector({
      persistence: 'sqlite',
      indexType: 'hnsw',
      dimensions: 128  // Node behavior embedding dimensions
    });

    this.learner = new SONA({
      adaptationRate: 0.01,
      memoryConsolidation: true
    });
  }

  // Learn optimal routing patterns from successful deliveries
  async learnRoutePattern(route: Route, success: boolean) {
    const embedding = await this.embedRoute(route);

    if (success) {
      await this.vectorDb.upsert({
        id: route.id,
        vector: embedding,
        metadata: {
          hops: route.hops,
          latency: route.latency,
          protocol: route.protocol,
          timeOfDay: new Date().getHours()
        }
      });

      await this.learner.reinforce(embedding, 1.0);
    } else {
      await this.learner.reinforce(embedding, -0.5);
    }
  }

  // Find similar successful routes for new messages
  async suggestRoute(destination: NodeId): Promise<Route[]> {
    const targetEmbedding = await this.embedDestination(destination);

    const similar = await this.vectorDb.search({
      vector: targetEmbedding,
      topK: 5,
      filter: { success: true }
    });

    return similar.map(r => reconstructRoute(r));
  }
}
```

---

## SPARC Phase 4: Refinement (TDD)

### 4.1 Test-Driven Development Specification

All features must follow TDD Red-Green-Refactor cycle:

1. **RED**: Write failing test first
2. **GREEN**: Write minimal code to pass
3. **REFACTOR**: Improve without changing behavior

### 4.2 Test Categories

```
tests/
├── unit/
│   ├── encryption/
│   │   ├── x25519.test.ts
│   │   ├── double-ratchet.test.ts
│   │   └── onion-routing.test.ts
│   ├── routing/
│   │   ├── routing-table.test.ts
│   │   ├── byzantine-detector.test.ts
│   │   └── hop-optimizer.test.ts
│   ├── protocols/
│   │   ├── ble-mesh.test.ts
│   │   ├── wifi-direct.test.ts
│   │   ├── ultrasonic.test.ts
│   │   └── channel-selector.test.ts
│   └── crdt/
│       ├── message-crdt.test.ts
│       └── vector-clock.test.ts
├── integration/
│   ├── multi-hop-delivery.test.ts
│   ├── protocol-failover.test.ts
│   ├── mesh-healing.test.ts
│   └── emergency-broadcast.test.ts
└── e2e/
    ├── two-device-chat.test.ts
    ├── mesh-network-formation.test.ts
    ├── offline-sync.test.ts
    └── attack-resistance.test.ts
```

### 4.3 Critical Test Specifications

```typescript
// tests/unit/protocols/ultrasonic.test.ts
describe('UltrasonicProtocol', () => {
  describe('Encoding', () => {
    it('should encode data to audio signal in 18-22kHz range', () => {
      const data = Buffer.from('Hello');
      const signal = UltrasonicProtocol.encode(data);

      const frequencies = analyzeFrequencies(signal);
      expect(frequencies.min).toBeGreaterThanOrEqual(18000);
      expect(frequencies.max).toBeLessThanOrEqual(22000);
    });

    it('should include preamble for synchronization', () => {
      const data = Buffer.from('Test');
      const signal = UltrasonicProtocol.encode(data);

      const preamble = extractPreamble(signal);
      expect(preamble).toEqual([18500, 19500, 18500, 19500]);
    });

    it('should add CRC16 checksum', () => {
      const data = Buffer.from('Checksum test');
      const signal = UltrasonicProtocol.encode(data);
      const decoded = UltrasonicProtocol.decode(signal);

      expect(decoded.checksumValid).toBe(true);
    });
  });

  describe('Decoding', () => {
    it('should decode signal back to original data', () => {
      const original = Buffer.from('Round trip test');
      const signal = UltrasonicProtocol.encode(original);
      const decoded = UltrasonicProtocol.decode(signal);

      expect(decoded.data).toEqual(original);
    });

    it('should reject signals without valid preamble', () => {
      const noise = generateWhiteNoise(1000);

      expect(() => UltrasonicProtocol.decode(noise))
        .toThrow('No preamble detected');
    });

    it('should handle ambient noise up to 60dB', () => {
      const data = Buffer.from('Noisy environment');
      const signal = UltrasonicProtocol.encode(data);
      const noisy = addNoise(signal, 60); // 60dB ambient
      const decoded = UltrasonicProtocol.decode(noisy);

      expect(decoded.data).toEqual(data);
    });
  });
});

// tests/unit/routing/byzantine-detector.test.ts
describe('ByzantineDetector', () => {
  it('should detect message dropping nodes', async () => {
    const detector = new ByzantineDetector();
    const maliciousNode = 'node-evil';

    // Simulate 100 messages, 80% dropped by malicious node
    for (let i = 0; i < 100; i++) {
      const delivered = Math.random() > 0.8;
      await detector.recordDelivery(maliciousNode, delivered);
    }

    const isMalicious = await detector.evaluate(maliciousNode);
    expect(isMalicious).toBe(true);
  });

  it('should require 2f+1 signatures for route validation', () => {
    const detector = new ByzantineDetector({ faultyTolerance: 2 });

    const route = createRouteProposal({
      path: ['A', 'B', 'C'],
      signatures: ['sigA', 'sigB', 'sigC', 'sigD', 'sigE'] // 5 = 2*2+1
    });

    expect(detector.validateRoute(route)).toBe(true);

    const insufficientRoute = createRouteProposal({
      path: ['A', 'B', 'C'],
      signatures: ['sigA', 'sigB', 'sigC', 'sigD'] // 4 < 5
    });

    expect(detector.validateRoute(insufficientRoute)).toBe(false);
  });
});

// tests/integration/multi-hop-delivery.test.ts
describe('Multi-Hop Message Delivery', () => {
  let network: SimulatedMeshNetwork;

  beforeEach(() => {
    network = new SimulatedMeshNetwork();
    // Create linear topology: A -- B -- C -- D
    network.addNode('A');
    network.addNode('B');
    network.addNode('C');
    network.addNode('D');
    network.connect('A', 'B');
    network.connect('B', 'C');
    network.connect('C', 'D');
  });

  it('should deliver message across 3 hops', async () => {
    const message = createMessage({
      from: 'A',
      to: 'D',
      content: 'Hello from A'
    });

    const result = await network.send(message);

    expect(result.delivered).toBe(true);
    expect(result.hops).toBe(3);
    expect(result.path).toEqual(['A', 'B', 'C', 'D']);
  });

  it('should maintain E2EE through relay nodes', async () => {
    const message = createMessage({
      from: 'A',
      to: 'D',
      content: 'Secret message'
    });

    const relayLogs = await network.sendWithLogging(message);

    // Relay nodes B and C should not see plaintext
    expect(relayLogs['B'].seenContent).toBeUndefined();
    expect(relayLogs['C'].seenContent).toBeUndefined();
    expect(relayLogs['D'].decryptedContent).toBe('Secret message');
  });

  it('should reroute when intermediate node fails', async () => {
    // Add alternate route
    network.connect('A', 'C'); // Direct A-C link

    const message = createMessage({ from: 'A', to: 'D' });

    // Fail node B
    network.failNode('B');

    const result = await network.send(message);

    expect(result.delivered).toBe(true);
    expect(result.path).toEqual(['A', 'C', 'D']); // Bypassed B
  });
});

// tests/e2e/attack-resistance.test.ts
describe('Attack Resistance', () => {
  it('should resist replay attacks', async () => {
    const attacker = new AttackerNode();
    const network = createTestNetwork();

    // Capture a legitimate message
    const capturedMessage = await attacker.intercept(network);

    // Attempt to replay it 5 minutes later
    await delay(5 * 60 * 1000);
    const replayResult = await attacker.replay(capturedMessage);

    expect(replayResult.accepted).toBe(false);
    expect(replayResult.reason).toBe('Timestamp expired');
  });

  it('should resist Sybil attacks', async () => {
    const network = createTestNetwork();

    // Attacker creates 100 fake identities
    const fakeNodes = Array(100).fill(null).map(() =>
      new FakeNode({ limitedResources: true })
    );

    // Attempt to dominate routing
    for (const fake of fakeNodes) {
      await network.join(fake);
    }

    // Network should still route through legitimate high-reputation nodes
    const routeQuality = await network.measureRouteQuality();
    expect(routeQuality.legitimateNodeUsage).toBeGreaterThan(0.7);
  });

  it('should resist timing analysis on ultrasonic channel', async () => {
    const protocol = new UltrasonicProtocol({ paddingEnabled: true });

    const shortMessage = Buffer.from('Hi');
    const longMessage = Buffer.from('This is a much longer message');

    const shortSignal = protocol.encode(shortMessage);
    const longSignal = protocol.encode(longMessage);

    // With padding, signals should be similar length
    const lengthRatio = shortSignal.length / longSignal.length;
    expect(lengthRatio).toBeGreaterThan(0.8);
    expect(lengthRatio).toBeLessThan(1.2);
  });
});
```

---

## SPARC Phase 5: Completion

### 5.1 Implementation Milestones

| Phase | Milestone | Duration | Deliverables |
|-------|-----------|----------|--------------|
| 1 | Core Engine | 4 weeks | Rust WASM core, encryption, basic routing |
| 2 | BLE Mesh | 3 weeks | Native modules, mesh formation, relay |
| 3 | WiFi Direct | 2 weeks | High-bandwidth channel, file transfer |
| 4 | Ultrasonic | 3 weeks | Audio encoding/decoding, noise filtering |
| 5 | Integration | 2 weeks | Channel orchestration, failover |
| 6 | Security Audit | 2 weeks | Penetration testing, crypto review |
| 7 | Beta | 4 weeks | TestFlight/Play Store beta |
| 8 | Launch | 2 weeks | Production release |

### 5.2 Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Message delivery rate | > 99.5% | Automated testing |
| Single-hop latency | < 500ms | P95 in production |
| 7-hop latency | < 5s | P95 in production |
| Battery drain (idle) | < 5%/hr | Device testing |
| Mesh formation time | < 10s | Automated testing |
| Ultrasonic range | > 8m | Controlled environment |
| User satisfaction | > 4.5/5 | App store ratings |

### 5.3 Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Platform permission changes | High | Abstract permission layer, feature flags |
| Ultrasonic interference | Medium | Adaptive frequency selection, fallback |
| Battery drain complaints | High | Aggressive power management, user controls |
| Crypto vulnerabilities | Critical | External audit, libsodium, regular updates |
| Regulatory issues | Medium | Legal review per jurisdiction, compliance mode |

---

## Appendix A: Protocol Specifications

### A.1 Message Format

```
┌────────────────────────────────────────────────────────────────┐
│                    MeshWave Message Format                      │
├────────────────────────────────────────────────────────────────┤
│ Field              │ Size     │ Description                    │
├────────────────────┼──────────┼────────────────────────────────┤
│ Version            │ 1 byte   │ Protocol version (0x03)        │
│ Type               │ 1 byte   │ Message type enum              │
│ Flags              │ 2 bytes  │ Priority, encryption, routing  │
│ TTL                │ 1 byte   │ Hop limit (max 7)              │
│ Timestamp          │ 8 bytes  │ Unix timestamp (ms)            │
│ Source ID          │ 32 bytes │ Sender public key hash         │
│ Dest ID            │ 32 bytes │ Recipient public key hash      │
│ Nonce              │ 24 bytes │ Encryption nonce               │
│ Payload Length     │ 4 bytes  │ Encrypted payload size         │
│ Payload            │ Variable │ Encrypted content              │
│ Signature          │ 64 bytes │ Ed25519 signature              │
│ Route Proof        │ Variable │ Byzantine route signatures     │
└────────────────────┴──────────┴────────────────────────────────┘
```

### A.2 Ultrasonic Protocol Parameters

| Parameter | Value | Notes |
|-----------|-------|-------|
| Base Frequency | 18,000 Hz | Above most adult hearing |
| Frequency Range | 18,000 - 21,500 Hz | 16 symbols (4 bits) |
| Symbol Duration | 50 ms | 20 symbols/second |
| Preamble Length | 200 ms | 4 sync tones |
| Max Payload | 256 bytes | ~5 seconds transmission |
| Sample Rate | 44,100 Hz | Standard audio |
| Error Correction | Reed-Solomon | RS(255, 223) |

---

## Appendix B: Claude Flow Integration

### B.1 Agent Configuration

```typescript
// MeshWave development swarm configuration
const meshWaveSwarm = {
  topology: 'hierarchical',
  maxAgents: 8,
  strategy: 'specialized',
  agents: [
    { type: 'coordinator', name: 'meshwave-coordinator' },
    { type: 'mobile-dev', name: 'react-native-engineer' },
    { type: 'security-architect', name: 'crypto-specialist' },
    { type: 'coder', name: 'rust-wasm-developer' },
    { type: 'tester', name: 'protocol-tester' },
    { type: 'performance-engineer', name: 'battery-optimizer' }
  ]
};
```

### B.2 Memory Integration

```typescript
// Store successful routing patterns in Claude Flow memory
await mcp__claude_flow__memory_usage({
  action: 'store',
  namespace: 'meshwave-routing',
  key: `route-${routeId}`,
  value: JSON.stringify({
    path: route.nodes,
    protocol: route.protocol,
    latency: route.latency,
    success: true,
    timestamp: Date.now()
  })
});
```

---

*Document generated by Claude Flow V3 SPARC System*
*For implementation, spawn the MeshWave development swarm*
