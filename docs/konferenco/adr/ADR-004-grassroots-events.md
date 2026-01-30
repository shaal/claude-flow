# ADR-004: Grassroots Event Creation System

**Status**: Proposed
**Date**: 2026-01-30
**Authors**: Architecture Team
**Reviewers**: Platform, Security, Commerce Teams

---

## Executive Summary

This ADR defines the architecture for Konferenco's Grassroots Event Creation System, enabling attendees to create unofficial events, meetups, and activities within the context of a parent event. This capability is a **key differentiator** for Konferenco, fostering organic community building and maximizing attendee engagement.

**Core Principle**: Transform passive attendees into active community builders while maintaining trust, safety, and seamless integration with official event programming.

---

## Context

### Problem Statement

Traditional event platforms treat attendees as passive consumers of curated content. This misses significant opportunities:

1. **Unmet networking needs**: Attendees with niche interests cannot easily connect
2. **Knowledge silos**: Experts in the audience have no platform to share
3. **Community building**: Organic gatherings happen informally with no platform support
4. **Missed commerce**: Vendors and creators cannot participate without official sponsorship

### Opportunity

By enabling grassroots event creation, Konferenco can:

- Increase attendee engagement by 40-60%
- Create additional revenue streams through grassroots commerce
- Build lasting community connections that extend beyond official events
- Differentiate from competitors who only support top-down event management

### Constraints

- Must not undermine official event programming
- Must maintain trust and safety standards
- Must integrate with existing venue/capacity systems
- Must comply with parent event organizer policies
- Must scale to 100K+ attendees with 10K+ grassroots events

---

## Decision

### 1. Event Hierarchy Model

We adopt a **five-tier event hierarchy** with clear distinctions and relationships.

```
+----------------------------------------------------------+
|                    PARENT EVENT                          |
|  (Conference, Festival, Convention)                      |
+----------------------------------------------------------+
          |
          +-- [TIER 1] Official Events
          |       |-- Keynotes, Main Sessions
          |       |-- Official Workshops
          |       |-- Sponsored Presentations
          |
          +-- [TIER 2] Sponsored/Partner Events
          |       |-- Sponsor Breakouts
          |       |-- Partner Showcases
          |       |-- Exhibitor Sessions
          |
          +-- [TIER 3] Grassroots Events
          |       |-- Attendee-Organized Sessions
          |       |-- Birds of a Feather (BoF)
          |       |-- Community Workshops
          |
          +-- [TIER 4] Social Gatherings
          |       |-- Dinners & Meetups
          |       |-- Interest Group Hangouts
          |       |-- Post-Session Discussions
          |
          +-- [TIER 5] Impromptu Meetups
                  |-- "Right Now" Flash Events
                  |-- Hallway Conversations
                  |-- Ad-hoc Connections
```

#### Event Type Definitions

```typescript
interface EventHierarchy {
  tiers: {
    official: {
      level: 1;
      approval: 'organizer_only';
      visibility: 'featured';
      venueAccess: 'reserved';
      commerceEnabled: true;
      badgeRequired: 'organizer' | 'speaker';
    };
    sponsored: {
      level: 2;
      approval: 'organizer_review';
      visibility: 'promoted';
      venueAccess: 'allocated';
      commerceEnabled: true;
      badgeRequired: 'sponsor' | 'partner';
    };
    grassroots: {
      level: 3;
      approval: 'auto_with_moderation';
      visibility: 'discoverable';
      venueAccess: 'bookable';
      commerceEnabled: true;
      badgeRequired: 'verified_attendee';
    };
    social: {
      level: 4;
      approval: 'auto';
      visibility: 'opt_in';
      venueAccess: 'available_only';
      commerceEnabled: 'limited';
      badgeRequired: 'attendee';
    };
    impromptu: {
      level: 5;
      approval: 'none';
      visibility: 'proximity_based';
      venueAccess: 'informal';
      commerceEnabled: false;
      badgeRequired: 'attendee';
    };
  };
}
```

#### Event Entity Schema

```typescript
interface GrassrootsEvent {
  // Identity
  id: UUID;
  parentEventId: UUID;
  slug: string;

  // Hierarchy
  tier: EventTier;
  parentGrassrootsId?: UUID; // Sub-events allowed

  // Core Details
  title: string;
  description: string;
  category: EventCategory;
  tags: string[];
  language: string;

  // Timing
  startTime: DateTime;
  endTime: DateTime;
  timezone: string;
  isRecurring: boolean;
  recurrenceRule?: RRule;

  // Location
  locationType: 'physical' | 'virtual' | 'hybrid';
  venue?: VenueAllocation;
  virtualRoom?: VirtualRoomConfig;

  // Capacity
  minAttendees: number;
  maxAttendees: number;
  currentRsvps: number;
  waitlistEnabled: boolean;

  // Creator
  creatorId: UUID;
  coOrganizerIds: UUID[];

  // Status
  status: EventStatus;
  moderationStatus: ModerationStatus;

  // Commerce
  isFree: boolean;
  ticketPrice?: Money;
  revenueSharePercentage?: number;

  // Trust
  creatorReputationScore: number;
  flagCount: number;
  verifiedByOrganizer: boolean;

  // Metadata
  createdAt: DateTime;
  updatedAt: DateTime;
  embedding: Float32Array; // For recommendation
}

type EventTier = 'official' | 'sponsored' | 'grassroots' | 'social' | 'impromptu';

type EventStatus =
  | 'draft'
  | 'pending_approval'
  | 'approved'
  | 'published'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'suspended';

type ModerationStatus =
  | 'pending'
  | 'auto_approved'
  | 'manually_approved'
  | 'flagged'
  | 'rejected'
  | 'suspended';
```

### 2. Creation Permissions & Approval Workflows

#### Permission Matrix

| User Type | Official | Sponsored | Grassroots | Social | Impromptu |
|-----------|----------|-----------|------------|--------|-----------|
| **Event Organizer** | Create | Approve | Moderate | View | View |
| **Sponsor Admin** | View | Create | Create | Create | Create |
| **Verified Attendee** | View | View | Create | Create | Create |
| **Standard Attendee** | View | View | Request | Create | Create |
| **Guest** | View (public) | View (public) | View (public) | - | - |

#### Verification Requirements

```typescript
interface AttendeeVerification {
  // Basic verification (for social/impromptu)
  basic: {
    requirements: [
      'valid_ticket',
      'email_verified'
    ];
    autoGranted: true;
  };

  // Verified attendee (for grassroots creation)
  verified: {
    requirements: [
      'basic_verification',
      'profile_complete',
      'attended_1_official_event' | 'reputation_score >= 50'
    ];
    autoGranted: boolean; // Based on parent event settings
    manualOverride: boolean;
  };

  // Trusted organizer (reduced moderation)
  trusted: {
    requirements: [
      'verified_attendee',
      'created_3_successful_events',
      'reputation_score >= 200',
      'no_violations_90_days'
    ];
    privileges: [
      'auto_approve_events',
      'extended_capacity_limits',
      'commerce_enabled',
      'featured_eligibility'
    ];
  };
}
```

#### Approval Workflow Engine

```yaml
workflows:
  grassroots_event_creation:
    trigger: event.submitted

    states:
      - draft
      - pending_review
      - auto_approved
      - manual_review
      - approved
      - rejected

    transitions:
      draft_to_pending:
        condition: event.isComplete()
        action: submit_for_review

      pending_to_auto_approved:
        condition: |
          creator.isTrusted() AND
          content.passesAutoModeration() AND
          venue.isAvailable() AND
          !conflicts_with_official_event()
        action: auto_approve
        notification: creator.notify('approved')

      pending_to_manual_review:
        condition: |
          content.flaggedByAutoMod() OR
          creator.reputationScore < 100 OR
          event.isCommercial
        action: queue_for_review
        assign: moderation_team
        sla: '4 hours'

      manual_review_to_approved:
        condition: moderator.approves()
        action: approve_event
        notification: creator.notify('approved_with_feedback')

      manual_review_to_rejected:
        condition: moderator.rejects()
        action: reject_event
        notification: creator.notify('rejected_with_reason')
        escalation: if(creator.appeals()) -> escalation_review

    auto_moderation:
      content_checks:
        - spam_detection
        - profanity_filter
        - policy_compliance
        - duplicate_detection
        - commercial_content_detection

      risk_scoring:
        low_risk: auto_approve
        medium_risk: queue_with_priority
        high_risk: queue_urgent

      ml_models:
        - content_classifier
        - intent_detector
        - fraud_detection
```

#### Spam Prevention System

```typescript
interface SpamPrevention {
  rateLimits: {
    // Per creator limits
    eventsPerDay: 3;
    eventsPerWeek: 10;
    eventsPerParentEvent: 20;

    // Cooldowns
    minTimeBetweenEvents: '1 hour';
    cooldownAfterRejection: '24 hours';
    cooldownAfterSuspension: '7 days';
  };

  contentAnalysis: {
    // Embedding-based duplicate detection
    duplicateThreshold: 0.92; // Cosine similarity
    nearDuplicateAction: 'flag_for_review';
    exactDuplicateAction: 'auto_reject';

    // Pattern detection
    spamPatterns: RegExp[];
    commercialIndicators: string[];
    promotionalLanguageScore: number;
  };

  behaviorAnalysis: {
    // Suspicious patterns
    rapidFireCreation: boolean;
    copyPasteContent: boolean;
    unusualTimingPatterns: boolean;

    // Network analysis
    coordinatedInauthentic: boolean;
    sockPuppetDetection: boolean;
  };
}
```

### 3. Discovery & Promotion System

#### Discovery Architecture

```
+------------------------------------------------------------------+
|                     DISCOVERY ENGINE                              |
+------------------------------------------------------------------+
|                                                                   |
|  +------------------+    +------------------+    +--------------+ |
|  | Interest Matcher |    | Schedule Aware   |    | Social Graph | |
|  | (HNSW Vector)    |    | Recommender      |    | Analyzer     | |
|  +------------------+    +------------------+    +--------------+ |
|           |                      |                      |         |
|           +----------------------+----------------------+         |
|                                  |                                |
|                         +--------v--------+                       |
|                         | Ranking Engine  |                       |
|                         +-----------------+                       |
|                                  |                                |
|           +----------------------+----------------------+         |
|           |                      |                      |         |
|  +--------v-------+    +---------v--------+    +-------v-------+ |
|  | Personalized   |    | Trending/Popular |    | Proximity     | |
|  | Feed           |    | Events           |    | Discovery     | |
|  +----------------+    +------------------+    +---------------+ |
+------------------------------------------------------------------+
```

#### Recommendation Algorithm

```typescript
interface RecommendationEngine {
  // Multi-signal ranking
  scoringFactors: {
    interestMatch: {
      weight: 0.35;
      source: 'hnsw_similarity';
      embedding: 'event_description + attendee_interests';
    };

    socialAffinity: {
      weight: 0.20;
      source: 'social_graph';
      signals: ['friends_attending', 'similar_attendees', 'followed_organizers'];
    };

    scheduleCompatibility: {
      weight: 0.15;
      source: 'calendar_analysis';
      factors: ['no_conflicts', 'travel_time', 'break_preferences'];
    };

    eventQuality: {
      weight: 0.15;
      source: 'quality_score';
      factors: ['organizer_reputation', 'past_ratings', 'completeness'];
    };

    freshness: {
      weight: 0.10;
      source: 'time_decay';
      halfLife: '48 hours';
    };

    diversity: {
      weight: 0.05;
      source: 'category_balancing';
      avoidRepetition: true;
    };
  };

  // Trending calculation
  trendingScore: {
    rsvpVelocity: number;        // RSVPs per hour
    viewToRsvpRatio: number;     // Conversion rate
    shareCount: number;          // Social shares
    commentActivity: number;     // Discussion engagement
    organizerResponse: number;   // Organizer engagement
  };
}
```

#### Feed Types & Surfaces

```typescript
interface DiscoverySurfaces {
  // Main discovery feed
  forYou: {
    algorithm: 'personalized';
    refreshInterval: '5 minutes';
    sections: [
      { type: 'recommended', limit: 10 },
      { type: 'friends_attending', limit: 5 },
      { type: 'popular_in_category', limit: 5 },
      { type: 'starting_soon', limit: 3 }
    ];
  };

  // Category browsing
  browse: {
    categories: EventCategory[];
    filters: ['time', 'location', 'price', 'capacity', 'language'];
    sortOptions: ['relevance', 'popularity', 'newest', 'starting_soon'];
  };

  // Trending/popular
  trending: {
    algorithm: 'trending_score';
    timeWindows: ['1h', '24h', '7d'];
    categories: boolean; // Per-category trending
  };

  // Proximity-based (for impromptu)
  nearby: {
    maxDistance: '500m';
    includeVirtual: boolean;
    happeningNow: boolean;
    startingSoon: '30 minutes';
  };

  // Schedule-integrated
  mySchedule: {
    rsvpdEvents: GrassrootsEvent[];
    suggestedGaps: TimeSlot[];
    conflictAlerts: boolean;
  };
}
```

#### Interest-Based Matching

```typescript
// HNSW-powered interest matching
async function findMatchingEvents(
  attendee: Attendee,
  options: MatchingOptions
): Promise<RankedEvent[]> {
  // 1. Generate attendee interest embedding
  const interestEmbedding = await generateEmbedding({
    interests: attendee.interests,
    skills: attendee.skills,
    goals: attendee.eventGoals,
    pastAttendance: attendee.attendedEvents.map(e => e.category),
    socialContext: await getSocialSignals(attendee.id)
  });

  // 2. Query HNSW index with filters
  const candidates = await eventIndex.searchWithFilters(
    interestEmbedding,
    100, // Over-fetch for post-filtering
    (eventId) => {
      const event = events.get(eventId);
      return (
        event.parentEventId === options.parentEventId &&
        event.status === 'published' &&
        event.currentRsvps < event.maxAttendees &&
        !attendee.hasRsvpd(eventId) &&
        !hasScheduleConflict(attendee, event)
      );
    }
  );

  // 3. Apply multi-factor ranking
  const ranked = await rankingEngine.rank(candidates, {
    attendee,
    factors: recommendationFactors,
    diversityConstraints: {
      maxPerCategory: 3,
      maxPerOrganizer: 2
    }
  });

  // 4. Apply business rules
  return applyBusinessRules(ranked, {
    promoteOfficialPartners: options.includeSponsored,
    boostVerifiedOrganizers: true,
    penalizeLowReputation: true
  });
}
```

### 4. Venue Integration

#### Physical Venue Management

```typescript
interface VenueSystem {
  // Space types available for grassroots events
  spaceTypes: {
    dedicatedRoom: {
      bookable: true;
      capacity: '10-100';
      amenities: ['av_equipment', 'whiteboard', 'seating'];
      bookingWindow: '48h-7d advance';
      costModel: 'included' | 'fee_based';
    };

    openSpace: {
      bookable: true;
      capacity: '5-30';
      amenities: ['standing_tables', 'power_outlets'];
      bookingWindow: '2h-48h advance';
      costModel: 'included';
    };

    hallwayArea: {
      bookable: false; // First-come, first-served
      capacity: '2-10';
      amenities: ['informal_seating'];
      costModel: 'free';
    };

    outdoorSpace: {
      bookable: true;
      capacity: '10-200';
      amenities: ['weather_dependent'];
      bookingWindow: '24h-7d advance';
      costModel: 'included' | 'fee_based';
    };

    virtualOnly: {
      bookable: true;
      capacity: 'unlimited' | number;
      amenities: ['video', 'chat', 'screen_share', 'breakout_rooms'];
      bookingWindow: 'immediate';
      costModel: 'included';
    };
  };
}
```

#### Booking System Architecture

```yaml
booking_system:
  availability_check:
    inputs:
      - event_time: DateTime
      - duration: Duration
      - expected_attendees: number
      - required_amenities: Amenity[]
      - location_preference: 'anywhere' | VenueId

    process:
      1. query_available_spaces:
          filter_by: [time, capacity, amenities]
          sort_by: [fit_score, location_convenience]

      2. check_conflicts:
          official_events: block
          other_grassroots: warn_if_similar_topic
          setup_teardown: include_buffer_time

      3. calculate_optimal_allocation:
          factors: [capacity_utilization, attendee_flow, noise_considerations]

    outputs:
      - available_spaces: Space[]
      - recommended_space: Space
      - conflict_warnings: Warning[]

  booking_flow:
    1. space_hold:
        duration: '15 minutes'
        purpose: 'complete booking'

    2. confirmation:
        required_fields: [event_details, organizer_agreement]
        payment: if_applicable

    3. allocation:
        status: 'confirmed'
        notifications: [organizer, venue_ops, affected_neighbors]
        calendar_sync: true

    4. pre_event:
        reminders: ['24h', '2h', '30m']
        check_in_instructions: true

    5. post_event:
        auto_release: true
        feedback_request: true
        damage_report: if_applicable

  capacity_management:
    overbooking_allowed: false
    waitlist_enabled: true
    dynamic_reallocation: true  # Move to larger space if needed

    thresholds:
      yellow_alert: 80%  # Capacity at 80%
      red_alert: 95%     # Nearly full
      overflow: 100%     # Trigger waitlist
```

#### Map Integration

```typescript
interface MapIntegration {
  // Indoor mapping
  indoorMap: {
    provider: 'mapbox_indoor' | 'google_indoor' | 'custom';
    features: {
      wayfinding: true;           // Turn-by-turn indoor navigation
      spaceHighlighting: true;    // Show grassroots event locations
      liveOccupancy: true;        // Real-time crowd density
      accessibility: true;        // Accessible routes
    };
  };

  // Event visualization
  eventOverlay: {
    showLiveEvents: {
      icon: 'activity_indicator';
      color: 'by_category';
      size: 'by_attendance';
    };

    showUpcoming: {
      timeWindow: '2 hours';
      filterByInterest: true;
    };

    showAvailableSpaces: {
      bookableOnly: boolean;
      capacityIndicator: true;
    };
  };

  // Proximity features
  proximityFeatures: {
    nearbyEvents: {
      radius: '100m';
      happeningNow: true;
      startingSoon: '15 minutes';
      notification: 'opt_in';
    };

    friendLocation: {
      shareConsent: 'explicit';
      precision: 'zone' | 'exact';
      showInEvents: true;
    };
  };
}
```

### 5. Commerce Features

#### Grassroots Commerce Model

```
+------------------------------------------------------------------+
|                    COMMERCE ARCHITECTURE                          |
+------------------------------------------------------------------+
|                                                                   |
|   GRASSROOTS VENDORS          TICKETED EVENTS        MARKETPLACE  |
|   +----------------+          +----------------+    +----------+  |
|   | Pop-up Shops   |          | Paid Workshops |    | Digital  |  |
|   | Food/Beverage  |          | Premium Access |    | Goods    |  |
|   | Crafts/Merch   |          | VIP Meetups    |    | Services |  |
|   +----------------+          +----------------+    +----------+  |
|           |                           |                   |       |
|           +---------------------------+-------------------+       |
|                                       |                           |
|                          +------------v-----------+               |
|                          |   PAYMENT PROCESSOR    |               |
|                          |   (Stripe Connect)     |               |
|                          +------------------------+               |
|                                       |                           |
|                    +------------------+------------------+        |
|                    |                  |                  |        |
|              +-----v----+      +------v-----+    +------v-----+  |
|              | Platform |      | Event      |    | Grassroots |  |
|              | Fee      |      | Organizer  |    | Creator    |  |
|              | (5-10%)  |      | Share      |    | Revenue    |  |
|              +----------+      +------------+    +------------+  |
+------------------------------------------------------------------+
```

#### Revenue Sharing Models

```typescript
interface RevenueSharing {
  // Ticketed grassroots events
  ticketedEvents: {
    platformFee: 0.05;        // 5% to Konferenco
    paymentProcessing: 0.029;  // 2.9% + $0.30 (Stripe)
    parentEventShare: {
      default: 0.10;           // 10% to parent event
      negotiable: true;
      range: [0, 0.25];
    };
    creatorShare: 'remainder'; // ~82%

    // Example: $50 ticket
    // Platform: $2.50
    // Stripe: $1.75
    // Parent Event: $5.00
    // Creator: $40.75
  };

  // Vendor marketplace
  vendorSales: {
    platformFee: 0.08;         // 8% to Konferenco
    paymentProcessing: 0.029;
    parentEventShare: 0.07;    // 7% to parent event
    vendorShare: 'remainder';  // ~82%

    // Tiered rates for volume
    volumeDiscounts: {
      tier1: { threshold: 1000, discount: 0.01 },
      tier2: { threshold: 5000, discount: 0.02 },
      tier3: { threshold: 10000, discount: 0.03 }
    };
  };

  // Tips and donations
  tipsAndDonations: {
    platformFee: 0.03;         // 3% (reduced for goodwill)
    paymentProcessing: 0.029;
    parentEventShare: 0;       // No cut from tips
    creatorShare: 'remainder'; // ~94%
  };
}
```

#### Pop-up Marketplace System

```typescript
interface MarketplaceSystem {
  // Vendor registration
  vendorOnboarding: {
    requirements: {
      verifiedAttendee: true;
      businessVerification: 'optional';  // Required for high volume
      taxDocumentation: 'threshold_based'; // Required at $600+
      insuranceCert: 'category_dependent';
    };

    approval: {
      autoApprove: ['digital_goods', 'services', 'small_crafts'];
      manualReview: ['food_beverage', 'health_products', 'high_value'];
      prohibited: ['weapons', 'adult', 'counterfeit', 'regulated'];
    };
  };

  // Booth/space allocation
  vendorSpaces: {
    types: {
      digital: {
        physical: false;
        listing: true;
        fee: 'none';
      };
      tablespace: {
        physical: true;
        size: '6x3 feet';
        fee: '$50-200/day';
        amenities: ['power', 'signage_holder'];
      };
      booth: {
        physical: true;
        size: '10x10 feet';
        fee: '$200-500/day';
        amenities: ['power', 'lighting', 'storage'];
      };
    };
  };

  // Product catalog
  productCatalog: {
    listing: {
      title: string;
      description: string;
      images: string[];
      price: Money;
      inventory: number | 'unlimited';
      category: ProductCategory;
      shipping: 'none' | 'digital' | ShippingConfig;
    };

    discovery: {
      indexing: 'hnsw_vector';
      search: 'full_text + semantic';
      filters: ['category', 'price', 'vendor', 'availability'];
    };
  };
}
```

#### Payment Processing

```typescript
interface PaymentSystem {
  // Payment methods
  methods: {
    card: {
      provider: 'stripe';
      features: ['instant_charge', 'saved_cards', '3ds_secure'];
    };

    digitalWallet: {
      providers: ['apple_pay', 'google_pay'];
      features: ['one_tap', 'biometric_auth'];
    };

    eventCredit: {
      description: 'Pre-loaded event wallet';
      features: ['instant_transfer', 'refundable', 'gifting'];
    };

    crypto: {
      enabled: 'optional';  // Parent event decides
      providers: ['coinbase_commerce'];
      currencies: ['btc', 'eth', 'usdc'];
    };
  };

  // Payout system
  payouts: {
    frequency: 'daily' | 'weekly' | 'event_end';
    minimumPayout: 25;  // USD
    methods: ['bank_transfer', 'stripe_instant', 'paypal'];

    // Escrow for protection
    escrow: {
      ticketedEvents: {
        holdPeriod: 'until_event_complete';
        releaseCondition: 'no_disputes_48h';
      };
      merchandise: {
        holdPeriod: '7 days';
        releaseCondition: 'delivery_confirmed' | 'timeout';
      };
    };
  };

  // Refund policies
  refunds: {
    ticketedEvents: {
      fullRefund: 'until_24h_before';
      partialRefund: '50%_until_2h_before';
      noRefund: 'after_start';
      creatorOverride: true;  // Can offer more generous terms
    };

    merchandise: {
      returnWindow: '14 days';
      condition: 'unused_original_packaging';
      restockingFee: 'vendor_defined';
    };
  };
}
```

### 6. Trust & Safety System

#### Reputation System Architecture

```typescript
interface ReputationSystem {
  // Reputation score components
  scoreCalculation: {
    baseScore: 100;  // Starting score for new users

    positiveFactors: {
      successfulEvent: +15;           // Completed event with positive feedback
      positiveReview: +5;             // Per positive review
      repeatAttendees: +10;           // Attendees who return
      verifiedOrganizer: +50;         // One-time bonus
      reportConfirmed: +20;           // Reporting valid violation
      longevity: +2;                  // Per month of good standing
    };

    negativeFactors: {
      cancelledEvent: -20;            // Event cancelled
      negativeReview: -10;            // Per negative review
      validReport: -30;               // Confirmed policy violation
      noShow: -25;                    // Organizer no-show
      spamAttempt: -50;               // Attempted spam
      suspensionHistory: -100;        // Previous suspension
    };

    decayFunction: {
      type: 'exponential';
      halfLife: '90 days';            // Negative factors decay
      floor: 0;                       // Minimum score
      ceiling: 1000;                  // Maximum score
    };
  };

  // Trust tiers
  trustTiers: {
    untrusted: {
      range: [0, 50];
      restrictions: ['no_event_creation', 'limited_rsvp'];
    };

    new: {
      range: [51, 100];
      restrictions: ['manual_approval', 'small_events_only'];
    };

    established: {
      range: [101, 200];
      privileges: ['auto_approve_basic', 'standard_capacity'];
    };

    trusted: {
      range: [201, 500];
      privileges: ['auto_approve_all', 'extended_capacity', 'commerce'];
    };

    exemplary: {
      range: [501, 1000];
      privileges: ['featured_eligibility', 'reduced_fees', 'beta_features'];
    };
  };
}
```

#### Report & Flag System

```typescript
interface ReportSystem {
  // Report types
  reportTypes: {
    content: {
      subtypes: ['spam', 'inappropriate', 'misleading', 'copyright'];
      evidence: 'screenshot_optional';
      routing: 'content_moderation_queue';
    };

    safety: {
      subtypes: ['harassment', 'threat', 'dangerous_activity'];
      evidence: 'required';
      routing: 'urgent_safety_queue';
      escalation: 'immediate';
    };

    commerce: {
      subtypes: ['fraud', 'non_delivery', 'counterfeit', 'price_gouging'];
      evidence: 'required';
      routing: 'commerce_dispute_queue';
    };

    behavior: {
      subtypes: ['disruptive', 'no_show_pattern', 'hostile'];
      evidence: 'optional';
      routing: 'behavior_review_queue';
    };
  };

  // Processing workflow
  workflow: {
    submission: {
      anonymity: 'protected';        // Reporter identity hidden from reported
      confirmation: 'immediate';
      tracking: 'case_number';
    };

    triage: {
      autoClassification: true;      // ML-based initial classification
      priorityScoring: {
        safety: 'critical';
        fraud: 'high';
        content: 'medium';
        behavior: 'standard';
      };
    };

    investigation: {
      sla: {
        critical: '1 hour';
        high: '4 hours';
        medium: '24 hours';
        standard: '72 hours';
      };

      actions: [
        'gather_evidence',
        'interview_parties',
        'review_history',
        'consult_policy'
      ];
    };

    resolution: {
      outcomes: [
        'no_action',
        'warning',
        'content_removal',
        'temporary_restriction',
        'suspension',
        'permanent_ban'
      ];

      appeals: {
        window: '14 days';
        process: 'secondary_review';
        binding: true;
      };
    };
  };
}
```

#### Verified Organizer Badge System

```typescript
interface BadgeSystem {
  // Badge types
  badges: {
    verifiedIdentity: {
      requirements: ['id_verification', 'selfie_match'];
      display: 'checkmark_blue';
      trustBoost: +30;
    };

    proOrganizer: {
      requirements: [
        'verified_identity',
        '10_successful_events',
        'reputation >= 300',
        '90%_positive_reviews'
      ];
      display: 'star_gold';
      trustBoost: +50;
      privileges: ['priority_support', 'analytics_access'];
    };

    communityLeader: {
      requirements: [
        'pro_organizer',
        '50_successful_events',
        'mentored_5_new_organizers'
      ];
      display: 'crown_purple';
      trustBoost: +100;
      privileges: ['moderation_input', 'feature_beta', 'speaker_invites'];
    };

    sponsoredPartner: {
      requirements: ['partner_agreement', 'sponsor_verification'];
      display: 'partner_badge';
      trustBoost: +75;
      privileges: ['promoted_events', 'dedicated_support'];
    };
  };

  // Display rules
  displayRules: {
    visibility: 'public';
    placement: ['profile', 'event_listing', 'search_results'];
    tooltip: 'badge_explanation';
    verification: 'click_to_verify';  // Users can verify badge authenticity
  };
}
```

---

## Data Architecture

### Database Schema

```sql
-- Core grassroots event table
CREATE TABLE grassroots_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_event_id UUID NOT NULL REFERENCES events(id),
    parent_grassroots_id UUID REFERENCES grassroots_events(id),

    -- Identity
    slug VARCHAR(100) NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,

    -- Hierarchy
    tier VARCHAR(20) NOT NULL CHECK (tier IN ('grassroots', 'social', 'impromptu')),
    category VARCHAR(50) NOT NULL,
    tags TEXT[],

    -- Timing
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    timezone VARCHAR(50) NOT NULL,
    is_recurring BOOLEAN DEFAULT FALSE,
    recurrence_rule JSONB,

    -- Location
    location_type VARCHAR(20) NOT NULL CHECK (location_type IN ('physical', 'virtual', 'hybrid')),
    venue_allocation_id UUID REFERENCES venue_allocations(id),
    virtual_room_config JSONB,

    -- Capacity
    min_attendees INTEGER DEFAULT 1,
    max_attendees INTEGER NOT NULL,
    current_rsvps INTEGER DEFAULT 0,
    waitlist_enabled BOOLEAN DEFAULT TRUE,

    -- Creator
    creator_id UUID NOT NULL REFERENCES users(id),
    co_organizer_ids UUID[],

    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'draft',
    moderation_status VARCHAR(20) NOT NULL DEFAULT 'pending',

    -- Commerce
    is_free BOOLEAN DEFAULT TRUE,
    ticket_price_cents INTEGER,
    ticket_currency VARCHAR(3),
    revenue_share_percentage DECIMAL(5,2),

    -- Trust
    creator_reputation_score INTEGER NOT NULL,
    flag_count INTEGER DEFAULT 0,
    verified_by_organizer BOOLEAN DEFAULT FALSE,

    -- Search
    embedding VECTOR(384),  -- For HNSW similarity search
    search_text TSVECTOR,   -- For full-text search

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    UNIQUE(parent_event_id, slug),
    CHECK (end_time > start_time),
    CHECK (max_attendees >= min_attendees)
);

-- Indexes for performance
CREATE INDEX idx_grassroots_parent ON grassroots_events(parent_event_id);
CREATE INDEX idx_grassroots_creator ON grassroots_events(creator_id);
CREATE INDEX idx_grassroots_status ON grassroots_events(status, moderation_status);
CREATE INDEX idx_grassroots_time ON grassroots_events(start_time, end_time);
CREATE INDEX idx_grassroots_category ON grassroots_events(category);
CREATE INDEX idx_grassroots_embedding ON grassroots_events USING hnsw (embedding vector_cosine_ops);
CREATE INDEX idx_grassroots_search ON grassroots_events USING gin(search_text);

-- RSVPs table
CREATE TABLE grassroots_rsvps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES grassroots_events(id),
    user_id UUID NOT NULL REFERENCES users(id),

    status VARCHAR(20) NOT NULL CHECK (status IN ('confirmed', 'waitlisted', 'cancelled')),
    ticket_id UUID REFERENCES tickets(id),

    rsvp_time TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    check_in_time TIMESTAMPTZ,

    UNIQUE(event_id, user_id)
);

-- Reputation table
CREATE TABLE user_reputation (
    user_id UUID PRIMARY KEY REFERENCES users(id),

    score INTEGER NOT NULL DEFAULT 100,
    trust_tier VARCHAR(20) NOT NULL DEFAULT 'new',

    events_created INTEGER DEFAULT 0,
    events_completed INTEGER DEFAULT 0,
    events_cancelled INTEGER DEFAULT 0,

    positive_reviews INTEGER DEFAULT 0,
    negative_reviews INTEGER DEFAULT 0,

    reports_received INTEGER DEFAULT 0,
    reports_confirmed INTEGER DEFAULT 0,

    badges TEXT[],

    last_activity TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Reports table
CREATE TABLE grassroots_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    reporter_id UUID NOT NULL REFERENCES users(id),
    reported_event_id UUID REFERENCES grassroots_events(id),
    reported_user_id UUID REFERENCES users(id),

    report_type VARCHAR(30) NOT NULL,
    subtype VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    evidence_urls TEXT[],

    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    priority VARCHAR(20) NOT NULL,
    assigned_to UUID REFERENCES users(id),

    resolution VARCHAR(30),
    resolution_notes TEXT,
    resolved_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Venue allocations
CREATE TABLE venue_allocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    venue_id UUID NOT NULL REFERENCES venues(id),
    space_id UUID NOT NULL REFERENCES venue_spaces(id),
    event_id UUID REFERENCES grassroots_events(id),

    allocation_type VARCHAR(20) NOT NULL,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,

    status VARCHAR(20) NOT NULL DEFAULT 'pending',

    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
```

### Event Sourcing for Audit Trail

```typescript
interface EventSourcing {
  // All state changes captured as events
  eventTypes: [
    'EventCreated',
    'EventUpdated',
    'EventPublished',
    'EventCancelled',
    'EventCompleted',
    'RSVPAdded',
    'RSVPCancelled',
    'CheckInRecorded',
    'ReportSubmitted',
    'ReportResolved',
    'ReputationChanged',
    'VenueAllocated',
    'VenueReleased',
    'PaymentProcessed',
    'RefundIssued'
  ];

  // Event structure
  eventStructure: {
    id: UUID;
    aggregateId: UUID;      // Event or User ID
    aggregateType: string;
    eventType: string;
    payload: object;
    metadata: {
      timestamp: DateTime;
      userId: UUID;
      correlationId: UUID;
      causationId: UUID;
    };
  };

  // Projections
  projections: {
    eventListings: 'real-time';    // For search/discovery
    analytics: 'near-real-time';    // For dashboards
    compliance: 'batch';            // For auditing
  };
}
```

---

## API Design

### REST API Endpoints

```yaml
openapi: 3.0.0
info:
  title: Grassroots Events API
  version: 1.0.0

paths:
  /v1/events/{parentEventId}/grassroots:
    get:
      summary: List grassroots events
      parameters:
        - name: parentEventId
          in: path
          required: true
          schema:
            type: string
            format: uuid
        - name: category
          in: query
          schema:
            type: string
        - name: startAfter
          in: query
          schema:
            type: string
            format: date-time
        - name: status
          in: query
          schema:
            type: string
            enum: [published, in_progress, completed]
        - name: limit
          in: query
          schema:
            type: integer
            default: 20
        - name: cursor
          in: query
          schema:
            type: string
      responses:
        200:
          description: List of grassroots events
          content:
            application/json:
              schema:
                type: object
                properties:
                  events:
                    type: array
                    items:
                      $ref: '#/components/schemas/GrassrootsEvent'
                  nextCursor:
                    type: string

    post:
      summary: Create grassroots event
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateGrassrootsEventRequest'
      responses:
        201:
          description: Event created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/GrassrootsEvent'
        400:
          description: Validation error
        403:
          description: Insufficient permissions

  /v1/events/{parentEventId}/grassroots/{eventId}:
    get:
      summary: Get grassroots event details
      parameters:
        - name: parentEventId
          in: path
          required: true
          schema:
            type: string
        - name: eventId
          in: path
          required: true
          schema:
            type: string
      responses:
        200:
          description: Event details
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/GrassrootsEventDetail'

    patch:
      summary: Update grassroots event
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/UpdateGrassrootsEventRequest'
      responses:
        200:
          description: Event updated

    delete:
      summary: Cancel grassroots event
      security:
        - bearerAuth: []
      responses:
        204:
          description: Event cancelled

  /v1/events/{parentEventId}/grassroots/{eventId}/rsvp:
    post:
      summary: RSVP to event
      security:
        - bearerAuth: []
      responses:
        200:
          description: RSVP confirmed
        409:
          description: Event full (waitlisted)

    delete:
      summary: Cancel RSVP
      security:
        - bearerAuth: []
      responses:
        204:
          description: RSVP cancelled

  /v1/events/{parentEventId}/grassroots/discover:
    get:
      summary: Personalized event discovery
      security:
        - bearerAuth: []
      parameters:
        - name: limit
          in: query
          schema:
            type: integer
            default: 20
      responses:
        200:
          description: Recommended events
          content:
            application/json:
              schema:
                type: object
                properties:
                  forYou:
                    type: array
                    items:
                      $ref: '#/components/schemas/GrassrootsEvent'
                  trending:
                    type: array
                    items:
                      $ref: '#/components/schemas/GrassrootsEvent'
                  startingSoon:
                    type: array
                    items:
                      $ref: '#/components/schemas/GrassrootsEvent'

  /v1/events/{parentEventId}/grassroots/{eventId}/report:
    post:
      summary: Report event or organizer
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ReportRequest'
      responses:
        201:
          description: Report submitted

components:
  schemas:
    GrassrootsEvent:
      type: object
      properties:
        id:
          type: string
          format: uuid
        title:
          type: string
        description:
          type: string
        tier:
          type: string
          enum: [grassroots, social, impromptu]
        category:
          type: string
        startTime:
          type: string
          format: date-time
        endTime:
          type: string
          format: date-time
        locationType:
          type: string
          enum: [physical, virtual, hybrid]
        venue:
          $ref: '#/components/schemas/VenueSummary'
        maxAttendees:
          type: integer
        currentRsvps:
          type: integer
        creator:
          $ref: '#/components/schemas/UserSummary'
        isFree:
          type: boolean
        ticketPrice:
          $ref: '#/components/schemas/Money'
        status:
          type: string
```

---

## TDD Scenarios

### Event Creation Flow Tests

```typescript
describe('Grassroots Event Creation', () => {
  describe('Permission Checks', () => {
    it('should allow verified attendee to create grassroots event', async () => {
      // Given
      const user = await createUser({ verified: true, reputationScore: 150 });
      const parentEvent = await createParentEvent();

      // When
      const result = await createGrassrootsEvent(user, parentEvent, {
        title: 'TypeScript Best Practices Discussion',
        description: 'Share and learn TypeScript patterns',
        category: 'technical',
        tier: 'grassroots',
        startTime: futureDate('+2 days'),
        maxAttendees: 20
      });

      // Then
      expect(result.status).toBe('pending_approval');
      expect(result.moderationStatus).toBe('pending');
    });

    it('should auto-approve event from trusted organizer', async () => {
      // Given
      const user = await createUser({ verified: true, reputationScore: 350, isTrusted: true });
      const parentEvent = await createParentEvent();

      // When
      const result = await createGrassrootsEvent(user, parentEvent, {
        title: 'Rust Beginners Meetup',
        category: 'technical',
        tier: 'grassroots',
        startTime: futureDate('+3 days'),
        maxAttendees: 15
      });

      // Then
      expect(result.status).toBe('approved');
      expect(result.moderationStatus).toBe('auto_approved');
    });

    it('should reject event from suspended user', async () => {
      // Given
      const user = await createUser({ suspended: true });
      const parentEvent = await createParentEvent();

      // When/Then
      await expect(
        createGrassrootsEvent(user, parentEvent, { title: 'Test Event' })
      ).rejects.toThrow('User is suspended from creating events');
    });

    it('should enforce rate limits on event creation', async () => {
      // Given
      const user = await createUser({ verified: true });
      const parentEvent = await createParentEvent();

      // Create 3 events (daily limit)
      for (let i = 0; i < 3; i++) {
        await createGrassrootsEvent(user, parentEvent, {
          title: `Event ${i}`,
          startTime: futureDate(`+${i + 1} days`)
        });
      }

      // When/Then - 4th should fail
      await expect(
        createGrassrootsEvent(user, parentEvent, { title: 'Event 4' })
      ).rejects.toThrow('Daily event creation limit reached');
    });
  });

  describe('Content Moderation', () => {
    it('should flag event with spam indicators', async () => {
      // Given
      const user = await createUser({ verified: true });
      const parentEvent = await createParentEvent();

      // When
      const result = await createGrassrootsEvent(user, parentEvent, {
        title: 'BUY NOW! Amazing Opportunity!!!',
        description: 'Click here for exclusive deals...',
        category: 'networking'
      });

      // Then
      expect(result.moderationStatus).toBe('flagged');
      expect(result.moderationFlags).toContain('spam_indicators');
    });

    it('should detect duplicate events', async () => {
      // Given
      const user = await createUser({ verified: true });
      const parentEvent = await createParentEvent();

      await createGrassrootsEvent(user, parentEvent, {
        title: 'Python Study Group',
        description: 'Weekly Python programming study session',
        startTime: futureDate('+1 day')
      });

      // When - Create near-duplicate
      const result = await createGrassrootsEvent(user, parentEvent, {
        title: 'Python Learning Group',
        description: 'Weekly Python programming study meeting',
        startTime: futureDate('+1 day')
      });

      // Then
      expect(result.moderationStatus).toBe('flagged');
      expect(result.moderationFlags).toContain('near_duplicate');
    });
  });

  describe('Venue Allocation', () => {
    it('should allocate available venue space', async () => {
      // Given
      const user = await createUser({ verified: true });
      const parentEvent = await createParentEvent();
      const availableSpace = await createVenueSpace({ capacity: 30 });

      // When
      const result = await createGrassrootsEvent(user, parentEvent, {
        title: 'Design Thinking Workshop',
        maxAttendees: 20,
        locationType: 'physical',
        venueRequest: { spaceId: availableSpace.id }
      });

      // Then
      expect(result.venue).toBeDefined();
      expect(result.venue.spaceId).toBe(availableSpace.id);
      expect(result.venue.status).toBe('confirmed');
    });

    it('should reject conflicting venue bookings', async () => {
      // Given
      const space = await createVenueSpace({ capacity: 30 });
      const existingEvent = await createGrassrootsEvent(userA, parentEvent, {
        startTime: '2026-03-15T10:00:00Z',
        endTime: '2026-03-15T12:00:00Z',
        venueRequest: { spaceId: space.id }
      });

      // When/Then
      await expect(
        createGrassrootsEvent(userB, parentEvent, {
          startTime: '2026-03-15T11:00:00Z',  // Overlaps!
          endTime: '2026-03-15T13:00:00Z',
          venueRequest: { spaceId: space.id }
        })
      ).rejects.toThrow('Venue space not available for requested time');
    });
  });
});

describe('Event Discovery', () => {
  describe('Personalized Recommendations', () => {
    it('should recommend events matching user interests', async () => {
      // Given
      const user = await createUser({
        interests: ['machine-learning', 'python', 'data-science']
      });
      const parentEvent = await createParentEvent();

      // Create diverse events
      const mlEvent = await createGrassrootsEvent(organizer, parentEvent, {
        title: 'ML Paper Reading Club',
        category: 'technical',
        tags: ['machine-learning', 'research']
      });
      const artEvent = await createGrassrootsEvent(organizer, parentEvent, {
        title: 'Watercolor Workshop',
        category: 'creative',
        tags: ['art', 'painting']
      });

      // When
      const recommendations = await getRecommendations(user, parentEvent);

      // Then
      expect(recommendations.forYou[0].id).toBe(mlEvent.id);
      expect(recommendations.forYou.map(e => e.id)).not.toContain(artEvent.id);
    });

    it('should boost events with friends attending', async () => {
      // Given
      const user = await createUser({ interests: ['networking'] });
      const friend = await createUser();
      await createFriendship(user, friend);

      const eventWithFriend = await createGrassrootsEvent(organizer, parentEvent, {
        title: 'Startup Networking'
      });
      await rsvpToEvent(friend, eventWithFriend);

      const eventWithoutFriends = await createGrassrootsEvent(organizer, parentEvent, {
        title: 'Startup Meetup'  // Similar but no friends
      });

      // When
      const recommendations = await getRecommendations(user, parentEvent);

      // Then
      const withFriendIndex = recommendations.forYou.findIndex(
        e => e.id === eventWithFriend.id
      );
      const withoutFriendIndex = recommendations.forYou.findIndex(
        e => e.id === eventWithoutFriends.id
      );
      expect(withFriendIndex).toBeLessThan(withoutFriendIndex);
    });
  });

  describe('Trending Events', () => {
    it('should calculate trending score based on RSVP velocity', async () => {
      // Given
      const event = await createGrassrootsEvent(organizer, parentEvent, {
        title: 'Hot Topic Discussion'
      });

      // Simulate rapid RSVPs
      for (let i = 0; i < 20; i++) {
        await rsvpToEvent(await createUser(), event);
      }

      // When
      const trending = await getTrendingEvents(parentEvent);

      // Then
      expect(trending[0].id).toBe(event.id);
      expect(trending[0].trendingScore).toBeGreaterThan(50);
    });
  });
});

describe('RSVP System', () => {
  it('should add user to waitlist when event is full', async () => {
    // Given
    const event = await createGrassrootsEvent(organizer, parentEvent, {
      maxAttendees: 2
    });
    await rsvpToEvent(user1, event);
    await rsvpToEvent(user2, event);

    // When
    const result = await rsvpToEvent(user3, event);

    // Then
    expect(result.status).toBe('waitlisted');
    expect(result.waitlistPosition).toBe(1);
  });

  it('should promote from waitlist on cancellation', async () => {
    // Given
    const event = await createGrassrootsEvent(organizer, parentEvent, {
      maxAttendees: 1
    });
    await rsvpToEvent(user1, event);
    const waitlistResult = await rsvpToEvent(user2, event);
    expect(waitlistResult.status).toBe('waitlisted');

    // When
    await cancelRsvp(user1, event);

    // Then
    const user2Rsvp = await getRsvp(user2, event);
    expect(user2Rsvp.status).toBe('confirmed');
    // Should receive notification
    expect(await getNotifications(user2)).toContainEqual(
      expect.objectContaining({ type: 'waitlist_promotion' })
    );
  });
});

describe('Commerce', () => {
  describe('Ticketed Events', () => {
    it('should process ticket purchase with correct revenue split', async () => {
      // Given
      const event = await createGrassrootsEvent(organizer, parentEvent, {
        isFree: false,
        ticketPrice: { amount: 5000, currency: 'USD' }  // $50
      });

      // When
      const purchase = await purchaseTicket(attendee, event);

      // Then
      expect(purchase.status).toBe('completed');
      expect(purchase.breakdown).toEqual({
        total: 5000,
        platformFee: 250,      // 5%
        processingFee: 175,    // 2.9% + 30c
        parentEventShare: 500, // 10%
        creatorRevenue: 4075   // Remainder
      });
    });

    it('should process refund before event', async () => {
      // Given
      const event = await createGrassrootsEvent(organizer, parentEvent, {
        isFree: false,
        ticketPrice: { amount: 2500, currency: 'USD' },
        startTime: futureDate('+3 days')
      });
      const ticket = await purchaseTicket(attendee, event);

      // When
      const refund = await requestRefund(attendee, ticket);

      // Then
      expect(refund.status).toBe('approved');
      expect(refund.amount).toBe(2500);  // Full refund (>24h before)
    });
  });
});

describe('Trust & Safety', () => {
  describe('Reputation System', () => {
    it('should increase reputation after successful event', async () => {
      // Given
      const organizer = await createUser({ reputationScore: 100 });
      const event = await createGrassrootsEvent(organizer, parentEvent, {
        maxAttendees: 10
      });

      // Simulate successful event
      for (let i = 0; i < 8; i++) {
        const attendee = await createUser();
        await rsvpToEvent(attendee, event);
        await checkInToEvent(attendee, event);
      }
      await completeEvent(event);
      await submitPositiveReview(attendees[0], event);

      // When
      const updatedOrganizer = await getUser(organizer.id);

      // Then
      expect(updatedOrganizer.reputationScore).toBe(120);  // +15 success, +5 review
      expect(updatedOrganizer.trustTier).toBe('established');
    });

    it('should decrease reputation after confirmed violation', async () => {
      // Given
      const organizer = await createUser({ reputationScore: 150 });
      const event = await createGrassrootsEvent(organizer, parentEvent, {});

      // When
      await submitReport(reporter, event, { type: 'content', subtype: 'misleading' });
      await resolveReport(moderator, report, { outcome: 'violation_confirmed' });

      // Then
      const updatedOrganizer = await getUser(organizer.id);
      expect(updatedOrganizer.reputationScore).toBe(120);  // -30 for violation
    });
  });

  describe('Report System', () => {
    it('should route safety reports to urgent queue', async () => {
      // Given
      const event = await createGrassrootsEvent(organizer, parentEvent, {});

      // When
      const report = await submitReport(reporter, event, {
        type: 'safety',
        subtype: 'harassment',
        description: 'Threatening behavior observed',
        evidence: ['screenshot_url']
      });

      // Then
      expect(report.priority).toBe('critical');
      expect(report.queue).toBe('urgent_safety_queue');
      expect(report.sla).toBe('1 hour');
    });
  });
});
```

### Integration Tests

```typescript
describe('End-to-End Grassroots Event Flow', () => {
  it('should complete full event lifecycle', async () => {
    // 1. Create verified user
    const organizer = await registerUser({ email: 'organizer@test.com' });
    await verifyEmail(organizer);
    await completeProfile(organizer, { interests: ['tech', 'startup'] });

    // 2. Attend official event to become verified attendee
    const conference = await getConference('tech-conf-2026');
    await purchaseTicket(organizer, conference);
    await checkInToEvent(organizer, conference.sessions[0]);

    // 3. Create grassroots event
    const grassrootsEvent = await createGrassrootsEvent(organizer, conference, {
      title: 'Founder Coffee Chat',
      description: 'Informal discussion for early-stage founders',
      category: 'networking',
      tier: 'social',
      startTime: futureDate('+1 day 9:00'),
      endTime: futureDate('+1 day 10:00'),
      locationType: 'physical',
      maxAttendees: 12
    });

    expect(grassrootsEvent.status).toBe('pending_approval');

    // 4. Event gets auto-approved (low risk)
    await waitForModeration(grassrootsEvent);
    const approvedEvent = await getEvent(grassrootsEvent.id);
    expect(approvedEvent.moderationStatus).toBe('auto_approved');

    // 5. Event appears in discovery
    const attendee = await createVerifiedAttendee(conference);
    const recommendations = await getRecommendations(attendee, conference);
    expect(recommendations.forYou.map(e => e.id)).toContain(grassrootsEvent.id);

    // 6. Attendees RSVP
    const rsvps = [];
    for (let i = 0; i < 8; i++) {
      const user = await createVerifiedAttendee(conference);
      rsvps.push(await rsvpToEvent(user, approvedEvent));
    }
    expect(rsvps.every(r => r.status === 'confirmed')).toBe(true);

    // 7. Event runs
    await advanceTimeTo(approvedEvent.startTime);
    expect((await getEvent(approvedEvent.id)).status).toBe('in_progress');

    // Check-ins
    for (const rsvp of rsvps.slice(0, 6)) {
      await checkInToEvent(rsvp.userId, approvedEvent);
    }

    // 8. Event completes
    await advanceTimeTo(approvedEvent.endTime);
    expect((await getEvent(approvedEvent.id)).status).toBe('completed');

    // 9. Collect feedback
    await submitReview(rsvps[0].userId, approvedEvent, { rating: 5, comment: 'Great discussion!' });
    await submitReview(rsvps[1].userId, approvedEvent, { rating: 4, comment: 'Enjoyed it' });

    // 10. Organizer reputation increases
    const updatedOrganizer = await getUser(organizer.id);
    expect(updatedOrganizer.reputationScore).toBeGreaterThan(100);
    expect(updatedOrganizer.eventsCompleted).toBe(1);
  });
});
```

---

## Consequences

### Positive

1. **Increased Engagement**: Attendees become active participants, not passive consumers
2. **Network Effects**: Successful grassroots events attract more attendees to parent events
3. **Additional Revenue**: Commerce features create new monetization opportunities
4. **Community Building**: Organic connections extend beyond official programming
5. **Differentiation**: Unique capability distinguishes Konferenco from competitors
6. **Scalability**: Self-organizing communities reduce organizer burden

### Negative

1. **Moderation Complexity**: More content requires more moderation resources
2. **Quality Variance**: Grassroots events may have inconsistent quality
3. **Brand Risk**: Poor grassroots events could reflect on parent event
4. **Technical Complexity**: Additional systems for discovery, commerce, trust
5. **Support Burden**: More event types means more support scenarios

### Mitigations

| Risk | Mitigation |
|------|------------|
| Content quality | Reputation system + moderation workflow |
| Brand risk | Clear labeling of unofficial events |
| Spam | Rate limiting + ML-based detection |
| Safety | Robust reporting + quick response SLAs |
| Complexity | Phased rollout starting with social tier |

---

## Implementation Phases

### Phase 1: Foundation (Weeks 1-4)
- Event hierarchy model
- Basic creation flow
- Manual moderation workflow
- Simple discovery (category + time filters)

### Phase 2: Automation (Weeks 5-8)
- Auto-moderation system
- Spam detection
- HNSW-based recommendations
- Venue integration

### Phase 3: Commerce (Weeks 9-12)
- Ticketed events
- Payment processing
- Revenue sharing
- Vendor marketplace

### Phase 4: Trust (Weeks 13-16)
- Full reputation system
- Verified badges
- Advanced reporting
- Appeals process

---

## References

- [ADR-001: Event Platform Architecture](./ADR-001-event-platform-architecture.md)
- [RuVector Integration Analysis](../research/ruvector-integration.md)
- [Stripe Connect Documentation](https://stripe.com/docs/connect)
- [HNSW Algorithm Paper](https://arxiv.org/abs/1603.09320)

---

**Document Status**: Proposed
**Next Steps**: Architecture review, security assessment, UX research validation
