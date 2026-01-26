# Claude Flow V3 Coding Workflow Guide

A practical manual for leveraging Claude Flow to maximize coding productivity through intelligent agent orchestration, swarm coordination, and automated workflows.

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Core Concepts](#core-concepts)
3. [Workflow Patterns](#workflow-patterns)
4. [Agent Selection Guide](#agent-selection-guide)
5. [Model Routing for Cost Optimization](#model-routing-for-cost-optimization)
6. [Anti-Drift Patterns](#anti-drift-patterns)
7. [Common Coding Workflows](#common-coding-workflows)
8. [Advanced Techniques](#advanced-techniques)
9. [Troubleshooting](#troubleshooting)

---

## Quick Start

### Prerequisites

```bash
# Ensure Node.js 20+ is installed
node --version  # Should be v20+

# Set up API key
export ANTHROPIC_API_KEY="your-key-here"
```

### First-Time Setup

```bash
# Initialize Claude Flow in your project
npx claude-flow@v3alpha init --wizard

# Add MCP server to Claude Code
claude mcp add claude-flow npx claude-flow@v3alpha mcp start

# Start the daemon for background workers
npx claude-flow@v3alpha daemon start

# Run health check
npx claude-flow@v3alpha doctor --fix
```

### Your First Coding Task

```bash
# Simple task - single agent
npx claude-flow@v3alpha agent spawn -t coder --name my-coder

# Complex task - spawn a swarm
npx claude-flow@v3alpha swarm init --v3-mode
```

---

## Core Concepts

### The Three Layers

| Layer | Purpose | Tools |
|-------|---------|-------|
| **Coordination** | Strategy & orchestration | MCP tools (swarm_init, task_orchestrate) |
| **Execution** | Actual code work | Claude Code Task tool with agents |
| **Intelligence** | Learning & optimization | Hooks, memory, neural features |

### Key Principle: MCP Coordinates, Task Tool Executes

- **MCP tools** set up the swarm topology and coordination strategy
- **Task tool** spawns real agents that do the actual coding work
- **Both must be used together** in the same message for complex tasks

### Agent Types for Coding

| Agent | Best For |
|-------|----------|
| `coder` | General implementation, writing code |
| `reviewer` | Code review, quality checks |
| `tester` | Writing and running tests |
| `architect` | System design, structure decisions |
| `researcher` | Exploring codebase, gathering context |
| `backend-dev` | API development, database work |
| `security-architect` | Security reviews, vulnerability fixes |

---

## Workflow Patterns

### Pattern 1: Simple Bug Fix (No Swarm)

For single-file fixes or minor changes, use a direct agent:

```bash
# Just spawn a coder agent
npx claude-flow@v3alpha agent spawn -t coder --name bugfixer
```

Or in Claude Code, simply describe the bug and let it handle directly.

**When to use**: 1-2 files, clear fix, no architectural decisions.

### Pattern 2: Feature Implementation (Small Swarm)

For new features touching 3-5 files:

```javascript
// Initialize with anti-drift configuration
mcp__claude_flow__swarm_init({
  topology: "hierarchical",
  maxAgents: 6,
  strategy: "specialized"
})

// Spawn concurrent agents
Task("Researcher", "Analyze existing patterns for user auth", "researcher")
Task("Coder", "Implement the auth feature", "coder")
Task("Tester", "Write tests for the auth feature", "tester")
```

**When to use**: Multi-file changes, clear requirements, moderate complexity.

### Pattern 3: Large Feature/Refactoring (Full Swarm)

For cross-cutting changes or major features:

```javascript
// Full anti-drift swarm
mcp__claude_flow__swarm_init({
  topology: "hierarchical",
  maxAgents: 8,
  strategy: "specialized"
})

// Comprehensive team
Task("Coordinator", "Coordinate agents, validate outputs against goal", "hierarchical-coordinator")
Task("Researcher", "Analyze codebase and requirements", "researcher")
Task("Architect", "Design implementation approach", "system-architect")
Task("Coder", "Implement the solution", "coder")
Task("Tester", "Write comprehensive tests", "tester")
Task("Reviewer", "Review code quality and security", "reviewer")
```

**When to use**: 5+ files, architectural decisions, high complexity.

---

## Agent Selection Guide

### Quick Reference Table

| Task Type | Recommended Agents | Swarm Size |
|-----------|-------------------|------------|
| Bug fix | coder, tester | 2 |
| Simple feature | coder, tester, reviewer | 3 |
| Complex feature | architect, coder, tester, reviewer | 4-6 |
| Refactoring | architect, coder, reviewer | 3-5 |
| Performance work | perf-engineer, coder | 2-3 |
| Security audit | security-architect, reviewer | 2-3 |
| Documentation | researcher, api-docs | 2 |

### Agent Capabilities

**coder**
- General-purpose implementation
- Can work in any language
- Best for writing new code and modifications

**reviewer**
- Code quality assessment
- Best practices validation
- Security review (basic)

**tester**
- Unit test creation
- Integration test setup
- Test coverage analysis

**system-architect**
- High-level design decisions
- Module structure planning
- Technology selection

**researcher**
- Codebase exploration
- Pattern identification
- Dependency analysis

**backend-dev**
- REST/GraphQL API development
- Database operations
- Server-side logic

**security-architect**
- Threat modeling
- Vulnerability assessment
- Security pattern implementation

---

## Model Routing for Cost Optimization

### The 3-Tier System

V3 includes intelligent routing to minimize costs while maintaining quality:

| Tier | Handler | Latency | Cost | Use Cases |
|------|---------|---------|------|-----------|
| 1 | Agent Booster (WASM) | <1ms | $0 | Simple transforms |
| 2 | Haiku | ~500ms | $0.0002 | Low complexity |
| 3 | Sonnet/Opus | 2-5s | $0.003+ | High complexity |

### Agent Booster Intents (Tier 1 - Free)

When you see `[AGENT_BOOSTER_AVAILABLE]`, these transforms run locally:

| Intent | Description |
|--------|-------------|
| `var-to-const` | Convert var to const/let |
| `add-types` | Add TypeScript types |
| `add-error-handling` | Add try/catch blocks |
| `async-await` | Convert callbacks to async/await |
| `add-logging` | Add log statements |
| `remove-console` | Remove console.log |

For these, use the Edit tool directly instead of spawning an agent.

### Model Selection by Complexity

```javascript
// Simple task - use haiku
Task({
  prompt: "Fix this typo in the config file",
  subagent_type: "coder",
  model: "haiku"  // Fast and cheap
})

// Medium task - use sonnet (default)
Task({
  prompt: "Implement pagination for the user list",
  subagent_type: "coder",
  model: "sonnet"  // Balanced
})

// Complex task - use opus
Task({
  prompt: "Design the authentication architecture with OAuth2",
  subagent_type: "system-architect",
  model: "opus"  // Maximum capability
})
```

### Complexity Indicators

**Use Haiku for**:
- Simple fixes, typos, formatting
- Adding comments or documentation
- Straightforward CRUD operations
- Configuration changes

**Use Sonnet for**:
- Feature implementation
- Debugging complex issues
- Refactoring
- Test writing

**Use Opus for**:
- Architecture decisions
- Security-critical code
- Multi-step reasoning
- Novel problem solving

---

## Anti-Drift Patterns

### What is Drift?

Drift occurs when agents:
- **Goal drift**: Lose sight of the original objective
- **Context drift**: Forget important constraints
- **Sync drift**: Work on inconsistent versions

### Anti-Drift Configuration

Always use this for coding swarms:

```javascript
mcp__claude_flow__swarm_init({
  topology: "hierarchical",  // Central coordinator
  maxAgents: 8,              // Small team
  strategy: "specialized"    // Clear roles
})
```

### Why This Works

| Choice | Benefit |
|--------|---------|
| **hierarchical** | Coordinator validates each output against the goal |
| **maxAgents: 6-8** | Fewer agents = easier coordination |
| **specialized** | Clear boundaries prevent overlap and confusion |

### Additional Anti-Drift Measures

1. **Frequent checkpoints**: Use post-task hooks
   ```bash
   npx claude-flow@v3alpha hooks post-task --task-id "[id]" --success true
   ```

2. **Shared memory namespace**: All agents access same context
   ```javascript
   mcp__claude_flow__memory_usage({
     action: "store",
     namespace: "swarm",
     key: "goal",
     value: "Implement user authentication with JWT"
   })
   ```

3. **Short task cycles**: Break work into verifiable chunks

---

## Common Coding Workflows

### Workflow: Bug Fix

```bash
# 1. Start session
npx claude-flow@v3alpha hooks session-start --session-id "bugfix-$(date +%s)"

# 2. Research the bug
npx claude-flow@v3alpha hooks pre-task --description "Investigate bug #123"

# 3. Let the coder fix it
# (Use Claude Code Task tool with coder agent)

# 4. Run tests
npx claude-flow@v3alpha hooks post-task --success true
```

### Workflow: New Feature

```javascript
// Step 1: Initialize swarm
mcp__claude_flow__swarm_init({
  topology: "hierarchical",
  maxAgents: 6,
  strategy: "specialized"
})

// Step 2: Spawn agents (all in ONE message)
Task("Researcher", "Find where user management is handled", "researcher")
Task("Architect", "Design the profile feature", "system-architect")
Task("Coder", "Implement user profile CRUD", "coder")
Task("Tester", "Write tests for profile feature", "tester")

// Step 3: Track with todos
TodoWrite([
  {content: "Research existing patterns", status: "in_progress", activeForm: "Researching patterns"},
  {content: "Design profile feature", status: "pending", activeForm: "Designing feature"},
  {content: "Implement profile CRUD", status: "pending", activeForm: "Implementing feature"},
  {content: "Write tests", status: "pending", activeForm: "Writing tests"},
  {content: "Review and merge", status: "pending", activeForm: "Reviewing code"}
])
```

### Workflow: Refactoring

```javascript
// Anti-drift swarm for refactoring
mcp__claude_flow__swarm_init({
  topology: "hierarchical",
  maxAgents: 5,
  strategy: "specialized"
})

// Refactoring team
Task("Coordinator", "Coordinate refactoring, prevent regressions", "hierarchical-coordinator")
Task("Architect", "Plan refactoring approach", "system-architect")
Task("Coder", "Execute refactoring", "coder")
Task("Reviewer", "Ensure no regressions", "reviewer")
```

### Workflow: Code Review

```javascript
// Review swarm
mcp__claude_flow__swarm_init({
  topology: "hierarchical",
  maxAgents: 4,
  strategy: "specialized"
})

Task("SecurityReviewer", "Check for security vulnerabilities", "security-architect")
Task("QualityReviewer", "Check code quality and patterns", "reviewer")
Task("TestReviewer", "Verify test coverage", "tester")
```

### Workflow: Test-Driven Development

```bash
# 1. Spec tests first
npx claude-flow@v3alpha sparc tdd "payment processing" --test-framework jest

# 2. Or manually with swarm
```

```javascript
mcp__claude_flow__swarm_init({
  topology: "hierarchical",
  maxAgents: 4,
  strategy: "specialized"
})

// TDD order: test first, then code
Task("Tester", "Write failing tests for payment processing", "tester")
Task("Coder", "Implement minimal code to pass tests", "coder")
Task("Reviewer", "Review implementation quality", "reviewer")
```

---

## Advanced Techniques

### Memory-Driven Development

Store decisions and context for long-running projects:

```javascript
// Store architectural decision
mcp__claude_flow__memory_usage({
  action: "store",
  namespace: "architecture",
  key: "auth-decision",
  value: JSON.stringify({
    decision: "Use JWT with refresh tokens",
    reason: "Scalability and stateless design",
    date: new Date().toISOString()
  })
})

// Later, retrieve for context
mcp__claude_flow__memory_usage({
  action: "retrieve",
  namespace: "architecture",
  key: "auth-decision"
})
```

### Hook-Based Automation

Set up automatic actions:

```bash
# Auto-format on edit
npx claude-flow@v3alpha hooks post-edit --file "src/**/*.ts" --train-patterns

# Pre-task validation
npx claude-flow@v3alpha hooks pre-task --description "Validate requirements"

# Session metrics
npx claude-flow@v3alpha hooks session-end --export-metrics true
```

### Neural Learning

Let the system learn from your patterns:

```bash
# Train on your codebase patterns
npx claude-flow@v3alpha hooks pretrain --model-type moe --epochs 10

# Build agent profiles from your style
npx claude-flow@v3alpha hooks build-agents --agent-types coder,tester

# Use learned patterns
npx claude-flow@v3alpha hooks route --task "implement similar auth"
```

### HNSW Search for Fast Context

```bash
# Search codebase patterns (150x-12,500x faster)
npx claude-flow@v3alpha memory search -q "authentication patterns"

# Search for similar code
npx claude-flow@v3alpha memory search -q "error handling in services"
```

---

## Troubleshooting

### Common Issues

**Swarm not executing work**

Problem: MCP init runs but nothing happens.

Solution: MCP only coordinates. You must also spawn agents with Task tool:

```javascript
// WRONG - only coordinates
mcp__claude_flow__swarm_init({...})

// RIGHT - coordinate AND execute
mcp__claude_flow__swarm_init({...})
Task("Coder", "Do the work", "coder")  // Must be in same message
```

**Agents losing context**

Problem: Agents seem to forget what they're working on.

Solution: Use hierarchical topology with shared memory:

```javascript
mcp__claude_flow__swarm_init({
  topology: "hierarchical",  // Not mesh
  strategy: "specialized"
})

// Store context in memory
mcp__claude_flow__memory_usage({
  action: "store",
  namespace: "context",
  key: "current-task",
  value: "Full description of what we're doing"
})
```

**High costs / slow execution**

Problem: Tasks taking too long or costing too much.

Solution: Use appropriate model routing:

1. Check for `[AGENT_BOOSTER_AVAILABLE]` - use Edit tool directly
2. Use `model: "haiku"` for simple tasks
3. Reserve opus for complex architecture decisions

**Agents conflicting**

Problem: Multiple agents editing same files incorrectly.

Solution: Use hierarchical topology with clear roles:

```javascript
mcp__claude_flow__swarm_init({
  topology: "hierarchical",  // Single coordinator
  maxAgents: 6,              // Keep team small
  strategy: "specialized"    // Clear boundaries
})
```

### Health Checks

```bash
# Full system diagnostic
npx claude-flow@v3alpha doctor --fix

# Check specific components
npx claude-flow@v3alpha status
npx claude-flow@v3alpha daemon status
npx claude-flow@v3alpha memory stats
```

### Debug Mode

```bash
# Enable verbose logging
export CLAUDE_FLOW_LOG_LEVEL=debug

# Run with tracing
npx claude-flow@v3alpha swarm init --v3-mode --verbose
```

---

## Quick Reference Card

### Essential Commands

| Command | Purpose |
|---------|---------|
| `npx claude-flow@v3alpha init --wizard` | Set up project |
| `npx claude-flow@v3alpha daemon start` | Start background workers |
| `npx claude-flow@v3alpha swarm init --v3-mode` | Initialize swarm |
| `npx claude-flow@v3alpha agent spawn -t coder` | Spawn single agent |
| `npx claude-flow@v3alpha memory search -q "query"` | Search codebase |
| `npx claude-flow@v3alpha doctor --fix` | Diagnose issues |

### Task Complexity Decision Tree

```
Is it a simple fix (1-2 lines)?
├── Yes → Edit directly, no agent needed
└── No → Is it a single file?
    ├── Yes → Spawn one coder agent
    └── No → Is it 3+ files?
        ├── Yes, but straightforward → Small swarm (3-4 agents)
        └── Yes, with architecture decisions → Full swarm (6-8 agents)
```

### Model Selection Quick Guide

```
Simple transform (var→const, add types)?
├── Yes → Use Agent Booster (Edit tool directly)
└── No → Is it simple fix/formatting?
    ├── Yes → Use model: "haiku"
    └── No → Is it feature/debugging?
        ├── Yes → Use model: "sonnet" (default)
        └── No → Use model: "opus" (architecture/security)
```

---

## Summary: Best Practices

1. **Always coordinate AND execute** - MCP tools + Task tool in same message
2. **Use anti-drift config** - hierarchical + specialized + small team
3. **Route by complexity** - Agent Booster → Haiku → Sonnet → Opus
4. **Batch operations** - All todos, agents, and files in single messages
5. **Use memory** - Store context and decisions for consistency
6. **Track with todos** - Always use TodoWrite for visibility
7. **Keep swarms small** - 6-8 agents max for coding tasks

---

*Claude Flow V3 Coding Workflow Guide - Version 3.0.0-alpha*

*For more documentation, see the [full user guide](../v2/docs/guides/USER_GUIDE.md)*
