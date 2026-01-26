# Claude Flow Feature Reference for Claude Code

A comprehensive reference for invoking every Claude Flow feature directly from within Claude Code sessions. This guide covers MCP tools, CLI commands, Task agents, and integration patterns.

---

## Table of Contents

1. [Setup & Prerequisites](#setup--prerequisites)
2. [MCP Tools Reference](#mcp-tools-reference)
3. [CLI Commands via Bash](#cli-commands-via-bash)
4. [Task Tool Agents](#task-tool-agents)
5. [Memory Operations](#memory-operations)
6. [Swarm Coordination](#swarm-coordination)
7. [Hooks System](#hooks-system)
8. [Neural & Intelligence Features](#neural--intelligence-features)
9. [Security Features](#security-features)
10. [Session Management](#session-management)
11. [Performance & Monitoring](#performance--monitoring)
12. [Complete Examples](#complete-examples)

---

## Setup & Prerequisites

### One-Time Setup

Add the Claude Flow MCP server to Claude Code:

```bash
# Add MCP server (run once)
claude mcp add claude-flow npx claude-flow@v3alpha mcp start

# Optional: Add ruv-swarm for enhanced coordination
claude mcp add ruv-swarm npx ruv-swarm mcp start
```

### Verify Setup

```bash
# Check MCP server status
npx claude-flow@v3alpha mcp status

# Run diagnostics
npx claude-flow@v3alpha doctor --fix

# Start daemon for background workers
npx claude-flow@v3alpha daemon start
```

---

## MCP Tools Reference

MCP tools are invoked using the `mcp__claude_flow__<tool_name>` syntax within Claude Code.

### Agent Tools

| Tool | Purpose | Parameters |
|------|---------|------------|
| `agent_spawn` | Create a new agent | `agentType`, `id`, `config` |
| `agent_list` | List all agents | `filter`, `includeInactive` |
| `agent_status` | Get agent status | `agentId` |
| `agent_terminate` | Stop an agent | `agentId`, `force` |

**Examples:**

```javascript
// Spawn a coder agent
mcp__claude_flow__agent_spawn({
  agentType: "coder",
  id: "my-coder-1",
  config: {
    provider: "anthropic",
    model: "claude-sonnet-4-20250514",
    timeout: 300
  }
})

// List all active agents
mcp__claude_flow__agent_list({
  filter: "active"
})

// Get specific agent status
mcp__claude_flow__agent_status({
  agentId: "my-coder-1"
})

// Terminate an agent
mcp__claude_flow__agent_terminate({
  agentId: "my-coder-1",
  force: false
})
```

### Swarm Tools

| Tool | Purpose | Parameters |
|------|---------|------------|
| `swarm_init` | Initialize swarm topology | `topology`, `maxAgents`, `strategy` |
| `swarm_status` | Get swarm status | `swarmId` |
| `swarm_scale` | Scale swarm size | `targetSize`, `strategy` |

**Examples:**

```javascript
// Initialize anti-drift swarm (recommended)
mcp__claude_flow__swarm_init({
  topology: "hierarchical",
  maxAgents: 8,
  strategy: "specialized"
})

// Alternative topologies
mcp__claude_flow__swarm_init({
  topology: "mesh",           // For creative collaboration
  maxAgents: 6,
  strategy: "balanced"
})

mcp__claude_flow__swarm_init({
  topology: "hierarchical-mesh",  // V3 hybrid
  maxAgents: 15,
  strategy: "adaptive"
})

// Get swarm status
mcp__claude_flow__swarm_status({
  swarmId: "current"
})

// Scale swarm
mcp__claude_flow__swarm_scale({
  targetSize: 10,
  strategy: "gradual"
})
```

### Memory Tools

| Tool | Purpose | Parameters |
|------|---------|------------|
| `memory_store` | Store data | `key`, `value`, `namespace`, `tags` |
| `memory_search` | Vector search | `query`, `limit`, `namespace` |
| `memory_list` | List entries | `namespace`, `limit` |
| `memory_delete` | Delete entry | `key`, `namespace` |

**Examples:**

```javascript
// Store a value
mcp__claude_flow__memory_store({
  key: "auth-decision",
  value: JSON.stringify({
    decision: "Use JWT with refresh tokens",
    reason: "Scalability",
    date: new Date().toISOString()
  }),
  namespace: "architecture",
  tags: ["auth", "security"]
})

// Semantic search (uses HNSW - 150x-12,500x faster)
mcp__claude_flow__memory_search({
  query: "authentication patterns",
  limit: 10,
  namespace: "architecture"
})

// List all entries in namespace
mcp__claude_flow__memory_list({
  namespace: "architecture",
  limit: 50
})

// Delete an entry
mcp__claude_flow__memory_delete({
  key: "old-decision",
  namespace: "architecture"
})
```

### Hooks Tools

| Tool | Purpose | Parameters |
|------|---------|------------|
| `hooks_pre-edit` | Pre-edit context | `filePath`, `operation` |
| `hooks_post-edit` | Record edit outcome | `filePath`, `success`, `metrics` |
| `hooks_pre-command` | Pre-command risk | `command` |
| `hooks_post-command` | Record command outcome | `command`, `exitCode` |
| `hooks_route` | Route to optimal agent | `task`, `context` |
| `hooks_explain` | Explain routing | `task` |

**Examples:**

```javascript
// Get context before editing
mcp__claude_flow__hooks_pre_edit({
  filePath: "src/auth/login.ts",
  operation: "refactor"
})

// Record successful edit
mcp__claude_flow__hooks_post_edit({
  filePath: "src/auth/login.ts",
  success: true,
  metrics: {
    time: 500,
    quality: 0.95
  }
})

// Route task to best agent
mcp__claude_flow__hooks_route({
  task: "implement OAuth2 authentication",
  context: {
    files: ["src/auth/"],
    complexity: "high"
  }
})

// Explain why an agent was chosen
mcp__claude_flow__hooks_explain({
  task: "security audit of auth module"
})
```

### Config Tools

| Tool | Purpose | Parameters |
|------|---------|------------|
| `config_load` | Load configuration | `path` |
| `config_save` | Save configuration | `config`, `path` |
| `config_validate` | Validate config | `config` |

**Examples:**

```javascript
// Load project config
mcp__claude_flow__config_load({
  path: "./claude-flow.config.json"
})

// Save configuration
mcp__claude_flow__config_save({
  config: {
    topology: "hierarchical",
    maxAgents: 8
  },
  path: "./claude-flow.config.json"
})
```

### System Tools

| Tool | Purpose | Parameters |
|------|---------|------------|
| `system_info` | System information | none |
| `system_health` | Health status | none |
| `system_metrics` | Performance metrics | `period` |

**Examples:**

```javascript
// Get system info
mcp__claude_flow__system_info({})

// Health check
mcp__claude_flow__system_health({})

// Get metrics
mcp__claude_flow__system_metrics({
  period: "1h"
})
```

---

## CLI Commands via Bash

All CLI commands can be invoked via the Bash tool in Claude Code.

### Initialization Commands

```bash
# Initialize project with wizard
npx claude-flow@v3alpha init --wizard

# Initialize with preset
npx claude-flow@v3alpha init --preset enterprise

# Initialize skills
npx claude-flow@v3alpha init --skills

# Initialize hooks
npx claude-flow@v3alpha init --hooks
```

### Agent Commands

```bash
# Spawn agent
npx claude-flow@v3alpha agent spawn -t coder --name my-coder

# List agents
npx claude-flow@v3alpha agent list

# Get agent status
npx claude-flow@v3alpha agent status my-coder

# Stop agent
npx claude-flow@v3alpha agent stop my-coder

# Agent metrics
npx claude-flow@v3alpha agent metrics

# Agent health
npx claude-flow@v3alpha agent health

# Agent logs
npx claude-flow@v3alpha agent logs my-coder
```

### Swarm Commands

```bash
# Initialize swarm
npx claude-flow@v3alpha swarm init --topology hierarchical --max-agents 8 --strategy specialized

# Swarm status
npx claude-flow@v3alpha swarm status

# Scale swarm
npx claude-flow@v3alpha swarm scale --target 10

# Stop swarm
npx claude-flow@v3alpha swarm stop

# List swarm agents
npx claude-flow@v3alpha swarm agents

# Swarm metrics
npx claude-flow@v3alpha swarm metrics
```

### Memory Commands

```bash
# Store data
npx claude-flow@v3alpha memory store -k "my-key" --value "my value" -n default

# Retrieve data
npx claude-flow@v3alpha memory retrieve -k "my-key" -n default

# Search (HNSW vector search)
npx claude-flow@v3alpha memory search -q "authentication patterns" --limit 10

# List entries
npx claude-flow@v3alpha memory list -n default

# Delete entry
npx claude-flow@v3alpha memory delete -k "my-key"

# Memory stats
npx claude-flow@v3alpha memory stats

# Clear namespace
npx claude-flow@v3alpha memory clear -n temp

# Export memory
npx claude-flow@v3alpha memory export -o backup.json

# Import memory
npx claude-flow@v3alpha memory import -i backup.json

# Initialize database
npx claude-flow@v3alpha memory init --backend hybrid
```

### Hooks Commands

```bash
# Pre-edit hook
npx claude-flow@v3alpha hooks pre-edit -f src/utils.ts -o update

# Post-edit hook
npx claude-flow@v3alpha hooks post-edit -f src/utils.ts --success true

# Pre-command hook
npx claude-flow@v3alpha hooks pre-command --command "npm test"

# Post-command hook
npx claude-flow@v3alpha hooks post-command --command "npm test" --exit-code 0

# Pre-task hook
npx claude-flow@v3alpha hooks pre-task --description "Implement auth"

# Post-task hook
npx claude-flow@v3alpha hooks post-task --task-id "task-123" --success true

# Route task to agent
npx claude-flow@v3alpha hooks route --task "security audit"

# Explain routing decision
npx claude-flow@v3alpha hooks explain --topic "Why security-architect?"

# Pretrain from codebase
npx claude-flow@v3alpha hooks pretrain --model-type moe --epochs 10

# Build agent profiles
npx claude-flow@v3alpha hooks build-agents --agent-types coder,tester

# Transfer patterns to IPFS
npx claude-flow@v3alpha hooks transfer --patterns "./learned-patterns.json"

# Session management
npx claude-flow@v3alpha hooks session-start --session-id "dev-$(date +%s)"
npx claude-flow@v3alpha hooks session-end --export-metrics true
npx claude-flow@v3alpha hooks session-restore --session-id "dev-123"

# Worker management
npx claude-flow@v3alpha hooks worker list
npx claude-flow@v3alpha hooks worker dispatch --trigger audit
npx claude-flow@v3alpha hooks worker status
```

### MCP Server Commands

```bash
# Start MCP server
npx claude-flow@v3alpha mcp start

# Start with specific transport
npx claude-flow@v3alpha mcp start -t http -p 8080

# Stop server
npx claude-flow@v3alpha mcp stop

# Server status
npx claude-flow@v3alpha mcp status

# Health check
npx claude-flow@v3alpha mcp health

# Restart server
npx claude-flow@v3alpha mcp restart

# List tools
npx claude-flow@v3alpha mcp tools

# Execute tool directly
npx claude-flow@v3alpha mcp exec -t swarm_init -p '{"topology":"mesh"}'

# View logs
npx claude-flow@v3alpha mcp logs -n 50
```

### Session Commands

```bash
# Start session
npx claude-flow@v3alpha session start --name "feature-dev"

# List sessions
npx claude-flow@v3alpha session list

# Get session info
npx claude-flow@v3alpha session info session-123

# Save session
npx claude-flow@v3alpha session save --id session-123

# Restore session
npx claude-flow@v3alpha session restore --id session-123

# End session
npx claude-flow@v3alpha session end --id session-123

# Clear session
npx claude-flow@v3alpha session clear
```

### Task Commands

```bash
# Create task
npx claude-flow@v3alpha task create --description "Implement user auth"

# List tasks
npx claude-flow@v3alpha task list

# Get task status
npx claude-flow@v3alpha task status task-123

# Assign task
npx claude-flow@v3alpha task assign --id task-123 --agent coder-1

# Complete task
npx claude-flow@v3alpha task complete --id task-123

# Cancel task
npx claude-flow@v3alpha task cancel --id task-123
```

### Daemon Commands

```bash
# Start daemon
npx claude-flow@v3alpha daemon start

# Stop daemon
npx claude-flow@v3alpha daemon stop

# Daemon status
npx claude-flow@v3alpha daemon status

# Trigger worker
npx claude-flow@v3alpha daemon trigger audit

# Enable/disable workers
npx claude-flow@v3alpha daemon enable optimize
npx claude-flow@v3alpha daemon disable benchmark
```

### Neural Commands

```bash
# Train neural patterns
npx claude-flow@v3alpha neural train --model-type moe --epochs 10

# Neural status
npx claude-flow@v3alpha neural status

# List learned patterns
npx claude-flow@v3alpha neural patterns

# Predict optimal approach
npx claude-flow@v3alpha neural predict --task "refactor auth module"

# Optimize neural config
npx claude-flow@v3alpha neural optimize
```

### Security Commands

```bash
# Security scan
npx claude-flow@v3alpha security scan --depth full

# Security audit
npx claude-flow@v3alpha security audit

# CVE check
npx claude-flow@v3alpha security cve

# Threat modeling
npx claude-flow@v3alpha security threats

# Validate security
npx claude-flow@v3alpha security validate

# Generate report
npx claude-flow@v3alpha security report -o security-report.json
```

### Performance Commands

```bash
# Run benchmarks
npx claude-flow@v3alpha performance benchmark --suite all

# Profile execution
npx claude-flow@v3alpha performance profile --duration 60

# Get metrics
npx claude-flow@v3alpha performance metrics

# Optimize
npx claude-flow@v3alpha performance optimize

# Generate report
npx claude-flow@v3alpha performance report
```

### Configuration Commands

```bash
# Get config value
npx claude-flow@v3alpha config get memory.backend

# Set config value
npx claude-flow@v3alpha config set memory.backend hybrid

# List all config
npx claude-flow@v3alpha config list

# Validate config
npx claude-flow@v3alpha config validate

# Reset config
npx claude-flow@v3alpha config reset

# Export config
npx claude-flow@v3alpha config export -o config-backup.json

# Import config
npx claude-flow@v3alpha config import -i config-backup.json
```

### Workflow Commands

```bash
# List workflows
npx claude-flow@v3alpha workflow list

# Run workflow
npx claude-flow@v3alpha workflow run feature-implementation

# Create workflow
npx claude-flow@v3alpha workflow create --name "my-workflow"

# Workflow status
npx claude-flow@v3alpha workflow status workflow-123

# Stop workflow
npx claude-flow@v3alpha workflow stop workflow-123

# Templates
npx claude-flow@v3alpha workflow templates
```

### Hive-Mind Commands

```bash
# Spawn hive-mind
npx claude-flow@v3alpha hive-mind spawn "Build e-commerce platform" --agents 8

# Hive status
npx claude-flow@v3alpha hive-mind status

# Query hive
npx claude-flow@v3alpha hive-mind query "What's the current progress?"

# Coordinate agents
npx claude-flow@v3alpha hive-mind coordinate --consensus raft

# Stop hive
npx claude-flow@v3alpha hive-mind stop

# Export hive state
npx claude-flow@v3alpha hive-mind export -o hive-state.json
```

### Utility Commands

```bash
# System diagnostics
npx claude-flow@v3alpha doctor --fix

# Check status
npx claude-flow@v3alpha status

# Version info
npx claude-flow@v3alpha --version

# Provider management
npx claude-flow@v3alpha providers list
npx claude-flow@v3alpha providers add openai
npx claude-flow@v3alpha providers test anthropic

# Plugin management
npx claude-flow@v3alpha plugins list
npx claude-flow@v3alpha plugins install @claude-flow/security
npx claude-flow@v3alpha plugins enable security

# Embeddings
npx claude-flow@v3alpha embeddings embed "text to embed"
npx claude-flow@v3alpha embeddings search "query" --limit 10
npx claude-flow@v3alpha embeddings init

# Migration (v2 to v3)
npx claude-flow@v3alpha migrate --from v2 --to v3
```

---

## Task Tool Agents

The Task tool spawns real working agents in Claude Code. These agents execute actual work.

### Core Development Agents

```javascript
// Coder - General implementation
Task({
  prompt: "Implement the user authentication module with JWT",
  subagent_type: "coder",
  model: "sonnet"  // or "haiku" for simple tasks, "opus" for complex
})

// Reviewer - Code review
Task({
  prompt: "Review the auth module for security issues and best practices",
  subagent_type: "reviewer"
})

// Tester - Test writing
Task({
  prompt: "Write comprehensive unit tests for the auth module",
  subagent_type: "tester"
})

// Researcher - Codebase exploration
Task({
  prompt: "Find all authentication-related code and document patterns",
  subagent_type: "researcher"
})

// Planner - Task planning
Task({
  prompt: "Create implementation plan for OAuth2 integration",
  subagent_type: "planner"
})
```

### Architecture Agents

```javascript
// System Architect
Task({
  prompt: "Design microservices architecture for the platform",
  subagent_type: "system-architect",
  model: "opus"  // Use opus for architecture decisions
})

// Backend Developer
Task({
  prompt: "Implement REST API endpoints for user management",
  subagent_type: "backend-dev"
})
```

### Swarm Coordination Agents

```javascript
// Hierarchical Coordinator (Queen)
Task({
  prompt: "Coordinate the swarm, validate outputs against goals",
  subagent_type: "hierarchical-coordinator"
})

// Mesh Coordinator
Task({
  prompt: "Facilitate peer-to-peer collaboration",
  subagent_type: "mesh-coordinator"
})

// Adaptive Coordinator
Task({
  prompt: "Dynamically adjust topology based on workload",
  subagent_type: "adaptive-coordinator"
})
```

### Security Agents

```javascript
// Security Architect
Task({
  prompt: "Design security architecture with threat modeling",
  subagent_type: "security-architect",
  model: "opus"
})

// Security Auditor (via reviewer with security focus)
Task({
  prompt: "Perform security audit and CVE remediation planning",
  subagent_type: "reviewer"
})
```

### Specialized Agents

```javascript
// Performance Engineer
Task({
  prompt: "Analyze and optimize application performance",
  subagent_type: "perf-analyzer"
})

// Memory Specialist
Task({
  prompt: "Optimize memory usage and implement caching",
  subagent_type: "memory-coordinator"
})

// API Documentation
Task({
  prompt: "Generate OpenAPI documentation for all endpoints",
  subagent_type: "api-docs"
})

// Mobile Developer
Task({
  prompt: "Implement React Native mobile app screens",
  subagent_type: "mobile-dev"
})

// ML Developer
Task({
  prompt: "Implement machine learning model for predictions",
  subagent_type: "ml-developer"
})

// CI/CD Engineer
Task({
  prompt: "Set up GitHub Actions CI/CD pipeline",
  subagent_type: "cicd-engineer"
})
```

### Model Selection Guidelines

| Complexity | Model | Agent Types |
|------------|-------|-------------|
| Simple | `haiku` | Simple fixes, formatting, docs |
| Medium | `sonnet` (default) | Features, debugging, tests |
| Complex | `opus` | Architecture, security, novel problems |

```javascript
// Simple task - use haiku
Task({
  prompt: "Add type annotations to utils.ts",
  subagent_type: "coder",
  model: "haiku"
})

// Medium task - use sonnet
Task({
  prompt: "Implement pagination for the API",
  subagent_type: "coder",
  model: "sonnet"
})

// Complex task - use opus
Task({
  prompt: "Design event-driven architecture for real-time features",
  subagent_type: "system-architect",
  model: "opus"
})
```

---

## Memory Operations

### Store Patterns and Decisions

```javascript
// Store architectural decision
mcp__claude_flow__memory_store({
  key: "adr-001-auth",
  value: JSON.stringify({
    title: "Use JWT for Authentication",
    status: "accepted",
    context: "Need stateless auth for microservices",
    decision: "JWT with refresh tokens",
    consequences: ["Scalable", "Requires secure token storage"]
  }),
  namespace: "architecture",
  tags: ["adr", "auth", "security"]
})

// Store code pattern
mcp__claude_flow__memory_store({
  key: "pattern-repository",
  value: JSON.stringify({
    name: "Repository Pattern",
    description: "Abstract data access layer",
    example: "class UserRepository extends BaseRepository<User>"
  }),
  namespace: "patterns",
  tags: ["pattern", "data-access"]
})

// Store context for long session
mcp__claude_flow__memory_store({
  key: "current-task",
  value: "Implementing user authentication with OAuth2",
  namespace: "session"
})
```

### Search Memory

```javascript
// Semantic search (HNSW-indexed)
mcp__claude_flow__memory_search({
  query: "how do we handle authentication",
  limit: 5,
  namespace: "architecture"
})

// Search patterns
mcp__claude_flow__memory_search({
  query: "data access patterns",
  limit: 10,
  namespace: "patterns"
})
```

### CLI Memory Operations

```bash
# Store with vector embedding
npx claude-flow@v3alpha memory store -k "auth-impl" --value "JWT implementation details" --vector

# Search with similarity
npx claude-flow@v3alpha memory search -q "authentication" --limit 5

# List all in namespace
npx claude-flow@v3alpha memory list -n architecture

# Get stats
npx claude-flow@v3alpha memory stats
```

---

## Swarm Coordination

### Initialize Swarm (MCP + Task)

**Critical**: MCP coordinates, Task executes. Both must be in same message.

```javascript
// STEP 1: Initialize coordination
mcp__claude_flow__swarm_init({
  topology: "hierarchical",
  maxAgents: 8,
  strategy: "specialized"
})

// STEP 2: Spawn agents (in same message!)
Task("Coordinator", "Coordinate swarm, validate outputs", "hierarchical-coordinator")
Task("Researcher", "Analyze requirements and codebase", "researcher")
Task("Architect", "Design implementation approach", "system-architect")
Task("Coder", "Implement the solution", "coder")
Task("Tester", "Write comprehensive tests", "tester")
Task("Reviewer", "Review code quality", "reviewer")
```

### Swarm Topologies

| Topology | Use Case | Agents |
|----------|----------|--------|
| `hierarchical` | Most coding tasks | 4-8 |
| `mesh` | Creative/exploratory | 4-6 |
| `hierarchical-mesh` | Large projects | 10-15 |
| `ring` | Sequential workflows | 3-5 |
| `star` | Central coordination | 5-8 |

### Swarm Strategies

| Strategy | Description |
|----------|-------------|
| `specialized` | Clear roles, no overlap (anti-drift) |
| `balanced` | Even work distribution |
| `adaptive` | Dynamic based on task |
| `development` | Focus on coding |
| `testing` | Focus on quality |
| `research` | Focus on exploration |

---

## Hooks System

### 12 Background Workers

| Worker | Priority | Trigger |
|--------|----------|---------|
| `ultralearn` | normal | Deep learning |
| `optimize` | high | Performance |
| `consolidate` | low | Memory cleanup |
| `predict` | normal | Preloading |
| `audit` | critical | Security |
| `map` | normal | Codebase analysis |
| `preload` | low | Resource loading |
| `deepdive` | normal | Code analysis |
| `document` | normal | Auto-docs |
| `refactor` | normal | Suggestions |
| `benchmark` | normal | Performance |
| `testgaps` | normal | Test coverage |

```bash
# List workers
npx claude-flow@v3alpha hooks worker list

# Trigger specific worker
npx claude-flow@v3alpha hooks worker dispatch --trigger audit
npx claude-flow@v3alpha hooks worker dispatch --trigger testgaps

# Check worker status
npx claude-flow@v3alpha hooks worker status
```

### Workflow Automation

```bash
# Pre-task: Get routing and context
npx claude-flow@v3alpha hooks pre-task --description "Implement OAuth2"

# Post-task: Record outcome
npx claude-flow@v3alpha hooks post-task --task-id "task-123" --success true

# Session management
npx claude-flow@v3alpha hooks session-start --session-id "dev-session"
npx claude-flow@v3alpha hooks session-end --export-metrics true
```

---

## Neural & Intelligence Features

### RuVector Intelligence System

```bash
# Train on codebase patterns
npx claude-flow@v3alpha neural train --model-type moe --epochs 10

# Check training status
npx claude-flow@v3alpha neural status

# View learned patterns
npx claude-flow@v3alpha neural patterns

# Get prediction for task
npx claude-flow@v3alpha neural predict --task "optimize database queries"

# Optimize neural configuration
npx claude-flow@v3alpha neural optimize
```

### Pretrain from Repository

```bash
# Learn patterns from codebase
npx claude-flow@v3alpha hooks pretrain --model-type moe --epochs 10

# Build agent profiles from patterns
npx claude-flow@v3alpha hooks build-agents --agent-types coder,tester,reviewer
```

### Intelligence Pipeline

1. **RETRIEVE** - Fetch patterns via HNSW search
2. **JUDGE** - Evaluate with verdicts
3. **DISTILL** - Extract learnings via LoRA
4. **CONSOLIDATE** - Prevent forgetting via EWC++

---

## Security Features

### Security Scanning

```bash
# Full security scan
npx claude-flow@v3alpha security scan --depth full

# Quick scan
npx claude-flow@v3alpha security scan --depth quick

# Audit specific areas
npx claude-flow@v3alpha security audit --focus auth,api

# Check for CVEs
npx claude-flow@v3alpha security cve

# Threat modeling
npx claude-flow@v3alpha security threats

# Validate security config
npx claude-flow@v3alpha security validate
```

### Security Module Usage

```typescript
// In code, use @claude-flow/security
import { InputValidator, PathValidator, SafeExecutor } from '@claude-flow/security';

// Validate input at boundaries
const validator = new InputValidator();
const result = validator.validate(userInput, schema);

// Prevent path traversal
const pathValidator = new PathValidator();
const safePath = pathValidator.validate(userPath, allowedDirs);

// Safe command execution
const executor = new SafeExecutor();
const output = await executor.run(command, { timeout: 5000 });
```

---

## Session Management

### Start Session

```bash
# Start named session
npx claude-flow@v3alpha session start --name "feature-auth"

# Or via hooks
npx claude-flow@v3alpha hooks session-start --session-id "feature-auth-$(date +%s)"
```

### During Session

```javascript
// Store session context
mcp__claude_flow__memory_store({
  key: "session-goal",
  value: "Implement OAuth2 authentication",
  namespace: "session"
})

// Track progress
mcp__claude_flow__memory_store({
  key: "session-progress",
  value: JSON.stringify({
    completed: ["research", "design"],
    inProgress: ["implementation"],
    pending: ["testing", "review"]
  }),
  namespace: "session"
})
```

### End Session

```bash
# End with metrics export
npx claude-flow@v3alpha hooks session-end --export-metrics true

# Or restore later
npx claude-flow@v3alpha session save --id "session-123"
npx claude-flow@v3alpha session restore --id "session-123"
```

---

## Performance & Monitoring

### System Health

```bash
# Run diagnostics
npx claude-flow@v3alpha doctor --fix

# Check status
npx claude-flow@v3alpha status

# Daemon status
npx claude-flow@v3alpha daemon status
```

### Performance Benchmarks

```bash
# Run all benchmarks
npx claude-flow@v3alpha performance benchmark --suite all

# Specific benchmark
npx claude-flow@v3alpha performance benchmark --suite memory
npx claude-flow@v3alpha performance benchmark --suite swarm

# Profile execution
npx claude-flow@v3alpha performance profile --duration 60

# Get metrics
npx claude-flow@v3alpha performance metrics

# Generate report
npx claude-flow@v3alpha performance report -o perf-report.json
```

### MCP Server Monitoring

```bash
# Server status
npx claude-flow@v3alpha mcp status

# Health check
npx claude-flow@v3alpha mcp health

# View logs
npx claude-flow@v3alpha mcp logs -n 100 --follow
```

---

## Complete Examples

### Example 1: Feature Implementation

```javascript
// 1. Initialize session
npx claude-flow@v3alpha hooks session-start --session-id "feat-oauth-$(date +%s)"

// 2. Initialize swarm
mcp__claude_flow__swarm_init({
  topology: "hierarchical",
  maxAgents: 6,
  strategy: "specialized"
})

// 3. Store goal
mcp__claude_flow__memory_store({
  key: "current-goal",
  value: "Implement OAuth2 authentication with Google and GitHub providers",
  namespace: "session"
})

// 4. Spawn agents (all in ONE message)
Task("Researcher", "Find existing auth patterns in codebase", "researcher")
Task("Architect", "Design OAuth2 integration architecture", "system-architect", { model: "opus" })
Task("Coder", "Implement OAuth2 with Google and GitHub", "coder")
Task("Tester", "Write OAuth2 integration tests", "tester")

// 5. Track todos
TodoWrite([
  {content: "Research existing patterns", status: "in_progress", activeForm: "Researching"},
  {content: "Design architecture", status: "pending", activeForm: "Designing"},
  {content: "Implement OAuth2", status: "pending", activeForm: "Implementing"},
  {content: "Write tests", status: "pending", activeForm: "Testing"},
  {content: "Review and merge", status: "pending", activeForm: "Reviewing"}
])
```

### Example 2: Security Audit

```javascript
// 1. Run security scan
npx claude-flow@v3alpha security scan --depth full

// 2. Initialize security swarm
mcp__claude_flow__swarm_init({
  topology: "hierarchical",
  maxAgents: 4,
  strategy: "specialized"
})

// 3. Spawn security agents
Task("SecurityArchitect", "Perform threat modeling", "security-architect", { model: "opus" })
Task("Auditor", "Review code for vulnerabilities", "reviewer")
Task("Tester", "Write security test cases", "tester")

// 4. Store findings
mcp__claude_flow__memory_store({
  key: "security-findings",
  value: JSON.stringify({ /* findings */ }),
  namespace: "security",
  tags: ["audit", "findings"]
})
```

### Example 3: Performance Optimization

```javascript
// 1. Run benchmarks
npx claude-flow@v3alpha performance benchmark --suite all

// 2. Initialize optimization swarm
mcp__claude_flow__swarm_init({
  topology: "hierarchical",
  maxAgents: 3,
  strategy: "optimization"
})

// 3. Spawn performance agents
Task("Analyzer", "Identify performance bottlenecks", "perf-analyzer")
Task("Coder", "Implement optimizations", "coder")
Task("Tester", "Verify performance improvements", "tester")

// 4. Track metrics
mcp__claude_flow__memory_store({
  key: "perf-baseline",
  value: JSON.stringify({ /* baseline metrics */ }),
  namespace: "performance"
})
```

---

## Quick Reference Card

### Essential MCP Tools

| Tool | Purpose |
|------|---------|
| `swarm_init` | Initialize swarm |
| `memory_store` | Store data |
| `memory_search` | Search memory |
| `hooks_route` | Route to agent |
| `agent_spawn` | Spawn agent |

### Essential CLI Commands

| Command | Purpose |
|---------|---------|
| `npx claude-flow@v3alpha init --wizard` | Setup |
| `npx claude-flow@v3alpha daemon start` | Start workers |
| `npx claude-flow@v3alpha swarm init` | Init swarm |
| `npx claude-flow@v3alpha memory search` | Search |
| `npx claude-flow@v3alpha doctor --fix` | Diagnose |

### Essential Task Agents

| Agent | Purpose |
|-------|---------|
| `coder` | Implementation |
| `tester` | Testing |
| `reviewer` | Review |
| `researcher` | Exploration |
| `system-architect` | Design |

---

*Claude Flow Feature Reference - Version 3.0.0-alpha*

*For workflow patterns, see [Coding Workflow Guide](./coding-workflow-guide.md)*
