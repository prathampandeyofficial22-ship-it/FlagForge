# PDF Builder - Modules 9 to 12
from reportlab.platypus import Paragraph, Spacer, PageBreak, Table, TableStyle
from reportlab.lib import colors
from .styles import (
    make_p, make_h1, make_h2, make_h3, make_callout, make_code_block,
    make_table, make_spacer, make_divider
)

def build_modules_9_to_12():
    elements = []
    
    # ==========================================
    # MODULE 9: RULE ENGINE & MURMURHASH3 ROLLOUT
    # ==========================================
    elements.append(make_h1("Module 9: Rule Engine & MurmurHash3 Rollout Engine", "MODULE 09"))
    elements.append(make_divider('#2563eb', 1.5))
    
    elements.append(make_h2("9.1 Targeting Rule Engine & Supported Operators"))
    elements.append(make_p(
        "<code>server/src/engine/rule-engine.ts</code> me flexible targeting engine implemented hai jo incoming user context attributes "
        "(jaise email, role, plan, country, version) ke against conditions check karta hai. Ye 9 production operators support karta hai:"
    ))
    
    op_headers = ["Operator", "Type Support", "Evaluation Logic", "Example Condition"]
    op_rows = [
        ["equals", "String / Number / Boolean", "context[attr] === rule.value", "plan equals 'enterprise'"],
        ["notEquals", "String / Number / Boolean", "context[attr] !== rule.value", "role notEquals 'guest'"],
        ["contains", "String", "String(context[attr]).includes(rule.value)", "email contains '@google.com'"],
        ["startsWith", "String", "String(context[attr]).startsWith(rule.value)", "userId startsWith 'beta_'"],
        ["endsWith", "String", "String(context[attr]).endsWith(rule.value)", "email endsWith '@company.dev'"],
        ["greaterThan", "Number", "Number(context[attr]) > Number(rule.value)", "orderCount greaterThan 50"],
        ["lessThan", "Number", "Number(context[attr]) < Number(rule.value)", "appVersion lessThan 3.0"],
        ["in", "Array / Set", "rule.value.includes(context[attr])", "country in ['IN', 'US', 'UK']"],
        ["notIn", "Array / Set", "!rule.value.includes(context[attr])", "country notIn ['CN', 'RU']"]
    ]
    elements.append(make_table(op_headers, op_rows, [80, 110, 190, 160]))
    elements.append(make_spacer(8))
    
    elements.append(make_h2("9.2 Deterministic MurmurHash3 Rollout Mathematics"))
    elements.append(make_p(
        "<b>Kyun MurmurHash3? Kyun nahi Math.random() ya MD5?</b><br/>"
        "• <code>Math.random()</code>: Flapping create karta hai! User page refresh karega toh kabhi flag true aayega, kabhi false. Horrible UX.<br/>"
        "• <code>MD5 / SHA-256</code>: Cryptographic hashes CPU-heavy hote hain. Hot path evaluation me 10,000 req/sec handle karne ke liye excessive latency introduce karte hain.<br/>"
        "• <b>MurmurHash3:</b> Non-cryptographic, 32-bit integer hash hai jo nanoseconds me compute hota hai, uniform distribution guarantee karta hai, aur avalanche effect deta hai."
    ))
    
    hash_code = """// server/src/engine/evaluator.ts
export function getRolloutBucket(flagKey: string, entityId: string): number {
  // Flag key aur entityId ko combine karte hain taaki different flags me independent distribution mile
  const combinedKey = `${flagKey}:${entityId}`;
  const hash = murmurhash3(combinedKey, 0); // Seed = 0
  
  // 32-bit integer ko absolute karke 0 se 9999 range me normalize karte hain, phir 100 se divide karte hain
  const bucket = (Math.abs(hash) % 10000) / 100;
  return bucket; // Returns a float between 0.00 and 99.99
}"""
    elements.append(make_code_block(hash_code))
    elements.append(make_spacer(6))
    
    elements.append(make_h3("Mathematical Proof: Zero User Flapping (No Degradation)"))
    elements.append(make_p(
        "Maan lijiye user <code>usr_55</code> aur flag <code>new-checkout</code> ka combined key hash hota hai aur bucket value <code>18.42</code> aati hai:<br/>"
        "• <b>Rollout 10%:</b> <code>18.42 &lt; 10</code> =&gt; <code>false</code><br/>"
        "• <b>Rollout 25%:</b> <code>18.42 &lt; 25</code> =&gt; <code>true</code> (User gets feature)<br/>"
        "• <b>Rollout 50%:</b> <code>18.42 &lt; 50</code> =&gt; <code>true</code> (User STILL gets feature)<br/>"
        "• <b>Rollout 100%:</b> <code>18.42 &lt; 100</code> =&gt; <code>true</code><br/>"
        "Notice karo: Jaise-jaise rollout badhta hai, koi bhi user jo pehle <code>true</code> tha, wo kabhi wapas <code>false</code> nahi hota! Is mathematical monotonicity ko <b>Monotonic Sticky Assignment</b> kehte hain."
    ))
    elements.append(make_spacer(8))
    
    # ==========================================
    # MODULE 10: REDIS CACHING & HOT-PATH LATENCY
    # ==========================================
    elements.append(make_h1("Module 10: Redis Caching Strategy & Sub-Millisecond Hot Path", "MODULE 10"))
    elements.append(make_divider('#2563eb', 1.5))
    
    elements.append(make_p(
        "Production environment me agar 10,000 req/sec direct MongoDB pe bheje jayenge toh database connection pool choke ho jayega. "
        "FlagForge me <b>Dual-Layer Hot Path Caching</b> implement ki gayi hai:"
    ))
    elements.append(make_p(
        "1. <b>Cache Key Topology:</b> <code>flag:{projectId}:{envKey}:{flagKey}</code>. For example: <code>flag:proj_abc:production:dark-mode</code>.<br/>"
        "2. <b>Time-To-Live (TTL):</b> 60 seconds. Stale ghost data se bachata hai agar network split ho jaye.<br/>"
        "3. <b>Dual-Layer Fallback:</b> Agar Redis cluster network partition ki wajah se unreachable ho jaye, toh <code>redis.service.ts</code> automatically in-memory local <code>Map</code> fallback pe degrade ho jata hai without throwing errors.<br/>"
        "4. <b>Cache Invalidation (Event-Driven):</b> Jab bhi developer flag edit karta hai ya Kill Switch dabata hai, service <code>cache.del(key)</code> aur <code>cache.delPattern('flag:*')</code> execute karti hai. Agli request fresh data read karti hai."
    ))
    elements.append(make_spacer(8))
    
    # ==========================================
    # MODULE 11: NODE.JS SDK ARCHITECTURE
    # ==========================================
    elements.append(make_h1("Module 11: Standalone Node.js SDK Architecture & Offline Resilience", "MODULE 11"))
    elements.append(make_divider('#2563eb', 1.5))
    
    elements.append(make_p(
        "FlagForge ka ek core portfolio differentiator hai iska standalone client package: <b><code>@flagforge/node-sdk</code></b> (located in <code>packages/sdk/</code>). "
        "External developers ko REST API manually call karne ki zaroorat nahi hoti; wo simply SDK install karte hain:"
    ))
    
    sdk_code = """// External Application Usage
import { FlagForgeClient } from '@flagforge/node-sdk';

const client = new FlagForgeClient({
  sdkKey: 'ff_live_a89f92c10b7...',
  baseUrl: 'https://api.flagforge.io',
  cacheTtlMs: 30000,    // Local memory cache for 30 seconds
  timeoutMs: 2000       // Max 2 sec wait time
});

// Fail-Safe Feature Check
const isEnabled = await client.isEnabled('ai-chat', {
  userId: req.user.id,
  attributes: { plan: req.user.plan, email: req.user.email }
}, false); // Fallback: false if network fails

if (isEnabled) {
  return renderAiChat();
} else {
  return renderStandardChat();
}"""
    elements.append(make_code_block(sdk_code))
    elements.append(make_spacer(6))
    
    elements.append(make_callout(
        "<b>SDK Offline Resilience & Zero-Crash Contract:</b><br/>"
        "Feature Flag SDKs ka #1 rule hota hai: <i>'Never take down the host application.'</i> Agar FlagForge server offline ho jaye ya timeout ho, "
        "SDK silently fallback value (e.g. <code>false</code>) return karta hai aur internal warning log karta hai. Host server me unhandled exception kabhi throw nahi hoti!",
        "tip", "SDK ENGINEERING EXCELLENCE"
    ))
    elements.append(make_spacer(8))
    
    # ==========================================
    # MODULE 12: MODERN FRONTEND UI ARCHITECTURE
    # ==========================================
    elements.append(make_h1("Module 12: Modern Frontend Architecture & UI Design System", "MODULE 12"))
    elements.append(make_divider('#2563eb', 1.5))
    
    elements.append(make_p(
        "Frontend ko modern developer tools (jaise Linear, Vercel, Stripe) ke high-density standards pe design kiya gaya hai:<br/>"
        "• <b>Matte Dark Theme:</b> Pure pitch-black ke bajaye neutral slate/charcoal tones (<code>#090d16</code>, <code>#0f172a</code>, <code>#1e293b</code>) use kiye gaye hain with crisp borderlines (<code>#334155</code>). No neon or purple AI gradients.<br/>"
        "• <b>TanStack Query (React Query):</b> Server state (flags list, environments, audit history) ko automatically cache karta hai. Jab koi flag toggle hota hai, toh <code>queryClient.invalidateQueries(['flags'])</code> call hota hai taaki UI instantaneously sync rahe.<br/>"
        "• <b>Zero Fabricated Metrics:</b> Dashboard aur Analytics page pe fabricated dummy numbers nahi hain; wo actual evaluations ko Recharts SVG graphs me display karte hain.<br/>"
        "• <b>Targeting Rules Builder Modal:</b> Dynamic condition builder jahan non-technical product managers bhi AND/OR conditions configure kar sakte hain."
    ))
    
    elements.append(PageBreak())
    return elements
