# System Design Document: TicketHub Ticketing Platform

## 1. Requirements

### Functional Requirements
* **Event Discovery:** Users can browse upcoming concerts, events, and venue details.
* **Seat Selection:** Users can view a real-time, interactive seat map showing available, held, and booked seats.
* **Temporary Holds:** Users can place a temporary 10-minute hold on selected seats during checkout to prevent others from buying them.
* **Payment Processing:** Users can complete payment to finalize ticket purchases.
* **Order History:** Users can view their booked tickets and purchase history.

### Non-Functional Requirements
* **Correctness (Zero Double-Booking):** Absolute consistency; under no circumstances can two users successfully book the same seat.
* **Fairness & Throttling:** During high-demand flash sales, a virtual waiting room queue must ensure fair-access ordering (first-come, first-served) without crashing backend services.
* **Speed & Latency:** 
  * Event browsing and static asset delivery must load in under $300\text{ms}$.
  * Seat map status checks must be highly responsive using caching layers.
* **Availability:** High availability ($99.99\%$) during massive traffic spikes.

---

## 2. Traffic Estimates

### Baseline (Normal Day)
* **Registered Users:** $2,000,000$
* **Daily Active Visitors:** $50,000$ visitors/day.
* **Page Views:** $50,000 \times 10 \text{ pages} = 500,000 \text{ views/day}$.
* **Average Request Rate (RPS):** $\frac{500,000}{86,400\text{ seconds}} \approx 5.8\text{ requests/sec}$.
* **Tickets Sold:** $5,000\text{ tickets/day}$.

### Peak ("Big Sale" Flash Event)
* **Event Scenario:** A popular concert goes on sale, attracting $200,000$ concurrent buyers competing for $20,000$ seats within the first $10$ minutes ($600\text{ seconds}$).
* **Peak Write / Checkout Traffic:** 
  * Inflow surge of $200,000$ users hitting the checkout/hold gateway.
  * Average peak concurrency during the initial rush requires handling hundreds of database writes/sec guarded by rate limiters and queues.
* **Comparison:** Normal traffic is light ($\sim 6\text{ RPS}$), whereas the flash sale creates a concentrated spike multiplying normal read/write concurrency exponentially, requiring a virtual waiting room to smooth out the influx.

---

## 3. API Design

### 1. Browse Events
* **Endpoint:** `GET /api/v1/events`
* **Query Parameters:** `page`, `limit`, `category`
* **Response:** List of upcoming events with metadata and pricing.

### 2. View Event Seats
* **Endpoint:** `GET /api/v1/events/{eventId}/seats`
* **Response:** Real-time array of seat objects with their status (`available`, `held`, `booked`).

### 3. Hold Seats (Checkout Initialization)
* **Endpoint:** `POST /api/v1/seats/hold`
* **Payload:** `{ "userId": 123, "eventId": 45, "seatIds": [101, 102] }`
* **Response:** Status `201 Created` with a `holdToken` and expiration timestamp (e.g., 10 minutes).

### 4. Process Payment & Finalize Order
* **Endpoint:** `POST /api/v1/orders/checkout`
* **Payload:** `{ "userId": 123, "holdToken": "abc-xyz-token", "paymentDetails": { ... } }`
* **Response:** Status `200 OK` confirming order creation and ticket issuance.

### 5. View User Tickets
* **Endpoint:** `GET /api/v1/users/{userId}/tickets`
* **Response:** List of purchased tickets and receipts for the user.

---

## 4. Data Model

### Tables and Schema Relationships

| Table Name | Primary Key | Key Columns | Relationships |
| :--- | :--- | :--- | :--- |
| `users` | `id` | `email`, `password_hash`, `created_at` | Has many `orders` |
| `events` | `id` | `title`, `description`, `date`, `venue`, `total_seats` | Has many `seats`, has many `orders` |
| `seats` | `id` | `event_id`, `seat_number`, `status` (`available`, `held`, `booked`), `version_id` | Belongs to `events`, referenced in `orders` |
| `orders` | `id` | `user_id`, `event_id`, `total_amount`, `payment_status`, `created_at` | Belongs to `users` and `events` |

---

## 5. Preventing Double-Booking

To guarantee that two users can never purchase the same seat, TicketHub uses a strict **two-phase transactional defense mechanism**:

1. **Atomic Conditional Updates & Row-Level Locking:** When a user attempts to hold or purchase a seat, the database executes an atomic transaction:
   ```sql
   UPDATE seats 
   SET status = 'held', version_id = version_id + 1 
   WHERE id = 101 AND status = 'available';

## 6. Architecture digram and howit escapes big scales
[ Clients / Users ] 
        │
        ▼
[ Cloudflare CDN (Static Assets & DDOS Protection) ]
        │
        ▼
[ Nginx Load Balancer / API Gateway ]
        │
        ├──────► [ Virtual Waiting Room Queue (Redis / RabbitMQ) ] (Throttles Flash Sale Traffic)
        │
        ▼
[ Application Servers (Node.js / Python FastAPI Cluster) ]
        │
        ├──► [ Redis Cache ] (Fast Seat Map Status & Session State)
        │
        └──► [ PostgreSQL Primary Database ] (ACID Transactions & Strict Constraints)
                     │
                     └──► [ Read Replicas ] (For Event Browsing & Search)

## .Surviving the Big Sale:
Waiting Room Queue: Instead of letting all 200,000 users hit the servers at once, users are assigned a position in a virtual waiting room queue (managed via Redis sorted sets), letting them through in controlled batches.

Read/Write Splitting: Event browsing queries are offloaded to database read replicas and cached in Redis, preserving primary database IOPS exclusively for transactional seat holds and checkouts.

## 7. Trade-offs Considered
Trade-off 1: Virtual Waiting Room vs. Pure First-Come Open Access

Choice: Implementing a virtual waiting room queue.

Trade-off: Introduces slight friction and waiting time for users, but protects infrastructure from catastrophic failure and ensures fair ordering.

Trade-off 2: Pessimistic Locking vs. Optimistic Conditional Updates

Choice: Optimistic/Conditional updates with status checks (status = 'available').

Trade-off: Reduces lock contention and keeps read performance high for seat maps, but requires careful retry logic on the frontend if a user's selected seat is claimed milliseconds prior.