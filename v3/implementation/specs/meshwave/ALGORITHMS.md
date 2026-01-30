# MeshWave Algorithm Design

## Core Algorithms and Data Structures

This document provides detailed pseudocode for MeshWave's core algorithms.

---

## 1. Multi-Protocol Channel Orchestration

### 1.1 Optimal Channel Selection

```python
class ChannelOrchestrator:
    """
    Dynamically selects the optimal communication channel based on
    message characteristics, network conditions, and device state.
    """

    def __init__(self, protocols: List[Protocol]):
        self.protocols = protocols
        self.metrics = MetricsCollector()
        self.battery_monitor = BatteryMonitor()

    def select_optimal_channel(
        self,
        message: Message,
        target: NodeId,
        context: NetworkContext
    ) -> ChannelSelection:
        """
        Algorithm: Weighted Multi-Criteria Channel Selection

        Time Complexity: O(P) where P = number of protocols
        Space Complexity: O(P) for score tracking
        """
        available = self.get_available_protocols(target)

        if not available:
            raise NoRouteError(f"No protocols available for {target}")

        scores = {}

        for protocol in available:
            score = 0.0

            # Criterion 1: Bandwidth Match (0-30 points)
            # Large files need high bandwidth, small messages don't care
            bandwidth_need = message.size / MAX_MESSAGE_SIZE
            bandwidth_score = (
                protocol.bandwidth / MAX_BANDWIDTH * 30 * bandwidth_need +
                30 * (1 - bandwidth_need)  # Small messages get full score
            )
            score += bandwidth_score

            # Criterion 2: Latency (0-25 points)
            # Lower latency = higher score
            latency_score = (1 - protocol.avg_latency / MAX_LATENCY) * 25
            score += max(0, latency_score)

            # Criterion 3: Battery Efficiency (0-20 points)
            # Weighted by current battery level
            battery_weight = self.battery_monitor.get_conservation_factor()
            power_score = (1 - protocol.power_draw / MAX_POWER) * 20 * battery_weight
            score += power_score

            # Criterion 4: Reliability (0-15 points)
            # Historical success rate for this protocol
            reliability = self.metrics.get_success_rate(protocol, target)
            score += reliability * 15

            # Criterion 5: Covert Requirement (0-10 points)
            # Ultrasonic/VLC get bonus for covert messages
            if message.flags.covert:
                if protocol.is_covert:
                    score += 10
                else:
                    score -= 20  # Penalty for non-covert

            # Criterion 6: Range Penalty
            # Estimate if target is reachable
            distance = context.estimated_distance(target)
            if distance > protocol.effective_range:
                score -= 50  # Heavy penalty if out of range

            scores[protocol] = score

        # Select highest scoring protocol
        best_protocol = max(scores, key=scores.get)

        return ChannelSelection(
            protocol=best_protocol,
            score=scores[best_protocol],
            fallback=self._get_fallback(scores, best_protocol),
            reason=self._explain_selection(scores, best_protocol)
        )

    def _get_fallback(
        self,
        scores: Dict[Protocol, float],
        primary: Protocol
    ) -> Optional[Protocol]:
        """Get second-best protocol for failover"""
        sorted_protocols = sorted(scores.items(), key=lambda x: x[1], reverse=True)
        if len(sorted_protocols) > 1:
            return sorted_protocols[1][0]
        return None
```

### 1.2 Automatic Failover

```python
class FailoverManager:
    """
    Handles automatic protocol failover when transmission fails.
    Implements exponential backoff and circuit breaker pattern.
    """

    def __init__(self):
        self.circuit_breakers = {}  # protocol -> CircuitBreaker
        self.retry_delays = [100, 200, 400, 800, 1600]  # ms

    async def transmit_with_failover(
        self,
        message: Message,
        target: NodeId,
        protocols: List[Protocol]
    ) -> TransmitResult:
        """
        Algorithm: Circuit Breaker Failover

        Attempts transmission on each protocol in order,
        with circuit breaker protection and exponential backoff.
        """
        errors = []

        for protocol in protocols:
            breaker = self.get_circuit_breaker(protocol)

            # Skip if circuit is open (recent failures)
            if breaker.is_open():
                errors.append(CircuitOpenError(protocol))
                continue

            for attempt, delay in enumerate(self.retry_delays):
                try:
                    result = await protocol.transmit(message, target)

                    if result.success:
                        breaker.record_success()
                        return TransmitResult(
                            success=True,
                            protocol=protocol,
                            attempts=attempt + 1,
                            failover_count=protocols.index(protocol)
                        )

                except TransmissionError as e:
                    breaker.record_failure()
                    errors.append(e)

                    if attempt < len(self.retry_delays) - 1:
                        await asyncio.sleep(delay / 1000)

        return TransmitResult(
            success=False,
            errors=errors,
            failover_count=len(protocols)
        )


class CircuitBreaker:
    """
    Circuit breaker pattern for protocol health management.

    States:
    - CLOSED: Normal operation, requests pass through
    - OPEN: Recent failures, requests blocked
    - HALF_OPEN: Testing if protocol recovered
    """

    FAILURE_THRESHOLD = 5
    RECOVERY_TIMEOUT = 30000  # ms
    SUCCESS_THRESHOLD = 3

    def __init__(self):
        self.state = CircuitState.CLOSED
        self.failure_count = 0
        self.success_count = 0
        self.last_failure_time = 0

    def is_open(self) -> bool:
        if self.state == CircuitState.OPEN:
            # Check if recovery timeout elapsed
            if time.now() - self.last_failure_time > self.RECOVERY_TIMEOUT:
                self.state = CircuitState.HALF_OPEN
                return False
            return True
        return False

    def record_failure(self):
        self.failure_count += 1
        self.success_count = 0
        self.last_failure_time = time.now()

        if self.failure_count >= self.FAILURE_THRESHOLD:
            self.state = CircuitState.OPEN

    def record_success(self):
        if self.state == CircuitState.HALF_OPEN:
            self.success_count += 1
            if self.success_count >= self.SUCCESS_THRESHOLD:
                self.state = CircuitState.CLOSED
                self.failure_count = 0
```

---

## 2. Ultrasonic Data Transmission

### 2.1 FSK Encoder

```python
class UltrasonicFSKEncoder:
    """
    Frequency Shift Keying encoder for ultrasonic data transmission.

    Uses 16 frequencies (18.0-19.5 kHz) for 4-bit symbols.
    Includes Reed-Solomon forward error correction.
    """

    # Configuration
    BASE_FREQ = 18000       # Hz
    FREQ_STEP = 100         # Hz per symbol
    SYMBOL_DURATION = 0.05  # seconds (50ms)
    SAMPLE_RATE = 44100     # Hz

    # Preamble for synchronization
    PREAMBLE = [18500, 19500, 18500, 19500]

    def encode(self, data: bytes) -> np.ndarray:
        """
        Algorithm: FSK Audio Encoding

        1. Generate synchronization preamble
        2. Convert bytes to 4-bit symbols
        3. Apply Reed-Solomon encoding
        4. Generate sine wave for each symbol
        5. Apply windowing to reduce spectral leakage

        Time Complexity: O(n) where n = len(data)
        Space Complexity: O(n * sample_rate * symbol_duration)
        """
        samples_per_symbol = int(self.SAMPLE_RATE * self.SYMBOL_DURATION)
        output = []

        # Step 1: Generate preamble
        for freq in self.PREAMBLE:
            tone = self._generate_tone(freq, samples_per_symbol)
            output.append(tone)

        # Step 2: Apply Reed-Solomon encoding
        rs_encoded = self._reed_solomon_encode(data)

        # Step 3: Convert to symbols (4 bits each)
        symbols = []
        for byte in rs_encoded:
            high_nibble = (byte >> 4) & 0x0F
            low_nibble = byte & 0x0F
            symbols.extend([high_nibble, low_nibble])

        # Step 4: Generate tone for each symbol
        for symbol in symbols:
            freq = self.BASE_FREQ + symbol * self.FREQ_STEP
            tone = self._generate_tone(freq, samples_per_symbol)
            output.append(tone)

        # Step 5: Add CRC16 checksum
        checksum = self._crc16(data)
        for nibble in [(checksum >> 12) & 0xF, (checksum >> 8) & 0xF,
                       (checksum >> 4) & 0xF, checksum & 0xF]:
            freq = self.BASE_FREQ + nibble * self.FREQ_STEP
            tone = self._generate_tone(freq, samples_per_symbol)
            output.append(tone)

        return np.concatenate(output)

    def _generate_tone(self, freq: float, num_samples: int) -> np.ndarray:
        """Generate sine wave with Hann window to reduce clicks"""
        t = np.arange(num_samples) / self.SAMPLE_RATE
        tone = np.sin(2 * np.pi * freq * t)

        # Apply Hann window for smooth transitions
        window = np.hanning(num_samples)
        return tone * window * 0.5  # Scale to avoid clipping

    def _reed_solomon_encode(self, data: bytes) -> bytes:
        """
        Reed-Solomon RS(255, 223) encoding.
        Adds 32 bytes of redundancy per 223 bytes of data.
        Can correct up to 16 byte errors.
        """
        rs = reedsolo.RSCodec(32)
        return rs.encode(data)

    def _crc16(self, data: bytes) -> int:
        """CRC-16-CCITT checksum"""
        crc = 0xFFFF
        for byte in data:
            crc ^= byte << 8
            for _ in range(8):
                if crc & 0x8000:
                    crc = (crc << 1) ^ 0x1021
                else:
                    crc <<= 1
                crc &= 0xFFFF
        return crc
```

### 2.2 FSK Decoder

```python
class UltrasonicFSKDecoder:
    """
    Decodes FSK-encoded ultrasonic audio signals.

    Uses FFT for frequency detection and cross-correlation
    for preamble synchronization.
    """

    def decode(self, audio: np.ndarray) -> DecodeResult:
        """
        Algorithm: FFT-based FSK Decoding

        1. Apply bandpass filter (17-23 kHz)
        2. Detect preamble using cross-correlation
        3. Segment into symbol windows
        4. FFT each window to determine frequency
        5. Reconstruct bytes from symbols
        6. Verify CRC and apply Reed-Solomon correction

        Time Complexity: O(n log n) for FFT operations
        Space Complexity: O(n) for filtered signal
        """
        # Step 1: Bandpass filter
        filtered = self._bandpass_filter(audio, 17000, 23000)

        # Step 2: Find preamble
        preamble_pos = self._detect_preamble(filtered)
        if preamble_pos < 0:
            raise DecodeError("No synchronization preamble detected")

        # Step 3: Extract data symbols
        samples_per_symbol = int(self.SAMPLE_RATE * self.SYMBOL_DURATION)
        data_start = preamble_pos + len(self.PREAMBLE) * samples_per_symbol

        symbols = []
        pos = data_start

        while pos + samples_per_symbol <= len(filtered):
            window = filtered[pos:pos + samples_per_symbol]
            freq = self._dominant_frequency(window)

            # Convert frequency to symbol
            symbol = round((freq - self.BASE_FREQ) / self.FREQ_STEP)
            if 0 <= symbol <= 15:
                symbols.append(symbol)
            else:
                symbols.append(0)  # Error case

            pos += samples_per_symbol

        # Step 4: Reconstruct bytes
        data_bytes = self._symbols_to_bytes(symbols[:-4])  # Exclude CRC
        crc_symbols = symbols[-4:]

        # Step 5: Verify CRC
        received_crc = (
            (crc_symbols[0] << 12) |
            (crc_symbols[1] << 8) |
            (crc_symbols[2] << 4) |
            crc_symbols[3]
        )

        # Step 6: Reed-Solomon decode
        try:
            decoded = self._reed_solomon_decode(data_bytes)
        except ReedSolomonError as e:
            raise DecodeError(f"Error correction failed: {e}")

        calculated_crc = self._crc16(decoded)

        return DecodeResult(
            data=decoded,
            checksum_valid=(received_crc == calculated_crc),
            error_corrections=e.corrections if hasattr(e, 'corrections') else 0,
            signal_quality=self._estimate_snr(filtered)
        )

    def _detect_preamble(self, signal: np.ndarray) -> int:
        """
        Cross-correlation to find preamble position.

        Returns sample index of preamble start, or -1 if not found.
        """
        # Generate expected preamble
        preamble_signal = []
        samples_per_tone = int(self.SAMPLE_RATE * self.SYMBOL_DURATION)

        for freq in self.PREAMBLE:
            t = np.arange(samples_per_tone) / self.SAMPLE_RATE
            tone = np.sin(2 * np.pi * freq * t)
            preamble_signal.append(tone)

        preamble = np.concatenate(preamble_signal)

        # Cross-correlate
        correlation = np.correlate(signal, preamble, mode='valid')

        # Find peak
        peak_idx = np.argmax(np.abs(correlation))
        peak_value = np.abs(correlation[peak_idx])

        # Threshold check
        threshold = 0.5 * np.max(np.abs(preamble)) * len(preamble)
        if peak_value < threshold:
            return -1

        return peak_idx

    def _dominant_frequency(self, window: np.ndarray) -> float:
        """Find dominant frequency in window using FFT"""
        # Apply window function
        windowed = window * np.hanning(len(window))

        # FFT
        fft = np.fft.rfft(windowed)
        freqs = np.fft.rfftfreq(len(window), 1 / self.SAMPLE_RATE)

        # Find peak in ultrasonic range
        mask = (freqs >= 17000) & (freqs <= 23000)
        masked_fft = np.abs(fft) * mask

        peak_idx = np.argmax(masked_fft)
        return freqs[peak_idx]

    def _bandpass_filter(
        self,
        signal: np.ndarray,
        low_freq: float,
        high_freq: float
    ) -> np.ndarray:
        """Butterworth bandpass filter"""
        nyquist = self.SAMPLE_RATE / 2
        low = low_freq / nyquist
        high = high_freq / nyquist

        b, a = scipy.signal.butter(4, [low, high], btype='band')
        return scipy.signal.filtfilt(b, a, signal)
```

---

## 3. Mesh Routing Algorithms

### 3.1 Byzantine-Tolerant Path Finding

```python
class ByzantineRouter:
    """
    Routing algorithm that tolerates Byzantine (malicious) nodes.

    Uses reputation-weighted path selection and requires
    multi-signature route proofs.
    """

    MAX_HOPS = 7
    SIGNATURE_THRESHOLD = lambda f: 2 * f + 1  # For f faulty nodes

    def __init__(self, network: MeshNetwork, reputation: ReputationTracker):
        self.network = network
        self.reputation = reputation
        self.faulty_tolerance = 2  # Assume up to 2 malicious nodes

    def find_path(
        self,
        source: NodeId,
        destination: NodeId
    ) -> Optional[Route]:
        """
        Algorithm: Reputation-Weighted Dijkstra with Byzantine Tolerance

        Modification of Dijkstra's algorithm that:
        1. Weights edges by node reputation (lower rep = higher cost)
        2. Requires path to avoid known malicious nodes
        3. Limits hop count to MAX_HOPS
        4. Prefers paths through high-reputation nodes

        Time Complexity: O((V + E) log V)
        Space Complexity: O(V)
        """
        distances = {source: 0}
        previous = {source: None}
        visited = set()

        # Priority queue: (distance, hop_count, node)
        pq = [(0, 0, source)]

        while pq:
            dist, hops, current = heapq.heappop(pq)

            if current in visited:
                continue
            visited.add(current)

            if current == destination:
                return self._reconstruct_path(previous, destination)

            if hops >= self.MAX_HOPS:
                continue  # Exceeded hop limit

            for neighbor in self.network.get_neighbors(current):
                if neighbor in visited:
                    continue

                # Skip known malicious nodes
                if self.reputation.is_malicious(neighbor):
                    continue

                # Calculate edge weight (inverse of reputation)
                rep = self.reputation.get_reputation(neighbor)
                edge_weight = 1.0 / max(rep.score, 0.01)  # Avoid division by zero

                new_dist = dist + edge_weight

                if neighbor not in distances or new_dist < distances[neighbor]:
                    distances[neighbor] = new_dist
                    previous[neighbor] = current
                    heapq.heappush(pq, (new_dist, hops + 1, neighbor))

        return None  # No path found

    def create_route_proof(self, route: Route) -> RouteProof:
        """
        Creates a cryptographic proof of route validity.

        Each node on the path signs the route, creating a chain
        of attestations. Requires 2f+1 signatures for f-fault tolerance.
        """
        signatures = []

        for i, node_id in enumerate(route.path):
            # Create attestation data
            attestation = {
                'route_id': route.id,
                'path': route.path,
                'position': i,
                'timestamp': time.now(),
                'previous_sig': signatures[-1] if signatures else None
            }

            # Sign attestation
            signature = self.network.get_node(node_id).sign(attestation)
            signatures.append(signature)

        return RouteProof(
            route=route,
            signatures=signatures,
            timestamp=time.now()
        )

    def validate_route_proof(self, proof: RouteProof) -> ValidationResult:
        """
        Validates a route proof meets Byzantine requirements.

        Returns ValidationResult with validity and any issues found.
        """
        required_sigs = self.SIGNATURE_THRESHOLD(self.faulty_tolerance)

        # Check signature count
        if len(proof.signatures) < required_sigs:
            return ValidationResult(
                valid=False,
                reason=f"Insufficient signatures: {len(proof.signatures)} < {required_sigs}"
            )

        # Verify each signature
        for i, sig in enumerate(proof.signatures):
            node_id = proof.route.path[i % len(proof.route.path)]

            attestation = {
                'route_id': proof.route.id,
                'path': proof.route.path,
                'position': i,
                'timestamp': proof.timestamp,
                'previous_sig': proof.signatures[i-1] if i > 0 else None
            }

            if not self.network.verify_signature(node_id, attestation, sig):
                return ValidationResult(
                    valid=False,
                    reason=f"Invalid signature at position {i}"
                )

        # Check for routing loops
        if len(proof.route.path) != len(set(proof.route.path)):
            return ValidationResult(
                valid=False,
                reason="Routing loop detected"
            )

        # Check timestamp freshness
        age = time.now() - proof.timestamp
        if age > self.MAX_ROUTE_AGE:
            return ValidationResult(
                valid=False,
                reason=f"Route too old: {age}ms > {self.MAX_ROUTE_AGE}ms"
            )

        return ValidationResult(valid=True)
```

### 3.2 Gossip Protocol for Network Discovery

```python
class GossipProtocol:
    """
    Epidemic-style protocol for disseminating network state.

    Each node periodically shares its view of the network with
    random neighbors, eventually achieving consistent state.
    """

    GOSSIP_INTERVAL = 5000  # ms
    FANOUT = 3  # Number of neighbors to gossip to
    MAX_AGE = 60000  # ms before node considered stale

    def __init__(self, node: MeshNode):
        self.node = node
        self.known_nodes = {}  # NodeId -> NodeInfo
        self.sequence_number = 0

    async def run(self):
        """Main gossip loop"""
        while True:
            await self._gossip_round()
            await asyncio.sleep(self.GOSSIP_INTERVAL / 1000)

    async def _gossip_round(self):
        """
        Algorithm: Push-Pull Gossip

        1. Select random subset of neighbors
        2. Send our view of network (push)
        3. Receive their view (pull)
        4. Merge views, keeping freshest info
        """
        neighbors = self.node.get_neighbors()
        if not neighbors:
            return

        # Select random neighbors
        targets = random.sample(
            neighbors,
            min(self.FANOUT, len(neighbors))
        )

        for neighbor in targets:
            try:
                # Push our state
                our_state = self._get_state_digest()
                their_state = await neighbor.exchange_gossip(our_state)

                # Pull and merge their state
                self._merge_state(their_state)

            except CommunicationError:
                # Mark neighbor as potentially offline
                self._record_failure(neighbor)

    def _get_state_digest(self) -> GossipDigest:
        """Creates compact representation of our network view"""
        self.sequence_number += 1

        return GossipDigest(
            sender=self.node.id,
            sequence=self.sequence_number,
            nodes={
                node_id: NodeDigest(
                    id=node_id,
                    last_seen=info.last_seen,
                    version=info.version,
                    endpoints=info.endpoints
                )
                for node_id, info in self.known_nodes.items()
                if time.now() - info.last_seen < self.MAX_AGE
            }
        )

    def _merge_state(self, remote: GossipDigest):
        """
        Merge remote state with local state.

        For each node, keep the info with highest version number.
        """
        for node_id, remote_info in remote.nodes.items():
            local_info = self.known_nodes.get(node_id)

            if local_info is None:
                # New node discovered
                self.known_nodes[node_id] = NodeInfo(
                    id=node_id,
                    last_seen=remote_info.last_seen,
                    version=remote_info.version,
                    endpoints=remote_info.endpoints
                )
            elif remote_info.version > local_info.version:
                # Remote has newer info
                self.known_nodes[node_id] = NodeInfo(
                    id=node_id,
                    last_seen=remote_info.last_seen,
                    version=remote_info.version,
                    endpoints=remote_info.endpoints
                )

        # Prune stale nodes
        self._prune_stale_nodes()

    def _prune_stale_nodes(self):
        """Remove nodes not seen recently"""
        now = time.now()
        stale = [
            node_id for node_id, info in self.known_nodes.items()
            if now - info.last_seen > self.MAX_AGE
        ]
        for node_id in stale:
            del self.known_nodes[node_id]
```

---

## 4. CRDT Message Synchronization

### 4.1 LWW-Register for Message State

```python
class MessageCRDT:
    """
    Conflict-free Replicated Data Type for message synchronization.

    Uses Last-Writer-Wins (LWW) register with vector clocks for
    ordering and OR-Set for message collection.
    """

    @dataclass
    class MessageEntry:
        id: UUID
        vector_clock: Dict[NodeId, int]
        content: bytes  # Encrypted payload
        tombstone: bool = False
        metadata: Dict[str, Any] = field(default_factory=dict)

    def __init__(self, node_id: NodeId):
        self.node_id = node_id
        self.messages: Dict[UUID, MessageEntry] = {}
        self.local_clock = 0

    def add_message(self, content: bytes, metadata: Dict = None) -> MessageEntry:
        """Add a new message to the set"""
        self.local_clock += 1

        entry = self.MessageEntry(
            id=uuid4(),
            vector_clock={self.node_id: self.local_clock},
            content=content,
            metadata=metadata or {}
        )

        self.messages[entry.id] = entry
        return entry

    def delete_message(self, message_id: UUID):
        """Soft-delete a message (tombstone)"""
        if message_id in self.messages:
            self.local_clock += 1
            entry = self.messages[message_id]
            entry.tombstone = True
            entry.vector_clock[self.node_id] = self.local_clock

    def merge(self, remote: 'MessageCRDT') -> 'MessageCRDT':
        """
        Algorithm: CRDT Merge

        For each message:
        1. If only in one set, include it
        2. If in both, merge vector clocks and prefer tombstone

        Merge is:
        - Commutative: A.merge(B) == B.merge(A)
        - Associative: A.merge(B.merge(C)) == A.merge(B).merge(C)
        - Idempotent: A.merge(A) == A
        """
        result = MessageCRDT(self.node_id)

        all_ids = set(self.messages.keys()) | set(remote.messages.keys())

        for msg_id in all_ids:
            local_entry = self.messages.get(msg_id)
            remote_entry = remote.messages.get(msg_id)

            if local_entry is None:
                result.messages[msg_id] = copy.deepcopy(remote_entry)
            elif remote_entry is None:
                result.messages[msg_id] = copy.deepcopy(local_entry)
            else:
                # Both have it - merge
                merged_entry = self._merge_entries(local_entry, remote_entry)
                result.messages[msg_id] = merged_entry

        # Update local clock to max observed
        result.local_clock = max(
            self.local_clock,
            remote.local_clock,
            max(
                max(e.vector_clock.values())
                for e in result.messages.values()
            ) if result.messages else 0
        )

        return result

    def _merge_entries(
        self,
        local: MessageEntry,
        remote: MessageEntry
    ) -> MessageEntry:
        """Merge two entries for the same message"""
        # Merge vector clocks (point-wise max)
        merged_clock = {}
        all_nodes = set(local.vector_clock.keys()) | set(remote.vector_clock.keys())

        for node in all_nodes:
            merged_clock[node] = max(
                local.vector_clock.get(node, 0),
                remote.vector_clock.get(node, 0)
            )

        # Tombstone wins (deletion is permanent)
        merged_tombstone = local.tombstone or remote.tombstone

        # Content is immutable, use local (they should be identical)
        # Metadata merged with remote taking precedence
        merged_metadata = {**local.metadata, **remote.metadata}

        return self.MessageEntry(
            id=local.id,
            vector_clock=merged_clock,
            content=local.content,
            tombstone=merged_tombstone,
            metadata=merged_metadata
        )

    def get_sync_delta(self, remote_clock: Dict[NodeId, int]) -> List[MessageEntry]:
        """
        Get messages that remote doesn't have.

        Returns entries where our vector clock is ahead.
        """
        delta = []

        for entry in self.messages.values():
            # Check if we have newer info than remote
            dominated = False
            for node, our_time in entry.vector_clock.items():
                remote_time = remote_clock.get(node, 0)
                if our_time > remote_time:
                    delta.append(entry)
                    break

        return delta
```

---

## 5. Security Algorithms

### 5.1 Double Ratchet Protocol

```python
class DoubleRatchet:
    """
    Signal Protocol's Double Ratchet algorithm for forward secrecy.

    Combines:
    - Diffie-Hellman ratchet (key agreement)
    - Symmetric-key ratchet (chain keys)
    """

    def __init__(self, identity_key: KeyPair):
        self.identity_key = identity_key
        self.dh_ratchet_key: Optional[KeyPair] = None
        self.root_key: Optional[bytes] = None
        self.sending_chain_key: Optional[bytes] = None
        self.receiving_chain_key: Optional[bytes] = None
        self.sending_chain_length = 0
        self.receiving_chain_length = 0
        self.skipped_message_keys: Dict[Tuple[bytes, int], bytes] = {}

    async def init_sender(self, recipient_public_key: bytes):
        """Initialize as message sender (Alice)"""
        # Generate ephemeral DH key
        self.dh_ratchet_key = generate_key_pair()

        # Derive initial root key
        shared_secret = x25519(self.identity_key.private, recipient_public_key)
        self.root_key, self.sending_chain_key = self._kdf_rk(
            shared_secret,
            x25519(self.dh_ratchet_key.private, recipient_public_key)
        )

    async def init_receiver(self, sender_public_key: bytes, sender_ephemeral: bytes):
        """Initialize as message receiver (Bob)"""
        # Generate our DH key
        self.dh_ratchet_key = generate_key_pair()

        # Derive initial keys
        shared_secret = x25519(self.identity_key.private, sender_public_key)
        self.root_key, self.receiving_chain_key = self._kdf_rk(
            shared_secret,
            x25519(self.identity_key.private, sender_ephemeral)
        )

    def encrypt(self, plaintext: bytes) -> EncryptedMessage:
        """
        Encrypt a message, advancing the sending chain.

        1. Derive message key from chain key
        2. Advance chain key
        3. Encrypt with ChaCha20-Poly1305
        """
        # Derive message key and new chain key
        message_key, self.sending_chain_key = self._kdf_ck(self.sending_chain_key)

        # Encrypt
        nonce = os.urandom(24)
        ciphertext = chacha20_poly1305_encrypt(plaintext, message_key, nonce)

        # Create header
        header = MessageHeader(
            dh_public=self.dh_ratchet_key.public,
            chain_length=self.sending_chain_length,
            message_number=self.sending_chain_length
        )

        self.sending_chain_length += 1

        return EncryptedMessage(
            header=header,
            nonce=nonce,
            ciphertext=ciphertext
        )

    def decrypt(self, message: EncryptedMessage) -> bytes:
        """
        Decrypt a message, possibly ratcheting.

        1. Check if we need to perform DH ratchet
        2. Derive correct message key (may skip some)
        3. Decrypt message
        """
        header = message.header

        # Check if this is from a new DH ratchet
        if header.dh_public != self._last_received_dh:
            # Perform DH ratchet
            self._dh_ratchet(header.dh_public)

        # Try to decrypt
        try:
            return self._try_decrypt(message)
        except DecryptionError:
            # Try skipped message keys
            key = (header.dh_public, header.message_number)
            if key in self.skipped_message_keys:
                message_key = self.skipped_message_keys.pop(key)
                return chacha20_poly1305_decrypt(
                    message.ciphertext, message_key, message.nonce
                )
            raise

    def _dh_ratchet(self, their_public: bytes):
        """Perform Diffie-Hellman ratchet step"""
        # Store skipped message keys
        while self.receiving_chain_length < MAX_SKIP:
            message_key, self.receiving_chain_key = self._kdf_ck(
                self.receiving_chain_key
            )
            self.skipped_message_keys[
                (self._last_received_dh, self.receiving_chain_length)
            ] = message_key
            self.receiving_chain_length += 1

        # Derive new receiving chain
        dh_output = x25519(self.dh_ratchet_key.private, their_public)
        self.root_key, self.receiving_chain_key = self._kdf_rk(
            self.root_key, dh_output
        )

        # Generate new DH key pair
        self.dh_ratchet_key = generate_key_pair()

        # Derive new sending chain
        dh_output = x25519(self.dh_ratchet_key.private, their_public)
        self.root_key, self.sending_chain_key = self._kdf_rk(
            self.root_key, dh_output
        )

        self._last_received_dh = their_public
        self.sending_chain_length = 0
        self.receiving_chain_length = 0

    def _kdf_rk(self, root_key: bytes, dh_output: bytes) -> Tuple[bytes, bytes]:
        """KDF for root key chain"""
        output = hkdf(
            root_key + dh_output,
            length=64,
            info=b"MeshWave_RK"
        )
        return output[:32], output[32:]

    def _kdf_ck(self, chain_key: bytes) -> Tuple[bytes, bytes]:
        """KDF for message chain"""
        message_key = hmac_sha256(chain_key, b"\x01")
        new_chain_key = hmac_sha256(chain_key, b"\x02")
        return message_key, new_chain_key
```

---

## Complexity Analysis Summary

| Algorithm | Time Complexity | Space Complexity |
|-----------|-----------------|------------------|
| Channel Selection | O(P) | O(P) |
| FSK Encoding | O(n) | O(n × sample_rate) |
| FSK Decoding | O(n log n) | O(n) |
| Byzantine Routing | O((V+E) log V) | O(V) |
| Gossip Merge | O(n) | O(n) |
| CRDT Merge | O(n) | O(n) |
| Double Ratchet Encrypt | O(1) | O(1) |
| Double Ratchet Decrypt | O(skip) | O(skip) |

Where:
- P = number of protocols
- n = data size
- V = vertices (nodes)
- E = edges (connections)
- skip = number of skipped messages

---

*Algorithm Design Document v1.0*
*MeshWave Off-Network Communication Protocol*
*Claude Flow V3 SPARC System*
