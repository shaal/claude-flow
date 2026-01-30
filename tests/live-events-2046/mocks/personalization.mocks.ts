/**
 * Personalization Engine Mock Specifications
 * ==========================================
 *
 * London School TDD: Behavior verification through mock interactions
 */

import { jest } from '@jest/globals';
import type {
  AttendeeProfile,
  PersonalizationPreferences,
  SocialConnection,
  PrivacyBoundaries,
} from '../test-specification';

// ============================================================================
// SONA ADAPTATION ENGINE MOCKS
// ============================================================================

export interface ISONAEngine {
  adapt(profile: AttendeeProfile, interaction: InteractionSignal): Promise<AdaptationResult>;
  predictPreference(userId: string, context: ExperienceContext): Promise<PreferencePrediction>;
  getConfidenceScore(userId: string): Promise<ConfidenceMetrics>;
  resetLearning(userId: string): Promise<void>;
}

export interface InteractionSignal {
  type: 'engagement' | 'skip' | 'dwell' | 'share' | 'save' | 'dismiss';
  contentId: string;
  duration: number;
  neuralEngagement: number;
  emotionalResponse: string;
  timestamp: number;
}

export interface AdaptationResult {
  adapted: boolean;
  updatedPreferences: Partial<PersonalizationPreferences>;
  confidenceDelta: number;
  learningProgress: number; // 0-1 convergence
}

export interface ExperienceContext {
  eventId: string;
  currentZone: string;
  timeOfDay: number;
  crowdDensity: number;
  companionIds: string[];
}

export interface PreferencePrediction {
  recommendedContent: string[];
  confidenceScores: Map<string, number>;
  reasoning: string;
}

export interface ConfidenceMetrics {
  overall: number;
  byCategory: Map<string, number>;
  interactionCount: number;
  convergenceEstimate: number;
}

export const createMockSONAEngine = (): jest.Mocked<ISONAEngine> => ({
  adapt: jest.fn<ISONAEngine['adapt']>().mockResolvedValue({
    adapted: true,
    updatedPreferences: {
      interactionStyle: 'active',
      intensityPreference: 0.8,
    },
    confidenceDelta: 0.02,
    learningProgress: 0.75,
  }),
  predictPreference: jest.fn<ISONAEngine['predictPreference']>().mockResolvedValue({
    recommendedContent: ['experience-001', 'experience-002', 'experience-003'],
    confidenceScores: new Map([
      ['experience-001', 0.95],
      ['experience-002', 0.88],
      ['experience-003', 0.82],
    ]),
    reasoning: 'Based on neural engagement patterns and social graph influence',
  }),
  getConfidenceScore: jest.fn<ISONAEngine['getConfidenceScore']>().mockResolvedValue({
    overall: 0.92,
    byCategory: new Map([
      ['content-type', 0.95],
      ['interaction-style', 0.88],
      ['social-preference', 0.90],
    ]),
    interactionCount: 150,
    convergenceEstimate: 0.95,
  }),
  resetLearning: jest.fn<ISONAEngine['resetLearning']>().mockResolvedValue(undefined),
});

// ============================================================================
// SOCIAL GRAPH RECOMMENDER MOCKS
// ============================================================================

export interface ISocialGraphRecommender {
  getConnections(userId: string): Promise<SocialConnection[]>;
  findMutualInterests(userIds: string[]): Promise<MutualInterests>;
  recommendGroupExperiences(groupId: string): Promise<GroupRecommendation[]>;
  calculateSocialInfluence(userId: string, contentId: string): Promise<SocialInfluence>;
}

export interface MutualInterests {
  interests: string[];
  strengthScores: Map<string, number>;
  suggestedActivities: string[];
}

export interface GroupRecommendation {
  experienceId: string;
  suitabilityScore: number;
  participationPrediction: number;
  logistics: GroupLogistics;
}

export interface GroupLogistics {
  optimalTime: number;
  suggestedZone: string;
  capacityMatch: number;
}

export interface SocialInfluence {
  influenceScore: number;
  influencers: string[];
  adoptionProbability: number;
}

export const createMockSocialGraphRecommender = (): jest.Mocked<ISocialGraphRecommender> => ({
  getConnections: jest.fn<ISocialGraphRecommender['getConnections']>().mockResolvedValue([
    {
      userId: 'friend-001',
      relationshipType: 'friend',
      interactionFrequency: 0.8,
      sharedInterests: ['music', 'technology', 'gaming'],
    },
    {
      userId: 'colleague-001',
      relationshipType: 'colleague',
      interactionFrequency: 0.5,
      sharedInterests: ['technology'],
    },
  ]),
  findMutualInterests: jest.fn<ISocialGraphRecommender['findMutualInterests']>().mockResolvedValue({
    interests: ['immersive-experiences', 'live-music', 'social-gaming'],
    strengthScores: new Map([
      ['immersive-experiences', 0.92],
      ['live-music', 0.88],
      ['social-gaming', 0.75],
    ]),
    suggestedActivities: ['concert-zone-a', 'vr-game-arena', 'social-lounge'],
  }),
  recommendGroupExperiences: jest.fn<ISocialGraphRecommender['recommendGroupExperiences']>()
    .mockResolvedValue([
      {
        experienceId: 'group-exp-001',
        suitabilityScore: 0.94,
        participationPrediction: 0.85,
        logistics: {
          optimalTime: Date.now() + 3600000,
          suggestedZone: 'zone-b',
          capacityMatch: 0.95,
        },
      },
    ]),
  calculateSocialInfluence: jest.fn<ISocialGraphRecommender['calculateSocialInfluence']>()
    .mockResolvedValue({
      influenceScore: 0.78,
      influencers: ['friend-001', 'influencer-002'],
      adoptionProbability: 0.82,
    }),
});

// ============================================================================
// PRIVACY BOUNDARY ENFORCER MOCKS
// ============================================================================

export interface IPrivacyEnforcer {
  checkPermission(userId: string, action: PrivacyAction): Promise<PermissionResult>;
  enforceDataBoundary(data: unknown, boundaries: PrivacyBoundaries): Promise<SanitizedData>;
  auditAccess(userId: string, resourceId: string): Promise<AuditResult>;
  getConsentStatus(userId: string): Promise<ConsentStatus>;
}

export interface PrivacyAction {
  type: 'read' | 'write' | 'share' | 'analyze' | 'retain';
  resource: string;
  requesterId: string;
  purpose: string;
}

export interface PermissionResult {
  allowed: boolean;
  reason?: string;
  requiredConsent?: string;
  expiresAt?: number;
}

export interface SanitizedData {
  data: unknown;
  redactedFields: string[];
  anonymizationApplied: boolean;
  retentionPolicy: string;
}

export interface AuditResult {
  accessCount: number;
  lastAccessTime: number;
  accessors: string[];
  violations: AccessViolation[];
}

export interface AccessViolation {
  timestamp: number;
  violationType: string;
  severity: 'low' | 'medium' | 'high';
  resolved: boolean;
}

export interface ConsentStatus {
  dataSharing: boolean;
  neuralDataCollection: boolean;
  socialGraphUsage: boolean;
  marketingCommunications: boolean;
  lastUpdated: number;
}

export const createMockPrivacyEnforcer = (): jest.Mocked<IPrivacyEnforcer> => ({
  checkPermission: jest.fn<IPrivacyEnforcer['checkPermission']>().mockResolvedValue({
    allowed: true,
    expiresAt: Date.now() + 86400000,
  }),
  enforceDataBoundary: jest.fn<IPrivacyEnforcer['enforceDataBoundary']>().mockResolvedValue({
    data: { userId: 'user-001', preferences: {} },
    redactedFields: ['neuralSignature', 'exactLocation'],
    anonymizationApplied: true,
    retentionPolicy: '24-hours',
  }),
  auditAccess: jest.fn<IPrivacyEnforcer['auditAccess']>().mockResolvedValue({
    accessCount: 15,
    lastAccessTime: Date.now() - 3600000,
    accessors: ['system', 'personalization-engine'],
    violations: [],
  }),
  getConsentStatus: jest.fn<IPrivacyEnforcer['getConsentStatus']>().mockResolvedValue({
    dataSharing: true,
    neuralDataCollection: true,
    socialGraphUsage: true,
    marketingCommunications: false,
    lastUpdated: Date.now() - 86400000,
  }),
});

// ============================================================================
// PREFERENCE LEARNING ENGINE MOCKS
// ============================================================================

export interface IPreferenceLearner {
  ingestSignal(userId: string, signal: LearningSignal): Promise<void>;
  getConvergenceStatus(userId: string): Promise<ConvergenceStatus>;
  exportModel(userId: string): Promise<PreferenceModel>;
  importModel(userId: string, model: PreferenceModel): Promise<void>;
}

export interface LearningSignal {
  type: 'explicit' | 'implicit' | 'neural' | 'social';
  feature: string;
  value: number;
  confidence: number;
  context: string;
}

export interface ConvergenceStatus {
  converged: boolean;
  progress: number;
  interactionsRemaining: number;
  stabilityScore: number;
}

export interface PreferenceModel {
  version: string;
  features: Map<string, number>;
  weights: Float32Array;
  lastUpdated: number;
}

export const createMockPreferenceLearner = (): jest.Mocked<IPreferenceLearner> => ({
  ingestSignal: jest.fn<IPreferenceLearner['ingestSignal']>().mockResolvedValue(undefined),
  getConvergenceStatus: jest.fn<IPreferenceLearner['getConvergenceStatus']>().mockResolvedValue({
    converged: true,
    progress: 0.95,
    interactionsRemaining: 5,
    stabilityScore: 0.92,
  }),
  exportModel: jest.fn<IPreferenceLearner['exportModel']>().mockResolvedValue({
    version: '2.0.0',
    features: new Map([
      ['content-preference', 0.85],
      ['interaction-style', 0.78],
    ]),
    weights: new Float32Array(128),
    lastUpdated: Date.now(),
  }),
  importModel: jest.fn<IPreferenceLearner['importModel']>().mockResolvedValue(undefined),
});

// ============================================================================
// CONTENT MATCHER MOCKS
// ============================================================================

export interface IContentMatcher {
  matchContent(preferences: PersonalizationPreferences, catalog: ContentItem[]): Promise<MatchResult[]>;
  scoreRelevance(userId: string, contentId: string): Promise<RelevanceScore>;
  injectSerendipity(matches: MatchResult[], serendipityFactor: number): Promise<MatchResult[]>;
}

export interface ContentItem {
  id: string;
  type: string;
  tags: string[];
  intensity: number;
  socialOptimal: number;
  duration: number;
}

export interface MatchResult {
  contentId: string;
  score: number;
  matchReasons: string[];
  confidence: number;
}

export interface RelevanceScore {
  score: number;
  factors: Map<string, number>;
  explanation: string;
}

export const createMockContentMatcher = (): jest.Mocked<IContentMatcher> => ({
  matchContent: jest.fn<IContentMatcher['matchContent']>().mockResolvedValue([
    { contentId: 'content-001', score: 0.95, matchReasons: ['preference-match', 'social-fit'], confidence: 0.92 },
    { contentId: 'content-002', score: 0.88, matchReasons: ['preference-match'], confidence: 0.85 },
  ]),
  scoreRelevance: jest.fn<IContentMatcher['scoreRelevance']>().mockResolvedValue({
    score: 0.91,
    factors: new Map([
      ['content-type', 0.95],
      ['intensity', 0.88],
      ['social', 0.90],
    ]),
    explanation: 'High match due to preference alignment and social context',
  }),
  injectSerendipity: jest.fn<IContentMatcher['injectSerendipity']>().mockImplementation(
    async (matches, _factor) => [
      ...matches,
      { contentId: 'serendipity-001', score: 0.70, matchReasons: ['discovery'], confidence: 0.75 },
    ]
  ),
});
