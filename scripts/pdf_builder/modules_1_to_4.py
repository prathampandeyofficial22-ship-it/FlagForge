# PDF Builder - Modules 1 to 4
from reportlab.platypus import Paragraph, Spacer, PageBreak, Table, TableStyle
from reportlab.lib import colors
from .styles import (
    make_p, make_h1, make_h2, make_h3, make_callout, make_code_block,
    make_table, make_spacer, make_divider
)

def build_modules_1_to_4():
    elements = []
    
    # ==========================================
    # MODULE 1: PRODUCT OVERVIEW & INDUSTRY PROBLEM
    # ==========================================
    elements.append(make_h1("Module 1: Product Overview, Industry Problem & Real-World Use Cases", "MODULE 01"))
    elements.append(make_divider('#2563eb', 1.5))
    
    elements.append(make_h2("1.1 FlagForge Kya Hai? (Core Engineering Concept)"))
    elements.append(make_p(
        "<b>FlagForge</b> ek high-throughput, developer-first <b>Feature Flag & Release Management Platform</b> hai. "
        "Simple shabdon me kahein toh ye software engineering teams ke liye ek <b>remote-control dashboard aur evaluation engine</b> provide karta hai, "
        "jisse bina naya code deploy kiye ya server restart kiye kisi bhi feature ko instantly ON ya OFF kiya ja sakta hai, "
        "specific users ya groups ko target kiya ja sakta hai, aur gradual percentage-based rollouts (10%, 25%, 50%, 100%) execute kiye ja sakte hain."
    ))
    elements.append(make_p(
        "<b>Core Principle: Decoupling Deployment from Release</b><br/>"
        "• <b>Deployment:</b> Code ko compile aur build karke production servers/containers pe live chalana.<br/>"
        "• <b>Release:</b> Us feature ko actual end-users ke saamne visible aur usable banana.<br/>"
        "Pehle ye dono ek sath hote the—agar code deploy hua toh feature sabke liye live ho gaya. Feature flags in dono ko alag kar dete hain. "
        "Aap code Friday ko deploy kar sakte ho aur flag 'disabled' rakh sakte ho, phir Monday subah ek button dabakar release kar sakte ho bina deployment risk ke."
    ))
    
    elements.append(make_h2("1.2 Feature Flags Se Pehle Ki Duniya (The Dark Ages of Software Releases)"))
    elements.append(make_p(
        "Feature flags aane se pehle software companies me releases bohot risky hoti thi:<br/>"
        "1. <b>Long-Lived Feature Branches & Merge Hell:</b> Teams alag branches pe mahino kaam karti thi. Merge karte waqt massive conflicts aate the.<br/>"
        "2. <b>Hardcoded Configs & Redeployment:</b> Feature on/off karne ke liye <code>config.json</code> badal kar poora CI/CD pipeline chalana padta tha.<br/>"
        "3. <b>Big Bang Releases (All-or-Nothing):</b> Naya code 100% users ko ek sath milta tha. Agar edge-case crash aaya toh poori app down ho jati thi.<br/>"
        "4. <b>Painful & Slow Rollbacks:</b> Bug aane par git revert + build + Docker build + rollout me <b>25 se 45 minutes</b> lagte the. Tab tak revenue loss hota tha."
    ))
    
    elements.append(make_h2("1.3 FlagForge In Problems Ko Kaise Solve Karta Hai?"))
    elements.append(make_p(
        "FlagForge is pure release lifecycle ko risk-free aur instantaneous bana deta hai:<br/>"
        "• <b>Instant Emergency Kill Switch (&lt;5ms):</b> Production me memory leak ya bug aane par dashboard se ek click me feature off. No deployment needed.<br/>"
        "• <b>Deterministic Canary Rollout (MurmurHash3):</b> Users ko mathematically stable hash buckets me divide karta hai bina DB me state store kiye.<br/>"
        "• <b>Multi-Environment SDK Keys:</b> Development, Staging, aur Production ke beech complete isolation. Staging key Prod me evaluate nahi hogi.<br/>"
        "• <b>Audit Trail (Append-Only):</b> Kis engineer ne kab rollout 10% se 50% kiya, sab immutable log me timestamp aur IP ke sath save hota hai."
    ))
    
    elements.append(make_h2("1.4 Three Real-World Scenarios (Actual Codebase Tracing)"))
    
    elements.append(make_h3("Scenario A: AI Recommendations Canary Rollout (10% Traffic)"))
    elements.append(make_p(
        "<b>Problem:</b> Ek heavy AI recommendation engine launch karna hai. Database connection pool choke na ho isliye pehle sirf 10% users ko dena hai.<br/>"
        "<b>FlagForge Execution Trace:</b><br/>"
        "1. Dashboard pe flag <code>ai-recommendations</code> ka rollout <b>10%</b> configure hota hai.<br/>"
        "2. Application backend <code>POST /api/v1/evaluate</code> call karta hai <code>{ flagKey: 'ai-recommendations', entityId: 'usr_981' }</code>.<br/>"
        "3. <code>server/src/engine/evaluator.ts</code> call karta hai <code>getRolloutBucket('ai-recommendations', 'usr_981')</code>.<br/>"
        "4. MurmurHash3 mathematically return karta hai value: <code>7.42%</code>. Since 7.42 &lt; 10, response aata hai <code>enabled: true</code>.<br/>"
        "5. Jab rollout kal 25% badhaya jayega, <code>usr_981</code> hamesha <code>true</code> hi rahega (Zero Flapping guarantee)!"
    ))
    
    elements.append(make_h3("Scenario B: Production Payment 500 Spike (Emergency Kill Switch)"))
    elements.append(make_p(
        "<b>Problem:</b> Payment Gateway v2 release hui, par UPI server crash hone ki wajah se 500 internal server errors badh gaye.<br/>"
        "<b>FlagForge Execution Trace:</b><br/>"
        "1. On-call engineer dashboard me <code>payment-gateway-v2</code> pe <b>Trigger Kill Switch</b> dabata hai.<br/>"
        "2. <code>FlagService.triggerKillSwitch()</code> DB me <code>killSwitched = true</code> update karta hai aur <code>cache.delPattern()</code> se Redis bust karta hai.<br/>"
        "3. Within 1 millisecond, SDK aur API calls ko <code>enabled: false, reason: 'KILL_SWITCH'</code> milne lagta hai.<br/>"
        "4. External app gracefully fallback karke Stripe v1 pe traffic route kar deti hai. Zero customer checkout failures!"
    ))
    
    elements.append(make_h3("Scenario C: VIP Cohort & Enterprise Beta Targeting"))
    elements.append(make_p(
        "<b>Problem:</b> New analytics dashboard sirf Enterprise tier clients aur internal testers (<code>@flagforge.dev</code>) ko dikhana hai.<br/>"
        "<b>FlagForge Execution Trace:</b><br/>"
        "1. Rule Engine me 2 rules set hain: Rule 1: <code>email endsWith '@flagforge.dev'</code>, Rule 2: <code>tier equals 'enterprise'</code>.<br/>"
        "2. <code>server/src/engine/rule-engine.ts</code> context attributes match karta hai. Match hote hi turant <code>enabled: true, reason: 'RULE_MATCH'</code> return hota hai, standard rollout percentage bypass ho jata hai."
    ))
    
    elements.append(make_h2("1.5 Why FlagForge is NOT a Typical CRUD Application"))
    elements.append(make_p(
        "Interviews me sabse important distinction ye hai:<br/>"
        "1. <b>Algorithmic State vs DB State:</b> Normal CRUD apps me user status DB me store hota hai (e.g. <code>user.hasAccess = true</code>). FlagForge me 10 million users ka status DB me save nahi hota; MurmurHash3 algorithm runtime pe mathematically compute karta hai ($O(1)$ time, 0 DB queries).<br/>"
        "2. <b>High-Throughput Hot-Path (10,000 req/s):</b> Normal CRUD me user clicks pe write hota hai. Feature Flag me har API call pe evaluation hoti hai. Isliye Redis multi-tier caching aur SDK local memory caching implement ki gayi hai.<br/>"
        "3. <b>Zero-Trust Cryptographic Keys:</b> SDK keys plain text me nahi balki SHA-256 hash me store hoti hain."
    ))
    elements.append(make_spacer(8))
    
    # ==========================================
    # MODULE 2: COMPLETE TECHNOLOGY STACK
    # ==========================================
    elements.append(make_h1("Module 2: Complete Technology Stack & Architectural Justifications", "MODULE 02"))
    elements.append(make_divider('#2563eb', 1.5))
    
    elements.append(make_p(
        "FlagForge me use hui har ek dependency aur technology ko deliberate architectural reasoning ke sath chuna gaya hai. "
        "Neeche table me core tech stack ka complete breakdown diya gaya hai:"
    ))
    
    tech_headers = ["Layer / Tech", "Purpose in FlagForge", "Why Chosen? (Architectural Justification)", "Alternatives & Tradeoffs"]
    tech_rows = [
        ["React 18 + Vite", "Control Plane UI Dashboard", "Blazing fast HMR, small bundle size, fast compile time vs legacy CRA.", "Next.js (Overkill for pure authenticated dashboard SPA)."],
        ["TypeScript", "End-to-End Type Safety", "Strict types across Server, Client, and SDK. Prevents runtime schema mismatch bugs.", "JavaScript (Too error-prone for enterprise software)."],
        ["Tailwind CSS", "Design System UI", "Linear/Vercel inspired matte dark theme, zero CSS runtime overhead, consistent tokens.", "MUI/Chakra (Heavy bundle, hard to style matte dark SaaS)."],
        ["TanStack Query", "Client Server State Cache", "Automatic cache invalidation, background refetching, optimistic UI updates.", "Redux (Massive boilerplate, bad for async server state)."],
        ["Node.js + Express", "REST API & Evaluation Server", "Non-blocking event loop ideal for I/O heavy feature flag evaluations (10k req/s).", "Go/Rust (Higher learning curve, TS allows code sharing with SDK)."],
        ["MongoDB + Mongoose", "Primary Document Store", "Flexible JSON document schema for nested targeting rules, audit logs, and environments.", "PostgreSQL (Great, but JSONB queries are less ergonomic than Mongo)."],
        ["Redis (ioredis)", "Hot-Path Evaluation Cache", "Sub-millisecond in-memory cache for compiled flags. Drops latency from 45ms to <2ms.", "Memcached (Lacks pattern-based deletion like delPattern)."],
        ["Zod", "Schema Validation", "Strict request runtime validation for API inputs, infers TypeScript types automatically.", "Joi / Yup (Zod has best-in-class TypeScript inference)."],
        ["Bcrypt + JWT", "Authentication & Sessions", "Bcrypt (12 salt rounds) for password hashing; stateless signed JWT for REST calls.", "Sessions/Cookies (Harder to use with third-party SDKs)."],
        ["Docker Compose", "Multi-Container Dev & Deploy", "Single command setup for MongoDB, Redis, Server, and Client containers.", "Bare metal local installs (Environment mismatch issues)."],
        ["Vitest + Supertest", "Automated Testing", "Blazing fast native TS test runner. 28 automated tests covering hot path and RBAC.", "Jest (Slower, requires ts-jest compilation overhead)."]
    ]
    elements.append(make_table(tech_headers, tech_rows, [85, 125, 185, 145]))
    elements.append(make_spacer(8))
    
    elements.append(make_callout(
        "<b>Interview Defense: 'Why not SQL (PostgreSQL)?'</b><br/>"
        "<i>'PostgreSQL is excellent, but in FlagForge, Feature Flags contain highly dynamic nested structures like targeting rules with variable "
        "operators (equals, contains, in), multiple environment configurations, and variable rollout percentages. "
        "MongoDB's native document model allows us to retrieve and cache the entire flag configuration in a single atomic read without complex multi-table joins.'</i>",
        "tip", "TECH STACK INTERVIEW DEFENSE"
    ))
    elements.append(make_spacer(8))
    
    # ==========================================
    # MODULE 3: COMPLETE DIRECTORY & FILE BREAKDOWN
    # ==========================================
    elements.append(make_h1("Module 3: Project Directory Structure & File-by-File Breakdown", "MODULE 03"))
    elements.append(make_divider('#2563eb', 1.5))
    
    elements.append(make_p(
        "FlagForge ko ek clean <b>Monorepo</b> architecture me organize kiya gaya hai taaki backend server, frontend dashboard, "
        "standalone npm SDK package, aur demo apps ek hi repository me strictly decoupled tareeqe se reside karein:"
    ))
    
    dir_tree = """FlagForge/
├── server/                     # Backend REST API & High-Throughput Evaluation Engine
│   ├── src/
│   │   ├── config/index.ts     # Centralized validated environment configs (PORT, MONGO_URI, REDIS_URL, JWT)
│   │   ├── models/             # Mongoose schemas (User, Org, Project, Environment, FeatureFlag, AuditLog)
│   │   ├── engine/             # Hot-path Evaluation Core (evaluator.ts, murmurhash.ts, rule-engine.ts)
│   │   ├── services/           # Business logic layer (auth, org, project, flag, evaluation, redis, audit)
│   │   ├── controllers/        # Request handling and HTTP status mapping
│   │   ├── routes/             # Express router definitions (/api/v1/...)
│   │   ├── middleware/         # Auth guard, RBAC role guard, Zod request validator, Error handler
│   │   ├── errors/             # Custom error hierarchy (AppError, NotFoundError, UnauthorizedError, etc.)
│   │   ├── utils/logger.ts     # Winston structured logging
│   │   ├── app.ts              # Express application setup, security headers, CORS, rate limiting
│   │   └── server.ts           # Server bootstrap, DB & Redis connection, graceful shutdown hooks
│   └── tests/                  # 7 Vitest test suites (24 tests: auth, org, project, flags, evaluation, hash)
├── client/                     # Control Plane Dashboard (React 18 + Vite + TypeScript + Tailwind)
│   ├── src/
│   │   ├── context/            # AuthContext (JWT & User state), ProjectContext (Active Org & Project)
│   │   ├── services/api.ts     # Axios instance with auto JWT Authorization header injection
│   │   ├── pages/              # Dashboard, Flags, FlagDetail, Environments, AuditLogs, Analytics, Settings
│   │   ├── components/         # Navbar, Sidebar, FlagCard, CreateFlagModal, TargetingRulesModal
│   │   └── App.tsx             # React Router v6 setup with ProtectedRoute guards
├── packages/sdk/               # Standalone npm package (@flagforge/node-sdk)
│   ├── src/
│   │   ├── client.ts           # FlagForgeClient class (in-memory caching, offline resilience, HTTP client)
│   │   ├── types.ts            # Public TypeScript interfaces (EvaluationContext, FlagEvaluation)
│   │   └── index.ts            # Entrypoint export
│   └── tests/                  # SDK Vitest unit & integration tests (4 tests)
├── examples/node-app/          # Real-world external consumer Node.js app demonstrating SDK integration
├── docker/                     # Production Dockerfiles (server.Dockerfile, client.Dockerfile)
├── docker-compose.yml          # Multi-container orchestration (Server, Client, MongoDB, Redis)
└── .github/workflows/ci.yml    # CI/CD pipeline running lint, typecheck, and all 28 automated tests"""
    elements.append(make_code_block(dir_tree))
    elements.append(make_spacer(8))
    
    # ==========================================
    # MODULE 4: HIGH-LEVEL ARCHITECTURE & HOT-PATH
    # ==========================================
    elements.append(make_h1("Module 4: System Architecture & Data Flow Lifecycle", "MODULE 04"))
    elements.append(make_divider('#2563eb', 1.5))
    
    elements.append(make_h2("4.1 Control Plane vs. Evaluation Hot Plane (The Fundamental Architecture)"))
    elements.append(make_p(
        "Ek enterprise feature flag system me do completely distinct architectural planes hote hain:<br/>"
        "• <b>Control Plane (Low Frequency, High Consistency):</b> Dashboard jahan developers flags create/update karte hain, rules change karte hain, aur audit logs dekhte hain. Iski traffic low hoti hai (10-50 req/sec) aur primary database MongoDB hota hai.<br/>"
        "• <b>Evaluation Hot Plane (Extreme High Frequency, Ultra-Low Latency):</b> External user applications jo har web request pe flags evaluate karti hain (10,000+ req/sec). Ye plane kabhi MongoDB ko direct hit nahi karta; ye pure in-memory Redis cache aur MurmurHash3 algorithmic math pe run hota hai (&lt;2ms response time)."
    ))
    
    elements.append(make_h2("4.2 End-to-End Request/Response Lifecycle Walkthrough"))
    elements.append(make_p(
        "Jab koi external Node.js backend client <code>client.isEnabled('dark-mode', { userId: 'usr_102' })</code> execute karta hai, toh internal flow step-by-step kaise kaam karta hai:<br/>"
        "1. <b>SDK In-Memory Cache Check:</b> SDK sabse pehle apne local memory cache me dekhta hai. Agar cache hit hai aur TTL valid hai, toh <b>0ms</b> me result return ho jata hai without any network call.<br/>"
        "2. <b>HTTP POST to Server:</b> Cache miss hone par SDK <code>POST /api/v1/evaluate</code> call karta hai header <code>x-sdk-key: ff_live_...</code> ke sath.<br/>"
        "3. <b>Express Middleware Pipeline:</b><br/>"
        "   - <code>rateLimiter</code> check karta hai ki IP allowed rate me hai ya nahi.<br/>"
        "   - <code>validateRequest</code> Zod schema se payload validation karta hai.<br/>"
        "   - <code>authMiddleware</code> SDK key ka SHA-256 hash nikal kar environment identify karta hai.<br/>"
        "4. <b>Redis Tier:</b> <code>EvaluationService</code> Redis se flag config mangta hai (<code>flag:{projectId}:{env}:{flagKey}</code>). Agar cache hit hai, MongoDB query skip ho jati hai.<br/>"
        "5. <b>Evaluation Engine:</b> <code>evaluator.ts</code> 6-step evaluation funnel execute karta hai (Kill Switch -> Environment Active -> Rule Engine -> MurmurHash3 Rollout).<br/>"
        "6. <b>Asynchronous Telemetry:</b> Evaluation count metric Redis/DB me asynchronously fire-and-forget log hota hai taaki client response block na ho.<br/>"
        "7. <b>Client Return:</b> Response JSON <code>{ enabled: true, flagKey: 'dark-mode', reason: 'ROLLOUT' }</code> SDK ko return hota hai, SDK ise local cache me store kar leta hai."
    ))
    
    elements.append(PageBreak())
    return elements
