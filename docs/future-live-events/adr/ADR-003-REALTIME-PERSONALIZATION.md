# ADR-003: Real-Time Personalization Engine

**Status:** Accepted
**Date:** 2026-01-30
**Author:** Future Live Events Architecture Swarm
**Version:** 1.0.0

## Context

The Future Live Events Platform 2046 must deliver hyper-personalized experiences to millions of concurrent attendees with sub-50ms decision latency. Traditional recommendation systems batch-process preferences and serve static segments, which cannot adapt to the dynamic, real-time nature of neural event experiences.

### Problem Statement

1. **Latency Gap**: Current systems have 500ms-2s personalization latency; neural experiences require <50ms
2. **Context Blindness**: Traditional systems ignore real-time emotional/physical state
3. **Cold Start Problem**: New attendees receive generic experiences
4. **Learning Speed**: Models don't adapt within single events
5. **Scale Challenge**: Individual personalization for 10M+ attendees

### Requirements Matrix

| Requirement | Target | Technology Enabler |
|-------------|--------|-------------------|
| Decision latency | <50ms | HNSW + Edge caching |
| Adaptation speed | <0.05ms | SONA online learning |
| Context dimensions | 100+ | GNN feature extraction |
| Concurrent users | 10M+ | Sharded vector indices |
| Memory retention | Cross-event | AgentDB persistent |

## Decision

Implement a **Hybrid Personalization Engine** combining:
1. **RuVector HNSW** for sub-millisecond preference matching
2. **SONA** for real-time preference learning
3. **GNN** for context-aware feature extraction
4. **AgentDB** for cross-session memory persistence

### Architecture Decision

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    REAL-TIME PERSONALIZATION ENGINE                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │                    CONTEXT AGGREGATION LAYER                       │ │
│  │                                                                    │ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌─────────┐ │ │
│  │  │  Neural  │ │ Biometric│ │ Location │ │  Social  │ │ History │ │ │
│  │  │ Signals  │ │  State   │ │ Context  │ │  Graph   │ │  Prefs  │ │ │
│  │  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬────┘ │ │
│  │       └────────────┴────────────┴────────────┴────────────┘      │ │
│  │                              │                                    │ │
│  │                              ▼                                    │ │
│  │  ┌────────────────────────────────────────────────────────────┐  │ │
│  │  │              GNN CONTEXT ENCODER                            │  │ │
│  │  │              (100+ dimensional feature vector)              │  │ │
│  │  └────────────────────────────────────────────────────────────┘  │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                              │                                          │
│                              ▼                                          │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │                    PREFERENCE MATCHING LAYER                       │ │
│  │                                                                    │ │
│  │  ┌────────────────────────────────────────────────────────────┐  │ │
│  │  │                 HNSW VECTOR INDEX                           │  │ │
│  │  │                                                             │  │ │
│  │  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │  │ │
│  │  │  │   Content   │  │   Friends   │  │ Experiences │        │  │ │
│  │  │  │   Index     │  │   Index     │  │   Index     │        │  │ │
│  │  │  │  (100M+)    │  │   (10M+)    │  │   (1M+)     │        │  │ │
│  │  │  └─────────────┘  └─────────────┘  └─────────────┘        │  │ │
│  │  │                                                             │  │ │
│  │  │  Performance: 150x-12,500x faster than linear scan         │  │ │
│  │  │  Latency: <0.5ms per query                                 │  │ │
│  │  └────────────────────────────────────────────────────────────┘  │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                              │                                          │
│                              ▼                                          │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │                    ONLINE LEARNING LAYER                           │ │
│  │                                                                    │ │
│  │  ┌────────────────────────────────────────────────────────────┐  │ │
│  │  │                    SONA ENGINE                              │  │ │
│  │  │                                                             │  │ │
│  │  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │  │ │
│  │  │  │   LoRA      │  │   EWC++     │  │  Attention  │        │  │ │
│  │  │  │ Fine-tuning │  │  Memory     │  │   Router    │        │  │ │
│  │  │  │ (<0.05ms)   │  │ Preserve    │  │  (39 types) │        │  │ │
│  │  │  └─────────────┘  └─────────────┘  └─────────────┘        │  │ │
│  │  │                                                             │  │ │
│  │  │  Capabilities:                                              │  │ │
│  │  │  - Real-time preference updates                            │  │ │
│  │  │  - No catastrophic forgetting                              │  │ │
│  │  │  - Multi-head attention for context                        │  │ │
│  │  └────────────────────────────────────────────────────────────┘  │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                              │                                          │
│                              ▼                                          │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │                    MEMORY PERSISTENCE LAYER                        │ │
│  │                                                                    │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐               │ │
│  │  │   AgentDB   │  │   Session   │  │   Cross-    │               │ │
│  │  │  (SQLite+   │  │   State     │  │   Event     │               │ │
│  │  │   Vector)   │  │   Cache     │  │   Memory    │               │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘               │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Key Design Decisions

#### D1: HNSW-Based Preference Matching

**Decision**: Use RuVector's HNSW (Hierarchical Navigable Small World) index for preference matching.

**Rationale**:
- 150x-12,500x faster than linear scan
- Sub-0.5ms query latency
- Scales to 100M+ vectors
- Supports real-time index updates

**Implementation**:
```typescript
// RuVector HNSW Configuration
import { HNSWIndex } from 'ruvector';

const contentIndex = new HNSWIndex({
  dimension: 256,
  metric: 'cosine',
  efConstruction: 200,
  M: 16,
  maxElements: 100_000_000,

  // Quantization for memory efficiency
  quantization: {
    enabled: true,
    type: 'int8',  // 3.92x memory reduction
    rescoring: true
  }
});

// Real-time preference query
async function getPersonalizedContent(
  attendee: Attendee,
  context: Context
): Promise<Content[]> {
  // Encode context to vector
  const queryVector = await gnnEncoder.encode({
    preferences: attendee.preferences,
    currentMood: context.emotionalState,
    location: context.venueZone,
    socialContext: context.nearbyFriends
  });

  // HNSW search (<0.5ms)
  const matches = await contentIndex.search(queryVector, {
    k: 10,
    ef: 100,  // Search quality parameter
    filter: {
      eventId: context.eventId,
      contentType: context.requestedType
    }
  });

  return matches.map(m => m.content);
}
```

#### D2: SONA Online Learning

**Decision**: Use SONA (Self-Optimizing Neural Architecture) for real-time preference adaptation.

**Rationale**:
- <0.05ms adaptation latency
- LoRA fine-tuning preserves base model
- EWC++ prevents catastrophic forgetting
- Per-user personalized layers

**Implementation**:
```typescript
// SONA Preference Learner
import { SONA } from 'ruvector';

const preferenceModel = new SONA({
  baseModel: 'preference-encoder-v3',
  personalizedLayers: ['attention', 'preference_head'],

  // LoRA configuration for fast adaptation
  lora: {
    rank: 8,
    alpha: 16,
    dropout: 0.1
  },

  // EWC++ for memory preservation
  ewc: {
    enabled: true,
    lambda: 0.4,
    fisherSamples: 100
  },

  // Online learning settings
  onlineLearning: {
    enabled: true,
    learningRate: 0.001,
    batchSize: 1,  // Immediate updates
    maxLatency: 0.05  // ms
  }
});

// Real-time preference update
async function updatePreference(
  attendee: Attendee,
  interaction: Interaction
): Promise<void> {
  // Extract preference signal from interaction
  const signal = extractPreferenceSignal(interaction);

  // SONA online update (<0.05ms)
  await preferenceModel.updatePersonalization(
    attendee.id,
    signal,
    { immediate: true }
  );

  // Update HNSW index with new preference vector
  const newVector = await preferenceModel.encodePreferences(attendee);
  await userPreferenceIndex.update(attendee.id, newVector);
}
```

#### D3: GNN Context Encoder

**Decision**: Use Graph Neural Network for multi-dimensional context encoding.

**Rationale**:
- Captures spatial relationships (venue graph)
- Models social connections (friend graph)
- Encodes temporal patterns
- 100+ context dimensions

**Implementation**:
```typescript
// GNN Context Encoder
import { GraphNeuralNetwork } from 'ruvector';

const contextEncoder = new GraphNeuralNetwork({
  architecture: 'GAT',  // Graph Attention Network
  layers: 3,
  hiddenDim: 128,
  outputDim: 256,
  attentionHeads: 8
});

interface AttendeeContext {
  // Neural state
  neuralSignals: number[];
  emotionalState: EmotionVector;
  attentionFocus: string;

  // Physical context
  location: VenueCoordinate;
  movement: MovementVector;
  proximityToStages: number[];

  // Social context
  nearbyFriends: string[];
  groupActivity: GroupActivityType;
  socialMood: SocialMoodVector;

  // Temporal context
  eventPhase: EventPhase;
  timeAtEvent: number;
  recentInteractions: Interaction[];

  // Historical context
  preferenceHistory: PreferenceVector;
  pastEventBehavior: BehaviorPattern;
}

async function encodeContext(ctx: AttendeeContext): Promise<number[]> {
  // Build context graph
  const graph = buildContextGraph(ctx);

  // GNN forward pass
  const encoded = await contextEncoder.encode(graph);

  return encoded;  // 256-dimensional context vector
}
```

#### D4: Cold Start Handling

**Decision**: Multi-strategy cold start resolution for new attendees.

**Strategies**:
| Strategy | Trigger | Approach |
|----------|---------|----------|
| Social Transfer | Has friends at event | Copy friend preferences |
| Demographic Prior | Basic profile available | Age/location based defaults |
| Active Exploration | Minimal data | Diverse initial recommendations |
| Rapid Learning | First interactions | Aggressive SONA adaptation |

**Implementation**:
```typescript
// Cold Start Handler
class ColdStartHandler {
  async initializeNewAttendee(
    attendee: Attendee,
    event: Event
  ): Promise<PreferenceVector> {

    // Strategy 1: Social transfer
    const friends = await this.getFriendsAtEvent(attendee, event);
    if (friends.length >= 3) {
      return this.aggregateFriendPreferences(friends);
    }

    // Strategy 2: Demographic prior
    const demographicPrior = await this.getDemographicPrior(attendee);

    // Strategy 3: Active exploration
    const explorationVector = this.generateExplorationVector(event);

    // Blend strategies
    return this.blendVectors([
      { vector: demographicPrior, weight: 0.4 },
      { vector: explorationVector, weight: 0.6 }
    ]);
  }

  // Rapid learning after first few interactions
  async rapidLearn(
    attendee: Attendee,
    interactions: Interaction[]
  ): Promise<void> {
    if (interactions.length < 5) {
      // Aggressive learning rate for cold start
      await preferenceModel.updatePersonalization(
        attendee.id,
        interactions,
        { learningRate: 0.01 }  // 10x normal rate
      );
    }
  }
}
```

#### D5: Edge Caching Strategy

**Decision**: Multi-tier caching for sub-50ms latency guarantee.

**Cache Tiers**:
```
┌────────────────────────────────────────────────────────────────────┐
│                      CACHE HIERARCHY                               │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  L1: Device Cache (1ms)                                           │
│  ├── Active preference vector                                     │
│  ├── Recent recommendations (last 10)                             │
│  └── Current context vector                                       │
│                                                                    │
│  L2: Edge Node Cache (5ms)                                        │
│  ├── HNSW index shard (local zone)                               │
│  ├── Hot content embeddings                                       │
│  └── Zone-specific models                                         │
│                                                                    │
│  L3: Regional Cache (20ms)                                        │
│  ├── Full HNSW index replica                                     │
│  ├── SONA base model                                             │
│  └── Aggregated preferences                                       │
│                                                                    │
│  L4: Cloud Store (100ms+)                                         │
│  ├── AgentDB full history                                        │
│  ├── Cross-event memory                                          │
│  └── Training data                                                │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

**Implementation**:
```typescript
// Multi-Tier Cache Manager
class PersonalizationCache {
  private l1: DeviceCache;
  private l2: EdgeCache;
  private l3: RegionalCache;
  private l4: CloudStore;

  async getPersonalization(
    attendee: Attendee,
    context: Context
  ): Promise<PersonalizationResult> {

    // L1: Check device cache (1ms)
    let result = await this.l1.get(attendee.id, context);
    if (result) return result;

    // L2: Check edge cache (5ms)
    result = await this.l2.get(attendee.id, context);
    if (result) {
      this.l1.set(attendee.id, context, result);
      return result;
    }

    // L3: Check regional cache (20ms)
    result = await this.l3.get(attendee.id, context);
    if (result) {
      this.l2.set(attendee.id, context, result);
      this.l1.set(attendee.id, context, result);
      return result;
    }

    // L4: Compute from cloud (100ms+)
    result = await this.computeFresh(attendee, context);
    this.propagateToAllCaches(attendee.id, context, result);
    return result;
  }
}
```

### Claude-Flow Integration

```typescript
// Personalization Agent in Claude-Flow Swarm
const personalizationAgent = {
  type: 'personalization-agent',
  capabilities: [
    'preference-encoding',
    'content-matching',
    'online-learning',
    'cold-start-handling'
  ],

  hooks: {
    'pre-task': async (ctx) => {
      // Pre-load attendee preferences
      await this.preloadPreferences(ctx.attendees);
    },

    'post-edit': async (ctx) => {
      // Update learning models after content changes
      await this.reindexContent(ctx.changedContent);
    }
  },

  async handlePersonalizationRequest(
    attendee: Attendee,
    requestType: RequestType
  ): Promise<PersonalizedResponse> {

    // Get context
    const context = await this.aggregateContext(attendee);

    // Query personalization engine
    const result = await personalizationEngine.getPersonalized(
      attendee,
      context,
      requestType
    );

    // Store interaction for learning
    await this.logInteraction(attendee, result);

    return result;
  }
};
```

## Consequences

### Positive

1. **<50ms decision latency** achieved through HNSW + edge caching
2. **Real-time adaptation** via SONA <0.05ms updates
3. **No cold start problem** with multi-strategy initialization
4. **Cross-event memory** preserves long-term preferences
5. **Scales to 10M+ users** with sharded indices

### Negative

1. **Memory overhead** - per-user SONA layers require storage
2. **Cache consistency** - multi-tier cache adds complexity
3. **Index maintenance** - HNSW requires periodic rebalancing
4. **Privacy concerns** - detailed preference tracking

### Neutral

1. **Gradual personalization** - starts generic, improves with usage
2. **Fallback to segments** - if individual fails, use cohort

## Privacy Considerations

| Data Type | Retention | Access | Anonymization |
|-----------|-----------|--------|---------------|
| Preference vectors | Persistent | User only | Differential privacy |
| Interaction logs | 30 days | Analytics (aggregate) | K-anonymity |
| Neural signals | Session only | Processing only | Not stored |
| SONA weights | Persistent | Model inference | Encrypted |

## Testing Strategy (TDD)

### Unit Tests

```typescript
describe('PersonalizationEngine', () => {
  it('should return results within 50ms', async () => {
    const attendee = createMockAttendee();
    const context = createMockContext();

    const start = performance.now();
    const result = await engine.getPersonalized(attendee, context);
    const elapsed = performance.now() - start;

    expect(elapsed).toBeLessThan(50);
    expect(result.items.length).toBeGreaterThan(0);
  });

  it('should adapt to preference within 0.1ms', async () => {
    const attendee = createMockAttendee();
    const interaction = createPositiveInteraction();

    const start = performance.now();
    await preferenceModel.updatePersonalization(attendee.id, interaction);
    const elapsed = performance.now() - start;

    expect(elapsed).toBeLessThan(0.1);
  });

  it('should handle cold start with no history', async () => {
    const newAttendee = createNewAttendee(); // No history
    const context = createMockContext();

    const result = await engine.getPersonalized(newAttendee, context);

    expect(result.items.length).toBeGreaterThan(0);
    expect(result.strategy).toBe('cold_start_exploration');
  });

  it('should achieve >90% preference accuracy after 10 interactions', async () => {
    const attendee = createMockAttendee();
    const truePreferences = generateTruePreferences();

    // Simulate 10 interactions
    for (let i = 0; i < 10; i++) {
      const interaction = simulateInteraction(attendee, truePreferences);
      await engine.recordInteraction(attendee, interaction);
    }

    // Test prediction accuracy
    const predictions = await engine.predictPreferences(attendee);
    const accuracy = computeAccuracy(predictions, truePreferences);

    expect(accuracy).toBeGreaterThan(0.9);
  });
});
```

### Performance Tests

```typescript
describe('PersonalizationEngine Performance', () => {
  it('should handle 10K concurrent requests', async () => {
    const requests = generateConcurrentRequests(10_000);

    const start = Date.now();
    await Promise.all(requests.map(r => engine.getPersonalized(r.attendee, r.context)));
    const elapsed = Date.now() - start;

    const throughput = 10_000 / (elapsed / 1000);
    expect(throughput).toBeGreaterThan(5_000); // >5K req/sec
  });

  it('should maintain latency under load', async () => {
    const latencies: number[] = [];

    // Simulate load
    await runLoadTest({
      duration: 60_000,
      rps: 1000,
      onResponse: (latency) => latencies.push(latency)
    });

    const p99 = percentile(latencies, 99);
    expect(p99).toBeLessThan(100); // p99 < 100ms
  });
});
```

## References

- PRD-FUTURE-LIVE-EVENTS-2046
- ADR-001: Neural Event Experience
- ADR-002: Admin AI Orchestration
- RuVector HNSW Documentation
- RuVector SONA Documentation
- Claude-Flow Memory System

---

**Version History**

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2026-01-30 | Architecture Swarm | Initial ADR |
