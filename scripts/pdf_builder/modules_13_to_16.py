# PDF Builder - Modules 13 to 16
from reportlab.platypus import Paragraph, Spacer, PageBreak, Table, TableStyle
from reportlab.lib import colors
from .styles import (
    make_p, make_h1, make_h2, make_h3, make_callout, make_code_block,
    make_table, make_spacer, make_divider
)

def build_modules_13_to_16():
    elements = []
    
    # ==========================================
    # MODULE 13: SECURITY ARCHITECTURE & THREAT DEFENSE
    # ==========================================
    elements.append(make_h1("Module 13: Security Architecture & Threat Defense", "MODULE 13"))
    elements.append(make_divider('#2563eb', 1.5))
    
    elements.append(make_h2("13.1 Cryptographic SDK Key Storage (Zero-Plaintext Guarantee)"))
    elements.append(make_p(
        "SDK keys third-party applications ke servers pe store hoti hain. Agar database leak ho jaye toh attackers kisi bhi company ki "
        "SDK keys se sensitive features access kar sakte hain. FlagForge me <b>One-Way Hash Cryptography</b> use hoti hai:<br/>"
        "• Key Generation: <code>const rawKey = 'ff_live_' + crypto.randomBytes(24).toString('hex');</code><br/>"
        "• Storage: Database me <code>rawKey</code> kabhi save nahi hota! Uska SHA-256 hash save hota hai: "
        "<code>const hash = crypto.createHash('sha256').update(rawKey).digest('hex');</code><br/>"
        "• Raw key user ko creation time pe <b>sirf ek baar</b> dikhayi jaati hai (just like GitHub personal access tokens)."
    ))
    
    elements.append(make_h2("13.2 Injection & Abuse Defense Mechanisms"))
    elements.append(make_p(
        "• <b>NoSQL Injection Defense:</b> Mongoose schemas aur Zod validation ensure karte hain ki user input strictly typed string/number ho, "
        "taaki attackers MongoDB operators (jaise <code>{ $gt: '' }</code>) inject na kar sakein.<br/>"
        "• <b>Rate Limiting (express-rate-limit):</b> Hot path endpoint <code>/api/v1/evaluate</code> pe strict IP rate limiting hai taaki DDoS attacks se "
        "server crash na ho.<br/>"
        "• <b>CORS & Security Headers:</b> Helmet middleware security headers (CSP, HSTS, X-Content-Type-Options) inject karta hai."
    ))
    elements.append(make_spacer(8))
    
    # ==========================================
    # MODULE 14: END-TO-END RELEASE WALKTHROUGH
    # ==========================================
    elements.append(make_h1("Module 14: End-to-End Walkthrough of a Real Feature Release", "MODULE 14"))
    elements.append(make_divider('#2563eb', 1.5))
    
    elements.append(make_p(
        "Interview me jab pucha jaye ki <i>'Ek release ka real life example trace karke batao'</i>, tab ye 7-step production flow explain karna hai:"
    ))
    
    step_headers = ["Phase", "Action Taken by Team", "System & Codebase Behavior", "Outcome & Safety Net"]
    step_rows = [
        ["Step 1: Create", "Dev creates flag 'checkout-v2'", "Mongoose saves flag with archived: false, audit log entry created.", "Flag is globally created but disabled in all environments."],
        ["Step 2: Staging Test", "Enable in Staging (100% rollout)", "Staging SDK key evaluates flag. QA runs end-to-end payment tests.", "Production remains 100% untouched and safe on checkout-v1."],
        ["Step 3: 10% Prod Canary", "Set Prod rollout: 10%, Rule: tier='enterprise'", "MurmurHash3 buckets users. Only 10% Enterprise users see checkout-v2.", "90% of users experience zero change. Blast radius capped at 10%."],
        ["Step 4: Monitoring", "Inspect Analytics dashboard", "Real-time evaluation charts display 200 vs 500 error distribution.", "Zero error spike detected in production logs."],
        ["Step 5: Expansion", "Promote rollout: 10% -> 50% -> 100%", "MurmurHash3 ensures existing 10% users remain true (Zero Flapping).", "Full production migration without a single server redeployment."],
        ["Step 6: Emergency Drill", "Upstream payment gateway fails. Click Kill Switch", "FlagService sets killSwitched=true, busts Redis cache in <1ms.", "All 100% users immediately fallback to checkout-v1 safely."]
    ]
    elements.append(make_table(step_headers, step_rows, [85, 145, 185, 125]))
    elements.append(make_spacer(8))
    
    # ==========================================
    # MODULE 15: TESTING STRATEGY & VERIFICATION
    # ==========================================
    elements.append(make_h1("Module 15: Testing Strategy & Automated Verification", "MODULE 15"))
    elements.append(make_divider('#2563eb', 1.5))
    
    elements.append(make_p(
        "FlagForge me <b>Vitest</b> native TypeScript test runner use kiya gaya hai. "
        "Codebase me <b>7 test suites aur total 28 automated tests 100% pass</b> hote hain:"
    ))
    
    test_headers = ["Test Suite File", "Tests Count", "What is Verified? (Core Assertions)"]
    test_rows = [
        ["server/tests/auth.test.ts", "4 tests", "User register, password bcrypt hashing, login JWT issuance, duplicate email rejection."],
        ["server/tests/organization.test.ts", "3 tests", "Multi-tenant org creation, RBAC role restrictions (Viewer cannot create projects)."],
        ["server/tests/project.test.ts", "3 tests", "Project creation, auto-generation of Dev/Staging/Prod environments, SDK key hashing."],
        ["server/tests/feature-flag.test.ts", "5 tests", "Flag CRUD, environment toggle isolation, soft delete archiving, quick toggle."],
        ["server/tests/evaluator.test.ts", "4 tests", "Evaluation funnel precedence: Kill Switch priority > Disabled > Rule Engine > Rollout."],
        ["server/tests/murmurhash.test.ts", "3 tests", "Mathematical determinism, bucket range [0, 100), zero user flapping, uniform distribution."],
        ["server/tests/sdk-integration.test.ts", "2 tests", "Live Supertest E2E integration: SDK key auth, single and batch flag evaluations."],
        ["packages/sdk/tests/client.test.ts", "4 tests", "In-memory cache hit (0ms), fallback on 500 error, network timeout resilience."]
    ]
    elements.append(make_table(test_headers, test_rows, [140, 60, 340]))
    elements.append(make_spacer(8))
    
    # ==========================================
    # MODULE 16: COMPLETE SDE INTERVIEW PLAYBOOK
    # ==========================================
    elements.append(make_h1("Module 16: Complete Technical Interview Playbook & Elevator Pitches", "MODULE 16"))
    elements.append(make_divider('#2563eb', 1.5))
    
    elements.append(make_h2("16.1 Project Elevator Pitches (30s, 1m, 3m)"))
    
    elements.append(make_h3("The 30-Second Punchy Pitch (Recruiter / Quick Intro)"))
    elements.append(make_callout(
        "<i>'FlagForge ek production-ready Feature Flag & Release Management platform hai jo cloud applications me deployment ko release se decouple karta hai. "
        "Maine isme MurmurHash3 based deterministic algorithm implement kiya hai jisse zero DB state ke sath 10% se 100% gradual canary rollouts execute hote hain, "
        "aur Redis multi-tier caching ke through sub-5 millisecond hot-path evaluation achieve hoti hai with an emergency kill switch.'</i>",
        "tip", "30-SECOND PITCH"
    ))
    elements.append(make_spacer(6))
    
    elements.append(make_h3("The 1-Minute Technical Pitch (SDE-1 / SDE-2 Technical Round)"))
    elements.append(make_callout(
        "<i>'FlagForge ek high-throughput developer platform hai jise do distinct planes me architect kiya gaya hai: Control Plane aur Evaluation Hot Plane. "
        "Control Plane me teams RBAC ke sath flags create karti hain, complex targeting rules configure karti hain, aur audit trails monitor karti hain. "
        "Evaluation Hot Plane me external applications hamare standalone Node.js SDK ke through flags evaluate karti hain at 10,000 req/sec. "
        "Hot path latency minimize karne ke liye maine dual-tier Redis caching aur in-memory local caching implement ki hai, aur SHA-256 cryptographic hashes ke through "
        "SDK keys authenticate hoti hain. Entire system 100% type-safe TypeScript, Dockerized, aur 28 automated tests ke sath verified hai.'</i>",
        "tip", "1-MINUTE PITCH"
    ))
    elements.append(make_spacer(6))
    
    elements.append(make_h2("16.2 Top 8 Deep Technical Interview Questions & Answers (Hinglish)"))
    
    elements.append(make_h3("Q1: MurmurHash3 me zero flapping kaise guarantee hoti hai?"))
    elements.append(make_p(
        "<b>Answer:</b> <i>'MurmurHash3 ek pure deterministic mathematical function hai: same input <code>`${flagKey}:${entityId}`</code> hamesha exact same 32-bit hash value dega. "
        "Jab hum is hash ko <code>(Math.abs(hash) % 10000) / 100</code> se normalize karte hain, toh har user ko ek fixed bucket milta hai (e.g. 14.5). "
        "Jab rollout 10% se 25% badhta hai, condition <code>14.5 &lt; 25</code> true ho jaati hai. Aur jab 50% hota hai, <code>14.5 &lt; 50</code> ab bhi true rehti hai! "
        "Is monotonically increasing inequality ki wajah se user kabhi flap nahi hota.'</i>"
    ))
    
    elements.append(make_h3("Q2: 10,000 req/s pe Cache Stampede (Dog-Piling) se kaise bachte ho?"))
    elements.append(make_p(
        "<b>Answer:</b> <i>'Agar flag update hote hi Redis key delete ho jaye aur 10,000 concurrent requests ek sath aakar DB hit karein, toh Mongo choke ho sakta hai. "
        "FlagForge ise do tareeqon se prevent karta hai:<br/>"
        "1. <b>SDK In-Memory Cache (First line of defense):</b> SDKs local memory me flag 30 seconds cache rakhte hain, toh har call server tak aati hi nahi.<br/>"
        "2. <b>Write-Through Warming / Mutex Lock:</b> Cache bust karne ke baad backend immediately DB se fresh config read karke Redis ko warm kar deta hai before responding to the dashboard update.'</i>"
    ))
    
    elements.append(make_h3("Q3: Is system ko 10,000 se 100,000+ req/s scale kaise karoge? (System Design)"))
    elements.append(make_p(
        "<b>Answer:</b> <i>'Production me 100k+ req/s scale karne ke liye 3 architectural shifts karenge:<br/>"
        "1. <b>Edge Evaluation (Cloudflare Workers / Lambda@Edge):</b> Evaluation logic (MurmurHash3 + Rules) ko CDN edge pe deploy kar denge. Edge nodes flag rules ko memory me sync rakhenge, so evaluation round-trip latency <b>&lt;1ms</b> ho jayegi without hitting origin server.<br/>"
        "2. <b>Redis Sentinel / Cluster with Read Replicas:</b> Evaluation reads ko multiple read-replicas pe distribute kar denge using consistent hashing.<br/>"
        "3. <b>Streaming Server-Sent Events (SSE) to SDKs:</b> Polling ke bajaye SDKs persistent SSE connection rakhengi, aur flag update hote hi server SDK ko delta push karega.'</i>"
    ))
    
    elements.append(make_h3("Q4: Agar FlagForge server down ho jaye toh host app crash kyun nahi hoti?"))
    elements.append(make_p(
        "<b>Answer:</b> <i>'Hamare standalone <code>@flagforge/node-sdk</code> me <b>Fail-Safe Zero-Crash Contract</b> implemented hai. "
        "Evaluation call ek safe <code>try/catch</code> block me wrapped hai with a strict HTTP timeout (e.g. 2000ms). Agar network timeout ho ya 500 error aaye, "
        "SDK error swallow karke caller ko caller ka diya hua <code>defaultValue</code> (usually <code>false</code>) return karta hai aur logger pe silent warning emit karta hai. "
        "Host application ka runtime execution kabhi disrupt nahi hota.'</i>"
    ))
    
    elements.append(make_spacer(8))
    elements.append(make_callout(
        "<b>Final Interview Advice:</b> Technical round me hamesha real numbers aur concrete file names bolo (e.g. <i>'Maine evaluator.ts me getRolloutBucket function implement kiya hai jo Math.abs(hash) % 10000 / 100 karta hai'</i>). "
        "Ye specificity interviewer ko 100% prove kar deti hai ki aapne poora code khud likha aur deeply samjha hai!",
        "tip", "INTERVIEW WINNING STRATEGY"
    ))
    
    return elements
