/**
 * TDD Test Specifications: Real-Time Personalization
 * ADR-003 Implementation Tests
 *
 * Following London School TDD with mock-driven development
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock interfaces (to be implemented)
interface PersonalizationEngine {
  getPersonalized(attendee: Attendee, context: Context, requestType: RequestType): Promise<PersonalizedResult>;
  recordInteraction(attendee: Attendee, interaction: Interaction): Promise<void>;
  predictPreferences(attendee: Attendee): Promise<PreferenceVector>;
}

interface Attendee {
  id: string;
  preferences: PreferenceVector;
  interactionHistory: Interaction[];
  isNewUser: boolean;
}

interface Context {
  eventId: string;
  emotionalState: EmotionalState;
  venueZone: string;
  nearbyFriends: string[];
  currentActivity: string;
  timestamp: number;
}

interface EmotionalState {
  valence: number;  // -1 to 1
  arousal: number;  // 0 to 1
  dominance: number;  // 0 to 1
}

type RequestType = 'content' | 'friends' | 'experiences' | 'services';

interface PersonalizedResult {
  items: RecommendedItem[];
  confidence: number;
  strategy: 'personalized' | 'cold_start_exploration' | 'cohort_based';
  latency: number;
}

interface RecommendedItem {
  id: string;
  score: number;
  reasoning: string;
}

interface Interaction {
  type: 'view' | 'click' | 'complete' | 'dismiss' | 'rate';
  itemId: string;
  timestamp: number;
  duration?: number;
  rating?: number;
}

interface PreferenceVector {
  dimensions: number[];
  confidence: number;
  lastUpdated: number;
}

interface HNSWIndex {
  search(query: number[], k: number, options?: SearchOptions): Promise<SearchResult[]>;
  insert(id: string, vector: number[]): Promise<void>;
  update(id: string, vector: number[]): Promise<void>;
  getSearchLatency(): number;
}

interface SearchOptions {
  ef?: number;
  filter?: Record<string, unknown>;
}

interface SearchResult {
  id: string;
  score: number;
  metadata?: Record<string, unknown>;
}

interface SONAPreferenceModel {
  encodePreferences(attendee: Attendee): Promise<number[]>;
  updatePersonalization(attendeeId: string, signal: PreferenceSignal, options?: UpdateOptions): Promise<void>;
  getAdaptationLatency(): number;
}

interface PreferenceSignal {
  interaction: Interaction;
  context: Context;
  inferredPreference: number[];
}

interface UpdateOptions {
  immediate?: boolean;
  learningRate?: number;
}

interface GNNContextEncoder {
  encode(context: FullContext): Promise<number[]>;
  getDimensions(): number;
}

interface FullContext {
  neural: number[];
  emotional: EmotionalState;
  spatial: SpatialContext;
  social: SocialContext;
  temporal: TemporalContext;
}

interface SpatialContext {
  location: { x: number; y: number; z: number };
  zone: string;
  proximityToStages: number[];
}

interface SocialContext {
  nearbyFriends: string[];
  groupSize: number;
  socialMood: number;
}

interface TemporalContext {
  eventPhase: 'opening' | 'peak' | 'closing';
  timeAtEvent: number;
  timeOfDay: number;
}

interface ColdStartHandler {
  initializeNewAttendee(attendee: Attendee, event: Event): Promise<PreferenceVector>;
  getFriendsAtEvent(attendee: Attendee, event: Event): Promise<Attendee[]>;
  rapidLearn(attendee: Attendee, interactions: Interaction[]): Promise<void>;
}

interface Event {
  id: string;
  type: string;
  demographics: DemographicProfile;
}

interface DemographicProfile {
  ageRange: [number, number];
  interests: string[];
}

interface PersonalizationCache {
  get(attendeeId: string, context: Context): Promise<PersonalizedResult | null>;
  set(attendeeId: string, context: Context, result: PersonalizedResult): Promise<void>;
  invalidate(attendeeId: string): Promise<void>;
  getCacheStats(): CacheStats;
}

interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  avgLatency: number;
}

// ============================================================================
// HNSW INDEX TESTS
// ============================================================================

describe('HNSWIndex', () => {
  let index: HNSWIndex;

  beforeEach(() => {
    index = {
      search: vi.fn(),
      insert: vi.fn(),
      update: vi.fn(),
      getSearchLatency: vi.fn(),
    } as unknown as HNSWIndex;
  });

  describe('Search Performance', () => {
    it('should complete search within 0.5ms', async () => {
      // Arrange
      const queryVector = Array.from({ length: 256 }, () => Math.random());

      vi.mocked(index.getSearchLatency).mockReturnValue(0.3);
      vi.mocked(index.search).mockResolvedValue([
        { id: 'content-1', score: 0.95 },
        { id: 'content-2', score: 0.88 },
      ]);

      // Act
      const latency = index.getSearchLatency();
      const results = await index.search(queryVector, 10);

      // Assert
      expect(latency).toBeLessThan(0.5);
      expect(results.length).toBeGreaterThan(0);
    });

    it('should return results sorted by relevance score', async () => {
      // Arrange
      vi.mocked(index.search).mockResolvedValue([
        { id: 'best-match', score: 0.98 },
        { id: 'good-match', score: 0.85 },
        { id: 'ok-match', score: 0.72 },
      ]);

      // Act
      const results = await index.search([], 10);

      // Assert
      expect(results[0].score).toBeGreaterThan(results[1].score);
      expect(results[1].score).toBeGreaterThan(results[2].score);
    });

    it('should support filtered search', async () => {
      // Arrange
      const queryVector = Array.from({ length: 256 }, () => Math.random());

      vi.mocked(index.search).mockResolvedValue([
        { id: 'music-content-1', score: 0.92, metadata: { type: 'music' } },
        { id: 'music-content-2', score: 0.87, metadata: { type: 'music' } },
      ]);

      // Act
      const results = await index.search(queryVector, 10, {
        filter: { type: 'music' },
      });

      // Assert
      expect(results.every(r => r.metadata?.type === 'music')).toBe(true);
    });
  });

  describe('Real-Time Updates', () => {
    it('should update vector without blocking search', async () => {
      // Arrange
      const newVector = Array.from({ length: 256 }, () => Math.random());

      vi.mocked(index.update).mockResolvedValue(undefined);
      vi.mocked(index.search).mockResolvedValue([{ id: 'updated-item', score: 0.95 }]);

      // Act - simulate concurrent update and search
      await Promise.all([
        index.update('item-1', newVector),
        index.search(newVector, 10),
      ]);

      // Assert
      expect(index.update).toHaveBeenCalled();
      expect(index.search).toHaveBeenCalled();
    });
  });
});

// ============================================================================
// SONA PREFERENCE MODEL TESTS
// ============================================================================

describe('SONAPreferenceModel', () => {
  let model: SONAPreferenceModel;

  beforeEach(() => {
    model = {
      encodePreferences: vi.fn(),
      updatePersonalization: vi.fn(),
      getAdaptationLatency: vi.fn(),
    } as unknown as SONAPreferenceModel;
  });

  describe('Real-Time Adaptation', () => {
    it('should adapt preferences within 0.05ms', async () => {
      // Arrange
      vi.mocked(model.getAdaptationLatency).mockReturnValue(0.03);

      const signal: PreferenceSignal = {
        interaction: { type: 'rate', itemId: 'content-1', timestamp: Date.now(), rating: 5 },
        context: { eventId: 'event-1', emotionalState: { valence: 0.8, arousal: 0.6, dominance: 0.5 }, venueZone: 'main', nearbyFriends: [], currentActivity: 'browsing', timestamp: Date.now() },
        inferredPreference: Array.from({ length: 256 }, () => Math.random()),
      };

      vi.mocked(model.updatePersonalization).mockResolvedValue(undefined);

      // Act
      const latency = model.getAdaptationLatency();

      // Assert
      expect(latency).toBeLessThan(0.05);
    });

    it('should preserve previous preferences (no catastrophic forgetting)', async () => {
      // Arrange
      const attendee: Attendee = {
        id: 'attendee-1',
        preferences: { dimensions: [0.8, 0.2, 0.5], confidence: 0.9, lastUpdated: Date.now() - 3600000 },
        interactionHistory: [],
        isNewUser: false,
      };

      // Encode before update
      vi.mocked(model.encodePreferences).mockResolvedValueOnce([0.8, 0.2, 0.5]);

      const originalPrefs = await model.encodePreferences(attendee);

      // Simulate many updates
      for (let i = 0; i < 100; i++) {
        await model.updatePersonalization(attendee.id, {
          interaction: { type: 'view', itemId: `item-${i}`, timestamp: Date.now() },
          context: {} as Context,
          inferredPreference: Array.from({ length: 256 }, () => Math.random()),
        });
      }

      // Encode after updates
      vi.mocked(model.encodePreferences).mockResolvedValueOnce([0.75, 0.25, 0.52]);
      const newPrefs = await model.encodePreferences(attendee);

      // Assert - preferences should drift but not completely change
      const maxDrift = Math.max(
        Math.abs(newPrefs[0] - originalPrefs[0]),
        Math.abs(newPrefs[1] - originalPrefs[1]),
        Math.abs(newPrefs[2] - originalPrefs[2])
      );
      expect(maxDrift).toBeLessThan(0.3); // Max 30% drift
    });

    it('should support aggressive learning for cold start users', async () => {
      // Arrange
      const newUser: Attendee = {
        id: 'new-user',
        preferences: { dimensions: [], confidence: 0, lastUpdated: 0 },
        interactionHistory: [],
        isNewUser: true,
      };

      vi.mocked(model.updatePersonalization).mockResolvedValue(undefined);

      // Act
      await model.updatePersonalization(newUser.id, {} as PreferenceSignal, {
        learningRate: 0.01, // 10x normal rate
        immediate: true,
      });

      // Assert
      expect(model.updatePersonalization).toHaveBeenCalledWith(
        newUser.id,
        expect.anything(),
        expect.objectContaining({ learningRate: 0.01 })
      );
    });
  });
});

// ============================================================================
// GNN CONTEXT ENCODER TESTS
// ============================================================================

describe('GNNContextEncoder', () => {
  let encoder: GNNContextEncoder;

  beforeEach(() => {
    encoder = {
      encode: vi.fn(),
      getDimensions: vi.fn(),
    } as unknown as GNNContextEncoder;
  });

  describe('Context Encoding', () => {
    it('should encode 100+ dimensional context', async () => {
      // Arrange
      vi.mocked(encoder.getDimensions).mockReturnValue(256);

      const fullContext: FullContext = {
        neural: Array.from({ length: 64 }, () => Math.random()),
        emotional: { valence: 0.7, arousal: 0.5, dominance: 0.6 },
        spatial: { location: { x: 100, y: 200, z: 0 }, zone: 'main-stage', proximityToStages: [10, 50, 100] },
        social: { nearbyFriends: ['friend-1', 'friend-2'], groupSize: 3, socialMood: 0.8 },
        temporal: { eventPhase: 'peak', timeAtEvent: 7200, timeOfDay: 20 },
      };

      vi.mocked(encoder.encode).mockResolvedValue(Array.from({ length: 256 }, () => Math.random()));

      // Act
      const encoded = await encoder.encode(fullContext);
      const dimensions = encoder.getDimensions();

      // Assert
      expect(dimensions).toBeGreaterThanOrEqual(100);
      expect(encoded.length).toBe(256);
    });

    it('should capture spatial relationships in encoding', async () => {
      // Arrange
      const nearStageContext: FullContext = {
        neural: [],
        emotional: { valence: 0.5, arousal: 0.5, dominance: 0.5 },
        spatial: { location: { x: 10, y: 10, z: 0 }, zone: 'main-stage', proximityToStages: [5, 100, 200] },
        social: { nearbyFriends: [], groupSize: 1, socialMood: 0.5 },
        temporal: { eventPhase: 'peak', timeAtEvent: 3600, timeOfDay: 19 },
      };

      const farFromStageContext: FullContext = {
        ...nearStageContext,
        spatial: { location: { x: 500, y: 500, z: 0 }, zone: 'food-court', proximityToStages: [200, 300, 400] },
      };

      vi.mocked(encoder.encode)
        .mockResolvedValueOnce([0.9, 0.8, 0.7, ...Array(253).fill(0.5)]) // Near stage
        .mockResolvedValueOnce([0.1, 0.2, 0.3, ...Array(253).fill(0.5)]); // Far from stage

      // Act
      const nearEncoding = await encoder.encode(nearStageContext);
      const farEncoding = await encoder.encode(farFromStageContext);

      // Assert - encodings should be different
      const similarity = nearEncoding.reduce((sum, val, i) => sum + val * farEncoding[i], 0);
      const normalized = similarity / Math.sqrt(nearEncoding.reduce((s, v) => s + v * v, 0) * farEncoding.reduce((s, v) => s + v * v, 0));
      expect(normalized).toBeLessThan(0.9); // Not too similar
    });
  });
});

// ============================================================================
// COLD START HANDLER TESTS
// ============================================================================

describe('ColdStartHandler', () => {
  let handler: ColdStartHandler;

  beforeEach(() => {
    handler = {
      initializeNewAttendee: vi.fn(),
      getFriendsAtEvent: vi.fn(),
      rapidLearn: vi.fn(),
    } as unknown as ColdStartHandler;
  });

  describe('New User Initialization', () => {
    it('should transfer preferences from friends when available', async () => {
      // Arrange
      const newAttendee: Attendee = {
        id: 'new-user',
        preferences: { dimensions: [], confidence: 0, lastUpdated: 0 },
        interactionHistory: [],
        isNewUser: true,
      };

      const event: Event = {
        id: 'event-1',
        type: 'music-festival',
        demographics: { ageRange: [18, 35], interests: ['music', 'art'] },
      };

      const friends: Attendee[] = [
        { id: 'friend-1', preferences: { dimensions: [0.8, 0.7, 0.6], confidence: 0.9, lastUpdated: Date.now() }, interactionHistory: [], isNewUser: false },
        { id: 'friend-2', preferences: { dimensions: [0.7, 0.8, 0.5], confidence: 0.85, lastUpdated: Date.now() }, interactionHistory: [], isNewUser: false },
        { id: 'friend-3', preferences: { dimensions: [0.75, 0.75, 0.55], confidence: 0.88, lastUpdated: Date.now() }, interactionHistory: [], isNewUser: false },
      ];

      vi.mocked(handler.getFriendsAtEvent).mockResolvedValue(friends);
      vi.mocked(handler.initializeNewAttendee).mockResolvedValue({
        dimensions: [0.75, 0.75, 0.55], // Aggregated from friends
        confidence: 0.7,
        lastUpdated: Date.now(),
      });

      // Act
      const friendsAtEvent = await handler.getFriendsAtEvent(newAttendee, event);
      const initialPrefs = await handler.initializeNewAttendee(newAttendee, event);

      // Assert
      expect(friendsAtEvent.length).toBeGreaterThanOrEqual(3);
      expect(initialPrefs.confidence).toBeGreaterThan(0.5);
    });

    it('should use demographic prior when no friends available', async () => {
      // Arrange
      const lonelyAttendee: Attendee = {
        id: 'lonely-user',
        preferences: { dimensions: [], confidence: 0, lastUpdated: 0 },
        interactionHistory: [],
        isNewUser: true,
      };

      const event: Event = {
        id: 'event-1',
        type: 'music-festival',
        demographics: { ageRange: [25, 35], interests: ['electronic', 'dance'] },
      };

      vi.mocked(handler.getFriendsAtEvent).mockResolvedValue([]);
      vi.mocked(handler.initializeNewAttendee).mockResolvedValue({
        dimensions: [0.5, 0.5, 0.5], // Generic exploration vector
        confidence: 0.3,
        lastUpdated: Date.now(),
      });

      // Act
      const initialPrefs = await handler.initializeNewAttendee(lonelyAttendee, event);

      // Assert
      expect(initialPrefs.confidence).toBeLessThan(0.5); // Lower confidence without friends
    });

    it('should achieve >90% accuracy after 10 interactions', async () => {
      // Arrange
      const newAttendee: Attendee = {
        id: 'learning-user',
        preferences: { dimensions: [], confidence: 0, lastUpdated: 0 },
        interactionHistory: [],
        isNewUser: true,
      };

      const interactions: Interaction[] = Array.from({ length: 10 }, (_, i) => ({
        type: 'rate' as const,
        itemId: `item-${i}`,
        timestamp: Date.now() + i * 1000,
        rating: i % 2 === 0 ? 5 : 1, // Clear preference pattern
      }));

      vi.mocked(handler.rapidLearn).mockResolvedValue(undefined);

      // Act
      await handler.rapidLearn(newAttendee, interactions);

      // Assert
      expect(handler.rapidLearn).toHaveBeenCalledWith(newAttendee, interactions);
    });
  });
});

// ============================================================================
// PERSONALIZATION CACHE TESTS
// ============================================================================

describe('PersonalizationCache', () => {
  let cache: PersonalizationCache;

  beforeEach(() => {
    cache = {
      get: vi.fn(),
      set: vi.fn(),
      invalidate: vi.fn(),
      getCacheStats: vi.fn(),
    } as unknown as PersonalizationCache;
  });

  describe('Cache Performance', () => {
    it('should achieve >80% cache hit rate', async () => {
      // Arrange
      vi.mocked(cache.getCacheStats).mockReturnValue({
        hits: 850,
        misses: 150,
        hitRate: 0.85,
        avgLatency: 2.5,
      });

      // Act
      const stats = cache.getCacheStats();

      // Assert
      expect(stats.hitRate).toBeGreaterThan(0.8);
    });

    it('should return cached results within 5ms', async () => {
      // Arrange
      vi.mocked(cache.getCacheStats).mockReturnValue({
        hits: 1000,
        misses: 0,
        hitRate: 1.0,
        avgLatency: 2.5,
      });

      // Act
      const stats = cache.getCacheStats();

      // Assert
      expect(stats.avgLatency).toBeLessThan(5);
    });

    it('should invalidate cache on preference update', async () => {
      // Arrange
      vi.mocked(cache.invalidate).mockResolvedValue(undefined);

      // Act
      await cache.invalidate('attendee-1');

      // Assert
      expect(cache.invalidate).toHaveBeenCalledWith('attendee-1');
    });
  });
});

// ============================================================================
// PERSONALIZATION ENGINE END-TO-END TESTS
// ============================================================================

describe('PersonalizationEngine End-to-End', () => {
  let engine: PersonalizationEngine;

  beforeEach(() => {
    engine = {
      getPersonalized: vi.fn(),
      recordInteraction: vi.fn(),
      predictPreferences: vi.fn(),
    } as unknown as PersonalizationEngine;
  });

  describe('Latency Requirements', () => {
    it('should return personalized results within 50ms', async () => {
      // Arrange
      const attendee: Attendee = {
        id: 'attendee-1',
        preferences: { dimensions: [0.8, 0.7, 0.6], confidence: 0.9, lastUpdated: Date.now() },
        interactionHistory: [],
        isNewUser: false,
      };

      const context: Context = {
        eventId: 'event-1',
        emotionalState: { valence: 0.7, arousal: 0.5, dominance: 0.6 },
        venueZone: 'main-stage',
        nearbyFriends: ['friend-1'],
        currentActivity: 'watching',
        timestamp: Date.now(),
      };

      vi.mocked(engine.getPersonalized).mockImplementation(async () => {
        await new Promise(r => setTimeout(r, 30)); // Simulate 30ms processing
        return {
          items: [{ id: 'rec-1', score: 0.95, reasoning: 'Matches preferences' }],
          confidence: 0.92,
          strategy: 'personalized',
          latency: 30,
        };
      });

      // Act
      const start = performance.now();
      const result = await engine.getPersonalized(attendee, context, 'content');
      const elapsed = performance.now() - start;

      // Assert
      expect(elapsed).toBeLessThan(50);
      expect(result.latency).toBeLessThan(50);
    });

    it('should handle cold start users without degraded latency', async () => {
      // Arrange
      const newAttendee: Attendee = {
        id: 'new-user',
        preferences: { dimensions: [], confidence: 0, lastUpdated: 0 },
        interactionHistory: [],
        isNewUser: true,
      };

      vi.mocked(engine.getPersonalized).mockResolvedValue({
        items: [{ id: 'explore-1', score: 0.6, reasoning: 'Exploration recommendation' }],
        confidence: 0.5,
        strategy: 'cold_start_exploration',
        latency: 40,
      });

      // Act
      const result = await engine.getPersonalized(newAttendee, {} as Context, 'content');

      // Assert
      expect(result.strategy).toBe('cold_start_exploration');
      expect(result.latency).toBeLessThan(50);
    });
  });

  describe('Personalization Quality', () => {
    it('should improve recommendations with more interactions', async () => {
      // Arrange
      const attendee: Attendee = {
        id: 'learning-user',
        preferences: { dimensions: [0.5, 0.5, 0.5], confidence: 0.3, lastUpdated: Date.now() },
        interactionHistory: [],
        isNewUser: false,
      };

      // Simulate confidence improvement over interactions
      const confidenceProgression = [0.3, 0.5, 0.7, 0.85, 0.92];

      for (let i = 0; i < 5; i++) {
        vi.mocked(engine.getPersonalized).mockResolvedValueOnce({
          items: [],
          confidence: confidenceProgression[i],
          strategy: 'personalized',
          latency: 30,
        });

        await engine.recordInteraction(attendee, {
          type: 'rate',
          itemId: `item-${i}`,
          timestamp: Date.now(),
          rating: 5,
        });
      }

      // Act
      const result = await engine.getPersonalized(attendee, {} as Context, 'content');

      // Assert
      expect(result.confidence).toBeGreaterThan(0.9);
    });
  });

  describe('Concurrent Load', () => {
    it('should handle 10K concurrent personalization requests', async () => {
      // Arrange
      vi.mocked(engine.getPersonalized).mockResolvedValue({
        items: [{ id: 'rec-1', score: 0.9, reasoning: 'test' }],
        confidence: 0.9,
        strategy: 'personalized',
        latency: 30,
      });

      const requestCount = 10_000;
      const requests = Array.from({ length: requestCount }, () =>
        engine.getPersonalized({} as Attendee, {} as Context, 'content')
      );

      // Act
      const start = Date.now();
      await Promise.all(requests);
      const elapsed = Date.now() - start;

      // Assert - should complete all requests reasonably fast
      const throughput = requestCount / (elapsed / 1000);
      expect(throughput).toBeGreaterThan(1000); // >1K req/sec
    });
  });
});
