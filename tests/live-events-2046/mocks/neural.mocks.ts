/**
 * Neural System Mock Specifications
 * ==================================
 *
 * London School TDD: Define collaborator contracts through mocks
 * Focus on HOW objects interact, not internal state
 */

import { jest } from '@jest/globals';
import type {
  NeuralCredentials,
  ThoughtCommand,
  EmotionalState,
} from '../test-specification';

// ============================================================================
// NEURAL INTERFACE MOCKS
// ============================================================================

export interface INeuralAuthenticator {
  authenticate(credentials: NeuralCredentials): Promise<AuthResult>;
  validateSignature(signature: Buffer, userId: string): Promise<boolean>;
  refreshSession(sessionId: string): Promise<SessionToken>;
  revokeAccess(userId: string): Promise<void>;
}

export interface AuthResult {
  success: boolean;
  sessionId: string;
  expiresAt: number;
  capabilities: string[];
  bandwidthAllocation: number;
}

export interface SessionToken {
  token: string;
  expiresAt: number;
  refreshToken: string;
}

export const createMockNeuralAuthenticator = (): jest.Mocked<INeuralAuthenticator> => ({
  authenticate: jest.fn<INeuralAuthenticator['authenticate']>().mockResolvedValue({
    success: true,
    sessionId: 'neural-session-001',
    expiresAt: Date.now() + 3600000,
    capabilities: ['thought-command', 'emotional-sync', 'haptic-feedback'],
    bandwidthAllocation: 10_000_000_000, // 10 Gbps
  }),
  validateSignature: jest.fn<INeuralAuthenticator['validateSignature']>().mockResolvedValue(true),
  refreshSession: jest.fn<INeuralAuthenticator['refreshSession']>().mockResolvedValue({
    token: 'refreshed-token-xyz',
    expiresAt: Date.now() + 3600000,
    refreshToken: 'refresh-token-abc',
  }),
  revokeAccess: jest.fn<INeuralAuthenticator['revokeAccess']>().mockResolvedValue(undefined),
});

// ============================================================================
// THOUGHT COMMAND PROCESSOR MOCKS
// ============================================================================

export interface IThoughtProcessor {
  recognize(neuralPattern: Float32Array): Promise<ThoughtCommand>;
  validateIntent(command: ThoughtCommand): Promise<ValidationResult>;
  execute(command: ThoughtCommand): Promise<ExecutionResult>;
  calibrate(userId: string, samples: Float32Array[]): Promise<CalibrationResult>;
}

export interface ValidationResult {
  valid: boolean;
  confidence: number;
  suggestedCorrections?: ThoughtCommand[];
}

export interface ExecutionResult {
  success: boolean;
  executionTime: number;
  feedback: HapticFeedback;
}

export interface HapticFeedback {
  type: 'confirmation' | 'error' | 'progress' | 'completion';
  intensity: number;
  pattern: number[];
}

export interface CalibrationResult {
  accuracy: number;
  recommendedThreshold: number;
  personalizedPatterns: Map<string, Float32Array>;
}

export const createMockThoughtProcessor = (): jest.Mocked<IThoughtProcessor> => ({
  recognize: jest.fn<IThoughtProcessor['recognize']>().mockResolvedValue({
    type: 'navigation',
    intent: 'move-to-stage-a',
    confidence: 0.97,
    neuralPattern: new Float32Array(256),
    timestamp: Date.now(),
  }),
  validateIntent: jest.fn<IThoughtProcessor['validateIntent']>().mockResolvedValue({
    valid: true,
    confidence: 0.98,
  }),
  execute: jest.fn<IThoughtProcessor['execute']>().mockResolvedValue({
    success: true,
    executionTime: 8, // 8ms - within 10ms requirement
    feedback: {
      type: 'confirmation',
      intensity: 0.7,
      pattern: [100, 50, 100],
    },
  }),
  calibrate: jest.fn<IThoughtProcessor['calibrate']>().mockResolvedValue({
    accuracy: 0.99,
    recommendedThreshold: 0.85,
    personalizedPatterns: new Map(),
  }),
});

// ============================================================================
// EMOTIONAL SYNCHRONIZATION MOCKS
// ============================================================================

export interface IEmotionalSynchronizer {
  readState(userId: string): Promise<EmotionalState>;
  syncToExperience(state: EmotionalState, experienceId: string): Promise<SyncResult>;
  broadcastGroupEmotion(groupId: string): Promise<GroupEmotionalState>;
  adjustAmbience(state: EmotionalState, venueZone: string): Promise<AmbienceAdjustment>;
}

export interface SyncResult {
  synchronized: boolean;
  latency: number;
  adjustmentsMade: string[];
}

export interface GroupEmotionalState {
  dominant: EmotionalState;
  distribution: Map<string, number>;
  coherence: number;
}

export interface AmbienceAdjustment {
  lighting: LightingConfig;
  audio: AudioConfig;
  haptic: HapticFieldConfig;
  applied: boolean;
}

export interface LightingConfig {
  color: [number, number, number];
  intensity: number;
  pattern: string;
}

export interface AudioConfig {
  frequency: number;
  volume: number;
  spatialEffect: string;
}

export interface HapticFieldConfig {
  intensity: number;
  frequency: number;
  coverage: string;
}

export const createMockEmotionalSynchronizer = (): jest.Mocked<IEmotionalSynchronizer> => ({
  readState: jest.fn<IEmotionalSynchronizer['readState']>().mockResolvedValue({
    primary: 'excitement',
    intensity: 0.85,
    secondary: 'anticipation',
    socialContext: 'crowd',
    timestamp: Date.now(),
  }),
  syncToExperience: jest.fn<IEmotionalSynchronizer['syncToExperience']>().mockResolvedValue({
    synchronized: true,
    latency: 5,
    adjustmentsMade: ['lighting', 'audio', 'haptic'],
  }),
  broadcastGroupEmotion: jest.fn<IEmotionalSynchronizer['broadcastGroupEmotion']>().mockResolvedValue({
    dominant: {
      primary: 'joy',
      intensity: 0.9,
      socialContext: 'crowd',
      timestamp: Date.now(),
    },
    distribution: new Map([
      ['joy', 0.6],
      ['excitement', 0.3],
      ['calm', 0.1],
    ]),
    coherence: 0.85,
  }),
  adjustAmbience: jest.fn<IEmotionalSynchronizer['adjustAmbience']>().mockResolvedValue({
    lighting: { color: [255, 200, 100], intensity: 0.8, pattern: 'pulse' },
    audio: { frequency: 440, volume: 0.6, spatialEffect: 'surround' },
    haptic: { intensity: 0.4, frequency: 60, coverage: 'full' },
    applied: true,
  }),
});

// ============================================================================
// NEURAL STREAM MANAGER MOCKS
// ============================================================================

export interface INeuralStreamManager {
  connect(userId: string, bandwidth: number): Promise<StreamConnection>;
  adjustBandwidth(connectionId: string, newBandwidth: number): Promise<boolean>;
  getLatencyMetrics(connectionId: string): Promise<LatencyMetrics>;
  disconnect(connectionId: string): Promise<void>;
}

export interface StreamConnection {
  id: string;
  status: 'connected' | 'buffering' | 'degraded' | 'disconnected';
  allocatedBandwidth: number;
  actualBandwidth: number;
  latency: number;
}

export interface LatencyMetrics {
  current: number;
  average: number;
  p95: number;
  p99: number;
  jitter: number;
}

export const createMockNeuralStreamManager = (): jest.Mocked<INeuralStreamManager> => ({
  connect: jest.fn<INeuralStreamManager['connect']>().mockResolvedValue({
    id: 'stream-connection-001',
    status: 'connected',
    allocatedBandwidth: 10_000_000_000,
    actualBandwidth: 9_500_000_000,
    latency: 3,
  }),
  adjustBandwidth: jest.fn<INeuralStreamManager['adjustBandwidth']>().mockResolvedValue(true),
  getLatencyMetrics: jest.fn<INeuralStreamManager['getLatencyMetrics']>().mockResolvedValue({
    current: 4,
    average: 5,
    p95: 8,
    p99: 9,
    jitter: 1,
  }),
  disconnect: jest.fn<INeuralStreamManager['disconnect']>().mockResolvedValue(undefined),
});

// ============================================================================
// NEURAL SECURITY MOCKS
// ============================================================================

export interface INeuralSecurityGuard {
  encryptStream(data: Buffer, sessionId: string): Promise<EncryptedPayload>;
  decryptStream(payload: EncryptedPayload, sessionId: string): Promise<Buffer>;
  detectIntrusion(pattern: Float32Array): Promise<IntrusionDetection>;
  isolateCompromisedSession(sessionId: string): Promise<void>;
}

export interface EncryptedPayload {
  ciphertext: Buffer;
  nonce: Buffer;
  tag: Buffer;
}

export interface IntrusionDetection {
  detected: boolean;
  threatLevel: 'none' | 'low' | 'medium' | 'high' | 'critical';
  indicators: string[];
  recommendedAction: string;
}

export const createMockNeuralSecurityGuard = (): jest.Mocked<INeuralSecurityGuard> => ({
  encryptStream: jest.fn<INeuralSecurityGuard['encryptStream']>().mockResolvedValue({
    ciphertext: Buffer.from('encrypted-data'),
    nonce: Buffer.from('nonce-value'),
    tag: Buffer.from('auth-tag'),
  }),
  decryptStream: jest.fn<INeuralSecurityGuard['decryptStream']>().mockResolvedValue(
    Buffer.from('decrypted-neural-data')
  ),
  detectIntrusion: jest.fn<INeuralSecurityGuard['detectIntrusion']>().mockResolvedValue({
    detected: false,
    threatLevel: 'none',
    indicators: [],
    recommendedAction: 'continue',
  }),
  isolateCompromisedSession: jest.fn<INeuralSecurityGuard['isolateCompromisedSession']>()
    .mockResolvedValue(undefined),
});
