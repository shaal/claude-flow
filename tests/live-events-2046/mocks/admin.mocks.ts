/**
 * Admin System Mock Specifications
 * =================================
 *
 * London School TDD: Mock-based contract definitions for admin systems
 */

import { jest } from '@jest/globals';
import type {
  AdminSchedule,
  ContentBlock,
  ScheduledNotification,
  CrowdTarget,
  SwarmTask,
} from '../test-specification';

// ============================================================================
// CONTENT SCHEDULER MOCKS
// ============================================================================

export interface IContentScheduler {
  createSchedule(eventId: string, blocks: ContentBlock[]): Promise<ScheduleResult>;
  optimizeSchedule(scheduleId: string): Promise<OptimizationResult>;
  resolveConflicts(conflicts: ScheduleConflict[]): Promise<ResolutionResult>;
  executeSchedule(scheduleId: string): Promise<ExecutionStatus>;
}

export interface ScheduleResult {
  scheduleId: string;
  created: boolean;
  conflicts: ScheduleConflict[];
  warnings: string[];
}

export interface ScheduleConflict {
  blockIds: string[];
  type: 'overlap' | 'resource' | 'dependency' | 'capacity';
  severity: 'warning' | 'error' | 'critical';
  suggestedResolution: string;
}

export interface OptimizationResult {
  optimized: boolean;
  improvementScore: number;
  changes: ScheduleChange[];
  resourceUtilization: number;
}

export interface ScheduleChange {
  blockId: string;
  changeType: 'move' | 'resize' | 'split' | 'merge';
  before: Partial<ContentBlock>;
  after: Partial<ContentBlock>;
}

export interface ResolutionResult {
  resolved: boolean;
  appliedResolutions: string[];
  remainingConflicts: ScheduleConflict[];
}

export interface ExecutionStatus {
  status: 'running' | 'paused' | 'completed' | 'failed';
  currentBlock: string;
  progress: number;
  issues: ExecutionIssue[];
}

export interface ExecutionIssue {
  blockId: string;
  type: string;
  severity: string;
  timestamp: number;
}

export const createMockContentScheduler = (): jest.Mocked<IContentScheduler> => ({
  createSchedule: jest.fn<IContentScheduler['createSchedule']>().mockResolvedValue({
    scheduleId: 'schedule-001',
    created: true,
    conflicts: [],
    warnings: [],
  }),
  optimizeSchedule: jest.fn<IContentScheduler['optimizeSchedule']>().mockResolvedValue({
    optimized: true,
    improvementScore: 0.15,
    changes: [
      {
        blockId: 'block-002',
        changeType: 'move',
        before: { startTime: 1000 },
        after: { startTime: 1500 },
      },
    ],
    resourceUtilization: 0.92,
  }),
  resolveConflicts: jest.fn<IContentScheduler['resolveConflicts']>().mockResolvedValue({
    resolved: true,
    appliedResolutions: ['moved-block-002', 'resized-block-003'],
    remainingConflicts: [],
  }),
  executeSchedule: jest.fn<IContentScheduler['executeSchedule']>().mockResolvedValue({
    status: 'running',
    currentBlock: 'block-001',
    progress: 0.25,
    issues: [],
  }),
});

// ============================================================================
// NOTIFICATION DELIVERY SYSTEM MOCKS
// ============================================================================

export interface INotificationDeliverySystem {
  schedule(notification: ScheduledNotification): Promise<ScheduleConfirmation>;
  send(notificationId: string): Promise<DeliveryResult>;
  getDeliveryStatus(notificationId: string): Promise<DeliveryStatus>;
  retry(notificationId: string, strategy: RetryStrategy): Promise<RetryResult>;
}

export interface ScheduleConfirmation {
  notificationId: string;
  scheduledTime: number;
  estimatedReach: number;
  deliveryPath: string[];
}

export interface DeliveryResult {
  delivered: boolean;
  deliveryTime: number;
  recipients: number;
  failedRecipients: string[];
  fallbackUsed: boolean;
}

export interface DeliveryStatus {
  status: 'pending' | 'sending' | 'delivered' | 'partial' | 'failed';
  deliveredCount: number;
  pendingCount: number;
  failedCount: number;
  lastAttempt: number;
}

export interface RetryStrategy {
  maxRetries: number;
  backoffMs: number;
  fallbackChannels: string[];
}

export interface RetryResult {
  success: boolean;
  attemptCount: number;
  finalChannel: string;
  totalTime: number;
}

export const createMockNotificationDeliverySystem = (): jest.Mocked<INotificationDeliverySystem> => ({
  schedule: jest.fn<INotificationDeliverySystem['schedule']>().mockResolvedValue({
    notificationId: 'notif-001',
    scheduledTime: Date.now() + 60000,
    estimatedReach: 50000,
    deliveryPath: ['neural', 'holographic', 'haptic'],
  }),
  send: jest.fn<INotificationDeliverySystem['send']>().mockResolvedValue({
    delivered: true,
    deliveryTime: 150,
    recipients: 49950,
    failedRecipients: [],
    fallbackUsed: false,
  }),
  getDeliveryStatus: jest.fn<INotificationDeliverySystem['getDeliveryStatus']>().mockResolvedValue({
    status: 'delivered',
    deliveredCount: 49950,
    pendingCount: 0,
    failedCount: 50,
    lastAttempt: Date.now(),
  }),
  retry: jest.fn<INotificationDeliverySystem['retry']>().mockResolvedValue({
    success: true,
    attemptCount: 2,
    finalChannel: 'haptic',
    totalTime: 350,
  }),
});

// ============================================================================
// CROWD INTELLIGENCE SYSTEM MOCKS
// ============================================================================

export interface ICrowdIntelligenceSystem {
  analyzeCurrentState(venueId: string): Promise<CrowdState>;
  predictFlow(venueId: string, timeWindow: number): Promise<FlowPrediction>;
  detectAnomaly(venueId: string): Promise<AnomalyDetection>;
  recommendAction(state: CrowdState): Promise<CrowdAction[]>;
}

export interface CrowdState {
  totalCount: number;
  density: Map<string, number>;
  flowVectors: Map<string, [number, number]>;
  sentiment: Map<string, number>;
  safetyScore: number;
}

export interface FlowPrediction {
  predictions: ZonePrediction[];
  confidence: number;
  timeHorizon: number;
  factors: string[];
}

export interface ZonePrediction {
  zoneId: string;
  predictedDensity: number;
  flowDirection: [number, number];
  peakTime: number;
}

export interface AnomalyDetection {
  detected: boolean;
  anomalies: Anomaly[];
  overallRisk: number;
}

export interface Anomaly {
  type: 'density-spike' | 'flow-reversal' | 'sentiment-shift' | 'safety-concern';
  location: string;
  severity: number;
  timestamp: number;
}

export interface CrowdAction {
  type: 'redirect' | 'alert' | 'capacity-limit' | 'emergency';
  targetZone: string;
  priority: number;
  parameters: Record<string, unknown>;
}

export const createMockCrowdIntelligenceSystem = (): jest.Mocked<ICrowdIntelligenceSystem> => ({
  analyzeCurrentState: jest.fn<ICrowdIntelligenceSystem['analyzeCurrentState']>().mockResolvedValue({
    totalCount: 75000,
    density: new Map([
      ['zone-a', 0.75],
      ['zone-b', 0.45],
      ['zone-c', 0.60],
    ]),
    flowVectors: new Map([
      ['zone-a', [0.5, 0.3]],
      ['zone-b', [-0.2, 0.1]],
    ]),
    sentiment: new Map([
      ['zone-a', 0.85],
      ['zone-b', 0.72],
    ]),
    safetyScore: 0.95,
  }),
  predictFlow: jest.fn<ICrowdIntelligenceSystem['predictFlow']>().mockResolvedValue({
    predictions: [
      {
        zoneId: 'zone-a',
        predictedDensity: 0.82,
        flowDirection: [0.6, 0.2],
        peakTime: Date.now() + 1800000,
      },
    ],
    confidence: 0.88,
    timeHorizon: 3600000,
    factors: ['scheduled-event', 'historical-pattern', 'current-flow'],
  }),
  detectAnomaly: jest.fn<ICrowdIntelligenceSystem['detectAnomaly']>().mockResolvedValue({
    detected: false,
    anomalies: [],
    overallRisk: 0.05,
  }),
  recommendAction: jest.fn<ICrowdIntelligenceSystem['recommendAction']>().mockResolvedValue([
    {
      type: 'redirect',
      targetZone: 'zone-b',
      priority: 0.6,
      parameters: { signageUpdate: true, incentiveOffer: 'refreshment-discount' },
    },
  ]),
});

// ============================================================================
// AGENT SWARM COORDINATOR MOCKS
// ============================================================================

export interface IAgentSwarmCoordinator {
  initializeSwarm(config: SwarmConfig): Promise<SwarmInstance>;
  assignTask(task: SwarmTask): Promise<TaskAssignment>;
  getConsensus(taskId: string): Promise<ConsensusResult>;
  scaleSwarm(instanceId: string, targetSize: number): Promise<ScaleResult>;
}

export interface SwarmConfig {
  topology: 'hierarchical' | 'mesh' | 'hybrid';
  minAgents: number;
  maxAgents: number;
  consensusProtocol: 'raft' | 'byzantine' | 'gossip';
  specializations: string[];
}

export interface SwarmInstance {
  instanceId: string;
  activeAgents: number;
  topology: string;
  status: 'initializing' | 'ready' | 'busy' | 'degraded';
  capabilities: string[];
}

export interface TaskAssignment {
  taskId: string;
  assignedAgents: AgentAssignment[];
  estimatedCompletion: number;
  coordinatorId: string;
}

export interface AgentAssignment {
  agentId: string;
  role: string;
  subtask: string;
  priority: number;
}

export interface ConsensusResult {
  reached: boolean;
  consensusValue: unknown;
  votingRecord: Map<string, boolean>;
  rounds: number;
  latency: number;
}

export interface ScaleResult {
  success: boolean;
  previousSize: number;
  currentSize: number;
  scalingTime: number;
  redistribution: string[];
}

export const createMockAgentSwarmCoordinator = (): jest.Mocked<IAgentSwarmCoordinator> => ({
  initializeSwarm: jest.fn<IAgentSwarmCoordinator['initializeSwarm']>().mockResolvedValue({
    instanceId: 'swarm-001',
    activeAgents: 8,
    topology: 'hierarchical',
    status: 'ready',
    capabilities: ['scheduling', 'notification', 'crowd-analysis', 'content-delivery'],
  }),
  assignTask: jest.fn<IAgentSwarmCoordinator['assignTask']>().mockResolvedValue({
    taskId: 'task-001',
    assignedAgents: [
      { agentId: 'agent-001', role: 'coordinator', subtask: 'orchestrate', priority: 1 },
      { agentId: 'agent-002', role: 'worker', subtask: 'execute', priority: 2 },
      { agentId: 'agent-003', role: 'validator', subtask: 'verify', priority: 3 },
    ],
    estimatedCompletion: Date.now() + 5000,
    coordinatorId: 'agent-001',
  }),
  getConsensus: jest.fn<IAgentSwarmCoordinator['getConsensus']>().mockResolvedValue({
    reached: true,
    consensusValue: { approved: true, confidence: 0.95 },
    votingRecord: new Map([
      ['agent-001', true],
      ['agent-002', true],
      ['agent-003', true],
    ]),
    rounds: 1,
    latency: 250,
  }),
  scaleSwarm: jest.fn<IAgentSwarmCoordinator['scaleSwarm']>().mockResolvedValue({
    success: true,
    previousSize: 8,
    currentSize: 12,
    scalingTime: 1500,
    redistribution: ['task-001', 'task-002'],
  }),
});

// ============================================================================
// AUTOMATION ENGINE MOCKS
// ============================================================================

export interface IAutomationEngine {
  registerWorkflow(workflow: Workflow): Promise<WorkflowRegistration>;
  triggerWorkflow(workflowId: string, context: WorkflowContext): Promise<WorkflowExecution>;
  getExecutionStatus(executionId: string): Promise<WorkflowStatus>;
  pauseExecution(executionId: string): Promise<void>;
}

export interface Workflow {
  id: string;
  name: string;
  triggers: WorkflowTrigger[];
  steps: WorkflowStep[];
  errorHandling: ErrorStrategy;
}

export interface WorkflowTrigger {
  type: 'schedule' | 'event' | 'condition' | 'manual';
  config: Record<string, unknown>;
}

export interface WorkflowStep {
  id: string;
  action: string;
  inputs: Record<string, unknown>;
  conditions: string[];
  timeout: number;
}

export interface ErrorStrategy {
  retryCount: number;
  fallbackAction: string;
  notifyOnFailure: boolean;
}

export interface WorkflowRegistration {
  registered: boolean;
  workflowId: string;
  validationErrors: string[];
}

export interface WorkflowContext {
  initiator: string;
  parameters: Record<string, unknown>;
  priority: number;
}

export interface WorkflowExecution {
  executionId: string;
  startTime: number;
  status: 'running' | 'completed' | 'failed' | 'paused';
}

export interface WorkflowStatus {
  executionId: string;
  currentStep: string;
  progress: number;
  outputs: Record<string, unknown>;
  errors: string[];
}

export const createMockAutomationEngine = (): jest.Mocked<IAutomationEngine> => ({
  registerWorkflow: jest.fn<IAutomationEngine['registerWorkflow']>().mockResolvedValue({
    registered: true,
    workflowId: 'workflow-001',
    validationErrors: [],
  }),
  triggerWorkflow: jest.fn<IAutomationEngine['triggerWorkflow']>().mockResolvedValue({
    executionId: 'execution-001',
    startTime: Date.now(),
    status: 'running',
  }),
  getExecutionStatus: jest.fn<IAutomationEngine['getExecutionStatus']>().mockResolvedValue({
    executionId: 'execution-001',
    currentStep: 'step-002',
    progress: 0.5,
    outputs: { processed: 100 },
    errors: [],
  }),
  pauseExecution: jest.fn<IAutomationEngine['pauseExecution']>().mockResolvedValue(undefined),
});
