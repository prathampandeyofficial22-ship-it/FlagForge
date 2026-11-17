# FlagForge — Feature Flag & Release Management Platform

FlagForge is a production-grade, developer-first SaaS platform for remote feature flag control, progressive canary percentage rollouts, user cohort targeting, and emergency kill switches. It empowers engineering teams to decouple deployments from releases and test in production with complete confidence.

---

## Key Capabilities

- **Deterministic Canary Rollouts**: Stable, uniform user cohort assignment using MurmurHash3 ($O(1)$ computation without database flapping or user state persistence).
- **Advanced Targeting Engine**: Evaluates conditions with operators (`equals`, `contains`, `startsWith`, `endsWith`, `greaterThan`, `lessThan`, `in`, `notIn`) combined via `AND`/`OR` rules with priority ranking.
- **Multi-Environment Isolation**: Complete workspace isolation across `Development`, `Staging`, and `Production` with separate cryptographically hashed SDK keys.
- **Sub-Millisecond Evaluation & Invalidation**: Multi-tier Redis and in-memory caching with immediate cache invalidation on configuration updates and kill switches.
- **Emergency Kill Switch**: Instant one-click feature disable that bypasses all rules and purges all distributed caches in real time.
- **Immutable Append-Only Audit Trail**: Full forensic tracking of all actor actions, timestamps, and before/after diff snapshots.
- **Zero-Dependency Node.js SDK**: Standalone `@flagforge/node-sdk` with local memory caching, timeouts, and safe offline fallbacks.
- **Refined B2B Developer Interface**: Matte dark theme inspired by Linear and Vercel with zero neon gradients, fake metrics, or non-functional controls.

---

## Architecture & System Design

```mermaid
flowchart TD
    subgraph ClientApps["Client Applications & Microservices"]
        NodeApp["Node.js Service\n(@flagforge/node-sdk)"]
        BrowserApp["Frontend Client\n(Evaluation API)"]
    end

    subgraph ManagementUI["FlagForge Management Portal (React + Vite + Tailwind)"]
        UI["Linear-Style Dark Dashboard\n(TanStack Query + Recharts)"]
    end

    subgraph Gateway["API Gateway Layer (Express.js + TypeScript)"]
        Security["Helmet + CORS + Rate Limiter + Zod Validator"]
        AuthMiddleware["JWT Session & RBAC Auth Middleware"]
        SDKAuth["SDK Key Authenticator (SHA-256 Hash Verification)"]
    end

    subgraph CoreServices["Domain Services (Clean Architecture)"]
        AuthService["Auth & Organization Service"]
        ProjectService["Project & Environment Service"]
        FlagService["Feature Flag & Config Service"]
        EvaluationEngine["Rule Engine & MurmurHash3 Bucket Evaluator"]
        AuditService["Append-Only Audit Log Service"]
        AnalyticsService["Real Telemetry Aggregator"]
    end

    subgraph Persistence["Storage & Caching Layer"]
        RedisCache[("Redis Cluster / In-Memory Cache\n- Low-Latency Evaluation Cache\n- Distributed Cache Busting")]
        MongoDB[("MongoDB Primary\n- Users, Orgs, Projects, Environments\n- Flags, Targeting Rules, Audit Logs")]
    end

    NodeApp -->|X-Environment-Key (SHA-256)| SDKAuth
    BrowserApp -->|X-Environment-Key| SDKAuth
    UI -->|Bearer JWT Session| AuthMiddleware

    SDKAuth --> EvaluationEngine
    AuthMiddleware --> AuthService
    AuthMiddleware --> ProjectService
    AuthMiddleware --> FlagService
    AuthMiddleware --> AuditService
    AuthMiddleware --> AnalyticsService

    EvaluationEngine -->|Check Cache Hit (TTL 60s)| RedisCache
    EvaluationEngine -->|Cache Miss Fallback| MongoDB
    FlagService -->|Bust Cache on Toggle / Kill Switch| RedisCache
    FlagService --> MongoDB
    AuditService --> MongoDB
    AnalyticsService --> MongoDB
```

---

## Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite, TypeScript, Tailwind CSS, TanStack Query, React Router DOM, Lucide React, Recharts |
| **Backend** | Node.js, Express.js, TypeScript, Mongoose, Zod, Bcrypt, JWT, Helmet, Express-Rate-Limit, Swagger UI |
| **Database & Cache** | MongoDB (Compound Unique Indexes, Soft Archiving), Redis (TTL Caching & Pub/Sub Invalidation) |
| **SDK** | `@flagforge/node-sdk` (Native TypeScript, zero heavy dependencies, MurmurHash3, AbortController timeouts) |
| **Testing** | Vitest, Supertest, MongoMemoryServer, ioredis-mock |
| **DevOps & Containers**| Docker, Docker Compose, GitHub Actions CI |

---

## Repository Structure

```
FlagForge/
├── .github/workflows/ci.yml       # Automated GitHub Actions CI workflow
├── docker-compose.yml             # Local MongoDB, Redis, Server & Client orchestration
├── docs/architecture.md           # System design specifications and schema blueprint
├── packages/
│   └── sdk/                       # @flagforge/node-sdk standalone package
│       ├── src/
│       │   ├── client.ts          # FlagForgeClient with in-memory caching & fallbacks
│       │   ├── hash.ts            # MurmurHash3 deterministic bucket calculation
│       │   ├── types.ts           # Evaluation types & client options
│       │   └── index.ts           # Exports
│       └── test/                  # SDK unit tests
├── examples/
│   └── node-app/                  # Real working express demo app using the SDK
├── server/                        # Backend REST API & Evaluation Engine
│   ├── src/
│   │   ├── config/                # Environment variables, database, redis, index sync
│   │   ├── controllers/           # HTTP controllers
│   │   ├── docs/                  # OpenAPI / Swagger specification
│   │   ├── engine/                # Core rule evaluator & MurmurHash3 algorithm
│   │   ├── middleware/            # JWT auth, RBAC, SDK Key auth, Zod validation
│   │   ├── models/                # Mongoose models & compound indexes
│   │   ├── routes/                # Express router definitions
│   │   ├── services/              # Domain business logic & telemetry aggregation
│   │   └── utils/                 # Hashing, structured logger, custom AppErrors
│   └── test/                      # Vitest test suites (Auth, Projects, Flags, E2E SDK)
└── client/                        # Frontend Management Application
    └── src/
        ├── api/                   # API client bindings
        ├── components/            # Reusable UI library (Button, Dialog, Badge, Switch)
        ├── context/               # AuthContext & organization state
        └── pages/                 # Flags, Detail/Targeting, Environments, Audit, Analytics
```

---

## Local Installation & Quick Start

### Prerequisites
- Node.js (v20+ or v22 LTS)
- npm (v10+)
- Docker & Docker Compose (optional, for running local MongoDB & Redis containers)

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/your-username/FlagForge.git
cd FlagForge

# Install monorepo dependencies across all workspaces
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Key environment configurations:
```env
PORT=4000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/flagforge
REDIS_URL=redis://localhost:6379
REDIS_ENABLED=false # Set to true when Redis server is running
JWT_SECRET=super-secret-flagforge-jwt-key-min-32-chars
```

*(Note: If `REDIS_ENABLED` is false, FlagForge seamlessly and automatically utilizes an in-memory cache fallback, so you can run and test the application immediately without starting external Redis).*

### 3. Start Database via Docker (Optional)
```bash
docker compose up -d mongodb redis
```

### 4. Build the Standalone SDK
```bash
npm run build:sdk
```

### 5. Start Development Servers
Run the backend API and frontend in parallel:
```bash
# Terminal 1: Backend API (port 4000)
npm run dev:server

# Terminal 2: Frontend Dashboard (port 5173)
npm run dev:client
```

Open your browser at `http://localhost:5173`.
Interactive Swagger API documentation is available at `http://localhost:4000/api/docs`.

---

## Running Automated Tests

FlagForge features automated test suites covering authentication, RBAC authorization, project isolation, flag CRUD, rule targeting, canary percentage rollouts, and live end-to-end SDK evaluation against an in-memory backend.

```bash
# Run server test suites (Vitest + MongoMemoryServer)
npm run test:server

# Run SDK unit tests
npm run test:sdk

# Run all test suites across the monorepo
npm test
```

---

## Node.js SDK Integration Guide

### 1. Install Package
```bash
npm install @flagforge/node-sdk
```

### 2. Initialization & Usage
```typescript
import { FlagForgeClient } from '@flagforge/node-sdk';

// Initialize with environment SDK key
const flagforge = new FlagForgeClient({
  apiKey: 'ff_server_production_xxxxxxxxxxxxxxxx',
  baseUrl: 'https://api.flagforge.io/api/v1', // or http://localhost:4000/api/v1
  enableLocalCache: true,
  cacheTtlMs: 60000, // 60s in-memory cache
  timeoutMs: 3000,   // Safe 3s network timeout
  offlineFallback: {
    'ai-recommendations': false,
  },
});

// Evaluate a boolean flag for user
const isEnabled = await flagforge.isEnabled('ai-recommendations', {
  key: 'user_12345',
  attributes: {
    country: 'CA',
    email: 'developer@acme.com',
    plan: 'enterprise',
  },
});

if (isEnabled) {
  // Execute feature code
} else {
  // Execute fallback code
}
```

### 3. Run the Included Example App
```bash
npm run dev --workspace=flagforge-example-node-app
# Visit: http://localhost:3001/checkout?userId=user_10&country=CA
```

---

## Production Deployment

### Docker Orchestration
To deploy the entire production stack (Frontend Nginx, Backend API, MongoDB, and Redis) with a single command:
```bash
docker compose up -d --build
```

### Cloud Deployment (MongoDB Atlas & Hosted Redis)
1. Provision a MongoDB cluster on MongoDB Atlas and set `MONGODB_URI`.
2. Provision a Redis instance (Upstash / Redis Cloud) and set `REDIS_URL` with `REDIS_ENABLED=true`.
3. Deploy the `server` Docker container on any container platform (Railway, Render, AWS ECS, Fly.io).
4. Deploy the `client/dist` static build to Vercel, Netlify, or Cloudflare Pages with `VITE_API_URL` pointing to your backend domain.

---

## Role-Based Access Control (RBAC) Matrix

| Permission | Owner | Admin | Developer | Viewer | SDK Key |
| :--- | :---: | :---: | :---: | :---: | :---: |
| Delete Workspace Organization | Yes | No | No | No | No |
| Invite / Manage Members | Yes | Yes | No | No | No |
| Rotate SDK Credentials | Yes | Yes | No | No | No |
| Create / Archive Flags | Yes | Yes | Yes | No | No |
| Configure Rules & Rollouts | Yes | Yes | Yes | No | No |
| Emergency Kill Switch | Yes | Yes | Yes | No | No |
| View Flags, Metrics & Audits | Yes | Yes | Yes | Yes | No |
| Evaluate via Evaluation API | No | No | No | No | Yes |

---

## Known Limitations & Future Enhancements

- **Multivariate Variants**: Currently boolean feature flags are fully supported; JSON and numeric variant schemas are planned for upcoming releases.
- **Client Web SDK**: Browser and mobile client SDKs using the `ff_client_...` key with SSE (Server-Sent Events) live streaming updates.
- **Webhook Integrations**: Slack/Discord alert webhooks on emergency kill switch activations.

---

## License

MIT © FlagForge Team
