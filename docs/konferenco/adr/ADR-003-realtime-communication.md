# ADR-003: Real-time Communication Architecture

**Status**: Proposed
**Date**: 2026-01-30
**Author**: Architecture Agent
**Deciders**: Konferenco Core Team
**Technical Area**: Communication Infrastructure

---

## Context and Problem Statement

Konferenco requires a real-time communication system capable of supporting large-scale live events with 100,000+ concurrent users. The system must provide sub-second message delivery, presence awareness, location-based discovery, group messaging for sessions and interest-based communities, and 1:1 messaging with scheduling capabilities.

### Key Challenges

1. **Scale**: Support 100,000+ concurrent connections at major conferences
2. **Latency**: Sub-second message delivery globally
3. **Presence**: Real-time awareness of attendee locations and availability
4. **Groups**: Dynamic channels for sessions, meetups, and interest groups
5. **Privacy**: Granular controls over location sharing and discoverability
6. **Reliability**: Messages must not be lost, even during network transitions
7. **Federation**: Support for multi-venue and distributed event scenarios

---

## Decision Drivers

| Driver | Priority | Rationale |
|--------|----------|-----------|
| **Scalability** | Critical | Must handle conference peaks (keynote sessions) |
| **Latency** | Critical | Real-time networking and Q&A require <500ms delivery |
| **Reliability** | High | Messages must be delivered eventually, even offline |
| **Privacy** | High | GDPR compliance, user consent for location sharing |
| **Federation** | Medium | Multi-venue events, partner integrations |
| **Cost Efficiency** | Medium | Optimize infrastructure costs at scale |
| **Developer Experience** | Medium | Clean APIs for mobile/web clients |

---

## Decision 1: Protocol Selection

### 1.1 Primary Protocol: WebSocket with HTTP/3 Fallback

**Decision**: Use WebSocket as the primary real-time protocol with HTTP/3 (QUIC) fallback.

**Rationale**:
- WebSocket provides full-duplex communication with minimal overhead
- HTTP/3 (QUIC) handles network transitions gracefully (venue WiFi changes)
- Broad client support across web and mobile platforms

```yaml
protocol_stack:
  primary:
    protocol: WebSocket
    transport: WSS (TLS 1.3)
    subprotocol: konferenco-v1
    heartbeat: 30s
    max_frame_size: 64KB
    compression: permessage-deflate

  fallback:
    protocol: HTTP/3 (QUIC)
    transport: TLS 1.3
    streaming: Server-Sent Events (SSE)
    polling_interval: 1s (degraded mode)

  low_latency:
    protocol: WebRTC DataChannel
    use_case: P2P messaging, video chat
    signaling: WebSocket
    ice_servers: [TURN/STUN cluster]
```

### 1.2 IoT/Beacon Integration: MQTT

**Decision**: Use MQTT for beacon and sensor integration.

**Rationale**:
- Lightweight protocol ideal for battery-constrained beacons
- QoS levels support different reliability requirements
- Existing beacon ecosystems (iBeacon, Eddystone) can bridge to MQTT

```yaml
mqtt_config:
  broker: EMQX Cluster
  port: 8883 (TLS)
  qos_levels:
    beacon_proximity: 0  # At most once (high frequency, loss tolerable)
    location_update: 1   # At least once (important but not critical)
    emergency_alert: 2   # Exactly once (safety critical)

  topic_structure:
    - konferenco/{event_id}/beacon/{zone_id}
    - konferenco/{event_id}/sensor/{sensor_type}
    - konferenco/{event_id}/alert/{severity}

  bridge_to_websocket: true
  retention: 5m (recent locations only)
```

### 1.3 Federation Protocol: ActivityPub

**Decision**: Use ActivityPub for cross-event federation and external integrations.

**Rationale**:
- Open standard for decentralized social networking
- Enables federation with external conference platforms
- Supports both actor-to-actor and broadcast patterns

```yaml
activitypub_config:
  enabled: true
  domain: events.konferenco.app

  actors:
    - Event (broadcasts announcements)
    - Session (publishes updates)
    - Attendee (follows/follows back)
    - Speaker (verified, broadcasts talks)

  activities:
    - Create (new messages, events)
    - Announce (rebroadcast important updates)
    - Follow/Accept (networking connections)
    - Update (schedule changes)
    - Like (session feedback)

  federation_partners:
    - partner_events (same protocol)
    - mastodon_instances (social sharing)
    - matrix_bridges (interop messaging)
```

---

## Decision 2: Scaling Strategy

### 2.1 Architecture: Horizontally Scaled WebSocket Cluster

**Decision**: Deploy a geographically distributed WebSocket cluster with edge presence at venues.

```
                                    ┌─────────────────────────────────────┐
                                    │         Global Load Balancer        │
                                    │    (Cloudflare/AWS Global Accelerator)│
                                    └─────────────────┬───────────────────┘
                                                      │
                    ┌─────────────────────────────────┼─────────────────────────────────┐
                    │                                 │                                 │
          ┌─────────▼─────────┐             ┌─────────▼─────────┐             ┌─────────▼─────────┐
          │  Edge Region US   │             │  Edge Region EU   │             │  Edge Region APAC │
          │   (us-east-1)     │             │   (eu-west-1)     │             │   (ap-northeast-1)│
          └─────────┬─────────┘             └─────────┬─────────┘             └─────────┬─────────┘
                    │                                 │                                 │
    ┌───────────────┼───────────────┐               ...                                ...
    │               │               │
┌───▼───┐       ┌───▼───┐       ┌───▼───┐
│  WS   │       │  WS   │       │  WS   │
│Pod 1  │       │Pod 2  │       │Pod N  │
└───┬───┘       └───┬───┘       └───┬───┘
    │               │               │
    └───────────────┼───────────────┘
                    │
          ┌─────────▼─────────┐
          │   Redis Cluster   │
          │  (Pub/Sub + State)│
          └─────────┬─────────┘
                    │
          ┌─────────▼─────────┐
          │  Message Broker   │
          │ (NATS JetStream)  │
          └───────────────────┘
```

### 2.2 Scaling Configuration

```yaml
scaling_config:
  websocket_pods:
    min_replicas: 10
    max_replicas: 500
    target_connections_per_pod: 5000
    max_connections_per_pod: 10000

    scaling_triggers:
      - metric: connections_per_pod
        threshold: 4000
        action: scale_up
      - metric: cpu_utilization
        threshold: 70%
        action: scale_up
      - metric: memory_utilization
        threshold: 80%
        action: scale_up
      - metric: message_latency_p99
        threshold: 200ms
        action: scale_up

    pod_resources:
      cpu: "2"
      memory: "4Gi"
      network: "10Gbps"

  geographic_distribution:
    regions:
      - us-east-1:
          priority: primary_us
          capacity: 50000
      - us-west-2:
          priority: secondary_us
          capacity: 30000
      - eu-west-1:
          priority: primary_eu
          capacity: 40000
      - ap-northeast-1:
          priority: primary_apac
          capacity: 30000

    edge_presence:
      enabled: true
      deployment: venue_pop
      capacity_per_venue: 5000
      latency_target: <10ms_to_venue
```

### 2.3 Connection Distribution

```yaml
connection_routing:
  strategy: consistent_hashing

  shard_key: user_id

  affinity:
    # Keep users in same event on same shard when possible
    secondary_key: event_id
    weight: 0.3

  rebalancing:
    enabled: true
    trigger: node_failure | scale_event
    drain_timeout: 30s
    migration_batch_size: 100

  sticky_sessions:
    enabled: true
    ttl: 1h
    cookie: konferenco_ws_node
```

### 2.4 Capacity Planning for 100K+ Users

```yaml
capacity_model:
  target_concurrent: 100000

  assumptions:
    avg_messages_per_user_per_minute: 2
    avg_presence_updates_per_user_per_minute: 0.5
    avg_subscriptions_per_user: 5
    message_fanout_ratio: 10  # Group messages

  calculated_load:
    messages_per_second: 3334  # 100K * 2 / 60
    presence_updates_per_second: 834  # 100K * 0.5 / 60
    fanout_messages_per_second: 33340  # messages * fanout
    total_throughput: 37508 msg/sec

  infrastructure:
    websocket_pods: 20-25  # at 4000 connections each
    redis_cluster_nodes: 6  # primary + replicas
    nats_cluster_nodes: 5
    mqtt_broker_nodes: 3

  burst_capacity:
    multiplier: 3x  # Handle keynote session spikes
    pre_scale_trigger: 15min before keynote
    max_concurrent: 300000
```

---

## Decision 3: Message Types and Delivery

### 3.1 Message Type Taxonomy

```yaml
message_types:
  # Real-time chat messages
  chat:
    subtypes:
      - channel_message    # Public channel message
      - direct_message     # 1:1 private message
      - thread_reply       # Threaded conversation
      - reaction           # Emoji reactions
      - mention            # @mentions
    priority: normal
    delivery: at_least_once
    retention: 90d
    max_size: 4KB
    rate_limit: 10/min per user

  # Location and presence
  location:
    subtypes:
      - position_update    # GPS/beacon coordinates
      - zone_enter         # Entered a venue zone
      - zone_exit          # Left a venue zone
      - proximity_alert    # Near matched attendee
    priority: high
    delivery: best_effort  # Latest wins
    retention: 1h (rolling)
    max_size: 256B
    rate_limit: 1/sec per user

  # Schedule and event updates
  schedule:
    subtypes:
      - session_start      # Session beginning
      - session_end        # Session ending
      - session_change     # Time/room change
      - session_cancelled  # Cancellation
      - speaker_update     # Speaker change
    priority: critical
    delivery: exactly_once
    retention: event_duration + 7d
    max_size: 2KB
    rate_limit: N/A (system only)

  # Meeting requests
  meeting:
    subtypes:
      - request            # Meeting invitation
      - accept             # Accept invitation
      - decline            # Decline invitation
      - propose_time       # Counter-propose
      - cancel             # Cancel meeting
      - reminder           # Meeting reminder
    priority: high
    delivery: exactly_once
    retention: 30d
    max_size: 2KB
    rate_limit: 20/hour per user

  # Marketplace transactions
  marketplace:
    subtypes:
      - listing_new        # New item/service listed
      - listing_update     # Price/availability change
      - inquiry            # Question about listing
      - offer              # Make an offer
      - offer_response     # Accept/decline/counter
      - transaction        # Purchase confirmation
    priority: normal
    delivery: exactly_once
    retention: 90d
    max_size: 8KB
    rate_limit: 5/min per user
```

### 3.2 Message Envelope Format

```typescript
interface MessageEnvelope {
  // Routing
  id: string;           // UUID v7 (time-sortable)
  type: MessageType;
  subtype: string;

  // Addressing
  from: {
    user_id: string;
    device_id?: string;
    session_id?: string;
  };
  to: {
    type: 'user' | 'channel' | 'broadcast';
    id: string;
    event_id?: string;
  };

  // Content
  payload: object;      // Type-specific payload

  // Metadata
  timestamp: number;    // Unix ms
  ttl: number;          // Seconds until expiry
  priority: 'low' | 'normal' | 'high' | 'critical';

  // Delivery tracking
  delivery: {
    required_ack: boolean;
    retry_policy: 'none' | 'exponential' | 'linear';
    max_retries: number;
    dedup_window: number;  // Seconds
  };

  // Security
  signature?: string;   // Ed25519 signature
  encrypted?: boolean;  // E2E encrypted
}
```

### 3.3 Delivery Guarantees

```yaml
delivery_guarantees:
  best_effort:
    description: "Fire and forget, latest wins"
    use_cases: [location_update, typing_indicator]
    implementation:
      - No persistence
      - No acknowledgment
      - Overwrites in-flight messages
    latency_target: <100ms

  at_least_once:
    description: "Delivered at least once, may duplicate"
    use_cases: [chat_message, reaction]
    implementation:
      - Persist before send
      - Require client acknowledgment
      - Retry on timeout (exponential backoff)
      - Client-side deduplication
    latency_target: <500ms
    max_retries: 5

  exactly_once:
    description: "Delivered exactly once"
    use_cases: [meeting_request, marketplace_transaction]
    implementation:
      - Idempotency key required
      - Two-phase commit for transactions
      - Server-side deduplication window
      - Ordered delivery within conversation
    latency_target: <1000ms
    dedup_window: 24h
```

---

## Decision 4: Presence and Discovery

### 4.1 Presence System Architecture

```yaml
presence_architecture:
  layers:
    # Online/offline status
    connectivity:
      states: [online, away, busy, offline]
      heartbeat_interval: 30s
      timeout: 90s
      storage: redis (TTL-based)

    # Physical location at venue
    location:
      sources:
        - gps (outdoor, accuracy ~5m)
        - wifi_fingerprint (indoor, accuracy ~3m)
        - beacon_proximity (indoor, accuracy ~1m)
        - nfc_checkin (exact, manual)
      update_frequency: 5s (moving), 60s (stationary)
      storage: redis geospatial + timeseries

    # Activity context
    context:
      states:
        - in_session (session_id)
        - networking
        - at_booth (exhibitor_id)
        - in_meeting (meeting_id)
        - exploring
      inference: automatic from location + schedule
      storage: redis hash
```

### 4.2 Proximity Detection

```yaml
proximity_detection:
  bluetooth_beacons:
    protocol: iBeacon + Eddystone
    uuid_namespace: konferenco-{event_id}
    major: zone_id
    minor: beacon_instance
    rssi_threshold: -70dBm  # ~3m range

    placement:
      - session_rooms (entry/exit)
      - networking_lounges
      - exhibitor_booths
      - food_courts
      - registration_desk

    backend_processing:
      aggregation_window: 5s
      min_readings: 3
      triangulation: weighted_centroid

  wifi_fingerprinting:
    enabled: true
    training_data: venue_survey
    model: random_forest
    update_frequency: 10s
    accuracy_target: 3m

  hybrid_fusion:
    algorithm: kalman_filter
    weights:
      beacon: 0.5
      wifi: 0.3
      gps: 0.2
    output_frequency: 5s
```

### 4.3 Privacy Controls

```yaml
privacy_controls:
  location_sharing:
    levels:
      - precise: "Exact location (beacon-level)"
      - zone: "General area (e.g., 'Track A rooms')"
      - venue: "At the conference"
      - hidden: "Location not shared"

    default: zone

    granular_controls:
      - share_with_connections: true
      - share_with_attendees: zone
      - share_with_exhibitors: hidden
      - share_with_speakers: zone

  discoverability:
    levels:
      - public: "Anyone can find and message"
      - connections: "Only connections can find"
      - requests: "Others can request to connect"
      - hidden: "Not discoverable"

    default: requests

  presence_visibility:
    show_online_status: true
    show_current_session: true
    show_availability: true

    dnd_mode:
      enabled: false
      auto_enable_in_session: true
      allow_list: [connections, speakers]

  data_retention:
    location_history: 24h
    presence_logs: 7d
    right_to_forget: immediate_delete
```

### 4.4 "Nearby" Features

```yaml
nearby_features:
  discover_nearby:
    query_types:
      - similar_interests
      - same_company
      - mutual_connections
      - compatible_schedule
      - open_to_networking

    radius_options: [10m, 50m, same_zone, same_venue]

    filters:
      - industry
      - job_function
      - interests
      - looking_for (mentor, hire, partner, etc.)

    ranking:
      - relevance_score (ML model)
      - proximity
      - mutual_connections
      - response_likelihood

  serendipity_engine:
    enabled: true
    trigger: proximity + compatibility_threshold
    notification: "You're near {name}, who shares your interest in {topic}"
    cooldown: 30min per pair

    compatibility_model:
      features:
        - interest_embedding_similarity
        - complementary_skills
        - networking_goal_alignment
        - schedule_overlap
      threshold: 0.7
```

---

## Decision 5: Offline Support

### 5.1 Offline Architecture

```yaml
offline_architecture:
  local_storage:
    database: IndexedDB (web), SQLite (mobile)
    sync_metadata: last_sync_timestamp per namespace

    namespaces:
      - messages (full offline support)
      - schedule (full offline support)
      - profiles (cached, partial)
      - presence (not persisted offline)
      - location (last known only)

  message_queue:
    outbound:
      storage: local_db
      max_queue_size: 1000 messages
      max_queue_age: 7d
      priority_order: true

    inbound:
      delta_sync: true
      batch_size: 100
      compression: gzip
```

### 5.2 Conflict Resolution with CRDTs

```yaml
crdt_implementation:
  data_types:
    # Last-Writer-Wins Register for simple values
    lww_register:
      use_cases:
        - user_profile_fields
        - meeting_status
        - message_read_state
      timestamp_source: hybrid_logical_clock

    # Observed-Remove Set for collections
    or_set:
      use_cases:
        - channel_members
        - blocked_users
        - favorite_sessions
      tombstone_gc: 24h

    # Counter for aggregations
    pn_counter:
      use_cases:
        - message_reactions
        - session_attendance_count
      merge: max(positive) - max(negative)

    # Sequence for ordered lists
    rga_sequence:
      use_cases:
        - chat_message_history
        - meeting_agenda_items
      interleaving: fractional_indexing

  vector_clock:
    format: "{node_id}:{sequence}"
    nodes: [client_device, server_region]
    merge_strategy: element_wise_max
```

### 5.3 Sync Protocol

```typescript
interface SyncProtocol {
  // Initial sync on reconnect
  fullSync: {
    trigger: 'first_connect' | 'cache_invalid';
    namespaces: string[];
    compression: 'gzip';
    pagination: {
      page_size: 100;
      cursor_based: true;
    };
  };

  // Incremental sync during session
  deltaSync: {
    trigger: 'reconnect' | 'periodic';
    interval: 30000;  // ms
    format: 'operations' | 'snapshots';
    compression: 'gzip';

    request: {
      namespace: string;
      since_version: string;  // Vector clock
      max_operations: 500;
    };

    response: {
      operations: Operation[];
      new_version: string;
      has_more: boolean;
    };
  };

  // Real-time sync
  realtimeSync: {
    protocol: 'websocket';
    format: 'operations';
    ordering: 'causal';  // Respects happens-before
    acknowledgment: true;
  };
}
```

### 5.4 Conflict Examples and Resolution

```yaml
conflict_scenarios:
  # Scenario 1: Concurrent message edits
  message_edit:
    description: "Two users edit the same message offline"
    resolution: LWW with timestamp
    example:
      user_a_edit: {text: "Updated A", ts: 1000}
      user_b_edit: {text: "Updated B", ts: 1001}
      result: "Updated B" (later timestamp wins)

  # Scenario 2: Meeting time conflicts
  meeting_reschedule:
    description: "User accepts meeting while offline, organizer reschedules"
    resolution: Server authority + notification
    example:
      offline_accept: {status: accepted, ts: 1000}
      server_reschedule: {time: new_time, ts: 1001}
      result:
        - Meeting rescheduled
        - User notified of conflict
        - User must re-accept

  # Scenario 3: Channel membership
  channel_membership:
    description: "User joins channel while removed by admin"
    resolution: OR-Set with admin priority
    example:
      user_join: {op: add, ts: 1000}
      admin_remove: {op: remove, ts: 1001}
      result: User removed (admin action has priority flag)

  # Scenario 4: Message ordering
  message_ordering:
    description: "Messages sent offline arrive out of order"
    resolution: RGA sequence with fractional indexing
    example:
      message_a: {index: 1.0, ts: 1000}
      message_b_offline: {index: 1.5, ts: 1002}  # Between 1 and 2
      message_c: {index: 2.0, ts: 1001}
      result: [A, B, C] (correct ordering maintained)
```

---

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                                   CLIENT LAYER                                       │
├─────────────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐│
│  │   Web Client    │  │  iOS Client     │  │ Android Client  │  │ Beacon Gateway  ││
│  │  (WebSocket)    │  │  (WebSocket)    │  │  (WebSocket)    │  │    (MQTT)       ││
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘│
│           │                    │                    │                    │          │
│  ┌────────▼────────────────────▼────────────────────▼────────────────────▼────────┐│
│  │                        Offline Sync Layer (CRDT)                                ││
│  │   IndexedDB / SQLite  │  Message Queue  │  Conflict Resolution                  ││
│  └────────────────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────────────┘
                                          │
                                          │ WSS / MQTT / HTTP/3
                                          ▼
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                                   EDGE LAYER                                         │
├─────────────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │                    Global Load Balancer (Cloudflare)                         │   │
│  │                    - Geographic routing                                       │   │
│  │                    - DDoS protection                                          │   │
│  │                    - WebSocket termination                                    │   │
│  └────────────────────────────────────┬────────────────────────────────────────┘   │
│                                       │                                             │
│  ┌───────────────┐  ┌───────────────┐ │ ┌───────────────┐  ┌───────────────┐       │
│  │ Edge PoP US   │  │ Edge PoP EU   │ │ │ Edge PoP APAC │  │ Venue Edge    │       │
│  │ (us-east-1)   │  │ (eu-west-1)   │ │ │(ap-northeast) │  │ (on-prem)     │       │
│  └───────────────┘  └───────────────┘ │ └───────────────┘  └───────────────┘       │
└─────────────────────────────────────────────────────────────────────────────────────┘
                                          │
                                          ▼
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                               CONNECTION LAYER                                       │
├─────────────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │                    WebSocket Gateway Cluster                                  │   │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐               │   │
│  │  │  WS-1   │ │  WS-2   │ │  WS-3   │ │  WS-N   │ │Autoscale│               │   │
│  │  │ 5K conn │ │ 5K conn │ │ 5K conn │ │ 5K conn │ │  Group  │               │   │
│  │  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘ └─────────┘               │   │
│  │       │           │           │           │                                  │   │
│  │       └───────────┴─────┬─────┴───────────┘                                  │   │
│  │                         │                                                     │   │
│  │  ┌──────────────────────▼──────────────────────┐                             │   │
│  │  │         Connection State (Redis Cluster)    │                             │   │
│  │  │  - Session mapping    - Presence tracking   │                             │   │
│  │  │  - Subscription state - Heartbeat monitoring│                             │   │
│  │  └─────────────────────────────────────────────┘                             │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                      │
│  ┌───────────────────────┐  ┌───────────────────────┐                              │
│  │    MQTT Broker        │  │   WebRTC Signaling    │                              │
│  │  (EMQX Cluster)       │  │   (TURN/STUN)         │                              │
│  │  - Beacon messages    │  │   - P2P video/audio   │                              │
│  │  - IoT sensors        │  │   - DataChannels      │                              │
│  └───────────────────────┘  └───────────────────────┘                              │
└─────────────────────────────────────────────────────────────────────────────────────┘
                                          │
                                          ▼
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                               MESSAGING LAYER                                        │
├─────────────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │                    Message Broker (NATS JetStream)                           │   │
│  │                                                                               │   │
│  │  Streams:                                                                     │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │   │
│  │  │    CHAT      │  │   PRESENCE   │  │   SCHEDULE   │  │  MARKETPLACE │     │   │
│  │  │  messages    │  │   updates    │  │   changes    │  │ transactions │     │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘     │   │
│  │                                                                               │   │
│  │  Consumer Groups:                                                             │   │
│  │  - Notification workers    - Persistence workers                              │   │
│  │  - Analytics pipeline      - Federation bridge                                │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                      │
│  ┌───────────────────────┐  ┌───────────────────────┐  ┌───────────────────────┐   │
│  │   Message Router      │  │  Delivery Tracker     │  │  Fanout Service       │   │
│  │  - Type routing       │  │  - ACK tracking       │  │  - Channel broadcast  │   │
│  │  - Priority queue     │  │  - Retry management   │  │  - Event notifications│   │
│  │  - Rate limiting      │  │  - Deduplication      │  │  - Push notifications │   │
│  └───────────────────────┘  └───────────────────────┘  └───────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────────┘
                                          │
                                          ▼
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                               INTELLIGENCE LAYER                                     │
├─────────────────────────────────────────────────────────────────────────────────────┤
│  ┌───────────────────────┐  ┌───────────────────────┐  ┌───────────────────────┐   │
│  │  Presence Engine      │  │  Discovery Engine     │  │  Routing Intelligence │   │
│  │  - Location fusion    │  │  - HNSW matching      │  │  - Q&A routing        │   │
│  │  - Zone detection     │  │  - Compatibility ML   │  │  - Smart notifications│   │
│  │  - Activity inference │  │  - Serendipity engine │  │  - Priority ranking   │   │
│  └───────────────────────┘  └───────────────────────┘  └───────────────────────┘   │
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │                    RuVector Integration (Claude-Flow)                         │   │
│  │  - HNSW vector search (150x-12,500x faster)                                  │   │
│  │  - SONA neural adaptation                                                     │   │
│  │  - Pattern learning (ReasoningBank)                                          │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────────┘
                                          │
                                          ▼
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                               PERSISTENCE LAYER                                      │
├─────────────────────────────────────────────────────────────────────────────────────┤
│  ┌───────────────────────┐  ┌───────────────────────┐  ┌───────────────────────┐   │
│  │  PostgreSQL Cluster   │  │  Redis Cluster        │  │  TimescaleDB          │   │
│  │  - Messages           │  │  - Sessions           │  │  - Location history   │   │
│  │  - Channels           │  │  - Presence           │  │  - Analytics events   │   │
│  │  - Users              │  │  - Cache              │  │  - Metrics            │   │
│  │  - Transactions       │  │  - Pub/Sub            │  │  - Time-series        │   │
│  └───────────────────────┘  └───────────────────────┘  └───────────────────────┘   │
│                                                                                      │
│  ┌───────────────────────┐  ┌───────────────────────┐                              │
│  │  S3/MinIO             │  │  Elasticsearch        │                              │
│  │  - Media attachments  │  │  - Message search     │                              │
│  │  - Event archives     │  │  - Full-text index    │                              │
│  └───────────────────────┘  └───────────────────────┘                              │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## SPARC Compliance

### Specification Compliance

| Requirement | Implementation | Verification |
|-------------|----------------|--------------|
| 100K+ concurrent users | Horizontal WebSocket scaling, 5K connections/pod | Load testing with k6 |
| Sub-second delivery | Edge PoPs, NATS JetStream, optimized routing | P99 latency monitoring |
| Presence awareness | Beacon/WiFi fusion, Redis presence tracking | Integration tests |
| Group channels | NATS subject-based routing, fanout service | Unit + integration tests |
| 1:1 messaging | Direct WebSocket routing, offline queue | E2E tests |
| Offline support | IndexedDB/SQLite, CRDT sync | Offline simulation tests |

### Pseudocode Verification

Each major component has pseudocode representations that were verified before implementation:

```
FUNCTION handleIncomingMessage(envelope):
    VALIDATE envelope.signature
    ROUTE based on envelope.to.type:
        CASE 'user': directDelivery(envelope)
        CASE 'channel': fanoutToSubscribers(envelope)
        CASE 'broadcast': eventBroadcast(envelope)
    TRACK delivery attempt
    IF delivery.required_ack:
        AWAIT acknowledgment OR retry
    STORE in persistence layer
```

### Architecture Alignment

| SPARC Phase | ADR Section | Status |
|-------------|-------------|--------|
| **S**pecification | Context, Decision Drivers | Complete |
| **P**seudocode | Message flow algorithms | Verified |
| **A**rchitecture | System diagrams, component design | This document |
| **R**efinement | Performance optimization | Ongoing |
| **C**ompletion | Implementation, testing | Pending |

---

## TDD Test Scenarios

### Unit Tests

```typescript
describe('MessageRouter', () => {
  describe('routeMessage', () => {
    it('should route direct messages to correct WebSocket connection', async () => {
      const router = new MessageRouter(mockConnectionStore);
      const envelope = createEnvelope({ to: { type: 'user', id: 'user-123' } });

      await router.route(envelope);

      expect(mockConnectionStore.getConnection).toHaveBeenCalledWith('user-123');
      expect(mockWebSocket.send).toHaveBeenCalledWith(expect.objectContaining({
        id: envelope.id
      }));
    });

    it('should queue messages when user is offline', async () => {
      mockConnectionStore.getConnection.mockReturnValue(null);
      const envelope = createEnvelope({ to: { type: 'user', id: 'offline-user' } });

      await router.route(envelope);

      expect(mockOfflineQueue.enqueue).toHaveBeenCalledWith('offline-user', envelope);
    });

    it('should fanout channel messages to all subscribers', async () => {
      const subscribers = ['user-1', 'user-2', 'user-3'];
      mockChannelStore.getSubscribers.mockReturnValue(subscribers);
      const envelope = createEnvelope({ to: { type: 'channel', id: 'channel-456' } });

      await router.route(envelope);

      expect(mockFanoutService.broadcast).toHaveBeenCalledWith('channel-456', envelope);
      expect(mockConnectionStore.getConnection).toHaveBeenCalledTimes(3);
    });

    it('should respect rate limits', async () => {
      const rateLimiter = new RateLimiter({ limit: 10, window: 60000 });
      const router = new MessageRouter(mockConnectionStore, rateLimiter);

      // Send 10 messages (should succeed)
      for (let i = 0; i < 10; i++) {
        await router.route(createEnvelope({ from: { user_id: 'user-123' } }));
      }

      // 11th message should be rate limited
      await expect(router.route(createEnvelope({ from: { user_id: 'user-123' } })))
        .rejects.toThrow(RateLimitExceededError);
    });
  });
});

describe('PresenceManager', () => {
  describe('updateLocation', () => {
    it('should fuse beacon and WiFi signals', async () => {
      const presence = new PresenceManager(mockRedis);

      await presence.updateBeaconSignal('user-123', { beaconId: 'zone-a', rssi: -65 });
      await presence.updateWiFiFingerprint('user-123', { ssids: ['venue-wifi'], strengths: [-50] });

      const location = await presence.getLocation('user-123');

      expect(location.zone).toBe('zone-a');
      expect(location.confidence).toBeGreaterThan(0.8);
      expect(location.source).toBe('fusion');
    });

    it('should respect privacy settings', async () => {
      const presence = new PresenceManager(mockRedis);
      mockUserSettings.mockReturnValue({ locationSharing: 'hidden' });

      await presence.updateLocation('user-123', { lat: 40.7, lng: -74.0 });

      const visibleLocation = await presence.getLocationForViewer('user-123', 'viewer-456');

      expect(visibleLocation).toBeNull();
    });
  });

  describe('findNearby', () => {
    it('should return users within radius matching filters', async () => {
      const presence = new PresenceManager(mockRedis);
      mockGeoSearch.mockReturnValue(['user-1', 'user-2', 'user-3']);
      mockUserProfiles.mockImplementation((id) => ({
        interests: id === 'user-1' ? ['AI'] : ['Marketing']
      }));

      const nearby = await presence.findNearby({
        userId: 'current-user',
        radius: 50,
        filters: { interests: ['AI'] }
      });

      expect(nearby).toHaveLength(1);
      expect(nearby[0].userId).toBe('user-1');
    });
  });
});

describe('CRDTSync', () => {
  describe('mergeOperations', () => {
    it('should resolve LWW conflicts correctly', () => {
      const crdt = new LWWRegister();

      crdt.apply({ value: 'A', timestamp: 1000, node: 'client-1' });
      crdt.apply({ value: 'B', timestamp: 1001, node: 'client-2' });
      crdt.apply({ value: 'C', timestamp: 999, node: 'client-3' });  // Earlier, should be ignored

      expect(crdt.value()).toBe('B');
    });

    it('should handle OR-Set add/remove correctly', () => {
      const set = new ORSet();

      set.apply({ op: 'add', element: 'user-1', tag: 'tag-1' });
      set.apply({ op: 'add', element: 'user-1', tag: 'tag-2' });
      set.apply({ op: 'remove', element: 'user-1', tag: 'tag-1' });

      expect(set.contains('user-1')).toBe(true);  // tag-2 still exists

      set.apply({ op: 'remove', element: 'user-1', tag: 'tag-2' });

      expect(set.contains('user-1')).toBe(false);
    });

    it('should maintain message ordering with RGA', () => {
      const rga = new RGASequence();

      rga.insert({ id: '1', content: 'A', position: { after: null } });
      rga.insert({ id: '2', content: 'C', position: { after: '1' } });
      rga.insert({ id: '3', content: 'B', position: { after: '1' } });  // Insert between A and C

      expect(rga.toArray()).toEqual(['A', 'B', 'C']);
    });
  });
});
```

### Integration Tests

```typescript
describe('End-to-End Messaging', () => {
  let server: TestServer;
  let client1: TestClient;
  let client2: TestClient;

  beforeAll(async () => {
    server = await TestServer.start({ mockExternal: true });
    client1 = await TestClient.connect(server.url, { userId: 'user-1' });
    client2 = await TestClient.connect(server.url, { userId: 'user-2' });
  });

  afterAll(async () => {
    await client1.disconnect();
    await client2.disconnect();
    await server.stop();
  });

  it('should deliver direct messages within 500ms', async () => {
    const startTime = Date.now();
    const messagePromise = client2.waitForMessage();

    await client1.sendDirectMessage('user-2', { text: 'Hello!' });

    const received = await messagePromise;
    const latency = Date.now() - startTime;

    expect(received.payload.text).toBe('Hello!');
    expect(latency).toBeLessThan(500);
  });

  it('should handle 1000 concurrent connections', async () => {
    const clients = await Promise.all(
      Array.from({ length: 1000 }, (_, i) =>
        TestClient.connect(server.url, { userId: `load-user-${i}` })
      )
    );

    const metrics = await server.getMetrics();

    expect(metrics.activeConnections).toBe(1002);  // +2 from beforeAll
    expect(metrics.memoryUsageMB).toBeLessThan(500);

    await Promise.all(clients.map(c => c.disconnect()));
  });

  it('should sync offline messages on reconnect', async () => {
    // Client2 goes offline
    await client2.disconnect();

    // Client1 sends messages while client2 is offline
    await client1.sendDirectMessage('user-2', { text: 'Message 1' });
    await client1.sendDirectMessage('user-2', { text: 'Message 2' });
    await client1.sendDirectMessage('user-2', { text: 'Message 3' });

    // Wait a bit for queue processing
    await sleep(100);

    // Client2 reconnects
    const syncedMessages: Message[] = [];
    client2 = await TestClient.connect(server.url, {
      userId: 'user-2',
      onSync: (messages) => syncedMessages.push(...messages)
    });

    // Wait for sync
    await waitFor(() => syncedMessages.length === 3, { timeout: 5000 });

    expect(syncedMessages).toHaveLength(3);
    expect(syncedMessages.map(m => m.payload.text)).toEqual([
      'Message 1', 'Message 2', 'Message 3'
    ]);
  });

  it('should handle channel fanout efficiently', async () => {
    const channelId = 'test-channel';
    const subscribers = await Promise.all(
      Array.from({ length: 100 }, (_, i) =>
        TestClient.connect(server.url, { userId: `subscriber-${i}` })
      )
    );

    // Subscribe all clients to channel
    await Promise.all(subscribers.map(c => c.subscribeToChannel(channelId)));

    // Track delivery
    const deliveryPromises = subscribers.map(c => c.waitForMessage());
    const startTime = Date.now();

    // Send channel message
    await client1.sendChannelMessage(channelId, { text: 'Broadcast!' });

    // Wait for all deliveries
    await Promise.all(deliveryPromises);
    const fanoutLatency = Date.now() - startTime;

    expect(fanoutLatency).toBeLessThan(1000);  // All 100 within 1 second

    await Promise.all(subscribers.map(c => c.disconnect()));
  });
});

describe('Presence and Proximity', () => {
  it('should detect nearby users based on beacon signals', async () => {
    const presence = server.getPresenceManager();

    // Simulate beacon signals
    await presence.updateBeaconSignal('user-1', { zone: 'room-a', rssi: -60 });
    await presence.updateBeaconSignal('user-2', { zone: 'room-a', rssi: -65 });
    await presence.updateBeaconSignal('user-3', { zone: 'room-b', rssi: -55 });

    const nearbyForUser1 = await presence.findNearby({
      userId: 'user-1',
      radiusType: 'same_zone'
    });

    expect(nearbyForUser1).toContainEqual(expect.objectContaining({ userId: 'user-2' }));
    expect(nearbyForUser1).not.toContainEqual(expect.objectContaining({ userId: 'user-3' }));
  });

  it('should trigger serendipity notifications', async () => {
    const serendipity = server.getSerendipityEngine();
    const notifications: Notification[] = [];

    serendipity.on('match', (n) => notifications.push(n));

    // Set up compatible profiles
    await server.setUserProfile('user-1', { interests: ['AI', 'ML'], lookingFor: 'collaborators' });
    await server.setUserProfile('user-2', { interests: ['AI', 'NLP'], lookingFor: 'collaborators' });

    // Bring users into proximity
    await server.updateLocation('user-1', { zone: 'networking-lounge' });
    await server.updateLocation('user-2', { zone: 'networking-lounge' });

    await waitFor(() => notifications.length > 0, { timeout: 5000 });

    expect(notifications[0]).toMatchObject({
      type: 'serendipity_match',
      users: expect.arrayContaining(['user-1', 'user-2']),
      reason: expect.stringContaining('AI')
    });
  });
});
```

### Load Tests

```javascript
// k6 load test script
import ws from 'k6/ws';
import { check, sleep } from 'k6';
import { Counter, Trend } from 'k6/metrics';

const messageLatency = new Trend('message_latency');
const messagesReceived = new Counter('messages_received');

export const options = {
  scenarios: {
    // Ramp up to 100K connections
    websocket_load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '5m', target: 10000 },
        { duration: '5m', target: 50000 },
        { duration: '5m', target: 100000 },
        { duration: '10m', target: 100000 },  // Sustain
        { duration: '5m', target: 0 },
      ],
    },
  },
  thresholds: {
    'message_latency': ['p99<500'],  // 99th percentile under 500ms
    'ws_connecting': ['p95<1000'],    // Connection time under 1s
  },
};

export default function () {
  const url = `wss://${__ENV.WS_HOST}/ws?token=${__VU}`;

  const res = ws.connect(url, {}, function (socket) {
    socket.on('open', function () {
      // Subscribe to event channel
      socket.send(JSON.stringify({
        type: 'subscribe',
        channel: 'event-main'
      }));

      // Send periodic messages
      socket.setInterval(function () {
        const sendTime = Date.now();
        socket.send(JSON.stringify({
          type: 'chat',
          channel: 'event-main',
          text: `Message from VU ${__VU}`,
          timestamp: sendTime
        }));
      }, 30000);  // Every 30 seconds
    });

    socket.on('message', function (data) {
      const msg = JSON.parse(data);
      messagesReceived.add(1);

      if (msg.timestamp) {
        messageLatency.add(Date.now() - msg.timestamp);
      }
    });

    socket.on('error', function (e) {
      console.error('WebSocket error:', e);
    });

    // Keep connection alive
    socket.setTimeout(function () {
      socket.close();
    }, 600000);  // 10 minutes
  });

  check(res, {
    'Connected successfully': (r) => r && r.status === 101,
  });
}
```

---

## Performance Targets

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Connection establishment | <1s p95 | k6 ws_connecting metric |
| Message delivery (direct) | <200ms p50, <500ms p99 | Application metrics |
| Message delivery (fanout) | <500ms p50, <1s p99 | Application metrics |
| Presence update propagation | <1s | Integration tests |
| Nearby discovery query | <100ms | Application metrics |
| Offline sync (100 messages) | <5s | Integration tests |
| Memory per connection | <50KB | Infrastructure monitoring |
| CPU per 10K connections | <1 core | Infrastructure monitoring |

---

## Implementation Phases

### Phase 1: Foundation (Weeks 1-3)

| Task | Priority | Dependencies |
|------|----------|--------------|
| WebSocket gateway setup | High | Infrastructure |
| Redis cluster deployment | High | Infrastructure |
| Basic message routing | High | Gateway |
| Direct messaging | High | Routing |
| Connection state management | High | Redis |
| Unit tests for router | High | Routing |

### Phase 2: Channels and Groups (Weeks 4-5)

| Task | Priority | Dependencies |
|------|----------|--------------|
| NATS JetStream setup | High | Infrastructure |
| Channel subscription management | High | NATS |
| Fanout service | High | Channels |
| Rate limiting | Medium | Router |
| Message persistence | High | PostgreSQL |
| Integration tests | High | All above |

### Phase 3: Presence and Location (Weeks 6-7)

| Task | Priority | Dependencies |
|------|----------|--------------|
| MQTT broker setup | Medium | Infrastructure |
| Beacon signal processing | High | MQTT |
| WiFi fingerprinting | Medium | ML model |
| Location fusion algorithm | High | Beacon, WiFi |
| Privacy controls | High | User service |
| Nearby discovery API | High | Location |

### Phase 4: Offline and Sync (Weeks 8-9)

| Task | Priority | Dependencies |
|------|----------|--------------|
| Offline message queue | High | PostgreSQL |
| CRDT implementation | High | - |
| Delta sync protocol | High | CRDT |
| Client SDK (Web) | High | Sync protocol |
| Client SDK (Mobile) | High | Sync protocol |
| Conflict resolution tests | High | CRDT |

### Phase 5: Intelligence and Optimization (Weeks 10-12)

| Task | Priority | Dependencies |
|------|----------|--------------|
| RuVector integration | Medium | Claude-Flow |
| Serendipity engine | Medium | Presence, RuVector |
| Smart notification routing | Medium | RuVector |
| Performance optimization | High | All above |
| Load testing (100K) | Critical | All above |
| Federation (ActivityPub) | Low | Core complete |

---

## Risks and Mitigations

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Venue WiFi instability | High | High | HTTP/3 fallback, offline queue |
| Beacon battery depletion | Medium | Medium | Redundant beacons, WiFi fallback |
| Privacy regulation changes | High | Low | Configurable privacy levels, consent management |
| Peak load exceeds capacity | High | Medium | Auto-scaling, pre-scaling for keynotes |
| CRDT complexity bugs | High | Medium | Extensive testing, formal verification |
| Vendor lock-in | Medium | Low | Abstract cloud services, multi-cloud ready |

---

## References

- [ADR-001: Event Coordinator Architecture](./ADR-001-event-coordinator.md)
- [ADR-002: Attendee Matching and Discovery](./ADR-002-attendee-matching.md)
- [RuVector Integration Research](../research/ruvector-integration.md)
- [WebSocket RFC 6455](https://tools.ietf.org/html/rfc6455)
- [MQTT v5.0 Specification](https://docs.oasis-open.org/mqtt/mqtt/v5.0/mqtt-v5.0.html)
- [ActivityPub W3C Recommendation](https://www.w3.org/TR/activitypub/)
- [CRDT Technical Report](https://hal.inria.fr/inria-00555588)

---

**Document Version**: 1.0.0
**Last Updated**: 2026-01-30
**Status**: Proposed
