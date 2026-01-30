# Konferenco TDD Strategy

| Field | Value |
|-------|-------|
| **Status** | Proposed |
| **Date** | 2026-01-30 |
| **Authors** | QA Architecture Team |
| **Related** | ADR-001-core-architecture.md |

---

## 1. Testing Philosophy

### 1.1 London School TDD Approach

Konferenco adopts the **London School (Mockist) TDD** methodology, emphasizing behavior verification over state verification. This approach aligns with our microservices architecture where services interact through well-defined interfaces.

**Core Principles:**

```
1. Start with a failing acceptance test (outside-in)
2. Drive implementation through unit tests with mocks
3. Verify behavior through interaction testing
4. Refactor with confidence
```

**The TDD Cycle:**

```
       RED
      /    \
     /      \
    /        \
GREEN -----> REFACTOR
    \        /
     \      /
      \    /
       REPEAT
```

| Phase | Activity | Duration Target |
|-------|----------|-----------------|
| RED | Write failing test | < 5 minutes |
| GREEN | Write minimal implementation | < 10 minutes |
| REFACTOR | Improve design, maintain tests passing | < 10 minutes |

### 1.2 Outside-In Development

Development flows from the outer layers (API/UI) inward to domain logic:

```
┌─────────────────────────────────────────────────────┐
│  1. Acceptance Tests (User Journeys)                │
│  ┌───────────────────────────────────────────────┐  │
│  │  2. API/Controller Tests                      │  │
│  │  ┌─────────────────────────────────────────┐  │  │
│  │  │  3. Service Tests                       │  │  │
│  │  │  ┌───────────────────────────────────┐  │  │  │
│  │  │  │  4. Domain/Entity Tests           │  │  │  │
│  │  │  │  ┌─────────────────────────────┐  │  │  │  │
│  │  │  │  │  5. Repository Tests        │  │  │  │  │
│  │  │  │  └─────────────────────────────┘  │  │  │  │
│  │  │  └───────────────────────────────────┘  │  │  │
│  │  └─────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

**Implementation Order:**

1. Write E2E test describing user journey (fails - feature missing)
2. Write API test for endpoint behavior (fails - controller missing)
3. Write service test with mocked dependencies (fails - service missing)
4. Write domain logic tests (fails - domain missing)
5. Implement domain logic (inner tests pass)
6. Implement service (service tests pass)
7. Implement controller (API tests pass)
8. Verify E2E test passes

### 1.3 Behavior-Driven Scenarios

All tests follow the **Given/When/Then** (GWT) format for clarity and documentation:

```typescript
describe('Event Creation', () => {
  describe('Given an authenticated organizer', () => {
    describe('When they create an event with valid data', () => {
      it('Then the event should be created and published to Kafka', async () => {
        // Arrange (Given)
        const organizer = await createAuthenticatedOrganizer();
        const eventData = validEventFixture();

        // Act (When)
        const result = await eventService.createEvent(organizer.id, eventData);

        // Assert (Then)
        expect(result).toHaveProperty('id');
        expect(kafkaMock.publish).toHaveBeenCalledWith(
          'event.created',
          expect.objectContaining({ eventId: result.id })
        );
      });
    });
  });
});
```

### 1.4 Mock-First Design

**Dependency Injection Pattern:**

```typescript
// Interface-driven design enables mocking
interface EventRepository {
  save(event: Event): Promise<Event>;
  findById(id: string): Promise<Event | null>;
  findByOrganizer(organizerId: string): Promise<Event[]>;
}

// Service depends on interface, not implementation
class EventService {
  constructor(
    private readonly eventRepository: EventRepository,
    private readonly eventPublisher: EventPublisher,
    private readonly capacityChecker: CapacityChecker
  ) {}
}

// Test with mocks
describe('EventService', () => {
  let service: EventService;
  let mockRepository: jest.Mocked<EventRepository>;
  let mockPublisher: jest.Mocked<EventPublisher>;
  let mockCapacityChecker: jest.Mocked<CapacityChecker>;

  beforeEach(() => {
    mockRepository = createMock<EventRepository>();
    mockPublisher = createMock<EventPublisher>();
    mockCapacityChecker = createMock<CapacityChecker>();

    service = new EventService(mockRepository, mockPublisher, mockCapacityChecker);
  });
});
```

**Mock Hierarchy:**

| Layer | Mocked By | Mock Type |
|-------|-----------|-----------|
| External APIs | Service layer | HTTP mocks (nock/msw) |
| Database | Repository layer | In-memory repository |
| Message Queue | Publisher layer | Event capture mock |
| Cache | Cache layer | Map-based mock |
| Time | Test utilities | Fake timers |

---

## 2. Test Categories

### 2.1 Unit Tests

**Scope:** Individual functions, classes, and modules in isolation.

**Characteristics:**
- Execute in < 10ms
- No I/O operations
- All dependencies mocked
- Single responsibility per test

#### 2.1.1 Core Domain Logic

```typescript
// src/domain/event/__tests__/event.entity.spec.ts
describe('Event Entity', () => {
  describe('capacity management', () => {
    it('should calculate remaining capacity correctly', () => {
      const event = new Event({
        id: 'event-123',
        maxCapacity: 100,
        registeredCount: 75
      });

      expect(event.remainingCapacity).toBe(25);
      expect(event.isAtCapacity).toBe(false);
    });

    it('should mark event as at capacity when full', () => {
      const event = new Event({
        id: 'event-123',
        maxCapacity: 100,
        registeredCount: 100
      });

      expect(event.remainingCapacity).toBe(0);
      expect(event.isAtCapacity).toBe(true);
    });

    it('should throw when registration exceeds capacity', () => {
      const event = new Event({ maxCapacity: 100, registeredCount: 100 });

      expect(() => event.registerAttendee('user-456'))
        .toThrow(CapacityExceededError);
    });
  });

  describe('grassroots enablement', () => {
    it('should allow sub-events when grassroots is enabled', () => {
      const event = new Event({ grassrootsEnabled: true });

      expect(event.canCreateSubEvent()).toBe(true);
    });

    it('should reject sub-events when grassroots is disabled', () => {
      const event = new Event({ grassrootsEnabled: false });

      expect(event.canCreateSubEvent()).toBe(false);
    });
  });
});
```

#### 2.1.2 Matching Algorithms

```typescript
// src/domain/networking/__tests__/matching-algorithm.spec.ts
describe('AttendeeMatchingAlgorithm', () => {
  let algorithm: AttendeeMatchingAlgorithm;

  beforeEach(() => {
    algorithm = new AttendeeMatchingAlgorithm({
      minScore: 0.5,
      maxMatches: 10,
      diversityBonus: 0.1
    });
  });

  describe('interest-based matching', () => {
    it('should score higher for overlapping interests', () => {
      const attendeeA = createAttendee({
        interests: ['AI', 'Machine Learning', 'Python']
      });
      const attendeeB = createAttendee({
        interests: ['AI', 'Machine Learning', 'Rust']
      });
      const attendeeC = createAttendee({
        interests: ['Finance', 'Trading', 'Excel']
      });

      const scoreAB = algorithm.calculateScore(attendeeA, attendeeB);
      const scoreAC = algorithm.calculateScore(attendeeA, attendeeC);

      expect(scoreAB).toBeGreaterThan(scoreAC);
      expect(scoreAB).toBeGreaterThanOrEqual(0.6); // 2/3 overlap
    });

    it('should apply diversity bonus for different industries', () => {
      const techAttendee = createAttendee({ industry: 'Technology' });
      const healthAttendee = createAttendee({ industry: 'Healthcare' });
      const otherTechAttendee = createAttendee({ industry: 'Technology' });

      const crossIndustryScore = algorithm.calculateScore(techAttendee, healthAttendee);
      const sameIndustryScore = algorithm.calculateScore(techAttendee, otherTechAttendee);

      expect(crossIndustryScore).toBeGreaterThan(sameIndustryScore);
    });
  });

  describe('availability matching', () => {
    it('should find common free slots', () => {
      const attendeeA = createAttendee({
        availability: [
          { start: '09:00', end: '12:00' },
          { start: '14:00', end: '17:00' }
        ]
      });
      const attendeeB = createAttendee({
        availability: [
          { start: '10:00', end: '11:00' },
          { start: '15:00', end: '16:00' }
        ]
      });

      const commonSlots = algorithm.findCommonAvailability(attendeeA, attendeeB);

      expect(commonSlots).toHaveLength(2);
      expect(commonSlots[0]).toEqual({ start: '10:00', end: '11:00' });
    });

    it('should return empty array when no overlap exists', () => {
      const attendeeA = createAttendee({
        availability: [{ start: '09:00', end: '12:00' }]
      });
      const attendeeB = createAttendee({
        availability: [{ start: '14:00', end: '17:00' }]
      });

      const commonSlots = algorithm.findCommonAvailability(attendeeA, attendeeB);

      expect(commonSlots).toHaveLength(0);
    });
  });

  describe('match generation', () => {
    it('should generate top N matches sorted by score', async () => {
      const targetAttendee = createAttendee({ id: 'target' });
      const candidates = generateCandidates(100);

      const matches = await algorithm.generateMatches(targetAttendee, candidates, 10);

      expect(matches).toHaveLength(10);
      expect(matches[0].score).toBeGreaterThanOrEqual(matches[9].score);
    });

    it('should exclude already-connected attendees', async () => {
      const targetAttendee = createAttendee({
        id: 'target',
        connections: ['connected-1', 'connected-2']
      });
      const candidates = [
        createAttendee({ id: 'connected-1' }),
        createAttendee({ id: 'new-1' }),
        createAttendee({ id: 'connected-2' }),
        createAttendee({ id: 'new-2' })
      ];

      const matches = await algorithm.generateMatches(targetAttendee, candidates, 10);

      const matchIds = matches.map(m => m.attendeeId);
      expect(matchIds).not.toContain('connected-1');
      expect(matchIds).not.toContain('connected-2');
      expect(matchIds).toContain('new-1');
      expect(matchIds).toContain('new-2');
    });
  });
});
```

#### 2.1.3 Schedule Optimization

```typescript
// src/domain/scheduling/__tests__/schedule-optimizer.spec.ts
describe('ScheduleOptimizer', () => {
  let optimizer: ScheduleOptimizer;

  beforeEach(() => {
    optimizer = new ScheduleOptimizer({
      conflictWeight: 1.0,
      travelTimeWeight: 0.5,
      preferenceWeight: 0.3
    });
  });

  describe('conflict detection', () => {
    it('should detect overlapping sessions', () => {
      const sessions = [
        createSession({ id: 'A', start: '09:00', end: '10:00', room: 'Room1' }),
        createSession({ id: 'B', start: '09:30', end: '10:30', room: 'Room2' }),
        createSession({ id: 'C', start: '11:00', end: '12:00', room: 'Room1' })
      ];

      const schedule = createSchedule(['A', 'B', 'C']);
      const conflicts = optimizer.detectConflicts(schedule, sessions);

      expect(conflicts).toHaveLength(1);
      expect(conflicts[0]).toEqual({
        sessionA: 'A',
        sessionB: 'B',
        type: 'time_overlap',
        overlapMinutes: 30
      });
    });

    it('should detect insufficient travel time between venues', () => {
      const sessions = [
        createSession({ id: 'A', start: '09:00', end: '10:00', venue: 'Hall-A' }),
        createSession({ id: 'B', start: '10:05', end: '11:00', venue: 'Hall-D' })
      ];
      const travelTimes = { 'Hall-A->Hall-D': 15 }; // 15 min travel time

      const schedule = createSchedule(['A', 'B']);
      const conflicts = optimizer.detectConflicts(schedule, sessions, travelTimes);

      expect(conflicts).toHaveLength(1);
      expect(conflicts[0].type).toBe('insufficient_travel_time');
    });
  });

  describe('optimization', () => {
    it('should minimize conflicts in generated schedule', async () => {
      const sessions = generateSessions(20);
      const preferences = generatePreferences(sessions, 0.7); // 70% preference score

      const optimizedSchedule = await optimizer.optimize(sessions, preferences);

      expect(optimizedSchedule.conflictCount).toBeLessThanOrEqual(2);
      expect(optimizedSchedule.preferenceScore).toBeGreaterThanOrEqual(0.6);
    });

    it('should respect mandatory sessions', async () => {
      const sessions = [
        createSession({ id: 'keynote', mandatory: true }),
        ...generateSessions(10)
      ];

      const optimizedSchedule = await optimizer.optimize(sessions, {});

      expect(optimizedSchedule.sessions).toContain('keynote');
    });
  });
});
```

#### 2.1.4 Event Validation

```typescript
// src/domain/event/__tests__/event-validator.spec.ts
describe('EventValidator', () => {
  let validator: EventValidator;

  beforeEach(() => {
    validator = new EventValidator();
  });

  describe('required fields', () => {
    it('should reject event without title', () => {
      const event = { description: 'Test', startDate: new Date() };

      const result = validator.validate(event);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'title',
        message: 'Title is required',
        code: 'REQUIRED_FIELD'
      });
    });

    it('should reject event without start date', () => {
      const event = { title: 'Test Event', description: 'Test' };

      const result = validator.validate(event);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'startDate',
        message: 'Start date is required',
        code: 'REQUIRED_FIELD'
      });
    });
  });

  describe('date validation', () => {
    it('should reject event with end date before start date', () => {
      const event = {
        title: 'Test Event',
        startDate: new Date('2026-06-15'),
        endDate: new Date('2026-06-14')
      };

      const result = validator.validate(event);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'endDate',
        message: 'End date must be after start date',
        code: 'INVALID_DATE_RANGE'
      });
    });

    it('should reject event with start date in the past', () => {
      const event = {
        title: 'Test Event',
        startDate: new Date('2020-01-01')
      };

      const result = validator.validate(event);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'startDate',
        message: 'Start date cannot be in the past',
        code: 'DATE_IN_PAST'
      });
    });
  });

  describe('capacity validation', () => {
    it('should reject negative capacity', () => {
      const event = { title: 'Test', startDate: new Date(), maxCapacity: -10 };

      const result = validator.validate(event);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'maxCapacity',
        message: 'Capacity must be a positive number',
        code: 'INVALID_CAPACITY'
      });
    });

    it('should accept zero capacity for unlimited events', () => {
      const event = { title: 'Test', startDate: new Date(), maxCapacity: 0 };

      const result = validator.validate(event);

      expect(result.isValid).toBe(true);
    });
  });

  describe('grassroots validation', () => {
    it('should validate sub-event has valid parent reference', () => {
      const subEvent = {
        title: 'Lightning Talks',
        startDate: new Date(),
        parentEventId: null,
        isGrassroots: true
      };

      const result = validator.validate(subEvent);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'parentEventId',
        message: 'Grassroots events must have a parent event',
        code: 'MISSING_PARENT'
      });
    });
  });
});
```

### 2.2 Integration Tests

**Scope:** Interaction between multiple components or with external systems.

**Characteristics:**
- Execute in < 5s
- May use real databases (test containers)
- May use real message queues
- External HTTP APIs mocked

#### 2.2.1 API Endpoints

```typescript
// src/api/__tests__/events.api.spec.ts
describe('Events API Integration', () => {
  let app: INestApplication;
  let eventRepository: EventRepository;
  let authService: AuthService;
  let kafkaProducer: jest.Mocked<KafkaProducer>;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule]
    })
    .overrideProvider(KafkaProducer)
    .useValue(createMockKafkaProducer())
    .compile();

    app = module.createNestApplication();
    await app.init();

    eventRepository = module.get(EventRepository);
    authService = module.get(AuthService);
    kafkaProducer = module.get(KafkaProducer);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await eventRepository.clear();
    kafkaProducer.send.mockClear();
  });

  describe('POST /events', () => {
    it('should create event and return 201', async () => {
      const token = await authService.generateToken({ userId: 'organizer-1', role: 'organizer' });
      const eventData = {
        title: 'Tech Conference 2026',
        description: 'Annual technology conference',
        startDate: '2026-06-15T09:00:00Z',
        endDate: '2026-06-17T18:00:00Z',
        maxCapacity: 500,
        venue: { name: 'Convention Center', city: 'San Francisco' }
      };

      const response = await request(app.getHttpServer())
        .post('/events')
        .set('Authorization', `Bearer ${token}`)
        .send(eventData)
        .expect(201);

      expect(response.body).toMatchObject({
        id: expect.any(String),
        title: 'Tech Conference 2026',
        status: 'draft'
      });

      // Verify database persistence
      const savedEvent = await eventRepository.findById(response.body.id);
      expect(savedEvent).not.toBeNull();
      expect(savedEvent.title).toBe('Tech Conference 2026');

      // Verify Kafka event published
      expect(kafkaProducer.send).toHaveBeenCalledWith({
        topic: 'events',
        messages: [{
          key: response.body.id,
          value: expect.stringContaining('event.created')
        }]
      });
    });

    it('should return 401 for unauthenticated request', async () => {
      const eventData = { title: 'Test Event' };

      await request(app.getHttpServer())
        .post('/events')
        .send(eventData)
        .expect(401);
    });

    it('should return 400 for invalid event data', async () => {
      const token = await authService.generateToken({ userId: 'organizer-1', role: 'organizer' });
      const invalidData = { description: 'Missing title' };

      const response = await request(app.getHttpServer())
        .post('/events')
        .set('Authorization', `Bearer ${token}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.errors).toContainEqual(
        expect.objectContaining({ field: 'title' })
      );
    });
  });

  describe('GET /events/:id', () => {
    it('should return event by ID', async () => {
      const event = await eventRepository.save(createEventFixture());

      const response = await request(app.getHttpServer())
        .get(`/events/${event.id}`)
        .expect(200);

      expect(response.body.id).toBe(event.id);
      expect(response.body.title).toBe(event.title);
    });

    it('should return 404 for non-existent event', async () => {
      await request(app.getHttpServer())
        .get('/events/non-existent-id')
        .expect(404);
    });
  });
});
```

#### 2.2.2 Database Operations

```typescript
// src/infrastructure/__tests__/event.repository.spec.ts
describe('EventRepository Integration', () => {
  let repository: PostgresEventRepository;
  let dataSource: DataSource;

  beforeAll(async () => {
    // Use testcontainers for isolated PostgreSQL
    const container = await new PostgreSqlContainer()
      .withDatabase('konferenco_test')
      .start();

    dataSource = new DataSource({
      type: 'postgres',
      host: container.getHost(),
      port: container.getMappedPort(5432),
      database: 'konferenco_test',
      username: container.getUsername(),
      password: container.getPassword(),
      entities: [EventEntity],
      synchronize: true
    });

    await dataSource.initialize();
    repository = new PostgresEventRepository(dataSource);
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  beforeEach(async () => {
    await dataSource.query('TRUNCATE TABLE events CASCADE');
  });

  describe('save', () => {
    it('should persist event and return with generated ID', async () => {
      const event = createEvent({ title: 'Database Test Event' });

      const saved = await repository.save(event);

      expect(saved.id).toBeDefined();
      expect(saved.createdAt).toBeInstanceOf(Date);
    });

    it('should handle concurrent saves without conflicts', async () => {
      const events = Array.from({ length: 10 }, (_, i) =>
        createEvent({ title: `Event ${i}` })
      );

      const results = await Promise.all(
        events.map(e => repository.save(e))
      );

      expect(results).toHaveLength(10);
      const uniqueIds = new Set(results.map(r => r.id));
      expect(uniqueIds.size).toBe(10);
    });
  });

  describe('findByOrganizer', () => {
    it('should return only events for specified organizer', async () => {
      await repository.save(createEvent({ organizerId: 'org-1', title: 'Event 1' }));
      await repository.save(createEvent({ organizerId: 'org-1', title: 'Event 2' }));
      await repository.save(createEvent({ organizerId: 'org-2', title: 'Event 3' }));

      const events = await repository.findByOrganizer('org-1');

      expect(events).toHaveLength(2);
      expect(events.every(e => e.organizerId === 'org-1')).toBe(true);
    });
  });

  describe('search', () => {
    it('should support full-text search on title and description', async () => {
      await repository.save(createEvent({ title: 'AI Conference', description: 'Machine learning talks' }));
      await repository.save(createEvent({ title: 'Web Summit', description: 'JavaScript workshops' }));
      await repository.save(createEvent({ title: 'Data Science Meetup', description: 'AI and analytics' }));

      const results = await repository.search('AI');

      expect(results).toHaveLength(2);
      expect(results.map(r => r.title)).toContain('AI Conference');
      expect(results.map(r => r.title)).toContain('Data Science Meetup');
    });
  });
});
```

#### 2.2.3 External Service Integration

```typescript
// src/integration/__tests__/payment.integration.spec.ts
describe('Payment Service Integration', () => {
  let paymentService: PaymentService;
  let stripeServer: SetupServer;

  beforeAll(() => {
    // Mock Stripe API
    stripeServer = setupServer(
      rest.post('https://api.stripe.com/v1/payment_intents', (req, res, ctx) => {
        return res(ctx.json({
          id: 'pi_test_123',
          status: 'succeeded',
          amount: 9900,
          currency: 'usd'
        }));
      }),
      rest.post('https://api.stripe.com/v1/refunds', (req, res, ctx) => {
        return res(ctx.json({
          id: 'rf_test_456',
          status: 'succeeded'
        }));
      })
    );
    stripeServer.listen();

    paymentService = new PaymentService({
      apiKey: 'sk_test_key',
      webhookSecret: 'whsec_test'
    });
  });

  afterAll(() => {
    stripeServer.close();
  });

  describe('processPayment', () => {
    it('should create payment intent and return confirmation', async () => {
      const result = await paymentService.processPayment({
        amount: 9900,
        currency: 'usd',
        customerId: 'cus_123',
        description: 'Tech Conference 2026 - General Admission'
      });

      expect(result).toMatchObject({
        paymentId: 'pi_test_123',
        status: 'succeeded',
        amount: 9900
      });
    });

    it('should handle payment failure gracefully', async () => {
      stripeServer.use(
        rest.post('https://api.stripe.com/v1/payment_intents', (req, res, ctx) => {
          return res(ctx.status(402), ctx.json({
            error: { type: 'card_error', message: 'Card declined' }
          }));
        })
      );

      await expect(paymentService.processPayment({
        amount: 9900,
        currency: 'usd',
        customerId: 'cus_123'
      })).rejects.toThrow(PaymentDeclinedError);
    });
  });
});
```

#### 2.2.4 AI/LLM Response Integration

```typescript
// src/integration/__tests__/ai-recommendations.spec.ts
describe('AI Recommendations Integration', () => {
  let recommendationService: AIRecommendationService;
  let llmServer: SetupServer;

  beforeAll(() => {
    llmServer = setupServer(
      rest.post('https://api.anthropic.com/v1/messages', async (req, res, ctx) => {
        const body = await req.json();

        // Simulate different responses based on prompt
        if (body.messages[0].content.includes('networking')) {
          return res(ctx.json({
            content: [{
              type: 'text',
              text: JSON.stringify({
                recommendations: [
                  { attendeeId: 'user-1', reason: 'Shared interest in AI' },
                  { attendeeId: 'user-2', reason: 'Complementary skills' }
                ]
              })
            }]
          }));
        }

        return res(ctx.json({
          content: [{ type: 'text', text: '{}' }]
        }));
      })
    );
    llmServer.listen();

    recommendationService = new AIRecommendationService({
      apiKey: 'sk-ant-test',
      model: 'claude-3-sonnet-20240229'
    });
  });

  afterAll(() => {
    llmServer.close();
  });

  describe('getNetworkingRecommendations', () => {
    it('should return personalized networking suggestions', async () => {
      const attendee = createAttendee({
        interests: ['AI', 'Machine Learning'],
        goals: ['Find co-founders', 'Learn about LLMs']
      });

      const recommendations = await recommendationService.getNetworkingRecommendations(attendee);

      expect(recommendations).toHaveLength(2);
      expect(recommendations[0]).toMatchObject({
        attendeeId: expect.any(String),
        reason: expect.any(String)
      });
    });

    it('should handle rate limiting with exponential backoff', async () => {
      let attempts = 0;
      llmServer.use(
        rest.post('https://api.anthropic.com/v1/messages', (req, res, ctx) => {
          attempts++;
          if (attempts < 3) {
            return res(ctx.status(429), ctx.json({ error: 'Rate limited' }));
          }
          return res(ctx.json({
            content: [{ type: 'text', text: '{"recommendations":[]}' }]
          }));
        })
      );

      const result = await recommendationService.getNetworkingRecommendations(createAttendee());

      expect(attempts).toBe(3);
      expect(result).toBeDefined();
    });

    it('should validate LLM response schema', async () => {
      llmServer.use(
        rest.post('https://api.anthropic.com/v1/messages', (req, res, ctx) => {
          return res(ctx.json({
            content: [{ type: 'text', text: 'Invalid JSON response' }]
          }));
        })
      );

      await expect(
        recommendationService.getNetworkingRecommendations(createAttendee())
      ).rejects.toThrow(LLMResponseValidationError);
    });
  });
});
```

### 2.3 End-to-End Tests

**Scope:** Complete user journeys through the entire system.

**Characteristics:**
- Execute in < 60s per test
- Use real browser (Playwright)
- Full stack deployment (test containers)
- Simulated external services

#### 2.3.1 Attendee Registration Journey

```typescript
// e2e/attendee-registration.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Attendee Registration Journey', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('Given a visitor discovers an event, When they complete registration, Then they should receive confirmation', async ({ page }) => {
    // Step 1: Discover event
    await page.fill('[data-testid="search-input"]', 'Tech Conference 2026');
    await page.click('[data-testid="search-button"]');

    await expect(page.locator('[data-testid="event-card"]').first()).toBeVisible();
    await page.click('[data-testid="event-card"]');

    // Verify event details page
    await expect(page.locator('h1')).toContainText('Tech Conference 2026');
    await expect(page.locator('[data-testid="ticket-price"]')).toContainText('$99');

    // Step 2: Select ticket
    await page.click('[data-testid="select-ticket-general"]');
    await page.fill('[data-testid="quantity-input"]', '2');
    await page.click('[data-testid="proceed-to-checkout"]');

    // Step 3: Create account / login
    await page.fill('[data-testid="email-input"]', 'newuser@example.com');
    await page.fill('[data-testid="password-input"]', 'SecurePass123!');
    await page.fill('[data-testid="name-input"]', 'Jane Doe');
    await page.click('[data-testid="create-account"]');

    // Step 4: Payment
    await expect(page.locator('[data-testid="payment-form"]')).toBeVisible();

    // Fill Stripe elements (using test card)
    const stripeFrame = page.frameLocator('iframe[name*="stripe"]');
    await stripeFrame.locator('[placeholder="Card number"]').fill('4242424242424242');
    await stripeFrame.locator('[placeholder="MM / YY"]').fill('12/30');
    await stripeFrame.locator('[placeholder="CVC"]').fill('123');
    await stripeFrame.locator('[placeholder="ZIP"]').fill('94102');

    await page.click('[data-testid="complete-purchase"]');

    // Step 5: Verify confirmation
    await expect(page.locator('[data-testid="confirmation-page"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="confirmation-message"]')).toContainText('Registration Complete');
    await expect(page.locator('[data-testid="ticket-count"]')).toContainText('2 tickets');
    await expect(page.locator('[data-testid="confirmation-email"]')).toContainText('newuser@example.com');

    // Verify add-to-calendar button is present
    await expect(page.locator('[data-testid="add-to-calendar"]')).toBeVisible();
  });

  test('Given a returning user, When they register for an event, Then their info should be pre-filled', async ({ page }) => {
    // Pre-condition: Login as existing user
    await page.click('[data-testid="login-link"]');
    await page.fill('[data-testid="email-input"]', 'existing@example.com');
    await page.fill('[data-testid="password-input"]', 'ExistingPass123!');
    await page.click('[data-testid="login-button"]');

    // Navigate to event
    await page.goto('/events/tech-conference-2026');
    await page.click('[data-testid="select-ticket-general"]');
    await page.click('[data-testid="proceed-to-checkout"]');

    // Verify pre-filled information
    await expect(page.locator('[data-testid="attendee-name"]')).toHaveValue('Existing User');
    await expect(page.locator('[data-testid="attendee-email"]')).toHaveValue('existing@example.com');
  });
});
```

#### 2.3.2 Grassroots Event Creation Journey

```typescript
// e2e/grassroots-creation.spec.ts
test.describe('Grassroots Event Creation Journey', () => {
  test.beforeEach(async ({ page }) => {
    // Login as registered attendee
    await loginAsAttendee(page, 'attendee@example.com');
  });

  test('Given a registered attendee, When they propose a grassroots session, Then it should await approval', async ({ page }) => {
    // Navigate to parent event
    await page.goto('/events/tech-conference-2026');

    // Verify grassroots is enabled
    await expect(page.locator('[data-testid="grassroots-badge"]')).toBeVisible();

    // Click propose session
    await page.click('[data-testid="propose-session"]');

    // Fill proposal form
    await page.fill('[data-testid="session-title"]', 'Lightning Talks: AI Tools');
    await page.fill('[data-testid="session-description"]', 'Quick demos of the latest AI development tools');
    await page.selectOption('[data-testid="session-format"]', 'lightning-talks');
    await page.fill('[data-testid="session-duration"]', '45');

    // Select preferred time slots
    await page.click('[data-testid="timeslot-day2-afternoon"]');
    await page.click('[data-testid="timeslot-day3-morning"]');

    // Add topics/tags
    await page.fill('[data-testid="topics-input"]', 'AI, Developer Tools, Productivity');

    // Submit proposal
    await page.click('[data-testid="submit-proposal"]');

    // Verify pending status
    await expect(page.locator('[data-testid="proposal-status"]')).toContainText('Pending Approval');
    await expect(page.locator('[data-testid="proposal-id"]')).toBeVisible();

    // Verify appears in "My Proposals" list
    await page.click('[data-testid="my-proposals-link"]');
    await expect(page.locator('[data-testid="proposal-item"]')).toContainText('Lightning Talks: AI Tools');
  });

  test('Given an approved grassroots session, When attendees view schedule, Then they can register', async ({ page }) => {
    // Setup: Create approved session (via API in beforeEach)
    const sessionId = await createApprovedGrassrootsSession();

    // View schedule
    await page.goto('/events/tech-conference-2026/schedule');

    // Find grassroots session
    await page.fill('[data-testid="schedule-search"]', 'Lightning Talks');
    await page.click(`[data-testid="session-${sessionId}"]`);

    // Verify grassroots indicator
    await expect(page.locator('[data-testid="community-badge"]')).toBeVisible();
    await expect(page.locator('[data-testid="session-host"]')).toContainText('Community');

    // Register for session
    await page.click('[data-testid="register-for-session"]');
    await expect(page.locator('[data-testid="registration-confirmed"]')).toBeVisible();
  });
});
```

#### 2.3.3 Networking Flow Journey

```typescript
// e2e/networking-flow.spec.ts
test.describe('Networking Flow Journey', () => {
  test('Given an attendee enables networking, When matches are suggested, Then they can connect and schedule meetings', async ({ page }) => {
    await loginAsAttendee(page, 'networker@example.com');
    await page.goto('/events/tech-conference-2026/networking');

    // Step 1: Complete networking profile
    await page.click('[data-testid="setup-networking"]');

    await page.fill('[data-testid="headline"]', 'AI Startup Founder');
    await page.fill('[data-testid="company"]', 'TechCorp');

    // Select interests
    await page.click('[data-testid="interest-ai"]');
    await page.click('[data-testid="interest-startups"]');
    await page.click('[data-testid="interest-investment"]');

    // Set networking goals
    await page.check('[data-testid="goal-cofounders"]');
    await page.check('[data-testid="goal-investors"]');

    // Set availability
    await page.click('[data-testid="availability-day1-afternoon"]');
    await page.click('[data-testid="availability-day2-morning"]');

    await page.click('[data-testid="save-profile"]');

    // Step 2: View AI-suggested matches
    await expect(page.locator('[data-testid="matches-section"]')).toBeVisible({ timeout: 5000 });

    const matchCards = page.locator('[data-testid="match-card"]');
    await expect(matchCards).toHaveCount({ minimum: 3 });

    // Verify match quality indicators
    const firstMatch = matchCards.first();
    await expect(firstMatch.locator('[data-testid="match-score"]')).toBeVisible();
    await expect(firstMatch.locator('[data-testid="common-interests"]')).toBeVisible();

    // Step 3: Send connection request
    await firstMatch.click();
    await page.click('[data-testid="request-connection"]');
    await page.fill('[data-testid="connection-message"]', 'Would love to discuss AI startups!');
    await page.click('[data-testid="send-request"]');

    await expect(page.locator('[data-testid="request-sent"]')).toBeVisible();

    // Step 4: Simulate acceptance and schedule meeting
    await simulateConnectionAcceptance(page);

    await page.click('[data-testid="connections-tab"]');
    await page.click('[data-testid="connection-item"]').first();
    await page.click('[data-testid="schedule-meeting"]');

    // Select available slot
    await page.click('[data-testid="slot-day1-1400"]');
    await page.fill('[data-testid="meeting-topic"]', 'Discuss AI collaboration');
    await page.click('[data-testid="confirm-meeting"]');

    await expect(page.locator('[data-testid="meeting-confirmed"]')).toBeVisible();
    await expect(page.locator('[data-testid="meeting-location"]')).toContainText('Networking Lounge');
  });
});
```

#### 2.3.4 Schedule Building Journey

```typescript
// e2e/schedule-building.spec.ts
test.describe('Schedule Building Journey', () => {
  test('Given an attendee views event schedule, When they build personal agenda, Then conflicts are highlighted', async ({ page }) => {
    await loginAsAttendee(page, 'scheduler@example.com');
    await page.goto('/events/tech-conference-2026/schedule');

    // Step 1: Browse schedule by day
    await expect(page.locator('[data-testid="day-tabs"]')).toBeVisible();
    await page.click('[data-testid="day-1-tab"]');

    // Step 2: Add sessions to personal schedule
    await page.click('[data-testid="session-keynote-ai"]');
    await expect(page.locator('[data-testid="session-modal"]')).toBeVisible();
    await page.click('[data-testid="add-to-schedule"]');
    await expect(page.locator('[data-testid="added-badge"]')).toBeVisible();
    await page.click('[data-testid="close-modal"]');

    // Add another session
    await page.click('[data-testid="session-workshop-ml"]');
    await page.click('[data-testid="add-to-schedule"]');
    await page.click('[data-testid="close-modal"]');

    // Step 3: Try to add conflicting session
    await page.click('[data-testid="session-panel-data"]'); // Overlaps with keynote
    await page.click('[data-testid="add-to-schedule"]');

    // Verify conflict warning
    await expect(page.locator('[data-testid="conflict-warning"]')).toBeVisible();
    await expect(page.locator('[data-testid="conflict-with"]')).toContainText('AI Keynote');

    // Choose to replace
    await page.click('[data-testid="replace-session"]');

    // Step 4: View personal agenda
    await page.click('[data-testid="my-schedule-tab"]');

    await expect(page.locator('[data-testid="scheduled-session"]')).toHaveCount(2);
    await expect(page.locator('[data-testid="scheduled-session"]').first()).toContainText('Data Panel');

    // Step 5: Export to calendar
    await page.click('[data-testid="export-calendar"]');
    await page.click('[data-testid="export-ics"]');

    // Verify download initiated
    const download = await page.waitForEvent('download');
    expect(download.suggestedFilename()).toContain('.ics');
  });
});
```

#### 2.3.5 Marketplace Transaction Journey

```typescript
// e2e/marketplace-transactions.spec.ts
test.describe('Marketplace Transaction Journey', () => {
  test('Given a vendor lists products, When an attendee purchases, Then both receive confirmation', async ({ browser }) => {
    // Create two browser contexts for vendor and attendee
    const vendorContext = await browser.newContext();
    const attendeeContext = await browser.newContext();

    const vendorPage = await vendorContext.newPage();
    const attendeePage = await attendeeContext.newPage();

    // VENDOR: Login and list product
    await loginAsVendor(vendorPage, 'vendor@example.com');
    await vendorPage.goto('/events/tech-conference-2026/marketplace/manage');

    await vendorPage.click('[data-testid="add-product"]');
    await vendorPage.fill('[data-testid="product-name"]', 'Conference T-Shirt');
    await vendorPage.fill('[data-testid="product-price"]', '25.00');
    await vendorPage.fill('[data-testid="product-quantity"]', '100');
    await vendorPage.setInputFiles('[data-testid="product-image"]', 'fixtures/tshirt.jpg');
    await vendorPage.click('[data-testid="publish-product"]');

    await expect(vendorPage.locator('[data-testid="product-live"]')).toBeVisible();

    // ATTENDEE: Browse and purchase
    await loginAsAttendee(attendeePage, 'buyer@example.com');
    await attendeePage.goto('/events/tech-conference-2026/marketplace');

    await attendeePage.fill('[data-testid="search-products"]', 'T-Shirt');
    await attendeePage.click('[data-testid="product-card"]').first();

    await expect(attendeePage.locator('[data-testid="product-title"]')).toContainText('Conference T-Shirt');
    await expect(attendeePage.locator('[data-testid="product-price"]')).toContainText('$25.00');

    // Select size and add to cart
    await attendeePage.selectOption('[data-testid="size-select"]', 'L');
    await attendeePage.fill('[data-testid="quantity"]', '2');
    await attendeePage.click('[data-testid="add-to-cart"]');

    // Checkout
    await attendeePage.click('[data-testid="view-cart"]');
    await expect(attendeePage.locator('[data-testid="cart-total"]')).toContainText('$50.00');
    await attendeePage.click('[data-testid="checkout"]');

    // Payment
    const stripeFrame = attendeePage.frameLocator('iframe[name*="stripe"]');
    await stripeFrame.locator('[placeholder="Card number"]').fill('4242424242424242');
    await stripeFrame.locator('[placeholder="MM / YY"]').fill('12/30');
    await stripeFrame.locator('[placeholder="CVC"]').fill('123');

    await attendeePage.click('[data-testid="complete-purchase"]');

    // Verify attendee confirmation
    await expect(attendeePage.locator('[data-testid="order-confirmation"]')).toBeVisible({ timeout: 10000 });
    await expect(attendeePage.locator('[data-testid="order-id"]')).toBeVisible();
    await expect(attendeePage.locator('[data-testid="pickup-instructions"]')).toContainText('Booth');

    // VENDOR: Verify order notification
    await vendorPage.reload();
    await expect(vendorPage.locator('[data-testid="new-orders-badge"]')).toContainText('1');
    await vendorPage.click('[data-testid="orders-tab"]');
    await expect(vendorPage.locator('[data-testid="order-item"]')).toContainText('Conference T-Shirt');
    await expect(vendorPage.locator('[data-testid="order-item"]')).toContainText('buyer@example.com');

    // Cleanup
    await vendorContext.close();
    await attendeeContext.close();
  });
});
```

### 2.4 Performance Tests

**Scope:** System behavior under load and stress conditions.

**Characteristics:**
- Dedicated performance environment
- Realistic data volumes
- Continuous monitoring
- Automated regression detection

#### 2.4.1 Load Testing (100K Concurrent Users)

```typescript
// performance/load-test.k6.ts
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const errorRate = new Rate('errors');
const eventLatency = new Trend('event_latency');
const registrationLatency = new Trend('registration_latency');

export const options = {
  scenarios: {
    // Simulate registration spike
    registration_spike: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 10000 },   // Ramp up to 10K
        { duration: '5m', target: 50000 },   // Ramp up to 50K
        { duration: '10m', target: 100000 }, // Sustain 100K
        { duration: '5m', target: 50000 },   // Ramp down
        { duration: '2m', target: 0 }        // Cool down
      ],
      gracefulRampDown: '30s'
    },

    // Concurrent browsing
    event_browsing: {
      executor: 'constant-vus',
      vus: 20000,
      duration: '20m',
      startTime: '2m'
    }
  },
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'], // 95th < 500ms, 99th < 1s
    errors: ['rate<0.01'],                           // Error rate < 1%
    event_latency: ['p(95)<200'],                    // Event queries < 200ms
    registration_latency: ['p(95)<1000']             // Registration < 1s
  }
};

const BASE_URL = __ENV.BASE_URL || 'https://staging.konferenco.io';

export function setup() {
  // Pre-create test event
  const res = http.post(`${BASE_URL}/api/internal/setup-load-test`, {
    eventCapacity: 200000,
    ticketTypes: ['general', 'vip', 'student']
  });
  return { eventId: JSON.parse(res.body).eventId };
}

export default function(data) {
  const scenario = __ENV.K6_SCENARIO_NAME;

  if (scenario === 'registration_spike') {
    testRegistration(data.eventId);
  } else {
    testBrowsing(data.eventId);
  }
}

function testRegistration(eventId: string) {
  const startTime = Date.now();

  // Step 1: Get available tickets
  const ticketsRes = http.get(`${BASE_URL}/api/events/${eventId}/tickets`);
  check(ticketsRes, { 'tickets available': (r) => r.status === 200 });

  // Step 2: Reserve ticket
  const reserveRes = http.post(`${BASE_URL}/api/tickets/reserve`, JSON.stringify({
    eventId,
    ticketType: 'general',
    quantity: 1
  }), { headers: { 'Content-Type': 'application/json' } });

  check(reserveRes, {
    'reservation successful': (r) => r.status === 201,
    'got reservation id': (r) => JSON.parse(r.body).reservationId !== undefined
  });

  if (reserveRes.status !== 201) {
    errorRate.add(1);
    return;
  }

  const reservationId = JSON.parse(reserveRes.body).reservationId;

  // Step 3: Complete payment (mock)
  const paymentRes = http.post(`${BASE_URL}/api/payments/process`, JSON.stringify({
    reservationId,
    paymentToken: 'tok_visa_test'
  }), { headers: { 'Content-Type': 'application/json' } });

  check(paymentRes, { 'payment successful': (r) => r.status === 200 });

  registrationLatency.add(Date.now() - startTime);
  errorRate.add(paymentRes.status !== 200 ? 1 : 0);

  sleep(Math.random() * 2); // Random delay between operations
}

function testBrowsing(eventId: string) {
  const startTime = Date.now();

  // Browse event details
  const eventRes = http.get(`${BASE_URL}/api/events/${eventId}`);
  check(eventRes, { 'event loaded': (r) => r.status === 200 });
  eventLatency.add(Date.now() - startTime);

  // Browse schedule
  http.get(`${BASE_URL}/api/events/${eventId}/schedule`);

  // Search sessions
  http.get(`${BASE_URL}/api/events/${eventId}/sessions?q=keynote`);

  sleep(Math.random() * 5); // Simulate reading time
}

export function teardown(data) {
  http.post(`${BASE_URL}/api/internal/cleanup-load-test`, {
    eventId: data.eventId
  });
}
```

#### 2.4.2 Real-Time Message Throughput

```typescript
// performance/websocket-load.k6.ts
import ws from 'k6/ws';
import { check, sleep } from 'k6';
import { Counter, Trend } from 'k6/metrics';

const messagesReceived = new Counter('messages_received');
const messageLatency = new Trend('message_latency');
const connectionTime = new Trend('connection_time');

export const options = {
  scenarios: {
    websocket_load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 5000 },
        { duration: '5m', target: 10000 },  // 10K concurrent connections
        { duration: '2m', target: 0 }
      ]
    }
  },
  thresholds: {
    connection_time: ['p(95)<1000'],    // Connect < 1s
    message_latency: ['p(95)<100'],     // Message delivery < 100ms
    messages_received: ['count>100000'] // Minimum throughput
  }
};

const WS_URL = __ENV.WS_URL || 'wss://staging.konferenco.io/ws';

export default function() {
  const roomId = `room-${Math.floor(Math.random() * 100)}`; // 100 chat rooms
  const userId = `user-${__VU}-${__ITER}`;

  const connectStart = Date.now();

  const res = ws.connect(`${WS_URL}?room=${roomId}&user=${userId}`, {}, function(socket) {
    connectionTime.add(Date.now() - connectStart);

    socket.on('open', function() {
      // Subscribe to room
      socket.send(JSON.stringify({
        type: 'subscribe',
        room: roomId
      }));

      // Send periodic messages
      const sendInterval = setInterval(() => {
        const sendTime = Date.now();
        socket.send(JSON.stringify({
          type: 'message',
          room: roomId,
          content: `Test message from ${userId}`,
          timestamp: sendTime
        }));
      }, 5000); // Send message every 5 seconds

      socket.setTimeout(function() {
        clearInterval(sendInterval);
        socket.close();
      }, 60000); // Keep connection for 60s
    });

    socket.on('message', function(data) {
      const message = JSON.parse(data);
      messagesReceived.add(1);

      if (message.timestamp) {
        messageLatency.add(Date.now() - message.timestamp);
      }
    });

    socket.on('error', function(e) {
      console.error('WebSocket error:', e);
    });
  });

  check(res, { 'ws connected': (r) => r && r.status === 101 });
}
```

#### 2.4.3 Search Latency

```typescript
// performance/search-latency.spec.ts
describe('Search Performance', () => {
  const iterations = 1000;
  const maxLatencyP95 = 50; // 50ms
  const maxLatencyP99 = 100; // 100ms

  it('should search events within latency SLA', async () => {
    const latencies: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const query = searchQueries[i % searchQueries.length];

      const start = performance.now();
      await searchService.searchEvents(query);
      latencies.push(performance.now() - start);
    }

    latencies.sort((a, b) => a - b);

    const p95 = latencies[Math.floor(iterations * 0.95)];
    const p99 = latencies[Math.floor(iterations * 0.99)];

    expect(p95).toBeLessThan(maxLatencyP95);
    expect(p99).toBeLessThan(maxLatencyP99);
  });

  it('should maintain latency under high cardinality', async () => {
    // Seed with 1M events
    await seedEvents(1_000_000);

    const latencies: number[] = [];

    for (let i = 0; i < 100; i++) {
      const start = performance.now();
      await searchService.searchEvents({
        text: 'conference',
        filters: {
          dateRange: { start: '2026-01-01', end: '2026-12-31' },
          location: { radius: 50, center: { lat: 37.7749, lng: -122.4194 } },
          categories: ['technology', 'business']
        },
        pagination: { limit: 20, offset: i * 20 }
      });
      latencies.push(performance.now() - start);
    }

    const avg = latencies.reduce((a, b) => a + b, 0) / latencies.length;
    expect(avg).toBeLessThan(100);
  });
});
```

#### 2.4.4 AI Response Times

```typescript
// performance/ai-response-times.spec.ts
describe('AI Service Performance', () => {
  describe('Networking Recommendations', () => {
    it('should generate recommendations within 2s', async () => {
      const attendee = createAttendee({
        interests: ['AI', 'Startups'],
        connections: generateIds(100)
      });
      const candidates = generateAttendees(1000);

      const start = performance.now();
      const recommendations = await aiService.getNetworkingRecommendations(
        attendee,
        candidates,
        { maxResults: 10 }
      );
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(2000);
      expect(recommendations).toHaveLength(10);
    });

    it('should cache recommendations for repeated requests', async () => {
      const attendee = createAttendee({ id: 'cache-test' });

      // First request
      const start1 = performance.now();
      await aiService.getNetworkingRecommendations(attendee, [], {});
      const duration1 = performance.now() - start1;

      // Second request (cached)
      const start2 = performance.now();
      await aiService.getNetworkingRecommendations(attendee, [], {});
      const duration2 = performance.now() - start2;

      expect(duration2).toBeLessThan(duration1 * 0.1); // 10x faster
    });
  });

  describe('Schedule Optimization', () => {
    it('should optimize schedule for 50 sessions within 5s', async () => {
      const sessions = generateSessions(50);
      const preferences = generatePreferences(sessions);

      const start = performance.now();
      const optimized = await aiService.optimizeSchedule(sessions, preferences);
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(5000);
      expect(optimized.conflictCount).toBeLessThanOrEqual(2);
    });
  });
});
```

---

## 3. Test Scenarios (Given/When/Then Format)

### 3.1 Event Creation Scenarios

#### 3.1.1 Official Event Creation

```gherkin
Feature: Official Event Creation
  As an event organizer
  I want to create official conference events
  So that I can manage large-scale professional gatherings

  Background:
    Given I am logged in as an organizer with "Professional" tier subscription
    And my organization is verified

  Scenario: Create minimal event with required fields only
    Given I am on the event creation page
    When I fill in the following event details:
      | field      | value                    |
      | title      | Tech Summit 2026         |
      | startDate  | 2026-06-15               |
      | endDate    | 2026-06-17               |
    And I click "Create Event"
    Then the event should be created with status "draft"
    And I should see the event dashboard
    And a "event.created" event should be published to Kafka

  Scenario: Create comprehensive event with all fields
    Given I am on the event creation page
    When I fill in complete event details:
      | field              | value                           |
      | title              | Global AI Conference 2026       |
      | description        | Premier AI event of the year    |
      | startDate          | 2026-09-10                      |
      | endDate            | 2026-09-12                      |
      | timezone           | America/Los_Angeles             |
      | maxCapacity        | 5000                            |
      | venue.name         | Moscone Center                  |
      | venue.city         | San Francisco                   |
      | venue.country      | USA                             |
      | isHybrid           | true                            |
      | grassrootsEnabled  | true                            |
      | categories         | [Technology, AI, Business]      |
    And I upload a cover image "event-banner.jpg"
    And I click "Create Event"
    Then the event should be created successfully
    And the event should have all specified attributes
    And the cover image should be stored in S3
    And the event should be indexed in Elasticsearch

  Scenario: Reject event creation with invalid dates
    Given I am on the event creation page
    When I fill in the following event details:
      | field      | value                    |
      | title      | Invalid Date Event       |
      | startDate  | 2026-06-20               |
      | endDate    | 2026-06-15               |
    And I click "Create Event"
    Then I should see validation error "End date must be after start date"
    And no event should be created

  Scenario: Enforce capacity limits based on subscription tier
    Given my organization has "Free" tier subscription
    And I am on the event creation page
    When I set maxCapacity to 500
    And I click "Create Event"
    Then I should see error "Free tier limited to 100 attendees. Upgrade to increase capacity."
    And no event should be created
```

#### 3.1.2 Grassroots Event Creation

```gherkin
Feature: Grassroots Event Creation
  As a conference attendee
  I want to propose community sessions within a larger event
  So that I can share knowledge and connect with like-minded attendees

  Background:
    Given there is a parent event "Tech Conference 2026" with grassroots enabled
    And I am registered as an attendee for this event

  Scenario: Propose a grassroots lightning talk session
    Given I am on the parent event page
    When I click "Propose Community Session"
    And I fill in the proposal form:
      | field        | value                               |
      | title        | 5 Tools That Changed My Development |
      | format       | Lightning Talk                      |
      | duration     | 15 minutes                          |
      | description  | Quick overview of productivity tools |
      | preferredDay | Day 2                               |
    And I submit the proposal
    Then my proposal should be created with status "pending_approval"
    And the parent event organizer should receive a notification
    And I should see my proposal in "My Proposals" list

  Scenario: Organizer approves grassroots session
    Given I have a pending grassroots proposal "AI Ethics Discussion"
    And I am logged in as the parent event organizer
    When I navigate to pending proposals
    And I review the proposal "AI Ethics Discussion"
    And I assign room "Community Room A" for "Day 2, 14:00-15:00"
    And I click "Approve"
    Then the proposal status should change to "approved"
    And the session should appear on the public schedule
    And the proposer should receive approval notification
    And a "grassroots.approved" event should be published

  Scenario: Grassroots session respects venue capacity
    Given room "Community Room A" has capacity of 30
    And a grassroots session is scheduled in "Community Room A"
    When 30 attendees have registered for the session
    And another attendee tries to register
    Then they should see "Session at capacity - join waitlist?"
    And they should be added to the waitlist if they accept

  Scenario: Reject proposal for non-attendee
    Given I am logged in but not registered for "Tech Conference 2026"
    When I try to access the proposal form for this event
    Then I should see "You must be registered for this event to propose sessions"
    And I should see a link to register for the event
```

### 3.2 Attendee Matching Scenarios

```gherkin
Feature: Intelligent Attendee Matching
  As a conference attendee
  I want to be matched with relevant people
  So that I can make valuable connections

  Background:
    Given I am registered for "Tech Conference 2026"
    And I have completed my networking profile

  Scenario: Match based on shared interests
    Given my profile has interests: ["AI", "Machine Learning", "Startups"]
    And there are other attendees with the following interests:
      | attendee | interests                          |
      | Alice    | AI, Deep Learning, Research        |
      | Bob      | Finance, Trading, Investment       |
      | Carol    | Machine Learning, AI, Python       |
    When the matching algorithm runs
    Then my top matches should include Alice and Carol
    And Bob should have a lower match score
    And match reasons should include "Shared interest: AI"

  Scenario: Match with complementary skills
    Given my profile indicates I'm looking for "Technical Co-founder"
    And I have skills: ["Business Development", "Marketing"]
    And Alice has skills: ["Full Stack Development", "DevOps"]
    And Alice is looking for "Business Co-founder"
    When the matching algorithm runs
    Then Alice should appear in my matches
    And match reason should include "Complementary skills"

  Scenario: Exclude already-connected attendees
    Given I am already connected with Alice
    And Alice and Bob both match my profile equally
    When the matching algorithm runs
    Then Bob should appear in my matches
    And Alice should not appear in matches

  Scenario: Respect availability constraints
    Given I am available: ["Day 1 Afternoon", "Day 2 Morning"]
    And Alice is available: ["Day 1 Morning", "Day 1 Evening"]
    And Bob is available: ["Day 1 Afternoon", "Day 2 Afternoon"]
    When I request networking matches
    Then matches should indicate availability overlap
    And Bob should show "Available: Day 1 Afternoon"
    And Alice should show "No common availability"

  Scenario: Diversity bonus in matching
    Given I work in "Technology" industry
    And there are matches from same and different industries:
      | attendee | industry    | base_score |
      | Alice    | Technology  | 0.85       |
      | Bob      | Healthcare  | 0.80       |
    When matches are calculated with diversity bonus enabled
    Then Bob's adjusted score should be higher than base score
    And final ranking may change to promote cross-industry connections
```

### 3.3 Meeting Scheduling Scenarios

```gherkin
Feature: Meeting Scheduling
  As a conference attendee
  I want to schedule meetings with connections
  So that I can have focused 1:1 conversations

  Background:
    Given I am connected with Alice at "Tech Conference 2026"
    And the event has designated networking spaces

  Scenario: Schedule meeting at available time
    Given both Alice and I have marked "Day 1, 14:00-15:00" as available
    And there are meeting rooms available
    When I request a meeting with Alice for "Day 1, 14:00-14:30"
    Then a meeting invitation should be sent to Alice
    And the meeting should be tentatively blocked on both calendars

  Scenario: Meeting requires mutual confirmation
    Given I have sent a meeting request to Alice
    When Alice accepts the meeting
    Then the meeting status should change to "confirmed"
    And a room should be automatically assigned
    And both parties should receive calendar invites
    And the time slot should be blocked for both attendees

  Scenario: Decline meeting and suggest alternatives
    Given I have received a meeting request from Bob
    And the requested time conflicts with my keynote attendance
    When I decline with message "In keynote - can we do 16:00?"
    Then Bob should receive decline notification with my message
    And system should suggest available alternative times

  Scenario: Auto-schedule meeting in optimal slot
    Given Alice and I want to meet but haven't specified a time
    And our availability overlaps at multiple times:
      | slot              | my_preference | alice_preference |
      | Day 1, 11:00      | low           | medium           |
      | Day 1, 14:00      | high          | high             |
      | Day 2, 10:00      | medium        | low              |
    When I click "Auto-schedule with Alice"
    Then the system should propose "Day 1, 14:00"
    And both parties should be able to confirm or adjust

  Scenario: Meeting room capacity management
    Given networking lounge has capacity for 20 simultaneous meetings
    And 20 meetings are already scheduled for "Day 1, 14:00"
    When I try to schedule a meeting for "Day 1, 14:00"
    Then I should see "Networking lounge at capacity for this time"
    And system should suggest "Day 1, 14:30" or "Day 1, 15:00"
```

### 3.4 Real-Time Chat Scenarios

```gherkin
Feature: Real-Time Event Chat
  As a conference attendee
  I want to participate in real-time chat during sessions
  So that I can engage with speakers and other attendees

  Background:
    Given I am attending session "Future of AI" at "Tech Conference 2026"
    And the session has live chat enabled

  Scenario: Send message to session chat
    Given I am viewing the session livestream
    And the chat panel is visible
    When I type "Great point about model training!" and press Enter
    Then my message should appear in the chat
    And other attendees in the session should see my message within 100ms
    And the message should include my name and profile picture

  Scenario: Receive messages in real-time
    Given I am in the session chat
    When another attendee Alice sends a message
    Then I should see Alice's message appear without refreshing
    And message should show timestamp
    And I should see typing indicator before message arrives

  Scenario: React to chat messages
    Given there is a message "Who else is excited about this?" in chat
    When I click the reaction button and select "thumbs up"
    Then the reaction count should increment
    And other users should see the updated reaction count in real-time

  Scenario: Chat moderation
    Given I send a message containing inappropriate content
    When the message is processed by the moderation system
    Then the message should be flagged and hidden
    And I should receive a warning notification
    And moderators should be alerted

  Scenario: Chat history persistence
    Given the session has ended
    When I revisit the session page
    Then I should see the complete chat history
    And messages should be paginated with infinite scroll
    And I should be able to search through chat history

  Scenario: High-volume chat handling
    Given 5000 attendees are in the session chat
    And messages are being sent at 100 messages/second
    When I am viewing the chat
    Then new messages should continue to flow smoothly
    And I should be able to pause the feed to read
    And message delivery latency should stay under 500ms
```

### 3.5 Marketplace Purchase Scenarios

```gherkin
Feature: Event Marketplace Transactions
  As a conference attendee
  I want to purchase merchandise and services
  So that I can enhance my conference experience

  Background:
    Given "Tech Conference 2026" has an active marketplace
    And vendor "ConferenceSwag" has listed products

  Scenario: Purchase physical merchandise
    Given the product "Conference T-Shirt" is available for $25
    And I am logged in as an attendee
    When I add the product to my cart:
      | size     | L       |
      | quantity | 2       |
    And I proceed to checkout
    And I complete payment with valid card
    Then my order should be confirmed
    And I should receive order confirmation email
    And the order should show pickup location at vendor booth
    And vendor should receive order notification

  Scenario: Purchase digital product
    Given the product "Workshop Recording Bundle" is available for $49
    When I purchase the digital product
    And payment is successful
    Then I should receive immediate access to download links
    And downloads should be available in my account dashboard
    And download links should expire after 7 days

  Scenario: Apply discount code
    Given I have discount code "EARLY20" for 20% off
    And my cart total is $100
    When I apply the discount code
    Then my cart total should update to $80
    And the discount should be itemized in the order summary

  Scenario: Inventory management
    Given "Limited Edition Badge" has 50 units in stock
    And 49 have been sold
    When I add the badge to my cart
    Then I should see "Only 1 left in stock!"
    When another user purchases the last badge before I checkout
    Then I should see "Sorry, this item is no longer available"
    And the item should be removed from my cart

  Scenario: Refund request
    Given I have purchased "Conference T-Shirt" yesterday
    And the order is "pending pickup"
    When I request a refund with reason "Changed my mind"
    Then the refund request should be submitted to vendor
    And vendor should have 48 hours to approve/deny
    And I should receive status updates via email

  Scenario: Vendor fulfillment tracking
    Given I have an order pending pickup
    When I arrive at the vendor booth
    And the vendor scans my QR code
    Then the order status should update to "fulfilled"
    And I should receive confirmation notification
    And the transaction should be marked complete
```

---

## 4. Testing Infrastructure

### 4.1 CI/CD Integration

```yaml
# .github/workflows/test.yml
name: Test Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  NODE_VERSION: '22'
  DATABASE_URL: postgresql://postgres:postgres@localhost:5432/konferenco_test
  REDIS_URL: redis://localhost:6379

jobs:
  unit-tests:
    name: Unit Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run unit tests
        run: pnpm test:unit --coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v4
        with:
          files: ./coverage/lcov.info
          flags: unit
          fail_ci_if_error: true

  integration-tests:
    name: Integration Tests
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_DB: konferenco_test
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

      redis:
        image: redis:7-alpine
        ports:
          - 6379:6379
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

      kafka:
        image: confluentinc/cp-kafka:7.5.0
        ports:
          - 9092:9092
        env:
          KAFKA_BROKER_ID: 1
          KAFKA_LISTENER_SECURITY_PROTOCOL_MAP: PLAINTEXT:PLAINTEXT
          KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://localhost:9092
          KAFKA_AUTO_CREATE_TOPICS_ENABLE: true

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run database migrations
        run: pnpm db:migrate

      - name: Run integration tests
        run: pnpm test:integration --coverage
        env:
          DATABASE_URL: ${{ env.DATABASE_URL }}
          REDIS_URL: ${{ env.REDIS_URL }}
          KAFKA_BROKERS: localhost:9092

      - name: Upload coverage
        uses: codecov/codecov-action@v4
        with:
          files: ./coverage/lcov.info
          flags: integration

  e2e-tests:
    name: E2E Tests
    runs-on: ubuntu-latest
    needs: [unit-tests, integration-tests]
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Install Playwright browsers
        run: pnpm exec playwright install --with-deps chromium

      - name: Start test environment
        run: docker compose -f docker-compose.test.yml up -d

      - name: Wait for services
        run: pnpm wait-on http://localhost:3000/health

      - name: Run E2E tests
        run: pnpm test:e2e

      - name: Upload test artifacts
        uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 7

  performance-tests:
    name: Performance Tests
    runs-on: ubuntu-latest
    needs: [e2e-tests]
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4

      - name: Setup k6
        run: |
          sudo gpg -k
          sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
          echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
          sudo apt-get update
          sudo apt-get install k6

      - name: Run performance tests
        run: k6 run performance/load-test.k6.ts
        env:
          BASE_URL: https://staging.konferenco.io

      - name: Upload results to Grafana Cloud
        run: |
          k6 run --out cloud performance/load-test.k6.ts
        env:
          K6_CLOUD_TOKEN: ${{ secrets.K6_CLOUD_TOKEN }}
```

### 4.2 Test Environments

```yaml
# test-environments.yml
environments:
  local:
    description: "Developer local environment"
    services:
      database:
        type: sqlite
        path: ":memory:"
      cache:
        type: memory
      queue:
        type: memory
      search:
        type: mock
    features:
      - hot-reload
      - debug-logging
      - mock-external-services

  ci:
    description: "Continuous Integration environment"
    services:
      database:
        type: postgres
        image: postgres:16
        ephemeral: true
      cache:
        type: redis
        image: redis:7-alpine
      queue:
        type: kafka
        image: confluentinc/cp-kafka:7.5.0
      search:
        type: elasticsearch
        image: elasticsearch:8.11.0
    features:
      - parallel-test-execution
      - coverage-collection
      - artifact-preservation

  staging:
    description: "Pre-production environment"
    services:
      database:
        type: postgres
        instance: staging-db.konferenco.internal
        reset_schedule: "0 2 * * *"  # Reset nightly
      cache:
        type: redis-cluster
        nodes: 3
      queue:
        type: kafka
        brokers: staging-kafka.konferenco.internal
      search:
        type: elasticsearch
        cluster: staging-search.konferenco.internal
    features:
      - production-like-data
      - external-service-sandboxes
      - performance-monitoring

  performance:
    description: "Dedicated performance testing environment"
    services:
      database:
        type: postgres
        instance: perf-db.konferenco.internal
        specs: db.r6g.4xlarge
      cache:
        type: redis-cluster
        nodes: 6
      queue:
        type: kafka
        brokers: 5
        partitions: 100
    features:
      - production-equivalent-specs
      - isolated-network
      - metrics-collection
```

### 4.3 Data Fixtures

```typescript
// tests/fixtures/index.ts
import { faker } from '@faker-js/faker';

// ===============================
// Event Fixtures
// ===============================

export function createEventFixture(overrides: Partial<Event> = {}): Event {
  return {
    id: faker.string.uuid(),
    title: faker.company.catchPhrase() + ' Conference',
    description: faker.lorem.paragraphs(3),
    startDate: faker.date.future({ years: 1 }),
    endDate: faker.date.future({ years: 1 }),
    timezone: faker.helpers.arrayElement(['America/New_York', 'Europe/London', 'Asia/Tokyo']),
    maxCapacity: faker.number.int({ min: 100, max: 10000 }),
    registeredCount: 0,
    status: 'draft',
    isHybrid: faker.datatype.boolean(),
    grassrootsEnabled: faker.datatype.boolean(),
    organizerId: faker.string.uuid(),
    venue: createVenueFixture(),
    categories: faker.helpers.arrayElements(['Technology', 'Business', 'Design', 'Marketing'], 2),
    tags: faker.helpers.arrayElements(['AI', 'Startup', 'Enterprise', 'Developer'], 3),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  };
}

export function createVenueFixture(overrides: Partial<Venue> = {}): Venue {
  return {
    name: faker.company.name() + ' Convention Center',
    address: faker.location.streetAddress(),
    city: faker.location.city(),
    state: faker.location.state(),
    country: faker.location.country(),
    postalCode: faker.location.zipCode(),
    coordinates: {
      lat: parseFloat(faker.location.latitude()),
      lng: parseFloat(faker.location.longitude())
    },
    rooms: Array.from({ length: 10 }, (_, i) => ({
      id: `room-${i + 1}`,
      name: `Room ${String.fromCharCode(65 + i)}`,
      capacity: faker.number.int({ min: 20, max: 500 })
    })),
    ...overrides
  };
}

// ===============================
// User Fixtures
// ===============================

export function createAttendeeFixture(overrides: Partial<Attendee> = {}): Attendee {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();

  return {
    id: faker.string.uuid(),
    email: faker.internet.email({ firstName, lastName }),
    firstName,
    lastName,
    company: faker.company.name(),
    jobTitle: faker.person.jobTitle(),
    bio: faker.lorem.sentence(),
    profileImage: faker.image.avatar(),
    interests: faker.helpers.arrayElements(
      ['AI', 'Machine Learning', 'Web Development', 'Mobile', 'Cloud', 'DevOps', 'Security'],
      faker.number.int({ min: 2, max: 5 })
    ),
    goals: faker.helpers.arrayElements(
      ['Learn new skills', 'Find co-founders', 'Recruit talent', 'Make sales', 'Network'],
      faker.number.int({ min: 1, max: 3 })
    ),
    industry: faker.helpers.arrayElement(['Technology', 'Finance', 'Healthcare', 'Education', 'Retail']),
    connections: [],
    networkingEnabled: true,
    availability: [],
    createdAt: new Date(),
    ...overrides
  };
}

export function createOrganizerFixture(overrides: Partial<Organizer> = {}): Organizer {
  return {
    ...createAttendeeFixture(),
    role: 'organizer',
    organization: {
      id: faker.string.uuid(),
      name: faker.company.name(),
      verified: faker.datatype.boolean(),
      tier: faker.helpers.arrayElement(['free', 'professional', 'enterprise'])
    },
    ...overrides
  };
}

// ===============================
// Session Fixtures
// ===============================

export function createSessionFixture(overrides: Partial<Session> = {}): Session {
  const startTime = faker.date.future();
  const duration = faker.helpers.arrayElement([30, 45, 60, 90]);

  return {
    id: faker.string.uuid(),
    eventId: faker.string.uuid(),
    title: faker.company.buzzPhrase(),
    description: faker.lorem.paragraph(),
    startTime,
    endTime: new Date(startTime.getTime() + duration * 60000),
    duration,
    room: `Room ${faker.string.alpha({ length: 1, casing: 'upper' })}`,
    sessionType: faker.helpers.arrayElement(['keynote', 'workshop', 'panel', 'lightning', 'networking']),
    speakers: [createSpeakerFixture()],
    capacity: faker.number.int({ min: 30, max: 200 }),
    registeredCount: 0,
    isGrassroots: false,
    tags: faker.helpers.arrayElements(['Beginner', 'Advanced', 'Hands-on', 'Interactive'], 2),
    ...overrides
  };
}

export function createSpeakerFixture(overrides: Partial<Speaker> = {}): Speaker {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();

  return {
    id: faker.string.uuid(),
    firstName,
    lastName,
    email: faker.internet.email({ firstName, lastName }),
    bio: faker.lorem.sentences(2),
    company: faker.company.name(),
    jobTitle: faker.person.jobTitle(),
    profileImage: faker.image.avatar(),
    socialLinks: {
      twitter: `@${faker.internet.userName()}`,
      linkedin: faker.internet.url()
    },
    ...overrides
  };
}

// ===============================
// Transaction Fixtures
// ===============================

export function createTicketFixture(overrides: Partial<Ticket> = {}): Ticket {
  return {
    id: faker.string.uuid(),
    eventId: faker.string.uuid(),
    attendeeId: faker.string.uuid(),
    type: faker.helpers.arrayElement(['general', 'vip', 'student', 'early-bird']),
    price: faker.number.int({ min: 0, max: 500 }) * 100, // cents
    currency: 'usd',
    status: 'active',
    purchasedAt: new Date(),
    qrCode: faker.string.alphanumeric(32),
    ...overrides
  };
}

export function createOrderFixture(overrides: Partial<Order> = {}): Order {
  return {
    id: faker.string.uuid(),
    buyerId: faker.string.uuid(),
    vendorId: faker.string.uuid(),
    items: [createOrderItemFixture()],
    subtotal: faker.number.int({ min: 1000, max: 50000 }),
    tax: faker.number.int({ min: 0, max: 5000 }),
    total: faker.number.int({ min: 1000, max: 55000 }),
    currency: 'usd',
    status: faker.helpers.arrayElement(['pending', 'paid', 'fulfilled', 'refunded']),
    paymentIntentId: `pi_${faker.string.alphanumeric(24)}`,
    createdAt: new Date(),
    ...overrides
  };
}

// ===============================
// Bulk Generation
// ===============================

export function generateAttendees(count: number): Attendee[] {
  return Array.from({ length: count }, () => createAttendeeFixture());
}

export function generateSessions(count: number, eventId?: string): Session[] {
  return Array.from({ length: count }, (_, i) =>
    createSessionFixture({
      eventId: eventId || faker.string.uuid(),
      startTime: new Date(Date.now() + i * 3600000) // Stagger by 1 hour
    })
  );
}

export function generateEvents(count: number): Event[] {
  return Array.from({ length: count }, () => createEventFixture());
}

// ===============================
// Scenario-Specific Fixtures
// ===============================

export const fixtures = {
  // Pre-defined scenarios
  techConference2026: createEventFixture({
    id: 'tech-conference-2026',
    title: 'Tech Conference 2026',
    startDate: new Date('2026-06-15'),
    endDate: new Date('2026-06-17'),
    maxCapacity: 5000,
    grassrootsEnabled: true
  }),

  cesScaleEvent: createEventFixture({
    id: 'ces-2026',
    title: 'CES 2026',
    maxCapacity: 180000,
    registeredCount: 150000,
    status: 'published'
  }),

  // Test users
  testOrganizer: createOrganizerFixture({
    id: 'test-organizer',
    email: 'organizer@test.com',
    firstName: 'Test',
    lastName: 'Organizer'
  }),

  testAttendee: createAttendeeFixture({
    id: 'test-attendee',
    email: 'attendee@test.com',
    firstName: 'Test',
    lastName: 'Attendee'
  })
};
```

### 4.4 Mock Services

```typescript
// tests/mocks/services.ts
import { rest, setupServer } from 'msw';
import { kafka } from 'kafkajs';

// ===============================
// HTTP Service Mocks (MSW)
// ===============================

export const handlers = [
  // Stripe API
  rest.post('https://api.stripe.com/v1/payment_intents', (req, res, ctx) => {
    return res(
      ctx.json({
        id: `pi_${Date.now()}`,
        status: 'succeeded',
        amount: 9900,
        currency: 'usd',
        client_secret: `pi_${Date.now()}_secret_xxx`
      })
    );
  }),

  rest.post('https://api.stripe.com/v1/refunds', (req, res, ctx) => {
    return res(
      ctx.json({
        id: `rf_${Date.now()}`,
        status: 'succeeded'
      })
    );
  }),

  // Anthropic API (Claude)
  rest.post('https://api.anthropic.com/v1/messages', async (req, res, ctx) => {
    const body = await req.json();
    const prompt = body.messages?.[0]?.content || '';

    // Route to different mock responses based on prompt content
    if (prompt.includes('networking') || prompt.includes('match')) {
      return res(
        ctx.json({
          content: [{
            type: 'text',
            text: JSON.stringify({
              recommendations: [
                { attendeeId: 'mock-user-1', score: 0.92, reason: 'Shared interest in AI' },
                { attendeeId: 'mock-user-2', score: 0.87, reason: 'Complementary skills' }
              ]
            })
          }]
        })
      );
    }

    if (prompt.includes('schedule') || prompt.includes('optimize')) {
      return res(
        ctx.json({
          content: [{
            type: 'text',
            text: JSON.stringify({
              optimizedSchedule: [
                { sessionId: 'session-1', slot: '09:00-10:00' },
                { sessionId: 'session-2', slot: '10:30-11:30' }
              ],
              conflictCount: 0
            })
          }]
        })
      );
    }

    // Default response
    return res(
      ctx.json({
        content: [{ type: 'text', text: '{}' }]
      })
    );
  }),

  // SendGrid Email API
  rest.post('https://api.sendgrid.com/v3/mail/send', (req, res, ctx) => {
    emailLog.push(req.body);
    return res(ctx.status(202));
  }),

  // Twilio SMS API
  rest.post('https://api.twilio.com/2010-04-01/*', (req, res, ctx) => {
    smsLog.push(req.body);
    return res(
      ctx.json({
        sid: `SM${Date.now()}`,
        status: 'queued'
      })
    );
  })
];

export const mockServer = setupServer(...handlers);

// Track sent communications for assertions
export const emailLog: any[] = [];
export const smsLog: any[] = [];

export function clearCommunicationLogs() {
  emailLog.length = 0;
  smsLog.length = 0;
}

// ===============================
// Kafka Mock Producer
// ===============================

export function createMockKafkaProducer(): jest.Mocked<KafkaProducer> {
  const messages: { topic: string; messages: any[] }[] = [];

  return {
    send: jest.fn(async (record) => {
      messages.push(record);
      return { topicName: record.topic, partition: 0, errorCode: 0 };
    }),
    sendBatch: jest.fn(async (batch) => {
      batch.topicMessages.forEach(tm => messages.push(tm));
      return [];
    }),
    connect: jest.fn(),
    disconnect: jest.fn(),
    getMessages: () => messages,
    clearMessages: () => { messages.length = 0; }
  } as any;
}

// ===============================
// In-Memory Repository Mocks
// ===============================

export function createMockEventRepository(): jest.Mocked<EventRepository> {
  const events = new Map<string, Event>();

  return {
    save: jest.fn(async (event) => {
      const id = event.id || `evt_${Date.now()}`;
      const saved = { ...event, id, createdAt: new Date(), updatedAt: new Date() };
      events.set(id, saved);
      return saved;
    }),
    findById: jest.fn(async (id) => events.get(id) || null),
    findByOrganizer: jest.fn(async (organizerId) =>
      Array.from(events.values()).filter(e => e.organizerId === organizerId)
    ),
    delete: jest.fn(async (id) => { events.delete(id); }),
    clear: jest.fn(async () => { events.clear(); }),
    search: jest.fn(async (query) => {
      return Array.from(events.values()).filter(e =>
        e.title.toLowerCase().includes(query.toLowerCase()) ||
        e.description?.toLowerCase().includes(query.toLowerCase())
      );
    })
  } as any;
}

// ===============================
// WebSocket Mock
// ===============================

export class MockWebSocketServer {
  private connections: Map<string, MockWebSocket> = new Map();
  private rooms: Map<string, Set<string>> = new Map();
  private messageLog: any[] = [];

  connect(userId: string): MockWebSocket {
    const ws = new MockWebSocket(userId, this);
    this.connections.set(userId, ws);
    return ws;
  }

  disconnect(userId: string) {
    this.connections.delete(userId);
    this.rooms.forEach(room => room.delete(userId));
  }

  joinRoom(userId: string, roomId: string) {
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, new Set());
    }
    this.rooms.get(roomId)!.add(userId);
  }

  broadcast(roomId: string, message: any, excludeUserId?: string) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    room.forEach(userId => {
      if (userId !== excludeUserId) {
        const ws = this.connections.get(userId);
        ws?.receive(message);
      }
    });
  }

  getMessageLog() {
    return this.messageLog;
  }

  logMessage(message: any) {
    this.messageLog.push({ ...message, timestamp: Date.now() });
  }
}

export class MockWebSocket {
  private handlers: Map<string, Function[]> = new Map();

  constructor(
    public userId: string,
    private server: MockWebSocketServer
  ) {}

  on(event: string, handler: Function) {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, []);
    }
    this.handlers.get(event)!.push(handler);
  }

  send(data: any) {
    const message = typeof data === 'string' ? JSON.parse(data) : data;
    this.server.logMessage({ from: this.userId, ...message });

    if (message.type === 'subscribe') {
      this.server.joinRoom(this.userId, message.room);
    } else if (message.type === 'message') {
      this.server.broadcast(message.room, message, this.userId);
    }
  }

  receive(data: any) {
    const handlers = this.handlers.get('message') || [];
    handlers.forEach(h => h(JSON.stringify(data)));
  }

  close() {
    this.server.disconnect(this.userId);
    const handlers = this.handlers.get('close') || [];
    handlers.forEach(h => h());
  }
}

// ===============================
// Cache Mock
// ===============================

export function createMockCache(): jest.Mocked<CacheService> {
  const cache = new Map<string, { value: any; expiry: number }>();

  return {
    get: jest.fn(async (key) => {
      const entry = cache.get(key);
      if (!entry) return null;
      if (entry.expiry && entry.expiry < Date.now()) {
        cache.delete(key);
        return null;
      }
      return entry.value;
    }),
    set: jest.fn(async (key, value, ttlSeconds) => {
      cache.set(key, {
        value,
        expiry: ttlSeconds ? Date.now() + ttlSeconds * 1000 : 0
      });
    }),
    delete: jest.fn(async (key) => { cache.delete(key); }),
    clear: jest.fn(async () => { cache.clear(); }),
    exists: jest.fn(async (key) => cache.has(key))
  } as any;
}
```

---

## 5. Quality Metrics

### 5.1 Coverage Targets

```yaml
coverage_requirements:
  global:
    statements: 80%
    branches: 75%
    functions: 80%
    lines: 80%

  by_module:
    domain:
      description: "Core business logic - highest coverage"
      statements: 95%
      branches: 90%
      functions: 95%
      lines: 95%

    api:
      description: "API controllers and middleware"
      statements: 85%
      branches: 80%
      functions: 85%
      lines: 85%

    infrastructure:
      description: "Database, cache, queue integrations"
      statements: 75%
      branches: 70%
      functions: 75%
      lines: 75%

    ui:
      description: "React components"
      statements: 70%
      branches: 65%
      functions: 70%
      lines: 70%

  critical_paths:
    description: "Must have 100% coverage"
    modules:
      - src/domain/event/event-validator.ts
      - src/domain/payment/payment-processor.ts
      - src/domain/auth/token-validator.ts
      - src/domain/networking/matching-algorithm.ts

  coverage_exclusions:
    patterns:
      - "**/*.d.ts"           # Type definitions
      - "**/index.ts"         # Re-exports
      - "**/*.config.ts"      # Configuration
      - "**/migrations/**"    # Database migrations
      - "**/__mocks__/**"     # Test mocks
```

### 5.2 Performance Benchmarks

```yaml
performance_benchmarks:
  api_latency:
    description: "API response time targets"
    endpoints:
      GET /events:
        p50: 50ms
        p95: 100ms
        p99: 200ms

      GET /events/:id:
        p50: 30ms
        p95: 75ms
        p99: 150ms

      POST /events:
        p50: 100ms
        p95: 250ms
        p99: 500ms

      GET /events/:id/schedule:
        p50: 75ms
        p95: 150ms
        p99: 300ms

      POST /tickets/reserve:
        p50: 150ms
        p95: 300ms
        p99: 500ms

  search_latency:
    description: "Elasticsearch query performance"
    queries:
      full_text_search:
        p50: 30ms
        p95: 50ms
        p99: 100ms

      geo_radius_search:
        p50: 40ms
        p95: 75ms
        p99: 150ms

      faceted_search:
        p50: 50ms
        p95: 100ms
        p99: 200ms

  realtime_latency:
    description: "WebSocket message delivery"
    metrics:
      message_delivery:
        p50: 20ms
        p95: 50ms
        p99: 100ms

      presence_update:
        p50: 30ms
        p95: 75ms
        p99: 150ms

      typing_indicator:
        p50: 10ms
        p95: 25ms
        p99: 50ms

  ai_service:
    description: "AI/LLM response times"
    operations:
      networking_recommendations:
        p50: 500ms
        p95: 1500ms
        p99: 3000ms

      schedule_optimization:
        p50: 1000ms
        p95: 3000ms
        p99: 5000ms

      content_moderation:
        p50: 200ms
        p95: 500ms
        p99: 1000ms

  database:
    description: "Database query performance"
    queries:
      simple_select:
        p50: 5ms
        p95: 15ms
        p99: 30ms

      complex_join:
        p50: 20ms
        p95: 50ms
        p99: 100ms

      write_operation:
        p50: 10ms
        p95: 30ms
        p99: 75ms

  throughput:
    description: "System throughput targets"
    metrics:
      api_requests_per_second: 10000
      websocket_connections: 100000
      messages_per_second: 50000
      registrations_per_minute: 5000
      search_queries_per_second: 2000
```

### 5.3 Reliability SLAs

```yaml
reliability_slas:
  availability:
    target: 99.9%
    measurement_window: monthly
    exclusions:
      - scheduled_maintenance
      - third_party_outages

    by_tier:
      free: 99.5%
      professional: 99.9%
      enterprise: 99.95%
      conference: 99.99%

  error_rates:
    description: "Maximum acceptable error rates"
    http_5xx:
      target: < 0.1%
      alert_threshold: > 0.5%
      critical_threshold: > 1%

    http_4xx:
      target: < 5%  # Expected for validation errors
      alert_threshold: > 10%

    payment_failures:
      target: < 2%
      alert_threshold: > 5%

    message_delivery:
      target: > 99.9%
      alert_threshold: < 99%

  recovery_objectives:
    rto:  # Recovery Time Objective
      standard: 1 hour
      critical: 15 minutes

    rpo:  # Recovery Point Objective
      standard: 1 hour
      critical: 5 minutes

    mttr:  # Mean Time To Recovery
      target: < 30 minutes

  data_durability:
    target: 99.999999999%  # 11 nines
    backup_frequency: hourly
    retention: 30 days
    geo_redundancy: 3 regions

  test_quality_gates:
    description: "CI/CD quality gates"
    requirements:
      unit_test_pass_rate: 100%
      integration_test_pass_rate: 100%
      e2e_test_pass_rate: 98%  # Allow for flakiness

      code_coverage_delta: >= 0%  # No coverage regression

      security_scan: no_critical
      dependency_vulnerabilities: no_high

      performance_regression: < 10%

  monitoring:
    description: "Observability requirements"
    metrics:
      collection_interval: 10s
      retention: 90 days

    logs:
      retention: 30 days
      searchable_within: 5s

    traces:
      sampling_rate: 10%
      retention: 7 days

    alerts:
      notification_latency: < 1 minute
      escalation_policy: defined
```

---

## Appendix A: Test File Organization

```
tests/
├── unit/
│   ├── domain/
│   │   ├── event/
│   │   │   ├── event.entity.spec.ts
│   │   │   ├── event-validator.spec.ts
│   │   │   └── event-service.spec.ts
│   │   ├── networking/
│   │   │   ├── matching-algorithm.spec.ts
│   │   │   └── connection-service.spec.ts
│   │   ├── scheduling/
│   │   │   ├── schedule-optimizer.spec.ts
│   │   │   └── conflict-detector.spec.ts
│   │   └── payment/
│   │       └── payment-processor.spec.ts
│   └── utils/
│       └── validators.spec.ts
│
├── integration/
│   ├── api/
│   │   ├── events.api.spec.ts
│   │   ├── users.api.spec.ts
│   │   ├── tickets.api.spec.ts
│   │   └── networking.api.spec.ts
│   ├── repositories/
│   │   ├── event.repository.spec.ts
│   │   └── user.repository.spec.ts
│   └── external/
│       ├── payment.integration.spec.ts
│       ├── email.integration.spec.ts
│       └── ai.integration.spec.ts
│
├── e2e/
│   ├── journeys/
│   │   ├── attendee-registration.spec.ts
│   │   ├── grassroots-creation.spec.ts
│   │   ├── networking-flow.spec.ts
│   │   ├── schedule-building.spec.ts
│   │   └── marketplace-transactions.spec.ts
│   └── playwright.config.ts
│
├── performance/
│   ├── load-test.k6.ts
│   ├── websocket-load.k6.ts
│   ├── search-latency.spec.ts
│   └── ai-response-times.spec.ts
│
├── fixtures/
│   ├── index.ts
│   ├── events.ts
│   ├── users.ts
│   └── sessions.ts
│
├── mocks/
│   ├── services.ts
│   ├── repositories.ts
│   └── handlers.ts
│
└── setup/
    ├── jest.setup.ts
    ├── test-containers.ts
    └── global-teardown.ts
```

---

## Appendix B: Jest Configuration

```typescript
// jest.config.ts
import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests', '<rootDir>/src'],

  // Test patterns
  testMatch: [
    '**/*.spec.ts',
    '**/*.test.ts'
  ],

  // Coverage
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/index.ts',
    '!src/**/*.config.ts',
    '!src/migrations/**'
  ],
  coverageThreshold: {
    global: {
      statements: 80,
      branches: 75,
      functions: 80,
      lines: 80
    },
    './src/domain/': {
      statements: 95,
      branches: 90,
      functions: 95,
      lines: 95
    }
  },
  coverageReporters: ['text', 'lcov', 'html'],

  // Setup
  setupFilesAfterEnv: ['<rootDir>/tests/setup/jest.setup.ts'],
  globalTeardown: '<rootDir>/tests/setup/global-teardown.ts',

  // Module resolution
  moduleNameMapper: {
    '@/(.*)': '<rootDir>/src/$1',
    '@tests/(.*)': '<rootDir>/tests/$1'
  },

  // Performance
  maxWorkers: '50%',
  testTimeout: 10000,

  // Reporting
  verbose: true,
  reporters: [
    'default',
    ['jest-junit', {
      outputDirectory: './reports',
      outputName: 'junit.xml'
    }]
  ],

  // Projects for different test types
  projects: [
    {
      displayName: 'unit',
      testMatch: ['<rootDir>/tests/unit/**/*.spec.ts'],
      testTimeout: 5000
    },
    {
      displayName: 'integration',
      testMatch: ['<rootDir>/tests/integration/**/*.spec.ts'],
      testTimeout: 30000,
      setupFilesAfterEnv: [
        '<rootDir>/tests/setup/jest.setup.ts',
        '<rootDir>/tests/setup/test-containers.ts'
      ]
    }
  ]
};

export default config;
```

---

## Decision Record

| Date | Change | Author |
|------|--------|--------|
| 2026-01-30 | Initial TDD strategy document | QA Architecture Team |

---

## References

- [London School TDD](https://devlead.io/DevTips/LondonVsChicago)
- [BDD with Gherkin](https://cucumber.io/docs/gherkin/)
- [Testing Microservices](https://martinfowler.com/articles/microservice-testing/)
- [k6 Load Testing](https://k6.io/docs/)
- [Playwright E2E Testing](https://playwright.dev/docs/intro)
- [Jest Testing Framework](https://jestjs.io/docs/getting-started)
