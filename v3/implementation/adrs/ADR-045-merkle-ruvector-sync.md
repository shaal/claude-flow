# ADR-045: Merkle Tree Integration with RuVector for Code/Document Synchronization

**Status:** Proposed
**Date:** 2026-01-28
**Author:** Claude Flow Architecture Team
**Version:** 1.0.0
**Methodology:** SPARC + TDD

---

## Executive Summary

This ADR proposes integrating Merkle trees with RuVector to enable efficient, verifiable synchronization of code and documents across distributed systems. The integration provides content-addressable storage, incremental change detection, and cryptographic verification while leveraging RuVector's existing HNSW vector search capabilities.

---

## Table of Contents

1. [SPARC Phase 1: Specification](#sparc-phase-1-specification)
2. [SPARC Phase 2: Pseudocode](#sparc-phase-2-pseudocode)
3. [SPARC Phase 3: Architecture](#sparc-phase-3-architecture)
4. [SPARC Phase 4: Refinement](#sparc-phase-4-refinement)
5. [SPARC Phase 5: Completion](#sparc-phase-5-completion)
6. [TDD Test Specifications](#tdd-test-specifications)

---

# SPARC Phase 1: Specification

## Problem Statement

Current RuVector implementation lacks:

1. **Change Detection Efficiency** - Full re-embedding required on any file change
2. **Synchronization Verification** - No cryptographic proof of sync state
3. **Incremental Updates** - O(n) operations for single-file changes
4. **Distributed Consistency** - No mechanism to verify peer alignment
5. **Version History** - No efficient diff between document states

## Goals

| Goal | Metric | Target |
|------|--------|--------|
| **Incremental Sync** | Update latency for single file | < 50ms |
| **Change Detection** | Time to detect k changes in n files | O(k log n) |
| **Verification** | Proof size for n documents | O(log n) |
| **Storage Efficiency** | Deduplication ratio | > 60% |
| **Embedding Cache Hit** | Unchanged content cache rate | > 95% |

## User Stories

### US-1: Developer Syncing Codebase
```
AS A developer using Claude Flow
I WANT my codebase changes to sync incrementally
SO THAT only modified files are re-embedded and indexed
```

**Acceptance Criteria:**
- [ ] Modifying 1 file in 10,000-file codebase syncs in < 100ms
- [ ] Unchanged files are not re-processed
- [ ] Sync state is cryptographically verifiable

### US-2: Team Collaboration
```
AS A team lead
I WANT to verify that all team members have identical knowledge bases
SO THAT we can ensure consistent AI assistance across the team
```

**Acceptance Criteria:**
- [ ] Compare two installations with single root hash
- [ ] Identify divergent files in O(k log n) time
- [ ] Generate sync diff report

### US-3: Document Version Control
```
AS A documentation maintainer
I WANT to track document versions with minimal storage
SO THAT I can reference any historical state efficiently
```

**Acceptance Criteria:**
- [ ] Store version history with structural sharing
- [ ] Retrieve any version in O(log n) time
- [ ] Generate diff between versions in O(k) time

### US-4: Offline-First Sync
```
AS A developer working offline
I WANT my local changes to merge cleanly when reconnected
SO THAT I don't lose work or create conflicts
```

**Acceptance Criteria:**
- [ ] CRDT-based merge for concurrent edits
- [ ] Conflict detection and resolution
- [ ] Automatic reconciliation on reconnect

## Functional Requirements

### FR-1: Merkle Tree Construction
- Build Merkle tree from file system hierarchy
- Support content-defined chunking for large files
- Use domain-separated hashing (0x00 for leaves, 0x01 for nodes)

### FR-2: Incremental Updates
- O(log n) tree update on single file change
- Maintain left-sibling path for efficient insertion
- Support batch updates for multiple changes

### FR-3: Change Detection
- Compare two trees by root hash
- Recursive descent to find divergent subtrees
- Generate minimal change set

### FR-4: Vector Cache Integration
- Cache embeddings by content hash (CID)
- Skip embedding for unchanged content
- Invalidate cache on content change

### FR-5: Distributed Sync Protocol
- Exchange root hashes for quick comparison
- Request only divergent subtrees
- Verify received content by hash

### FR-6: Version History
- Merkle DAG for commit history (Git-style)
- Structural sharing across versions
- Efficient diff between any two commits

## Non-Functional Requirements

### NFR-1: Performance
- Tree construction: < 1s for 10,000 files
- Single update: < 50ms
- Root comparison: < 1ms
- Full sync (1000 changes): < 5s

### NFR-2: Storage
- Overhead: < 5% of content size
- Deduplication: > 60% for similar content
- Index size: O(n log n)

### NFR-3: Security
- SHA-256 for content hashing
- Ed25519 for signing
- Domain separation to prevent attacks

### NFR-4: Reliability
- Crash recovery with WAL
- Atomic updates
- Corruption detection

---

# SPARC Phase 2: Pseudocode

## Core Data Structures

```typescript
// Merkle Node representing file or directory
interface MerkleNode {
  cid: string;              // Content ID (SHA-256 hash)
  type: 'leaf' | 'branch';
  size: number;             // Total size of subtree

  // For leaves (files)
  content?: Uint8Array;
  chunks?: ChunkInfo[];     // For large files

  // For branches (directories)
  children?: Map<string, MerkleNode>;

  // Metadata
  name: string;
  modTime: number;

  // Vector integration
  embeddingCid?: string;    // CID of cached embedding
}

// Incremental tree state
interface IncrementalMerkleTree {
  root: MerkleNode | null;
  leafCount: number;
  leftSiblings: string[];   // Hashes on path to next leaf

  // Embedding cache
  embeddingCache: Map<string, Float32Array>;

  // Version history
  commits: Map<string, Commit>;
  head: string;             // Current commit CID
}

// Version commit
interface Commit {
  cid: string;
  parent: string | null;
  tree: string;             // Root CID of tree at this commit
  message: string;
  timestamp: number;
  author: string;
  signature?: string;
}

// Sync state
interface SyncState {
  localRoot: string;
  remoteRoot: string;
  divergentPaths: string[];
  pendingChanges: Change[];
}
```

## Algorithm: Build Merkle Tree

```
FUNCTION buildMerkleTree(rootPath: string): MerkleNode
  INPUT: Root directory path
  OUTPUT: Merkle tree root node

  1. entries ← listDirectory(rootPath)
  2. IF entries is empty THEN
       RETURN createEmptyNode()
     END IF

  3. children ← new Map()
  4. FOR EACH entry IN entries DO
       IF isDirectory(entry) THEN
         // Recurse into directory
         childNode ← buildMerkleTree(entry.path)
       ELSE
         // Create leaf node for file
         content ← readFile(entry.path)

         // Content-defined chunking for large files
         IF content.length > CHUNK_THRESHOLD THEN
           chunks ← contentDefinedChunking(content)
           childNode ← createChunkedLeaf(chunks, entry)
         ELSE
           childNode ← createLeaf(content, entry)
         END IF
       END IF

       children.set(entry.name, childNode)
     END FOR

  5. // Sort children for deterministic hash
     sortedChildren ← sortByName(children)

  6. // Compute branch hash
     hashInput ← BRANCH_PREFIX  // 0x01
     FOR EACH (name, child) IN sortedChildren DO
       hashInput ← hashInput || encode(name) || child.cid
     END FOR

     branchCid ← sha256(hashInput)

  7. RETURN MerkleNode {
       cid: branchCid,
       type: 'branch',
       children: sortedChildren,
       size: sumChildSizes(sortedChildren)
     }
END FUNCTION
```

## Algorithm: Content-Defined Chunking

```
FUNCTION contentDefinedChunking(content: Uint8Array): Chunk[]
  INPUT: File content bytes
  OUTPUT: Array of content-defined chunks

  // Use Rabin fingerprinting for boundary detection
  1. chunks ← []
  2. start ← 0
  3. minSize ← 2KB
  4. maxSize ← 64KB
  5. targetSize ← 8KB
  6. mask ← (1 << 13) - 1  // ~8KB average

  7. FOR i FROM minSize TO content.length DO
       fingerprint ← rabinFingerprint(content, i - 48, i)

       IF (fingerprint & mask) = mask OR (i - start) >= maxSize THEN
         // Chunk boundary found
         chunkContent ← content.slice(start, i)
         chunkCid ← sha256(LEAF_PREFIX || chunkContent)

         chunks.push(Chunk {
           cid: chunkCid,
           start: start,
           size: i - start,
           content: chunkContent
         })

         start ← i
       END IF
     END FOR

  8. // Handle final chunk
     IF start < content.length THEN
       finalContent ← content.slice(start)
       finalCid ← sha256(LEAF_PREFIX || finalContent)
       chunks.push(Chunk { cid: finalCid, ... })
     END IF

  9. RETURN chunks
END FUNCTION
```

## Algorithm: Incremental Update

```
FUNCTION incrementalUpdate(tree: IncrementalMerkleTree,
                           path: string,
                           newContent: Uint8Array): string
  INPUT: Tree state, file path, new content
  OUTPUT: New root CID

  1. // Compute new leaf CID
     newLeafCid ← sha256(LEAF_PREFIX || newContent)

  2. // Check if content unchanged
     IF embeddingCache.has(newLeafCid) THEN
       // Content unchanged, skip re-embedding
       RETURN tree.root.cid
     END IF

  3. // Parse path into components
     pathParts ← path.split('/')

  4. // Traverse tree and collect path
     current ← tree.root
     ancestors ← []

     FOR i FROM 0 TO pathParts.length - 2 DO
       ancestors.push((pathParts[i], current))
       current ← current.children.get(pathParts[i + 1])
     END FOR

  5. // Create new leaf
     newLeaf ← createLeaf(newContent, pathParts[last])

  6. // Rebuild path to root (O(log n))
     updatedNode ← newLeaf

     FOR i FROM ancestors.length - 1 DOWNTO 0 DO
       (name, parent) ← ancestors[i]

       // Clone parent with updated child
       newChildren ← clone(parent.children)
       newChildren.set(name, updatedNode)

       // Recompute parent hash
       updatedNode ← recomputeBranchHash(newChildren)
     END FOR

  7. // Update tree state
     tree.root ← updatedNode

  8. // Generate embedding for new content (async)
     scheduleEmbedding(newLeafCid, newContent)

  9. RETURN updatedNode.cid
END FUNCTION
```

## Algorithm: Change Detection

```
FUNCTION detectChanges(treeA: MerkleNode, treeB: MerkleNode): Change[]
  INPUT: Two Merkle tree roots
  OUTPUT: List of changes between trees

  1. // Quick check: identical roots
     IF treeA.cid = treeB.cid THEN
       RETURN []  // Trees are identical
     END IF

  2. changes ← []

  3. // Handle type mismatches
     IF treeA.type ≠ treeB.type THEN
       changes.push(Change { type: 'replaced', path: '/', ... })
       RETURN changes
     END IF

  4. // For leaves, entire content changed
     IF treeA.type = 'leaf' THEN
       changes.push(Change { type: 'modified', ... })
       RETURN changes
     END IF

  5. // For branches, compare children
     allNames ← union(treeA.children.keys(), treeB.children.keys())

     FOR EACH name IN allNames DO
       childA ← treeA.children.get(name)
       childB ← treeB.children.get(name)

       IF childA is undefined THEN
         // Added in B
         changes.push(Change { type: 'added', path: name, node: childB })
       ELSE IF childB is undefined THEN
         // Deleted in B
         changes.push(Change { type: 'deleted', path: name, node: childA })
       ELSE IF childA.cid ≠ childB.cid THEN
         // Recurse into changed subtree
         subChanges ← detectChanges(childA, childB)
         FOR EACH change IN subChanges DO
           change.path ← name + '/' + change.path
           changes.push(change)
         END FOR
       END IF
       // If CIDs match, subtrees are identical - skip
     END FOR

  6. RETURN changes
END FUNCTION
```

## Algorithm: Sync Protocol

```
FUNCTION syncWithPeer(local: MerkleTree, peer: PeerConnection): SyncResult
  INPUT: Local tree, peer connection
  OUTPUT: Sync result with changes applied

  1. // Phase 1: Exchange root hashes
     localRoot ← local.root.cid
     remoteRoot ← peer.getRootCid()

     IF localRoot = remoteRoot THEN
       RETURN SyncResult { status: 'synchronized', changes: [] }
     END IF

  2. // Phase 2: Find divergent subtrees
     divergentPaths ← []
     queue ← [('/', localRoot, remoteRoot)]

     WHILE queue is not empty DO
       (path, localCid, remoteCid) ← queue.dequeue()

       IF localCid = remoteCid THEN
         CONTINUE  // Subtree matches
       END IF

       // Fetch node metadata
       localNode ← local.getNode(localCid)
       remoteNode ← peer.getNode(remoteCid)

       IF localNode.type = 'leaf' OR remoteNode.type = 'leaf' THEN
         divergentPaths.push(path)
       ELSE
         // Queue children for comparison
         FOR EACH childName IN union(localNode.children, remoteNode.children) DO
           localChild ← localNode.children.get(childName)?.cid
           remoteChild ← remoteNode.children.get(childName)?.cid

           IF localChild ≠ remoteChild THEN
             queue.enqueue((path + '/' + childName, localChild, remoteChild))
           END IF
         END FOR
       END IF
     END WHILE

  3. // Phase 3: Request divergent content
     FOR EACH path IN divergentPaths DO
       remoteContent ← peer.getContent(path)

       // Verify content matches advertised CID
       computedCid ← computeCid(remoteContent)
       IF computedCid ≠ remoteNode.cid THEN
         THROW IntegrityError("Content mismatch for " + path)
       END IF

       // Apply change locally
       local.update(path, remoteContent)
     END FOR

  4. // Phase 4: Verify sync
     newLocalRoot ← local.root.cid
     IF newLocalRoot = remoteRoot THEN
       RETURN SyncResult { status: 'synchronized', changes: divergentPaths }
     ELSE
       // May need another round (concurrent changes)
       RETURN syncWithPeer(local, peer)
     END IF
END FUNCTION
```

## Algorithm: Vector Cache Integration

```
FUNCTION syncWithVectorIndex(tree: MerkleTree, vectorDb: HNSWIndex): SyncStats
  INPUT: Merkle tree, HNSW vector index
  OUTPUT: Sync statistics

  1. stats ← { processed: 0, cached: 0, embedded: 0, deleted: 0 }

  2. // Get current tree state
     currentLeaves ← getAllLeaves(tree.root)
     currentCids ← Set(currentLeaves.map(l => l.cid))

  3. // Get indexed CIDs
     indexedCids ← vectorDb.getAllCids()

  4. // Find changes
     toEmbed ← currentCids - indexedCids      // New content
     toDelete ← indexedCids - currentCids     // Removed content
     unchanged ← currentCids ∩ indexedCids    // Cache hits

  5. stats.cached ← unchanged.size

  6. // Delete removed embeddings
     FOR EACH cid IN toDelete DO
       vectorDb.delete(cid)
       embeddingCache.delete(cid)
       stats.deleted++
     END FOR

  7. // Embed new content (batched for efficiency)
     contentBatch ← []
     FOR EACH cid IN toEmbed DO
       leaf ← getLeafByCid(tree, cid)
       contentBatch.push({ cid, content: leaf.content, metadata: leaf.metadata })

       IF contentBatch.length >= BATCH_SIZE THEN
         embedAndStore(contentBatch, vectorDb)
         stats.embedded += contentBatch.length
         contentBatch ← []
       END IF
     END FOR

     // Process remaining batch
     IF contentBatch.length > 0 THEN
       embedAndStore(contentBatch, vectorDb)
       stats.embedded += contentBatch.length
     END IF

  8. stats.processed ← currentLeaves.length
     RETURN stats
END FUNCTION

FUNCTION embedAndStore(batch: ContentBatch[], vectorDb: HNSWIndex): void
  1. // Batch embedding for efficiency
     contents ← batch.map(b => b.content)
     embeddings ← embeddingModel.batchEmbed(contents)

  2. FOR i FROM 0 TO batch.length - 1 DO
       cid ← batch[i].cid
       embedding ← embeddings[i]
       metadata ← batch[i].metadata

       // Store in HNSW index
       vectorDb.insert(cid, embedding, metadata)

       // Cache for future lookups
       embeddingCache.set(cid, embedding)
     END FOR
END FUNCTION
```

---

# SPARC Phase 3: Architecture

## System Architecture

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                    Merkle-RuVector Sync Architecture                          │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                           Application Layer                              │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │ │
│  │  │  CLI Sync   │  │  MCP Tools  │  │  Watch Mode │  │  Git Hooks  │    │ │
│  │  │  Commands   │  │  (12 tools) │  │  (FSEvents) │  │  (pre-push) │    │ │
│  │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘    │ │
│  │         │                │                │                │            │ │
│  └─────────┼────────────────┼────────────────┼────────────────┼────────────┘ │
│            │                │                │                │              │
│            ▼                ▼                ▼                ▼              │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                         Sync Orchestrator                                │ │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐         │ │
│  │  │  Change Queue   │  │  Batch Manager  │  │  Conflict       │         │ │
│  │  │  (Debounced)    │  │  (Coalescing)   │  │  Resolver       │         │ │
│  │  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘         │ │
│  └───────────┼────────────────────┼────────────────────┼───────────────────┘ │
│              │                    │                    │                     │
│              ▼                    ▼                    ▼                     │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                         Merkle Engine                                    │ │
│  │                                                                          │ │
│  │  ┌───────────────────────────────────────────────────────────────────┐  │ │
│  │  │                    Tree Manager                                    │  │ │
│  │  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐               │  │ │
│  │  │  │ Tree Build  │  │ Incremental │  │   Change    │               │  │ │
│  │  │  │   O(n)      │  │ Update O(lg)│  │ Detect O(k) │               │  │ │
│  │  │  └─────────────┘  └─────────────┘  └─────────────┘               │  │ │
│  │  └───────────────────────────────────────────────────────────────────┘  │ │
│  │                                                                          │ │
│  │  ┌───────────────────────────────────────────────────────────────────┐  │ │
│  │  │                    Content Store (CAS)                             │  │ │
│  │  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐               │  │ │
│  │  │  │ Chunk Store │  │ Dedup Index │  │ Blob Store  │               │  │ │
│  │  │  │ (SQLite)    │  │ (FNV-1a)    │  │ (LevelDB)   │               │  │ │
│  │  │  └─────────────┘  └─────────────┘  └─────────────┘               │  │ │
│  │  └───────────────────────────────────────────────────────────────────┘  │ │
│  │                                                                          │ │
│  │  ┌───────────────────────────────────────────────────────────────────┐  │ │
│  │  │                    Version Manager (DAG)                           │  │ │
│  │  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐               │  │ │
│  │  │  │ Commit Log  │  │ Branch Mgr  │  │ Diff Engine │               │  │ │
│  │  │  │ (Append)    │  │ (Refs)      │  │ O(k lg n)   │               │  │ │
│  │  │  └─────────────┘  └─────────────┘  └─────────────┘               │  │ │
│  │  └───────────────────────────────────────────────────────────────────┘  │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                           │                                  │
│                                           ▼                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                         RuVector Integration                             │ │
│  │                                                                          │ │
│  │  ┌───────────────────────────────────────────────────────────────────┐  │ │
│  │  │                    Embedding Cache                                 │  │ │
│  │  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐               │  │ │
│  │  │  │ CID → Vec   │  │ LRU Evict   │  │ Persist     │               │  │ │
│  │  │  │ Map (95%+)  │  │ (Memory)    │  │ (SQLite)    │               │  │ │
│  │  │  └─────────────┘  └─────────────┘  └─────────────┘               │  │ │
│  │  └───────────────────────────────────────────────────────────────────┘  │ │
│  │                                                                          │ │
│  │  ┌───────────────────────────────────────────────────────────────────┐  │ │
│  │  │                    HNSW Index                                      │  │ │
│  │  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐               │  │ │
│  │  │  │ Vector Idx  │  │ Metadata    │  │ Persistent  │               │  │ │
│  │  │  │ (150x fast) │  │ Store       │  │ (USEARCH)   │               │  │ │
│  │  │  └─────────────┘  └─────────────┘  └─────────────┘               │  │ │
│  │  └───────────────────────────────────────────────────────────────────┘  │ │
│  │                                                                          │ │
│  │  ┌───────────────────────────────────────────────────────────────────┐  │ │
│  │  │                    Neural Learning (SONA)                          │  │ │
│  │  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐               │  │ │
│  │  │  │ Pattern Idx │  │ LoRA Train  │  │ EWC++ Guard │               │  │ │
│  │  │  │ (Merkle)    │  │ (Adaptive)  │  │ (Stability) │               │  │ │
│  │  │  └─────────────┘  └─────────────┘  └─────────────┘               │  │ │
│  │  └───────────────────────────────────────────────────────────────────┘  │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                           │                                  │
│                                           ▼                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                         Sync Protocol Layer                              │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │ │
│  │  │ Peer Disc   │  │ DAG Sync    │  │ CRDT Merge  │  │ Gossip      │    │ │
│  │  │ (mDNS/DHT)  │  │ (Graphsync) │  │ (LWW/MVR)   │  │ (Anti-Ent)  │    │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘    │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                           │                                  │
│                                           ▼                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                         Storage Layer                                    │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │ │
│  │  │ Local FS    │  │ SQLite      │  │ IPFS        │  │ S3/R2       │    │ │
│  │  │ (Primary)   │  │ (Metadata)  │  │ (Dist)      │  │ (Cloud)     │    │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘    │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                               │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Component Specifications

### 1. Merkle Tree Manager

```typescript
// v3/@claude-flow/merkle/src/tree-manager.ts

interface TreeManagerConfig {
  hashAlgorithm: 'sha256' | 'blake3';
  chunkingStrategy: 'fixed' | 'content-defined' | 'semantic';
  minChunkSize: number;      // Default: 2KB
  maxChunkSize: number;      // Default: 64KB
  targetChunkSize: number;   // Default: 8KB
}

interface TreeManager {
  // Build complete tree
  build(rootPath: string): Promise<MerkleTree>;

  // Incremental operations
  update(path: string, content: Uint8Array): Promise<string>;
  delete(path: string): Promise<string>;
  rename(oldPath: string, newPath: string): Promise<string>;

  // Query operations
  getNode(cid: string): Promise<MerkleNode | null>;
  getPath(path: string): Promise<MerkleNode | null>;
  listChildren(path: string): Promise<MerkleNode[]>;

  // Comparison
  diff(otherTree: MerkleTree): Promise<Change[]>;
  verify(rootCid: string): Promise<VerificationResult>;

  // Serialization
  export(): Promise<Uint8Array>;
  import(data: Uint8Array): Promise<void>;
}
```

### 2. Content-Addressable Store

```typescript
// v3/@claude-flow/merkle/src/content-store.ts

interface ContentStore {
  // Basic operations
  put(content: Uint8Array): Promise<string>;  // Returns CID
  get(cid: string): Promise<Uint8Array | null>;
  has(cid: string): Promise<boolean>;
  delete(cid: string): Promise<boolean>;

  // Batch operations
  putBatch(contents: Uint8Array[]): Promise<string[]>;
  getBatch(cids: string[]): Promise<Map<string, Uint8Array>>;

  // Chunking
  putLarge(content: Uint8Array): Promise<ChunkedContent>;
  getLarge(rootCid: string): Promise<Uint8Array>;

  // Statistics
  getStats(): Promise<StoreStats>;
  gc(): Promise<GCResult>;  // Garbage collection
}

interface StoreStats {
  totalObjects: number;
  totalSize: number;
  deduplicatedSize: number;
  deduplicationRatio: number;
}
```

### 3. Vector Cache Bridge

```typescript
// v3/@claude-flow/merkle/src/vector-cache.ts

interface VectorCacheBridge {
  // Cache operations
  getCachedEmbedding(cid: string): Promise<Float32Array | null>;
  cacheEmbedding(cid: string, embedding: Float32Array): Promise<void>;

  // Sync operations
  syncWithTree(tree: MerkleTree): Promise<SyncStats>;
  invalidatePath(path: string): Promise<number>;

  // Batch embedding
  embedMissing(cids: string[]): Promise<Map<string, Float32Array>>;

  // Query with Merkle verification
  searchWithProof(
    query: Float32Array,
    k: number
  ): Promise<SearchResultWithProof[]>;
}

interface SearchResultWithProof {
  cid: string;
  score: number;
  content: Uint8Array;
  merkleProof: MerkleProof;  // Proof of inclusion in tree
}

interface MerkleProof {
  leaf: string;           // Leaf CID
  siblings: string[];     // Sibling hashes on path
  root: string;           // Expected root
}
```

### 4. Sync Protocol

```typescript
// v3/@claude-flow/merkle/src/sync-protocol.ts

interface SyncProtocol {
  // Discovery
  discoverPeers(): Promise<Peer[]>;
  announceSelf(): Promise<void>;

  // Sync operations
  syncWithPeer(peer: Peer): Promise<SyncResult>;
  syncWithAll(): Promise<SyncResult[]>;

  // Real-time sync
  startWatch(): void;
  stopWatch(): void;
  onRemoteChange(handler: (change: RemoteChange) => void): void;

  // Conflict handling
  getConflicts(): Promise<Conflict[]>;
  resolveConflict(id: string, resolution: Resolution): Promise<void>;
}

interface SyncResult {
  peer: string;
  status: 'synchronized' | 'partial' | 'failed';
  changesApplied: number;
  changesRejected: number;
  conflicts: Conflict[];
  duration: number;
}
```

### 5. Version Manager

```typescript
// v3/@claude-flow/merkle/src/version-manager.ts

interface VersionManager {
  // Commit operations
  commit(message: string): Promise<Commit>;
  getCommit(cid: string): Promise<Commit | null>;

  // Branch operations
  createBranch(name: string): Promise<void>;
  switchBranch(name: string): Promise<void>;
  mergeBranch(name: string): Promise<MergeResult>;

  // History
  log(options?: LogOptions): Promise<Commit[]>;
  diff(fromCid: string, toCid: string): Promise<Change[]>;

  // Checkout
  checkout(commitCid: string): Promise<void>;
  restore(path: string, commitCid: string): Promise<void>;
}
```

## File Structure

```
v3/@claude-flow/merkle/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts                  # Public API exports
│   ├── types.ts                  # Type definitions
│   │
│   ├── tree/
│   │   ├── index.ts              # Tree manager
│   │   ├── builder.ts            # Tree construction
│   │   ├── updater.ts            # Incremental updates
│   │   ├── differ.ts             # Change detection
│   │   └── verifier.ts           # Tree verification
│   │
│   ├── content/
│   │   ├── index.ts              # Content store
│   │   ├── chunker.ts            # Content-defined chunking
│   │   ├── hasher.ts             # Hash computation
│   │   └── dedup.ts              # Deduplication index
│   │
│   ├── vector/
│   │   ├── index.ts              # Vector cache bridge
│   │   ├── cache.ts              # Embedding cache
│   │   ├── sync.ts               # Vector index sync
│   │   └── proof.ts              # Merkle proof generation
│   │
│   ├── sync/
│   │   ├── index.ts              # Sync protocol
│   │   ├── discovery.ts          # Peer discovery
│   │   ├── transfer.ts           # DAG transfer
│   │   ├── crdt.ts               # CRDT merge logic
│   │   └── gossip.ts             # Gossip protocol
│   │
│   ├── version/
│   │   ├── index.ts              # Version manager
│   │   ├── commit.ts             # Commit operations
│   │   ├── branch.ts             # Branch management
│   │   └── diff.ts               # Diff computation
│   │
│   └── storage/
│       ├── index.ts              # Storage abstraction
│       ├── sqlite.ts             # SQLite backend
│       ├── leveldb.ts            # LevelDB backend
│       └── ipfs.ts               # IPFS backend
│
└── tests/
    ├── tree.test.ts
    ├── content.test.ts
    ├── vector.test.ts
    ├── sync.test.ts
    ├── version.test.ts
    └── integration.test.ts
```

## Integration Points

### With Existing RuVector Components

| Component | Integration | Description |
|-----------|-------------|-------------|
| `EmbeddingService` | Vector Cache Bridge | Cache embeddings by CID |
| `HNSWIndex` | Merkle-aware Search | Include proofs in results |
| `AgentDB` | Content Store Backend | Use as persistent storage |
| `SyncBridge` | Merkle Sync Protocol | Replace hash-based sync |
| `ReasoningBank` | Pattern Merkle Index | Version pattern collections |

### With CLI Commands

```bash
# New merkle subcommand group
npx claude-flow@v3alpha merkle init           # Initialize tree
npx claude-flow@v3alpha merkle status         # Show sync status
npx claude-flow@v3alpha merkle sync           # Sync with peers
npx claude-flow@v3alpha merkle diff <commit>  # Show changes
npx claude-flow@v3alpha merkle log            # Show history
npx claude-flow@v3alpha merkle verify         # Verify integrity
```

### MCP Tools

```typescript
// 12 new MCP tools for Merkle operations
const merkleMcpTools = [
  'merkle/init',           // Initialize tree for directory
  'merkle/status',         // Get sync status
  'merkle/update',         // Update file in tree
  'merkle/diff',           // Get changes between states
  'merkle/sync',           // Sync with peer
  'merkle/verify',         // Verify tree integrity
  'merkle/commit',         // Create version commit
  'merkle/log',            // Get version history
  'merkle/checkout',       // Restore version
  'merkle/search',         // Search with Merkle proofs
  'merkle/proof',          // Generate inclusion proof
  'merkle/resolve',        // Resolve conflicts
];
```

---

# SPARC Phase 4: Refinement

## Implementation Phases

### Phase 1: Core Merkle Tree (Week 1-2)

**Objective:** Implement basic Merkle tree operations

| Task | Priority | Effort | Dependencies |
|------|----------|--------|--------------|
| Define types and interfaces | P0 | 2d | None |
| Implement tree builder | P0 | 3d | Types |
| Implement content hasher | P0 | 2d | Types |
| Implement incremental updater | P0 | 3d | Builder |
| Implement change detector | P0 | 2d | Builder |
| Unit tests | P0 | 2d | All above |

**Deliverables:**
- `@claude-flow/merkle` package skeleton
- Tree build/update/diff operations
- 90% test coverage for core

### Phase 2: Content-Addressable Store (Week 2-3)

**Objective:** Implement CAS with chunking and dedup

| Task | Priority | Effort | Dependencies |
|------|----------|--------|--------------|
| Implement chunker (Rabin) | P0 | 2d | Phase 1 |
| Implement blob store | P0 | 2d | Chunker |
| Implement dedup index | P1 | 2d | Blob store |
| SQLite persistence | P0 | 2d | All above |
| Garbage collection | P2 | 1d | Persistence |

**Deliverables:**
- Content-defined chunking
- 60%+ deduplication
- Persistent storage

### Phase 3: Vector Cache Integration (Week 3-4)

**Objective:** Bridge Merkle tree with RuVector embeddings

| Task | Priority | Effort | Dependencies |
|------|----------|--------|--------------|
| Embedding cache by CID | P0 | 2d | Phase 1-2 |
| Incremental embedding sync | P0 | 3d | Cache |
| Merkle proof generation | P1 | 2d | Phase 1 |
| Search with proofs | P1 | 2d | Proofs |
| Cache invalidation | P0 | 1d | Cache |

**Deliverables:**
- 95%+ cache hit rate
- Proof-verified search
- < 50ms incremental sync

### Phase 4: Sync Protocol (Week 4-5)

**Objective:** Implement distributed sync

| Task | Priority | Effort | Dependencies |
|------|----------|--------|--------------|
| Root exchange protocol | P0 | 2d | Phase 1 |
| DAG sync (Graphsync-style) | P0 | 3d | Exchange |
| CRDT merge (LWW) | P1 | 2d | DAG sync |
| Conflict detection | P0 | 2d | Merge |
| Gossip protocol | P2 | 2d | All above |

**Deliverables:**
- Peer-to-peer sync
- O(k log n) change sync
- Conflict resolution

### Phase 5: Version Management (Week 5-6)

**Objective:** Git-style version control

| Task | Priority | Effort | Dependencies |
|------|----------|--------|--------------|
| Commit object model | P0 | 2d | Phase 1-2 |
| Branch management | P1 | 2d | Commits |
| Diff between commits | P0 | 2d | Commits |
| Checkout/restore | P1 | 2d | Branch |
| Merge commits | P2 | 2d | All above |

**Deliverables:**
- Commit history
- Branch/merge
- Structural sharing

### Phase 6: CLI & MCP Integration (Week 6-7)

**Objective:** User-facing interfaces

| Task | Priority | Effort | Dependencies |
|------|----------|--------|--------------|
| CLI commands (6) | P0 | 3d | Phase 1-5 |
| MCP tools (12) | P0 | 3d | Phase 1-5 |
| Watch mode | P1 | 2d | CLI |
| Progress reporting | P1 | 1d | CLI |
| Documentation | P0 | 2d | All above |

**Deliverables:**
- Full CLI integration
- MCP tool registration
- User documentation

## Risk Mitigation

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Chunking performance | Medium | High | Benchmark early, optimize hot paths |
| HNSW integration complexity | Medium | Medium | Incremental integration, feature flags |
| Sync conflicts | High | Medium | Well-tested CRDT implementation |
| Storage bloat | Low | Medium | Aggressive dedup, GC |
| Network unreliability | Medium | Low | Retry logic, offline-first design |

## TDD Approach

For each component, follow RED-GREEN-REFACTOR:

1. **RED**: Write failing test for next feature
2. **GREEN**: Minimal implementation to pass
3. **REFACTOR**: Clean up while tests pass

Example TDD cycle for tree builder:

```typescript
// Step 1: RED - Write failing test
describe('TreeBuilder', () => {
  it('should compute correct root hash for single file', async () => {
    const builder = new TreeBuilder();
    const tree = await builder.build('/tmp/test-single-file');

    // Expected: SHA-256 of (0x00 || file_content)
    expect(tree.root.cid).toBe('sha256:abc123...');
  });
});

// Step 2: GREEN - Minimal implementation
class TreeBuilder {
  async build(path: string): Promise<MerkleTree> {
    const content = await fs.readFile(path);
    const hash = sha256(Buffer.concat([LEAF_PREFIX, content]));
    return { root: { cid: hash, type: 'leaf' } };
  }
}

// Step 3: REFACTOR - Add proper structure
class TreeBuilder {
  private hasher: ContentHasher;

  constructor(config: TreeBuilderConfig) {
    this.hasher = new ContentHasher(config.hashAlgorithm);
  }

  async build(path: string): Promise<MerkleTree> {
    const stat = await fs.stat(path);
    if (stat.isFile()) {
      return this.buildLeaf(path);
    }
    return this.buildBranch(path);
  }
  // ...
}
```

---

# SPARC Phase 5: Completion

## Success Criteria

### Performance Targets

| Metric | Target | Test Method |
|--------|--------|-------------|
| Tree build (10K files) | < 1s | Benchmark suite |
| Single file update | < 50ms | Benchmark suite |
| Change detection (1K changes) | < 100ms | Benchmark suite |
| Embedding cache hit | > 95% | Integration test |
| Sync 1K changes | < 5s | E2E test |
| Memory usage | < 100MB | Profiling |

### Quality Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| Test coverage | > 90% | `vitest --coverage` |
| TypeScript strict | 0 errors | `tsc --strict` |
| No security vulns | 0 high/critical | `npm audit` |
| Documentation | 100% public API | TypeDoc |

## Validation Plan

### Unit Tests

```typescript
// tests/tree.test.ts
describe('MerkleTree', () => {
  describe('build', () => {
    it('should create leaf node for single file');
    it('should create branch node for directory');
    it('should sort children deterministically');
    it('should use domain-separated hashing');
  });

  describe('update', () => {
    it('should update in O(log n) time');
    it('should preserve unchanged subtrees');
    it('should recompute path to root');
  });

  describe('diff', () => {
    it('should return empty for identical trees');
    it('should detect added files');
    it('should detect deleted files');
    it('should detect modified files');
    it('should be O(k log n) for k changes');
  });
});
```

### Integration Tests

```typescript
// tests/integration.test.ts
describe('Merkle-RuVector Integration', () => {
  it('should skip embedding for unchanged files');
  it('should invalidate cache on file change');
  it('should generate valid Merkle proofs');
  it('should verify proofs during search');
});
```

### E2E Tests

```typescript
// tests/e2e.test.ts
describe('End-to-End Sync', () => {
  it('should sync two installations');
  it('should handle concurrent edits');
  it('should resolve conflicts with CRDT');
  it('should maintain consistency after crash');
});
```

## Benchmark Suite

```typescript
// benchmarks/merkle-bench.ts
import { bench, describe } from 'vitest';

describe('MerkleTree Benchmarks', () => {
  bench('build 10K files', async () => {
    await treeManager.build(largePath);
  }, { time: 1000 });

  bench('single file update', async () => {
    await treeManager.update('file.txt', newContent);
  }, { time: 50 });

  bench('detect 1K changes', async () => {
    await treeManager.diff(oldTree, newTree);
  }, { time: 100 });

  bench('embedding cache lookup', async () => {
    await vectorCache.getCachedEmbedding(cid);
  }, { time: 1 });
});
```

## Monitoring & Observability

```typescript
// Metrics to track in production
interface MerkleMetrics {
  // Tree operations
  treeBuildsTotal: Counter;
  treeBuildDuration: Histogram;
  treeUpdatesTotal: Counter;
  treeUpdateDuration: Histogram;

  // Cache performance
  embeddingCacheHits: Counter;
  embeddingCacheMisses: Counter;
  embeddingCacheHitRate: Gauge;

  // Sync operations
  syncOperationsTotal: Counter;
  syncDuration: Histogram;
  syncConflictsTotal: Counter;

  // Storage
  contentStoreSize: Gauge;
  deduplicationRatio: Gauge;
}
```

---

# TDD Test Specifications

## Test Categories

### 1. Tree Construction Tests

```typescript
// File: tests/tree/construction.test.ts

describe('Tree Construction', () => {
  // Leaf node tests
  describe('Leaf Nodes', () => {
    it('should hash content with LEAF_PREFIX (0x00)', async () => {
      const content = Buffer.from('hello world');
      const leaf = await builder.createLeaf(content, 'test.txt');

      const expected = sha256(Buffer.concat([
        Buffer.from([0x00]),
        content
      ]));

      expect(leaf.cid).toBe(expected);
    });

    it('should chunk large files using content-defined boundaries', async () => {
      const largeContent = generateLargeContent(1_000_000); // 1MB
      const leaf = await builder.createLeaf(largeContent, 'large.bin');

      expect(leaf.chunks).toBeDefined();
      expect(leaf.chunks!.length).toBeGreaterThan(1);

      // Verify chunk boundaries are content-defined
      const boundaries = leaf.chunks!.map(c => c.start);
      expect(boundaries).toMatchSnapshot(); // Deterministic
    });

    it('should preserve chunk boundaries on small edits', async () => {
      const original = generateLargeContent(100_000);
      const modified = insertAtPosition(original, 50_000, 'INSERTED');

      const originalLeaf = await builder.createLeaf(original, 'file.bin');
      const modifiedLeaf = await builder.createLeaf(modified, 'file.bin');

      // Most chunks should be unchanged
      const sharedChunks = originalLeaf.chunks!.filter(oc =>
        modifiedLeaf.chunks!.some(mc => mc.cid === oc.cid)
      );

      expect(sharedChunks.length).toBeGreaterThan(
        originalLeaf.chunks!.length * 0.8
      );
    });
  });

  // Branch node tests
  describe('Branch Nodes', () => {
    it('should hash children with BRANCH_PREFIX (0x01)', async () => {
      const children = new Map([
        ['a.txt', { cid: 'cid_a', type: 'leaf' as const }],
        ['b.txt', { cid: 'cid_b', type: 'leaf' as const }],
      ]);

      const branch = await builder.createBranch(children);

      // Verify hash includes sorted children
      const expected = sha256(Buffer.concat([
        Buffer.from([0x01]),
        encodeChild('a.txt', 'cid_a'),
        encodeChild('b.txt', 'cid_b'),
      ]));

      expect(branch.cid).toBe(expected);
    });

    it('should sort children deterministically', async () => {
      const children1 = new Map([
        ['z.txt', leaf1],
        ['a.txt', leaf2],
      ]);

      const children2 = new Map([
        ['a.txt', leaf2],
        ['z.txt', leaf1],
      ]);

      const branch1 = await builder.createBranch(children1);
      const branch2 = await builder.createBranch(children2);

      expect(branch1.cid).toBe(branch2.cid);
    });
  });

  // Full tree tests
  describe('Full Tree', () => {
    it('should build tree from directory', async () => {
      await createTestDirectory('/tmp/merkle-test', {
        'src/index.ts': 'export {}',
        'src/utils/helper.ts': 'export const helper = 1',
        'README.md': '# Test',
      });

      const tree = await builder.build('/tmp/merkle-test');

      expect(tree.root.type).toBe('branch');
      expect(tree.root.children?.size).toBe(2); // src, README.md
    });

    it('should produce identical hash for identical content', async () => {
      const tree1 = await builder.build('/tmp/dir1');
      const tree2 = await builder.build('/tmp/dir2'); // Same content

      expect(tree1.root.cid).toBe(tree2.root.cid);
    });
  });
});
```

### 2. Incremental Update Tests

```typescript
// File: tests/tree/update.test.ts

describe('Incremental Updates', () => {
  let tree: MerkleTree;

  beforeEach(async () => {
    tree = await builder.build('/tmp/test-repo');
  });

  describe('Single File Updates', () => {
    it('should update in O(log n) operations', async () => {
      const operations: string[] = [];
      const trackedBuilder = trackOperations(builder, operations);

      await trackedBuilder.update('src/index.ts', 'new content');

      // Should only touch nodes on path to root
      expect(operations.length).toBeLessThanOrEqual(
        Math.ceil(Math.log2(tree.leafCount)) + 1
      );
    });

    it('should preserve unchanged subtree hashes', async () => {
      const originalUtils = tree.root.children?.get('src')
        ?.children?.get('utils');

      await builder.update('README.md', 'updated readme');

      const newUtils = tree.root.children?.get('src')
        ?.children?.get('utils');

      expect(newUtils?.cid).toBe(originalUtils?.cid);
    });

    it('should change root hash after update', async () => {
      const originalRoot = tree.root.cid;

      await builder.update('src/index.ts', 'modified');

      expect(tree.root.cid).not.toBe(originalRoot);
    });
  });

  describe('Batch Updates', () => {
    it('should process multiple updates atomically', async () => {
      const updates = [
        { path: 'a.txt', content: 'a' },
        { path: 'b.txt', content: 'b' },
        { path: 'c.txt', content: 'c' },
      ];

      const newRoot = await builder.batchUpdate(updates);

      // Verify all updates applied
      for (const update of updates) {
        const node = await tree.getPath(update.path);
        expect(node).toBeDefined();
      }
    });

    it('should optimize shared path updates', async () => {
      const operations: string[] = [];
      const trackedBuilder = trackOperations(builder, operations);

      await trackedBuilder.batchUpdate([
        { path: 'src/a.ts', content: 'a' },
        { path: 'src/b.ts', content: 'b' },
      ]);

      // Should share recomputation of src/ branch
      expect(operations.filter(o => o === 'recomputeBranch:src')).toHaveLength(1);
    });
  });
});
```

### 3. Change Detection Tests

```typescript
// File: tests/tree/diff.test.ts

describe('Change Detection', () => {
  describe('Identical Trees', () => {
    it('should return empty changes for identical trees', async () => {
      const tree1 = await builder.build('/tmp/identical1');
      const tree2 = await builder.build('/tmp/identical2');

      const changes = await differ.detectChanges(tree1, tree2);

      expect(changes).toEqual([]);
    });

    it('should short-circuit on matching root', async () => {
      const comparisons: string[] = [];
      const trackedDiffer = trackComparisons(differ, comparisons);

      await trackedDiffer.detectChanges(tree1, tree2);

      expect(comparisons).toEqual(['root']); // Only compared root
    });
  });

  describe('File Changes', () => {
    it('should detect added files', async () => {
      const original = await builder.build('/tmp/original');
      await fs.writeFile('/tmp/original/new.txt', 'new file');
      const modified = await builder.build('/tmp/original');

      const changes = await differ.detectChanges(original, modified);

      expect(changes).toContainEqual({
        type: 'added',
        path: 'new.txt',
      });
    });

    it('should detect deleted files', async () => {
      const original = await builder.build('/tmp/original');
      await fs.unlink('/tmp/original/existing.txt');
      const modified = await builder.build('/tmp/original');

      const changes = await differ.detectChanges(original, modified);

      expect(changes).toContainEqual({
        type: 'deleted',
        path: 'existing.txt',
      });
    });

    it('should detect modified files', async () => {
      const original = await builder.build('/tmp/original');
      await fs.writeFile('/tmp/original/file.txt', 'modified content');
      const modified = await builder.build('/tmp/original');

      const changes = await differ.detectChanges(original, modified);

      expect(changes).toContainEqual({
        type: 'modified',
        path: 'file.txt',
      });
    });
  });

  describe('Performance', () => {
    it('should be O(k log n) for k changes', async () => {
      // Create tree with 10,000 files
      const largeTree = await createLargeTree(10_000);

      // Modify 100 files
      const modifiedTree = await modifyRandomFiles(largeTree, 100);

      const start = performance.now();
      const changes = await differ.detectChanges(largeTree, modifiedTree);
      const duration = performance.now() - start;

      expect(changes.length).toBe(100);
      expect(duration).toBeLessThan(100); // < 100ms for 100 changes
    });
  });
});
```

### 4. Vector Cache Integration Tests

```typescript
// File: tests/vector/cache.test.ts

describe('Vector Cache Integration', () => {
  describe('Cache Operations', () => {
    it('should cache embedding by content CID', async () => {
      const content = 'test content for embedding';
      const cid = computeCid(content);
      const embedding = await embedder.embed(content);

      await cache.cacheEmbedding(cid, embedding);

      const cached = await cache.getCachedEmbedding(cid);
      expect(cached).toEqual(embedding);
    });

    it('should return null for uncached CID', async () => {
      const result = await cache.getCachedEmbedding('nonexistent-cid');
      expect(result).toBeNull();
    });

    it('should persist cache across restarts', async () => {
      const cid = 'test-cid';
      const embedding = new Float32Array([1, 2, 3]);

      await cache.cacheEmbedding(cid, embedding);
      await cache.close();

      // Reopen cache
      const newCache = await VectorCache.open();
      const cached = await newCache.getCachedEmbedding(cid);

      expect(cached).toEqual(embedding);
    });
  });

  describe('Sync Operations', () => {
    it('should skip embedding for unchanged files', async () => {
      const embedCalls: string[] = [];
      const trackedEmbedder = trackEmbedCalls(embedder, embedCalls);

      // First sync - all files embedded
      await bridge.syncWithTree(tree, trackedEmbedder);
      const firstCallCount = embedCalls.length;

      // Second sync - no changes
      await bridge.syncWithTree(tree, trackedEmbedder);

      expect(embedCalls.length).toBe(firstCallCount); // No new embeddings
    });

    it('should only embed changed files', async () => {
      await bridge.syncWithTree(originalTree);

      const embedCalls: string[] = [];
      const trackedEmbedder = trackEmbedCalls(embedder, embedCalls);

      // Modify one file
      await modifyFile(tree, 'changed.txt');
      await bridge.syncWithTree(tree, trackedEmbedder);

      expect(embedCalls).toEqual(['changed.txt']);
    });

    it('should achieve > 95% cache hit rate on unchanged repo', async () => {
      // Initial sync
      await bridge.syncWithTree(tree);

      // Measure second sync
      const stats = await bridge.syncWithTree(tree);

      expect(stats.cacheHitRate).toBeGreaterThan(0.95);
    });
  });

  describe('Merkle Proofs', () => {
    it('should generate valid inclusion proof', async () => {
      const result = await bridge.searchWithProof(queryVector, 5);

      for (const hit of result) {
        const isValid = verifyProof(
          hit.cid,
          hit.merkleProof,
          tree.root.cid
        );
        expect(isValid).toBe(true);
      }
    });

    it('should reject tampered content', async () => {
      const result = await bridge.searchWithProof(queryVector, 1);

      // Tamper with proof
      const tamperedProof = {
        ...result[0].merkleProof,
        siblings: ['tampered-hash', ...result[0].merkleProof.siblings.slice(1)],
      };

      const isValid = verifyProof(
        result[0].cid,
        tamperedProof,
        tree.root.cid
      );

      expect(isValid).toBe(false);
    });
  });
});
```

### 5. Sync Protocol Tests

```typescript
// File: tests/sync/protocol.test.ts

describe('Sync Protocol', () => {
  describe('Root Exchange', () => {
    it('should detect synchronized peers', async () => {
      const peer1 = await createPeer(tree);
      const peer2 = await createPeer(tree); // Same tree

      const result = await peer1.syncWithPeer(peer2);

      expect(result.status).toBe('synchronized');
      expect(result.changesApplied).toBe(0);
    });

    it('should detect divergent peers', async () => {
      const peer1 = await createPeer(tree1);
      const peer2 = await createPeer(tree2); // Different tree

      const result = await peer1.syncWithPeer(peer2);

      expect(result.changesApplied).toBeGreaterThan(0);
    });
  });

  describe('Change Synchronization', () => {
    it('should sync only divergent subtrees', async () => {
      const transfers: string[] = [];
      const trackedPeer = trackTransfers(peer, transfers);

      await trackedPeer.syncWithPeer(remotePeer);

      // Should not transfer unchanged content
      expect(transfers).not.toContain(unchangedSubtreeCid);
    });

    it('should verify received content by hash', async () => {
      // Create malicious peer that sends wrong content
      const maliciousPeer = createMaliciousPeer();

      await expect(peer.syncWithPeer(maliciousPeer)).rejects.toThrow(
        'Content integrity verification failed'
      );
    });
  });

  describe('Conflict Resolution', () => {
    it('should detect concurrent edits', async () => {
      // Both peers edit same file
      await peer1.update('shared.txt', 'version 1');
      await peer2.update('shared.txt', 'version 2');

      const result = await peer1.syncWithPeer(peer2);

      expect(result.conflicts).toHaveLength(1);
      expect(result.conflicts[0].path).toBe('shared.txt');
    });

    it('should resolve with LWW strategy', async () => {
      peer1.setConflictStrategy('last-write-wins');

      // Peer 2's edit is newer
      await peer1.update('shared.txt', 'old', { timestamp: 1000 });
      await peer2.update('shared.txt', 'new', { timestamp: 2000 });

      await peer1.syncWithPeer(peer2);

      const content = await peer1.getContent('shared.txt');
      expect(content).toBe('new');
    });

    it('should preserve both versions with MVR strategy', async () => {
      peer1.setConflictStrategy('multi-value');

      await peer1.update('shared.txt', 'version A');
      await peer2.update('shared.txt', 'version B');

      await peer1.syncWithPeer(peer2);

      const versions = await peer1.getVersions('shared.txt');
      expect(versions).toContain('version A');
      expect(versions).toContain('version B');
    });
  });
});
```

### 6. Benchmark Tests

```typescript
// File: benchmarks/merkle.bench.ts

import { bench, describe } from 'vitest';

describe('Merkle Tree Benchmarks', () => {
  describe('Tree Construction', () => {
    bench('build tree - 100 files', async () => {
      await builder.build(dir100);
    });

    bench('build tree - 1,000 files', async () => {
      await builder.build(dir1000);
    });

    bench('build tree - 10,000 files', async () => {
      await builder.build(dir10000);
    }, { time: 1000 }); // Must complete in < 1s
  });

  describe('Incremental Updates', () => {
    bench('update single file', async () => {
      await tree.update('random-file.txt', 'new content');
    }, { time: 50 }); // Must complete in < 50ms

    bench('batch update 10 files', async () => {
      await tree.batchUpdate(tenFileUpdates);
    });

    bench('batch update 100 files', async () => {
      await tree.batchUpdate(hundredFileUpdates);
    });
  });

  describe('Change Detection', () => {
    bench('diff - no changes', async () => {
      await differ.detectChanges(tree, tree);
    });

    bench('diff - 10 changes in 10K files', async () => {
      await differ.detectChanges(largeTree, modifiedTree10);
    });

    bench('diff - 100 changes in 10K files', async () => {
      await differ.detectChanges(largeTree, modifiedTree100);
    }, { time: 100 }); // Must complete in < 100ms

    bench('diff - 1000 changes in 10K files', async () => {
      await differ.detectChanges(largeTree, modifiedTree1000);
    });
  });

  describe('Vector Cache', () => {
    bench('cache lookup hit', async () => {
      await cache.getCachedEmbedding(existingCid);
    }, { time: 1 }); // Must complete in < 1ms

    bench('cache lookup miss', async () => {
      await cache.getCachedEmbedding('nonexistent');
    });

    bench('sync unchanged tree', async () => {
      await bridge.syncWithTree(unchangedTree);
    });
  });
});
```

---

## Consequences

### Positive

1. **Efficient Synchronization** - O(k log n) for k changes instead of O(n)
2. **Cryptographic Verification** - Prove content integrity with Merkle proofs
3. **Embedding Cache Efficiency** - 95%+ cache hit rate for unchanged content
4. **Distributed Consistency** - Compare systems with single root hash
5. **Version History** - Git-style versioning with structural sharing

### Negative

1. **Storage Overhead** - Additional ~5% for tree metadata
2. **Complexity** - New subsystem to maintain
3. **Learning Curve** - Team needs to understand Merkle concepts
4. **Migration** - Existing installations need tree initialization

### Neutral

1. **Optional Feature** - Can be enabled/disabled per project
2. **Backward Compatible** - Existing sync still works
3. **Platform Independent** - Pure TypeScript implementation

---

## References

1. [Merkle Tree Wikipedia](https://en.wikipedia.org/wiki/Merkle_tree)
2. [IPFS Merkle DAG](https://docs.ipfs.tech/concepts/merkle-dag/)
3. [Git Internals](https://git-scm.com/book/en/v2/Git-Internals-Git-Objects)
4. [Prolly Trees (DoltHub)](https://docs.dolthub.com/architecture/storage-engine/prolly-tree)
5. [Content-Defined Chunking](https://restic.net/blog/2015-09-12/chunk-specification)
6. [ADR-017: RuVector Integration](./ADR-017-ruvector-integration.md)
7. [ADR-021: Transfer Hook IPFS](./ADR-021-transfer-hook-ipfs-pattern-sharing.md)

---

**Status:** Proposed
**Next Steps:**
1. Review and approve ADR
2. Create `@claude-flow/merkle` package
3. Begin Phase 1 implementation
4. Schedule weekly progress reviews
