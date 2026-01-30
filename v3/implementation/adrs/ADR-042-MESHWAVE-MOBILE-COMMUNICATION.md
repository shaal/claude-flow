---
status: Proposed
date: 2026-01-30
deciders: Claude Flow V3 Architecture Team
---

# ADR-042: MeshWave Off-Network Mobile Communication Protocol

## Context

Mobile applications traditionally depend on centralized infrastructure (cellular networks, WiFi access points, internet connectivity) for communication. This creates vulnerabilities:

1. **Single Points of Failure**: Natural disasters, infrastructure attacks, or power outages disable communication
2. **Surveillance Capabilities**: Centralized networks enable mass monitoring
3. **Censorship Vectors**: Authoritarian regimes can block or throttle communication
4. **Coverage Gaps**: Remote areas lack infrastructure
5. **Network Congestion**: Events with high attendance overwhelm local capacity

We need a decentralized, infrastructure-free communication protocol that leverages device-to-device capabilities.

## Decision

We will implement **MeshWave**, a multi-modal mesh communication protocol using:

### Primary Decision: Hybrid Multi-Protocol Architecture

Instead of relying on a single protocol (like Bluetooth alone), MeshWave combines:

| Protocol | Role | Range | Bandwidth | Power |
|----------|------|-------|-----------|-------|
| **BLE 5.0 Mesh** | Discovery, low-bandwidth messaging, mesh relay | 100m | 2 Mbps | Low |
| **WiFi Direct** | High-bandwidth transfers (images, voice) | 200m | 250 Mbps | Medium |
| **Ultrasonic Audio** | Covert channel, bridge isolated networks | 10m | 200 bps | Very Low |
| **NFC** | Secure key exchange, trust establishment | 4cm | 424 kbps | Minimal |
| **Visual Light (VLC)** | Emergency fallback, bridge air-gapped | 5m | 10 kbps | Low |

### Why Multi-Protocol?

1. **Resilience**: If one protocol is blocked/jammed, others continue
2. **Optimization**: Select best protocol per-message based on size, priority, power
3. **Covert Capability**: Ultrasonic and VLC are undetectable to network monitors
4. **Range Extension**: Chain protocols to extend effective range

### Architecture Decisions

#### AD-042.1: Rust + WASM Core Engine

**Decision**: Implement core protocol logic in Rust, compile to WASM for cross-platform.

**Rationale**:
- Memory safety critical for cryptographic operations
- Performance for routing calculations and audio processing
- Single codebase for iOS, Android, and potential desktop
- WASM sandbox provides additional security boundary

**Trade-offs**:
- Increased build complexity
- Larger bundle size (~2MB WASM)
- React Native bridge overhead

#### AD-042.2: X25519 + ChaCha20-Poly1305 + Double Ratchet

**Decision**: Use Signal Protocol-inspired encryption stack.

**Rationale**:
- X25519: Fast, secure key exchange, compact keys (32 bytes)
- ChaCha20-Poly1305: Faster than AES on mobile without hardware acceleration
- Double Ratchet: Forward secrecy, break-in recovery

**Alternatives Considered**:
- RSA: Rejected (large keys, slower)
- AES-GCM: Rejected (needs hardware acceleration)
- Noise Protocol: Considered, but Double Ratchet better for async messaging

#### AD-042.3: Byzantine Fault-Tolerant Routing

**Decision**: Implement BFT routing with 2f+1 signature threshold.

**Rationale**:
- Mesh networks inherently untrusted
- Malicious nodes may drop, modify, or replay messages
- BFT ensures correctness with up to f faulty nodes out of 3f+1

**Implementation**:
```
Route validation requires signatures from:
- At least 2f+1 nodes for f-fault tolerance
- Signature chain proves message traversed claimed path
- Statistical detection of message-dropping nodes
```

#### AD-042.4: CRDT-Based Message Synchronization

**Decision**: Use Conflict-free Replicated Data Types for message ordering.

**Rationale**:
- Network partitions inevitable in mesh
- Eventual consistency acceptable for messaging
- No central coordinator needed
- Automatic conflict resolution

**CRDT Type**: LWW-Register for message state, OR-Set for group membership.

#### AD-042.5: Ultrasonic FSK Encoding

**Decision**: Use Frequency-Shift Keying in 18-22kHz range.

**Rationale**:
- 18kHz+ above most adult hearing threshold
- FSK robust against ambient noise
- No special hardware needed (standard speakers/microphones)
- Legal in all jurisdictions (standard audio output)

**Parameters**:
- Base frequency: 18,000 Hz
- 16 frequencies (4 bits per symbol)
- 50ms symbol duration = 80 bps raw, ~200 bps with encoding

**Limitations**:
- Low bandwidth (text only)
- Reduced effectiveness in noisy environments
- 10m maximum reliable range

## Consequences

### Positive

1. **Infrastructure Independence**: Works in disasters, remote areas, censored regions
2. **Privacy by Design**: E2EE, no central logs, optional anonymity
3. **Resilience**: Multi-protocol failover, mesh healing
4. **Novel Capability**: Ultrasonic bridge is unique differentiator
5. **Open Source Potential**: Community security audits, trust building

### Negative

1. **Complexity**: Five protocols increase development and testing burden
2. **Battery Impact**: Active mesh participation drains battery faster
3. **Range Limitations**: Effective range ~700m with 7 hops (100m × 7)
4. **Adoption Dependency**: Useful only with critical mass of users in area
5. **Platform Restrictions**: iOS background BLE limitations, Android fragmentation

### Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Apple restricts background BLE | Medium | High | Implement "Find My"-style workaround, push for API changes |
| Ultrasonic interferes with pets | Low | Medium | User-adjustable frequency range, disable option |
| Regulatory pushback | Low | High | Legal review per jurisdiction, compliance mode |
| Crypto vulnerability discovered | Low | Critical | Audited libraries, rapid update mechanism |
| Poor adoption | High | High | Viral features, event-specific marketing |

## Implementation Notes

### Phase 1: Core (Weeks 1-4)
- Rust WASM skeleton
- Encryption primitives
- Basic BLE discovery

### Phase 2: Mesh (Weeks 5-7)
- BLE mesh relay
- Routing table
- Store-and-forward

### Phase 3: Protocols (Weeks 8-12)
- WiFi Direct integration
- Ultrasonic encoder/decoder
- VLC proof-of-concept

### Phase 4: Security (Weeks 13-14)
- Byzantine detection
- External security audit
- Penetration testing

### Phase 5: Beta (Weeks 15-18)
- TestFlight/Play Store
- Field testing
- Performance optimization

## Integration with Claude Flow

### Memory System Integration

MeshWave can leverage Claude Flow's memory system for:

1. **Route Learning**: Store successful routes in vector database (RuVector/HNSW)
2. **Pattern Recognition**: SONA learns optimal protocol selection
3. **Anomaly Detection**: Neural network identifies malicious behavior patterns

```typescript
// Example: Store route pattern in Claude Flow memory
await claudeFlow.memory.store({
  namespace: 'meshwave-routes',
  key: routeHash,
  vector: embedRoute(route),
  metadata: {
    success: true,
    latency: route.latencyMs,
    protocol: route.primaryProtocol,
    hops: route.hopCount
  }
});
```

### Swarm Development

Use Claude Flow swarm for parallel development:

```bash
# Initialize MeshWave development swarm
npx claude-flow@v3alpha swarm init \
  --topology hierarchical \
  --agents coordinator,mobile-dev,security-architect,coder,tester \
  --name meshwave-dev
```

## References

- [BLE Mesh Specification](https://www.bluetooth.com/specifications/specs/mesh-model-1-0-1/)
- [Signal Protocol](https://signal.org/docs/)
- [CRDT Literature](https://crdt.tech/)
- [Ultrasonic Data Transmission Research](https://arxiv.org/abs/1611.02847)
- [Byzantine Fault Tolerance](https://pmg.csail.mit.edu/papers/osdi99.pdf)

---

*ADR-042 | MeshWave Mobile Communication Protocol*
*Claude Flow V3 Architecture Decision Record*
