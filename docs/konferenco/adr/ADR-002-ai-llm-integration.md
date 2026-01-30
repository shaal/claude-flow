# ADR-002: AI/LLM Integration Strategy for Konferenco

**Status**: Proposed
**Date**: 2026-01-30
**Authors**: Architecture Team
**Deciders**: Platform Engineering, AI/ML Team
**Technical Story**: Enable AI-powered features for intelligent event experiences

---

## Context and Problem Statement

Konferenco aims to revolutionize live events through intelligent, AI-powered features that enhance attendee experiences. We need a comprehensive strategy for integrating Large Language Models (LLMs) and vector search capabilities to enable:

- Intelligent content discovery and recommendations
- AI-assisted networking between attendees
- Real-time language support and accessibility
- Personalized event experiences at scale

The challenge is balancing powerful AI capabilities with performance requirements, cost constraints, and user privacy expectations for a real-time event platform serving thousands of concurrent users.

---

## Decision Drivers

1. **Real-time Performance**: Sub-second response times for interactive features
2. **Scale**: Support 100K+ concurrent attendees with personalized experiences
3. **Privacy**: Protect attendee data while enabling intelligent features
4. **Cost Efficiency**: Optimize model usage to maintain sustainable unit economics
5. **Reliability**: Graceful degradation when AI services are unavailable
6. **Accuracy**: High-quality, relevant results that build user trust

---

## Decision

We will implement a **hybrid AI architecture** combining:

1. **Local-first inference** for latency-sensitive operations
2. **Cloud LLMs** for complex reasoning tasks
3. **RuVector + Claude-Flow** for vector search and swarm coordination
4. **3-tier model routing** based on task complexity

---

## 1. LLM-Powered Features

### 1.1 Conversational Event Search

**Description**: Natural language interface for finding sessions, speakers, and content.

```typescript
interface ConversationalSearchRequest {
  query: string;              // "Find talks about AI ethics tomorrow morning"
  context: {
    attendeeId: string;
    currentLocation?: string;
    previousSearches?: string[];
    timeContext: Date;
  };
}

interface ConversationalSearchResponse {
  interpretation: string;     // "Looking for AI ethics sessions on Day 2 AM"
  results: SearchResult[];
  suggestions: string[];      // Follow-up query suggestions
  confidence: number;
}
```

**Implementation Flow**:

```
User Query
    |
    v
[Intent Classification] -----> Local Model (Haiku)
    |                          - Session search
    |                          - Speaker lookup
    |                          - Networking request
    v
[Entity Extraction] ---------> Local NER Model
    |                          - Topics, dates, times
    |                          - Speaker names
    |                          - Locations
    v
[Semantic Search] -----------> HNSW Index (ruvector)
    |                          - Vector similarity
    |                          - Metadata filtering
    v
[Result Ranking] ------------> Hybrid scoring
    |                          - Relevance + personalization
    |                          - Availability weighting
    v
[Response Generation] -------> Conditional routing
                               - Simple: template
                               - Complex: LLM synthesis
```

**Test Scenarios**:
```yaml
conversational_search_tests:
  - name: "Basic topic search"
    query: "Find machine learning talks"
    expected:
      intent: "session_search"
      entities: ["machine learning"]
      min_results: 5
      latency_p95: "<500ms"

  - name: "Complex temporal query"
    query: "What's happening in Track A after my current session?"
    expected:
      intent: "schedule_lookup"
      context_required: ["current_session", "track_schedule"]
      latency_p95: "<800ms"

  - name: "Ambiguous query handling"
    query: "Something about data"
    expected:
      clarification_requested: true
      suggestions_count: ">= 3"
```

### 1.2 AI Networking Assistant

**Description**: Intelligent matchmaking for attendee networking.

```typescript
interface NetworkingRequest {
  type: 'find_people' | 'introduction' | 'follow_up';
  criteria: string;           // "Find me people interested in MLOps"
  preferences: {
    groupSize: 'one-on-one' | 'small-group' | 'any';
    timeSlot?: string;
    excludeIds?: string[];    // People already met
  };
}

interface NetworkingMatch {
  attendee: AttendeeProfile;
  matchScore: number;         // 0-1 relevance score
  commonInterests: string[];
  suggestedIcebreaker: string;
  availableSlots: TimeSlot[];
}
```

**Matching Algorithm**:

```
1. ENCODE attendee profile into embedding vector
   - Skills, interests, goals, company, role
   - Use MiniLM-L6-v2 (384 dimensions)

2. SEARCH HNSW index with filters
   - Exclude already-connected attendees
   - Filter by availability, preferences
   - Return top-K candidates

3. RERANK using learned patterns
   - Query ReasoningBank for successful match patterns
   - Apply collaborative filtering signals
   - Weight by mutual interest overlap

4. GENERATE icebreaker suggestions
   - Local model for simple suggestions
   - Claude API for creative, context-rich intros

5. RECORD outcome for learning
   - Track if introduction happened
   - Collect post-networking feedback
   - Update pattern weights
```

**Privacy Controls**:
```yaml
networking_privacy:
  opt_in_required: true
  data_exposure_levels:
    public:
      - name
      - company
      - role
      - public_interests

    matched_only:
      - detailed_interests
      - goals
      - availability

    never_shared:
      - contact_info (until mutual consent)
      - past_interactions
      - internal_scores
```

### 1.3 Content Summarization

**Description**: AI-generated summaries for sessions, speakers, and tracks.

```typescript
interface SummarizationConfig {
  content_type: 'session' | 'speaker_bio' | 'track_overview' | 'day_recap';
  length: 'brief' | 'standard' | 'detailed';
  focus?: string[];           // Aspects to emphasize
  audience?: 'technical' | 'business' | 'general';
}

interface ContentSummary {
  summary: string;
  keyPoints: string[];
  relatedTopics: string[];
  generatedAt: Date;
  modelUsed: string;
  confidence: number;
}
```

**Caching Strategy**:
```yaml
summarization_cache:
  session_summaries:
    ttl: "24h"                # Refresh daily
    invalidate_on: ["description_change", "speaker_change"]
    pre_generate: true        # Generate before event starts

  day_recaps:
    ttl: "until_next_day"
    generate_at: "22:00 local"
    include: ["top_sessions", "key_moments", "tomorrow_preview"]

  real_time_summaries:
    enabled_for: ["live_qa", "panel_discussions"]
    latency_target: "<3s"
    model: "claude-3-haiku"
```

### 1.4 Real-time Translation

**Description**: Multi-language support for global events.

```typescript
interface TranslationService {
  // Real-time speech-to-text + translation
  streamTranscription(
    audioStream: ReadableStream,
    sourceLanguage: string,
    targetLanguages: string[]
  ): AsyncIterable<TranslatedSegment>;

  // Text translation for content
  translateContent(
    content: string,
    targetLanguage: string,
    context?: 'session_title' | 'description' | 'chat'
  ): Promise<TranslatedContent>;
}

interface TranslatedSegment {
  original: string;
  translations: Map<string, string>;
  timestamp: number;
  confidence: number;
  speakerId?: string;
}
```

**Model Selection for Translation**:
```yaml
translation_routing:
  real_time_captions:
    model: "whisper-large-v3"       # Local inference
    latency_target: "<500ms"
    languages: ["en", "es", "fr", "de", "zh", "ja", "ko"]

  content_translation:
    simple_content:
      model: "nllb-200"             # Local, open-source
      use_when: "word_count < 500"

    complex_content:
      model: "claude-3-haiku"
      use_when: "technical_terms OR nuanced_context"

  fallback:
    strategy: "cached_translation"
    notify_user: true
```

### 1.5 Smart Schedule Optimization

**Description**: AI-powered schedule building and conflict resolution.

```typescript
interface ScheduleOptimizer {
  // Build optimal personal schedule
  generateSchedule(
    attendee: AttendeeProfile,
    constraints: ScheduleConstraints,
    preferences: SchedulePreferences
  ): Promise<OptimizedSchedule>;

  // Suggest alternatives for conflicts
  resolveConflict(
    conflictingSessions: Session[],
    attendeeContext: AttendeeContext
  ): Promise<ConflictResolution>;

  // Real-time rescheduling suggestions
  adaptSchedule(
    currentSchedule: Schedule,
    event: ScheduleChangeEvent
  ): Promise<ScheduleAdaptation>;
}

interface OptimizedSchedule {
  sessions: ScheduledSession[];
  networkingSlots: TimeSlot[];
  breakSlots: TimeSlot[];
  score: number;
  reasoning: string[];
}
```

**Optimization Algorithm**:
```
1. EXTRACT preferences from:
   - Explicit interests (profile)
   - Implicit signals (browsing, bookmarks)
   - Historical patterns (past events)

2. SCORE each session:
   score = w1 * relevance_to_interests
         + w2 * speaker_reputation
         + w3 * attendee_reviews
         + w4 * networking_opportunity
         - w5 * travel_time_penalty

3. SOLVE constraint satisfaction:
   - No time overlaps
   - Include required sessions
   - Balance topic variety
   - Include networking/break time

4. GENERATE explanation:
   - Why each session was chosen
   - Trade-offs made
   - Alternative sessions available
```

---

## 2. Vector Search (RuVector Integration)

### 2.1 Architecture Overview

```
                    +---------------------------+
                    |     Konferenco API        |
                    +-------------+-------------+
                                  |
                    +-------------v-------------+
                    |    Embedding Service      |
                    |    (MiniLM-L6 / ONNX)    |
                    +-------------+-------------+
                                  |
         +------------------------+------------------------+
         |                        |                        |
+--------v--------+    +----------v----------+    +--------v--------+
|  Attendee Index |    |   Session Index     |    |  Content Index  |
|  (100K vectors) |    |   (10K vectors)     |    |  (1M vectors)   |
+-----------------+    +---------------------+    +-----------------+
|  HNSW M=16      |    |  HNSW M=16          |    |  HNSW M=32      |
|  dim=384        |    |  dim=384            |    |  dim=384        |
|  ef=100         |    |  ef=100             |    |  ef=200         |
+-----------------+    +---------------------+    +-----------------+
```

### 2.2 Attendee Similarity Matching

```typescript
interface AttendeeEmbedding {
  id: string;
  vector: Float32Array;       // 384 dimensions
  metadata: {
    interests: string[];
    role: string;
    company: string;
    goals: string[];
    availableForNetworking: boolean;
    lastActive: Date;
  };
}

class AttendeeMatchingService {
  private index: HNSWIndex;
  private embeddingService: EmbeddingService;

  async findSimilarAttendees(
    attendeeId: string,
    options: MatchOptions
  ): Promise<AttendeeMatch[]> {
    const attendee = await this.getAttendeeEmbedding(attendeeId);

    // Search with filters
    const results = await this.index.searchWithFilters(
      attendee.vector,
      options.limit || 10,
      (candidateId) => {
        const candidate = this.metadata.get(candidateId);
        return (
          candidateId !== attendeeId &&
          candidate.availableForNetworking &&
          !options.exclude?.includes(candidateId) &&
          this.meetsPreferences(candidate, options.preferences)
        );
      }
    );

    return this.enrichWithMatchDetails(results, attendee);
  }
}
```

**Embedding Generation**:
```typescript
function generateAttendeeEmbedding(profile: AttendeeProfile): string {
  // Create rich text representation for embedding
  return `
    Role: ${profile.role} at ${profile.company}
    Industry: ${profile.industry}
    Interests: ${profile.interests.join(', ')}
    Looking for: ${profile.goals.join(', ')}
    Experience with: ${profile.skills.join(', ')}
    Event goals: ${profile.eventGoals}
  `.trim();
}
```

### 2.3 Session Recommendation Engine

```typescript
interface SessionRecommendation {
  session: Session;
  score: number;
  reasons: RecommendationReason[];
  alternativeTimes?: Session[];  // Same/similar content, different time
}

interface RecommendationReason {
  type: 'interest_match' | 'speaker_follow' | 'popular' | 'networking_opportunity';
  description: string;
  weight: number;
}

class SessionRecommender {
  async getRecommendations(
    attendeeId: string,
    context: RecommendationContext
  ): Promise<SessionRecommendation[]> {
    // Multi-signal recommendation
    const signals = await Promise.all([
      this.getInterestBasedRecommendations(attendeeId),
      this.getCollaborativeRecommendations(attendeeId),
      this.getPopularityBasedRecommendations(context),
      this.getNetworkingOpportunityRecommendations(attendeeId)
    ]);

    // Merge and deduplicate
    const merged = this.mergeRecommendations(signals, {
      weights: {
        interest: 0.4,
        collaborative: 0.25,
        popularity: 0.15,
        networking: 0.2
      }
    });

    // Apply schedule constraints
    return this.filterByAvailability(merged, attendeeId);
  }
}
```

### 2.4 Semantic Search Across Content

```typescript
interface SemanticSearchOptions {
  query: string;
  contentTypes: ('session' | 'speaker' | 'resource' | 'qa')[];
  filters?: {
    track?: string[];
    day?: string[];
    difficulty?: string[];
  };
  limit: number;
  includeHighlights: boolean;
}

interface SemanticSearchResult {
  id: string;
  type: string;
  content: any;
  score: number;
  highlights?: string[];      // Relevant excerpts
}

class SemanticSearchService {
  async search(options: SemanticSearchOptions): Promise<SemanticSearchResult[]> {
    // Generate query embedding
    const queryEmbedding = await this.embed(options.query);

    // Search appropriate indices based on content types
    const searchPromises = options.contentTypes.map(type =>
      this.searchIndex(type, queryEmbedding, options)
    );

    const results = await Promise.all(searchPromises);

    // Merge, rank, and return
    return this.mergeAndRank(results.flat(), options.limit);
  }

  private async searchIndex(
    type: string,
    embedding: Float32Array,
    options: SemanticSearchOptions
  ): Promise<SemanticSearchResult[]> {
    const index = this.indices.get(type);

    // Hybrid query: semantic + structured filters
    return this.hybridBackend.queryHybrid({
      semantic: { embedding, k: options.limit * 2 },
      structured: this.buildStructuredFilter(options.filters),
      combineStrategy: 'semantic-weighted'  // Semantic primary, filters refine
    });
  }
}
```

### 2.5 HNSW Configuration

```yaml
hnsw_indices:
  attendees:
    dimensions: 384
    M: 16                     # Connections per node
    efConstruction: 200       # Build quality (higher = better, slower)
    efSearch: 100             # Query quality
    maxElements: 200000       # Capacity with headroom
    metric: "cosine"
    quantization: "none"      # Full precision for accuracy

  sessions:
    dimensions: 384
    M: 16
    efConstruction: 200
    efSearch: 100
    maxElements: 50000
    metric: "cosine"
    quantization: "none"

  content:                    # Slides, resources, Q&A
    dimensions: 384
    M: 32                     # Higher connectivity for large index
    efConstruction: 300
    efSearch: 200
    maxElements: 2000000
    metric: "cosine"
    quantization: "scalar_8bit"  # Compression for scale

performance_targets:
  search_latency_p50: "<1ms"
  search_latency_p99: "<10ms"
  index_build_time: "<5min per 100K vectors"
  memory_per_100k_vectors: "<500MB"
```

---

## 3. Personalization Engine

### 3.1 Learning Attendee Preferences

```typescript
interface PreferenceModel {
  explicit: ExplicitPreferences;    // User-stated
  implicit: ImplicitPreferences;    // Behavior-derived
  contextual: ContextualFactors;    // Situational
}

interface ExplicitPreferences {
  interests: WeightedTopic[];
  contentFormats: string[];         // Talks, workshops, panels
  networkingGoals: string[];
  dietaryRestrictions?: string[];
  accessibilityNeeds?: string[];
}

interface ImplicitPreferences {
  topicEngagement: Map<string, EngagementScore>;
  speakerAffinities: Map<string, number>;
  sessionTypePreferences: Map<string, number>;
  timeOfDayPreferences: Map<string, number>;
  engagementPatterns: EngagementPattern[];
}

interface ContextualFactors {
  currentLocation?: string;
  energyLevel?: 'low' | 'medium' | 'high';
  socialMood?: 'networking' | 'learning' | 'recharging';
  scheduleFullness: number;
  timeUntilNextSession: number;
}
```

**Preference Learning Pipeline**:

```
+------------------+     +-------------------+     +------------------+
|  Event Signals   |     |  Signal Processor |     |  Preference      |
|                  | --> |                   | --> |  Model Update    |
|  - Session views |     |  - Normalize      |     |                  |
|  - Bookmarks     |     |  - Weight decay   |     |  - Topic weights |
|  - Attendance    |     |  - Context enrich |     |  - Format prefs  |
|  - Q&A activity  |     |  - Noise filter   |     |  - Time prefs    |
|  - Networking    |     |                   |     |                  |
+------------------+     +-------------------+     +------------------+
                                                           |
                                                           v
                                                  +------------------+
                                                  |  ReasoningBank   |
                                                  |                  |
                                                  |  - Store pattern |
                                                  |  - Cross-user    |
                                                  |    learning      |
                                                  +------------------+
```

**Signal Weights**:
```yaml
preference_signals:
  explicit_interest:
    weight: 1.0
    decay: "none"

  session_attendance:
    weight: 0.8
    decay: "linear_7d"

  session_completion:          # Stayed full duration
    weight: 0.6
    decay: "linear_7d"

  bookmark:
    weight: 0.4
    decay: "linear_30d"

  session_view:
    weight: 0.2
    decay: "exponential_24h"

  negative_signals:
    early_departure:
      weight: -0.5
    session_skip:              # Bookmarked but didn't attend
      weight: -0.3
```

### 3.2 Adaptive Recommendations

```typescript
class AdaptiveRecommender {
  private sonaOptimizer: SONAOptimizer;
  private reasoningBank: ReasoningBank;

  async getAdaptiveRecommendations(
    attendeeId: string,
    context: RecommendationContext
  ): Promise<AdaptiveRecommendation[]> {
    // 1. Get current preference model
    const preferences = await this.getPreferenceModel(attendeeId);

    // 2. Apply SONA adaptation for real-time signals
    const adaptedPreferences = await this.sonaOptimizer.adapt(
      preferences,
      context.recentSignals
    );

    // 3. Query ReasoningBank for successful patterns
    const patterns = await this.reasoningBank.searchPatterns(
      `recommendations for ${attendeeId}`,
      5
    );

    // 4. Generate recommendations with explanation
    const recommendations = await this.generateRecommendations(
      adaptedPreferences,
      patterns,
      context
    );

    // 5. Add exploration for preference discovery
    return this.addExplorationItems(recommendations, preferences);
  }

  private addExplorationItems(
    recommendations: Recommendation[],
    preferences: PreferenceModel
  ): AdaptiveRecommendation[] {
    // 10% exploration: suggest things outside known preferences
    const explorationCount = Math.ceil(recommendations.length * 0.1);

    const explorationItems = this.findNovelItems(
      preferences,
      explorationCount
    );

    return [
      ...recommendations,
      ...explorationItems.map(item => ({
        ...item,
        isExploration: true,
        explorationReason: "Expanding your horizons"
      }))
    ];
  }
}
```

### 3.3 Context-Aware Suggestions

```typescript
interface ContextAwareSuggestion {
  type: 'session' | 'networking' | 'break' | 'resource';
  content: any;
  reason: string;
  urgency: 'immediate' | 'soon' | 'later';
  confidence: number;
}

class ContextAwareSuggester {
  async getSuggestions(
    attendeeId: string,
    currentContext: AttendeeContext
  ): Promise<ContextAwareSuggestion[]> {
    const suggestions: ContextAwareSuggestion[] = [];

    // Time-based suggestions
    if (currentContext.minutesUntilNextSession < 15) {
      suggestions.push(
        await this.getPreSessionSuggestion(attendeeId, currentContext)
      );
    }

    // Location-based suggestions
    if (currentContext.location) {
      suggestions.push(
        ...await this.getNearbyNetworkingOpportunities(
          attendeeId,
          currentContext.location
        )
      );
    }

    // Energy-aware suggestions
    if (currentContext.sessionCount > 3 && !currentContext.hadBreak) {
      suggestions.push({
        type: 'break',
        content: await this.findNearestLounge(currentContext.location),
        reason: "You've been in sessions for a while. Take a break?",
        urgency: 'soon',
        confidence: 0.7
      });
    }

    // Interest-triggered suggestions
    const trendingTopic = await this.getTrendingTopicMatch(attendeeId);
    if (trendingTopic) {
      suggestions.push({
        type: 'session',
        content: trendingTopic.session,
        reason: `${trendingTopic.topic} is trending - matches your interests!`,
        urgency: 'later',
        confidence: 0.8
      });
    }

    return this.prioritize(suggestions);
  }
}
```

---

## 4. Model Selection Strategy

### 4.1 3-Tier Model Routing

```
+------------------------------------------------------------------+
|                        TASK ROUTER                                |
+------------------------------------------------------------------+
|                              |                                    |
v                              v                                    v
+----------------+   +------------------+   +----------------------+
|   TIER 1       |   |   TIER 2         |   |   TIER 3             |
|   Agent Booster|   |   Haiku          |   |   Sonnet/Opus        |
+----------------+   +------------------+   +----------------------+
|                |   |                  |   |                      |
| - Simple edits |   | - Intent class.  |   | - Complex reasoning  |
| - Transforms   |   | - Simple Q&A     |   | - Creative writing   |
| - Templating   |   | - Summarization  |   | - Multi-step planning|
|                |   | - Translation    |   | - Architecture       |
+----------------+   +------------------+   +----------------------+
|                |   |                  |   |                      |
| Latency: <1ms  |   | Latency: ~500ms  |   | Latency: 2-5s        |
| Cost: $0       |   | Cost: $0.0002    |   | Cost: $0.003-0.015   |
| Local WASM     |   | Cloud API        |   | Cloud API            |
+----------------+   +------------------+   +----------------------+
```

### 4.2 Task Complexity Classification

```typescript
interface TaskComplexityAnalysis {
  complexity: 'simple' | 'medium' | 'complex';
  score: number;              // 0-1
  factors: ComplexityFactor[];
  recommendedTier: 1 | 2 | 3;
  recommendedModel: string;
}

function classifyTaskComplexity(task: AITask): TaskComplexityAnalysis {
  const factors: ComplexityFactor[] = [];
  let score = 0;

  // Factor: Multi-step reasoning required
  if (task.requiresReasoning) {
    score += 0.3;
    factors.push({ name: 'reasoning', weight: 0.3 });
  }

  // Factor: Context length
  if (task.contextTokens > 4000) {
    score += 0.2;
    factors.push({ name: 'long_context', weight: 0.2 });
  }

  // Factor: Creative output needed
  if (task.outputType === 'creative') {
    score += 0.25;
    factors.push({ name: 'creative', weight: 0.25 });
  }

  // Factor: Domain expertise
  if (task.requiresDomainKnowledge) {
    score += 0.15;
    factors.push({ name: 'domain_expertise', weight: 0.15 });
  }

  // Factor: Safety-critical
  if (task.isSafetyCritical) {
    score += 0.3;
    factors.push({ name: 'safety_critical', weight: 0.3 });
  }

  return {
    complexity: score < 0.3 ? 'simple' : score < 0.6 ? 'medium' : 'complex',
    score,
    factors,
    recommendedTier: score < 0.3 ? 1 : score < 0.6 ? 2 : 3,
    recommendedModel: getRecommendedModel(score)
  };
}

function getRecommendedModel(complexityScore: number): string {
  if (complexityScore < 0.3) return 'agent-booster';
  if (complexityScore < 0.5) return 'claude-3-haiku';
  if (complexityScore < 0.7) return 'claude-3-sonnet';
  return 'claude-opus-4';
}
```

### 4.3 Task-to-Model Mapping

```yaml
task_model_mapping:
  # Tier 1: Agent Booster (Local, Free)
  tier_1_tasks:
    - template_filling
    - simple_formatting
    - data_extraction
    - regex_operations
    - json_transformation

  # Tier 2: Haiku (Fast, Cheap)
  tier_2_tasks:
    - intent_classification
    - entity_extraction
    - simple_summarization
    - translation
    - sentiment_analysis
    - simple_qa

  # Tier 3: Sonnet (Balanced)
  tier_3_sonnet_tasks:
    - content_summarization
    - recommendation_explanation
    - moderate_qa
    - schedule_optimization
    - networking_icebreakers

  # Tier 3: Opus (Premium)
  tier_3_opus_tasks:
    - complex_reasoning
    - multi_step_planning
    - creative_content_generation
    - architecture_decisions
    - safety_critical_analysis
```

### 4.4 Privacy-Preserving Local Inference

```typescript
interface LocalInferenceConfig {
  models: {
    embedding: {
      name: 'MiniLM-L6-v2';
      runtime: 'onnx';
      quantization: 'int8';
      memoryLimit: '512MB';
    };
    classification: {
      name: 'distilbert-intent';
      runtime: 'onnx';
      quantization: 'int8';
      memoryLimit: '256MB';
    };
    ner: {
      name: 'spacy-ner';
      runtime: 'wasm';
      memoryLimit: '128MB';
    };
  };
  privacyRules: {
    neverSendToCloud: ['pii', 'medical', 'financial'];
    localOnlyFeatures: ['attendee_matching', 'basic_search'];
    anonymizeBeforeCloud: ['feedback_analysis', 'aggregate_insights'];
  };
}

class PrivacyAwareRouter {
  async routeTask(task: AITask): Promise<InferenceResult> {
    // Check if task contains sensitive data
    const sensitivityAnalysis = this.analyzeSensitivity(task);

    if (sensitivityAnalysis.containsSensitiveData) {
      // Force local inference or anonymize
      if (this.canRunLocally(task)) {
        return this.runLocal(task);
      } else {
        const anonymizedTask = this.anonymize(task);
        return this.runCloud(anonymizedTask);
      }
    }

    // Normal routing based on complexity
    return this.routeByComplexity(task);
  }

  private analyzeSensitivity(task: AITask): SensitivityAnalysis {
    return {
      containsSensitiveData: this.detectPII(task.input),
      dataTypes: this.classifyDataTypes(task.input),
      recommendedHandling: this.getHandlingRecommendation(task)
    };
  }
}
```

### 4.5 Cost Optimization

```typescript
interface CostOptimizer {
  // Budget tracking
  dailyBudget: number;
  currentSpend: number;
  budgetAlerts: number[];       // Thresholds for alerts

  // Optimization strategies
  strategies: {
    caching: CachingStrategy;
    batching: BatchingStrategy;
    degradation: DegradationStrategy;
  };
}

class CostOptimizedRouter {
  private costTracker: CostTracker;
  private cache: ResponseCache;

  async routeWithCostOptimization(
    task: AITask
  ): Promise<OptimizedInferenceResult> {
    // 1. Check cache first
    const cached = await this.cache.get(task.hash);
    if (cached && this.isCacheValid(cached, task)) {
      return { ...cached, fromCache: true, cost: 0 };
    }

    // 2. Check if we can batch with pending requests
    if (this.canBatch(task)) {
      return this.addToBatch(task);
    }

    // 3. Check budget constraints
    const estimatedCost = this.estimateCost(task);
    if (this.wouldExceedBudget(estimatedCost)) {
      // Try to downgrade model
      const downgradedTask = this.tryDowngrade(task);
      if (downgradedTask) {
        return this.execute(downgradedTask);
      }
      // Or queue for later
      return this.queueForOffPeak(task);
    }

    // 4. Execute with cost tracking
    const result = await this.execute(task);
    await this.cache.set(task.hash, result);

    return result;
  }
}
```

**Cost Projections**:
```yaml
cost_projections:
  per_attendee_per_day:
    scenario: "active_user"     # 20 AI interactions/day
    breakdown:
      tier_1_local: $0.00       # 10 interactions
      tier_2_haiku: $0.002      # 8 interactions
      tier_3_sonnet: $0.006     # 2 interactions
    total: $0.008

  event_totals:
    attendees: 10000
    days: 3
    estimated_total: $240
    with_caching: $120          # 50% cache hit rate
    with_batching: $96          # 20% additional savings

  cost_guardrails:
    daily_max_per_user: $0.05
    daily_event_max: $500
    alert_threshold: 0.8
```

---

## 5. Claude-Flow Integration

### 5.1 Swarm Coordination for Parallel AI Tasks

```typescript
// Initialize swarm for complex AI operations
const aiSwarmConfig = {
  topology: 'hierarchical',
  maxAgents: 8,
  strategy: 'specialized',
  consensus: 'raft'
};

// Agent roles for AI operations
const aiAgentRoles = {
  coordinator: {
    role: 'ai-coordinator',
    responsibilities: [
      'Task decomposition',
      'Agent assignment',
      'Result aggregation',
      'Quality validation'
    ]
  },
  embedder: {
    role: 'embedding-agent',
    responsibilities: [
      'Generate embeddings',
      'Batch processing',
      'Index updates'
    ]
  },
  searcher: {
    role: 'search-agent',
    responsibilities: [
      'HNSW queries',
      'Result ranking',
      'Filter application'
    ]
  },
  recommender: {
    role: 'recommendation-agent',
    responsibilities: [
      'Collaborative filtering',
      'Content-based matching',
      'Explanation generation'
    ]
  },
  summarizer: {
    role: 'summarization-agent',
    responsibilities: [
      'Content summarization',
      'Key point extraction',
      'Multi-doc synthesis'
    ]
  }
};
```

**Parallel Processing Pattern**:
```typescript
class AITaskOrchestrator {
  private swarm: SwarmCoordinator;

  async processComplexRequest(
    request: ComplexAIRequest
  ): Promise<ComplexAIResponse> {
    // Decompose into parallel tasks
    const tasks = this.decompose(request);

    // Assign to specialized agents
    const assignments = tasks.map(task => ({
      task,
      agent: this.selectAgent(task.type),
      priority: task.priority
    }));

    // Execute in parallel via swarm
    const results = await this.swarm.executeParallel(
      assignments,
      {
        timeout: 5000,
        failureStrategy: 'partial-success'
      }
    );

    // Aggregate results
    return this.aggregate(results);
  }
}
```

### 5.2 Memory System for Context Persistence

```typescript
// Memory namespaces for AI context
const memoryNamespaces = {
  // Attendee context (persistent across sessions)
  'ai:attendee:{id}': {
    preferences: PreferenceModel,
    interactionHistory: Interaction[],
    recommendationFeedback: Feedback[]
  },

  // Session context (within single session)
  'ai:session:{sessionId}': {
    attendees: string[],
    questionsAsked: Question[],
    engagementMetrics: Metrics,
    summaryProgress: SummaryState
  },

  // Global patterns (cross-event learning)
  'ai:patterns': {
    successfulMatches: MatchPattern[],
    popularTopics: TopicTrend[],
    engagementPatterns: EngagementPattern[]
  }
};

class AIMemoryManager {
  private hybridBackend: HybridBackend;
  private reasoningBank: ReasoningBank;

  // Store interaction for learning
  async recordInteraction(
    attendeeId: string,
    interaction: AIInteraction
  ): Promise<void> {
    // Store in attendee history
    await this.hybridBackend.store(
      `ai:attendee:${attendeeId}:history`,
      interaction
    );

    // Extract and store patterns
    const pattern = this.extractPattern(interaction);
    if (pattern) {
      await this.reasoningBank.storePattern(
        pattern.strategy,
        pattern.domain,
        pattern.metadata
      );
    }
  }

  // Retrieve context for personalization
  async getAttendeeContext(
    attendeeId: string
  ): Promise<AttendeeAIContext> {
    const [preferences, history, patterns] = await Promise.all([
      this.hybridBackend.get(`ai:attendee:${attendeeId}:preferences`),
      this.hybridBackend.query(`ai:attendee:${attendeeId}:history`, {
        limit: 50,
        sort: 'desc'
      }),
      this.reasoningBank.searchPatterns(
        `attendee:${attendeeId}`,
        10
      )
    ]);

    return { preferences, history, patterns };
  }
}
```

### 5.3 Hooks for Event-Driven AI Triggers

```typescript
// AI-specific hooks
const aiHooks = {
  // Pre-processing hooks
  'ai:pre-inference': async (ctx: InferenceContext) => {
    // Enrich context with relevant patterns
    ctx.patterns = await reasoningBank.searchPatterns(ctx.task, 5);

    // Check cache
    ctx.cached = await cache.get(ctx.taskHash);

    // Route to appropriate model
    ctx.routingDecision = await router.analyzeTask(ctx.task);
  },

  // Post-processing hooks
  'ai:post-inference': async (ctx: InferenceContext, result: InferenceResult) => {
    // Cache successful results
    if (result.success) {
      await cache.set(ctx.taskHash, result);
    }

    // Record for learning
    await reasoningBank.recordOutcome(
      ctx.patterns[0]?.id,
      result.success
    );

    // Update cost tracking
    await costTracker.record(result.cost, result.model);
  },

  // Event-specific hooks
  'event:attendee-checkin': async (ctx: CheckinContext) => {
    // Initialize attendee AI context
    await aiMemory.initializeAttendee(ctx.attendeeId);

    // Pre-compute initial recommendations
    const recommendations = await recommender.getInitialRecommendations(
      ctx.attendeeId
    );
    await cache.set(`recs:${ctx.attendeeId}`, recommendations);
  },

  'event:session-start': async (ctx: SessionContext) => {
    // Activate real-time Q&A routing
    await qaRouter.activate(ctx.sessionId);

    // Load speaker context for AI assistance
    await aiMemory.loadSpeakerContext(ctx.speakerId);
  },

  'event:session-end': async (ctx: SessionContext) => {
    // Generate session summary
    const summary = await summarizer.generateSessionSummary(ctx.sessionId);
    await storage.save(`summary:${ctx.sessionId}`, summary);

    // Update recommendations based on attendance
    await recommender.updateFromAttendance(ctx.attendees, ctx.sessionId);
  },

  'event:day-end': async (ctx: DayEndContext) => {
    // Generate day recap
    const recap = await summarizer.generateDayRecap(ctx.eventId, ctx.day);

    // Consolidate learned patterns
    await reasoningBank.consolidate();

    // Pre-compute next day recommendations
    await recommender.precomputeNextDay(ctx.eventId);
  }
};
```

### 5.4 Background Workers for AI Operations

```yaml
ai_background_workers:
  embedding_indexer:
    trigger: "new_content"
    priority: "high"
    task: |
      Generate embeddings for new content (sessions, speakers, resources)
      Update HNSW indices incrementally
      Validate index integrity

  pattern_learner:
    trigger: "batch_interactions"
    schedule: "*/15 * * * *"    # Every 15 minutes
    task: |
      Aggregate recent interactions
      Extract success/failure patterns
      Update ReasoningBank weights

  recommendation_refresher:
    trigger: "schedule_change"
    schedule: "0 * * * *"       # Hourly
    task: |
      Refresh cached recommendations
      Update availability-based filters
      Pre-compute trending suggestions

  summary_generator:
    trigger: "session_end"
    task: |
      Generate session summary
      Extract key quotes/moments
      Update speaker profiles

  cost_optimizer:
    schedule: "0 0 * * *"       # Daily at midnight
    task: |
      Analyze previous day's AI costs
      Identify optimization opportunities
      Adjust routing thresholds
```

---

## 6. Test-Driven Development Approach

### 6.1 Test Scenarios for AI Features

```typescript
// Test suite for conversational search
describe('ConversationalSearch', () => {
  describe('Intent Classification', () => {
    it('should classify session search intent', async () => {
      const result = await search.classify('Find talks about kubernetes');
      expect(result.intent).toBe('session_search');
      expect(result.confidence).toBeGreaterThan(0.8);
    });

    it('should classify networking intent', async () => {
      const result = await search.classify('Connect me with ML engineers');
      expect(result.intent).toBe('networking');
      expect(result.confidence).toBeGreaterThan(0.8);
    });

    it('should handle ambiguous queries gracefully', async () => {
      const result = await search.classify('help');
      expect(result.intent).toBe('clarification_needed');
      expect(result.suggestions.length).toBeGreaterThan(0);
    });
  });

  describe('Semantic Search', () => {
    it('should find relevant sessions for natural language query', async () => {
      const results = await search.query('machine learning best practices');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].relevanceScore).toBeGreaterThan(0.7);
    });

    it('should respect filters while maintaining relevance', async () => {
      const results = await search.query('AI', { track: 'Data Science' });
      results.forEach(r => {
        expect(r.session.track).toBe('Data Science');
      });
    });

    it('should return results within latency SLA', async () => {
      const start = Date.now();
      await search.query('complex multi-word natural language query');
      const latency = Date.now() - start;
      expect(latency).toBeLessThan(500); // 500ms SLA
    });
  });
});

// Test suite for networking assistant
describe('NetworkingAssistant', () => {
  describe('Attendee Matching', () => {
    it('should find relevant matches based on interests', async () => {
      const matches = await networking.findMatches('attendee-123', {
        criteria: 'interested in DevOps'
      });

      expect(matches.length).toBeGreaterThan(0);
      matches.forEach(match => {
        expect(match.commonInterests).toContain('DevOps');
      });
    });

    it('should exclude already-connected attendees', async () => {
      const attendeeId = 'attendee-123';
      const connected = ['attendee-456', 'attendee-789'];

      const matches = await networking.findMatches(attendeeId, {
        exclude: connected
      });

      matches.forEach(match => {
        expect(connected).not.toContain(match.attendeeId);
      });
    });

    it('should respect privacy settings', async () => {
      // Attendee has networking disabled
      await setAttendeePrivacy('attendee-private', {
        networkingEnabled: false
      });

      const matches = await networking.findMatches('attendee-123', {});
      const matchIds = matches.map(m => m.attendeeId);

      expect(matchIds).not.toContain('attendee-private');
    });
  });

  describe('Icebreaker Generation', () => {
    it('should generate contextually relevant icebreakers', async () => {
      const icebreaker = await networking.generateIcebreaker(
        'attendee-123',
        'attendee-456',
        { commonInterests: ['AI', 'TypeScript'] }
      );

      expect(icebreaker.text).toBeDefined();
      expect(icebreaker.relevance).toBeGreaterThan(0.7);
    });
  });
});

// Test suite for recommendations
describe('RecommendationEngine', () => {
  describe('Session Recommendations', () => {
    it('should recommend sessions matching attendee interests', async () => {
      const attendee = createTestAttendee({
        interests: ['Machine Learning', 'Python']
      });

      const recs = await recommender.getSessionRecommendations(attendee.id);

      expect(recs.length).toBeGreaterThan(0);
      recs.slice(0, 5).forEach(rec => {
        expect(rec.reasons.some(r =>
          r.type === 'interest_match'
        )).toBe(true);
      });
    });

    it('should diversify recommendations', async () => {
      const recs = await recommender.getSessionRecommendations('attendee-123');

      const topics = new Set(recs.map(r => r.session.primaryTopic));
      expect(topics.size).toBeGreaterThan(recs.length * 0.5);
    });

    it('should respect schedule constraints', async () => {
      const recs = await recommender.getSessionRecommendations('attendee-123');

      // No overlapping sessions
      for (let i = 0; i < recs.length; i++) {
        for (let j = i + 1; j < recs.length; j++) {
          expect(
            hasTimeOverlap(recs[i].session, recs[j].session)
          ).toBe(false);
        }
      }
    });
  });
});
```

### 6.2 Accuracy and Relevance Metrics

```yaml
accuracy_metrics:
  conversational_search:
    intent_classification:
      target_accuracy: ">= 95%"
      measurement: |
        - Human-labeled test set of 1000 queries
        - F1 score per intent category
        - Confusion matrix analysis
      monitoring: "daily sampling of 100 queries"

    search_relevance:
      target_ndcg: ">= 0.85"    # Normalized Discounted Cumulative Gain
      target_mrr: ">= 0.75"     # Mean Reciprocal Rank
      measurement: |
        - A/B test with click-through rates
        - Manual relevance judgments (1-5 scale)
        - User satisfaction surveys
      monitoring: "weekly relevance audits"

  networking_matching:
    match_quality:
      target_success_rate: ">= 70%"  # Users who met said it was valuable
      measurement: |
        - Post-networking surveys
        - Follow-up connection rates
        - Repeat networking request rates
      monitoring: "per-event analysis"

    diversity:
      target_diversity_index: ">= 0.6"  # Simpson's diversity index
      measurement: |
        - Company diversity in matches
        - Role diversity in matches
        - Interest overlap distribution

  recommendations:
    click_through_rate:
      target: ">= 15%"
      measurement: "recommendation clicks / recommendations shown"

    conversion_rate:
      target: ">= 40%"         # Clicked recommendations that led to attendance
      measurement: "attended / clicked"

    serendipity_score:
      target: ">= 0.3"         # Novel but relevant recommendations
      measurement: |
        - Recommendations outside explicit interests that user engaged with
        - User reported "pleasant surprise" rate

  translation:
    bleu_score:
      target: ">= 0.75"        # For content translation
      measurement: "BLEU against professional translations"

    real_time_accuracy:
      target: ">= 90%"         # Word-level accuracy for captions
      measurement: "WER (Word Error Rate)"
```

### 6.3 Performance Benchmarks

```typescript
// Performance benchmark suite
describe('AI Performance Benchmarks', () => {
  describe('Latency Benchmarks', () => {
    it('embedding generation < 50ms', async () => {
      const text = 'Sample text for embedding generation benchmark';
      const times: number[] = [];

      for (let i = 0; i < 100; i++) {
        const start = performance.now();
        await embeddingService.embed(text);
        times.push(performance.now() - start);
      }

      const p95 = percentile(times, 95);
      expect(p95).toBeLessThan(50);
    });

    it('HNSW search < 5ms for 100K vectors', async () => {
      // Setup: index with 100K vectors
      const index = await setupTestIndex(100000);
      const queryVector = generateRandomVector(384);
      const times: number[] = [];

      for (let i = 0; i < 1000; i++) {
        const start = performance.now();
        await index.search(queryVector, 10);
        times.push(performance.now() - start);
      }

      expect(percentile(times, 50)).toBeLessThan(1);   // p50 < 1ms
      expect(percentile(times, 95)).toBeLessThan(5);   // p95 < 5ms
      expect(percentile(times, 99)).toBeLessThan(10);  // p99 < 10ms
    });

    it('recommendation generation < 100ms', async () => {
      const times: number[] = [];

      for (let i = 0; i < 100; i++) {
        const start = performance.now();
        await recommender.getRecommendations(`attendee-${i}`);
        times.push(performance.now() - start);
      }

      expect(percentile(times, 95)).toBeLessThan(100);
    });

    it('intent classification < 100ms', async () => {
      const queries = generateTestQueries(100);
      const times: number[] = [];

      for (const query of queries) {
        const start = performance.now();
        await classifier.classify(query);
        times.push(performance.now() - start);
      }

      expect(percentile(times, 95)).toBeLessThan(100);
    });
  });

  describe('Throughput Benchmarks', () => {
    it('handles 1000 concurrent search requests', async () => {
      const requests = Array(1000).fill(null).map((_, i) => ({
        query: `test query ${i}`,
        limit: 10
      }));

      const start = performance.now();
      await Promise.all(requests.map(r => search.query(r.query)));
      const totalTime = performance.now() - start;

      const throughput = 1000 / (totalTime / 1000); // requests/sec
      expect(throughput).toBeGreaterThan(100); // >100 req/sec
    });

    it('handles 500 concurrent recommendation requests', async () => {
      const attendeeIds = Array(500).fill(null).map((_, i) => `attendee-${i}`);

      const start = performance.now();
      await Promise.all(attendeeIds.map(id =>
        recommender.getRecommendations(id)
      ));
      const totalTime = performance.now() - start;

      const throughput = 500 / (totalTime / 1000);
      expect(throughput).toBeGreaterThan(50); // >50 req/sec
    });
  });

  describe('Memory Benchmarks', () => {
    it('HNSW index memory < 500MB for 100K vectors', async () => {
      const initialMemory = process.memoryUsage().heapUsed;

      const index = new HNSWIndex({ dimensions: 384, maxElements: 100000 });
      for (let i = 0; i < 100000; i++) {
        await index.addPoint(`id-${i}`, generateRandomVector(384));
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const indexMemory = (finalMemory - initialMemory) / (1024 * 1024); // MB

      expect(indexMemory).toBeLessThan(500);
    });
  });
});
```

### 6.4 Continuous Monitoring

```yaml
monitoring_dashboard:
  real_time_metrics:
    - name: "AI Request Latency"
      type: "histogram"
      buckets: [10, 50, 100, 200, 500, 1000, 2000, 5000]
      labels: ["endpoint", "model", "status"]

    - name: "AI Request Throughput"
      type: "counter"
      labels: ["endpoint", "model"]

    - name: "Model Routing Distribution"
      type: "counter"
      labels: ["recommended_model", "actual_model"]

    - name: "Cache Hit Rate"
      type: "gauge"
      labels: ["cache_type"]

  quality_metrics:
    - name: "Search Relevance Score"
      type: "histogram"
      collection: "sampling"
      sample_rate: 0.1

    - name: "Recommendation Click Rate"
      type: "gauge"
      window: "1h"

    - name: "User Satisfaction Score"
      type: "gauge"
      source: "feedback"

  cost_metrics:
    - name: "AI Cost Per Request"
      type: "histogram"
      labels: ["model", "task_type"]

    - name: "Daily AI Spend"
      type: "counter"
      labels: ["model"]

    - name: "Cost Per Attendee"
      type: "gauge"
      window: "24h"

  alerts:
    - name: "High Latency Alert"
      condition: "p95_latency > 2s for 5m"
      severity: "warning"

    - name: "Model Degradation Alert"
      condition: "relevance_score < 0.7 for 15m"
      severity: "critical"

    - name: "Budget Exceeded Alert"
      condition: "daily_spend > budget * 0.9"
      severity: "warning"
```

---

## 7. Security and Privacy Considerations

### 7.1 Data Classification

```yaml
data_classification:
  public:
    - session_descriptions
    - speaker_bios
    - event_schedule

  internal:
    - aggregated_analytics
    - anonymized_patterns
    - model_performance_metrics

  confidential:
    - attendee_profiles
    - interaction_history
    - preference_models

  restricted:
    - pii (email, phone)
    - authentication_tokens
    - payment_information
```

### 7.2 AI-Specific Security Measures

```yaml
ai_security:
  prompt_injection_prevention:
    - input_sanitization
    - output_validation
    - context_isolation

  data_leakage_prevention:
    - no_pii_in_prompts
    - response_filtering
    - audit_logging

  model_security:
    - signed_model_artifacts
    - integrity_verification
    - access_control_for_inference

  api_security:
    - rate_limiting_per_user
    - request_authentication
    - response_encryption
```

---

## 8. Implementation Roadmap

### Phase 1: Foundation (Weeks 1-2)
- [ ] Deploy embedding service (MiniLM-L6)
- [ ] Setup HNSW indices for attendees and sessions
- [ ] Implement basic semantic search
- [ ] Setup cost tracking infrastructure

### Phase 2: Core Features (Weeks 3-4)
- [ ] Implement conversational search
- [ ] Build networking assistant (basic matching)
- [ ] Deploy recommendation engine v1
- [ ] Implement model routing

### Phase 3: Intelligence (Weeks 5-6)
- [ ] Integrate ReasoningBank for pattern learning
- [ ] Implement adaptive recommendations
- [ ] Deploy context-aware suggestions
- [ ] Setup Claude-Flow hooks

### Phase 4: Advanced Features (Weeks 7-8)
- [ ] Real-time translation integration
- [ ] Smart schedule optimizer
- [ ] Advanced personalization
- [ ] Performance optimization

---

## Consequences

### Positive

1. **Enhanced User Experience**: AI-powered features create more personalized, valuable event experiences
2. **Scalability**: Vector search and caching enable serving 100K+ users efficiently
3. **Cost Control**: 3-tier routing optimizes model usage and costs
4. **Privacy Protection**: Local inference and data classification protect user data
5. **Continuous Improvement**: Pattern learning improves recommendations over time

### Negative

1. **Complexity**: Multi-model architecture requires sophisticated orchestration
2. **Latency Variability**: Cloud model calls introduce variable latency
3. **Cold Start**: New attendees have limited personalization initially
4. **Maintenance**: Multiple models and indices require ongoing maintenance

### Risks

1. **Model Availability**: Cloud model outages could impact features
   - *Mitigation*: Graceful degradation to cached/local alternatives

2. **Cost Overruns**: Unexpected usage spikes could exceed budget
   - *Mitigation*: Hard budget caps and automatic downgrade

3. **Quality Drift**: Model updates could change behavior
   - *Mitigation*: Version pinning and continuous quality monitoring

4. **Privacy Incidents**: Accidental data exposure through AI
   - *Mitigation*: Strict data classification and filtering

---

## Related Documents

- ADR-001: System Architecture Overview
- Research: RuVector Integration Analysis (`/docs/konferenco/research/ruvector-integration.md`)
- Claude-Flow V3 Documentation

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-30 | Architecture Team | Initial draft |
