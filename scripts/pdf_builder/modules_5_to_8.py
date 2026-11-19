# PDF Builder - Modules 5 to 8
from reportlab.platypus import Paragraph, Spacer, PageBreak, Table, TableStyle
from reportlab.lib import colors
from .styles import (
    make_p, make_h1, make_h2, make_h3, make_callout, make_code_block,
    make_table, make_spacer, make_divider
)

def build_modules_5_to_8():
    elements = []
    
    # ==========================================
    # MODULE 5: BACKEND DEEP DIVE
    # ==========================================
    elements.append(make_h1("Module 5: Backend Deep Dive (Architecture, Layers & Handlers)", "MODULE 05"))
    elements.append(make_divider('#2563eb', 1.5))
    
    elements.append(make_h2("5.1 Clean Layered Architecture Pattern"))
    elements.append(make_p(
        "FlagForge backend ko strict <b>Layered Architecture</b> me design kiya gaya hai jisme concerns isolated rehte hain:<br/>"
        "• <b>Routes Layer (<code>server/src/routes/</code>):</b> Endpoint definitions aur middleware orchestration (auth guard, rate limit, validation).<br/>"
        "• <b>Controllers Layer (<code>server/src/controllers/</code>):</b> Request parameters extract karta hai, service method call karta hai, aur standard HTTP status codes (200, 201, 204) ke sath JSON response format karta hai.<br/>"
        "• <b>Services Layer (<code>server/src/services/</code>):</b> Core business logic, transactional updates, cache invalidation, aur audit logging coordinate karta hai.<br/>"
        "• <b>Engine Core (<code>server/src/engine/</code>):</b> Pure stateless evaluation functions (MurmurHash3, Rule matcher) jinka database se koi tight coupling nahi hota.<br/>"
        "• <b>Models Layer (<code>server/src/models/</code>):</b> Mongoose document schemas, database validation rules, aur performance compound indexes."
    ))
    
    elements.append(make_h2("5.2 Custom Error Hierarchy (Clean Exception Handling)"))
    elements.append(make_p(
        "Production applications me raw errors ya stack traces expose karna security vulnerability hoti hai. "
        "FlagForge me <code>server/src/errors/index.ts</code> me standard <code>AppError</code> hierarchy implement ki gayi hai:"
    ))
    
    error_code = """// server/src/errors/index.ts
export class AppError extends Error {
  constructor(public message: string, public statusCode: number = 500, public isOperational: boolean = true) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class NotFoundError extends AppError { constructor(msg = 'Resource not found') { super(msg, 404); } }
export class UnauthorizedError extends AppError { constructor(msg = 'Unauthorized access') { super(msg, 401); } }
export class ForbiddenError extends AppError { constructor(msg = 'Insufficient permissions') { super(msg, 403); } }
export class ConflictError extends AppError { constructor(msg = 'Resource conflict') { super(msg, 409); } }
export class BadRequestError extends AppError { constructor(msg = 'Invalid request data') { super(msg, 400); } }"""
    elements.append(make_code_block(error_code))
    elements.append(make_spacer(6))
    
    elements.append(make_h2("5.3 Centralized Error Handling Middleware"))
    elements.append(make_p(
        "<code>server/src/middleware/errorHandler.ts</code> Express application ka last middleware hai. "
        "Agar error operational hai (jaise <code>NotFoundError</code> ya <code>ForbiddenError</code>), toh exact status code aur message bhejta hai. "
        "Agar unexpected runtime crash (e.g. database disconnect) ho, toh production me generic 500 message bhejta hai taaki internal DB credentials leak na hon."
    ))
    elements.append(make_spacer(8))
    
    # ==========================================
    # MODULE 6: DATABASE ARCHITECTURE & MONGODB SCHEMAS
    # ==========================================
    elements.append(make_h1("Module 6: Database Architecture & MongoDB Schemas", "MODULE 06"))
    elements.append(make_divider('#2563eb', 1.5))
    
    elements.append(make_p(
        "FlagForge me 7 primary MongoDB collections hain jo production-grade indexes aur relational references se optimized hain:"
    ))
    
    schema_headers = ["Collection / Model", "Key Fields & Types", "Indexes & Performance Optimization"]
    schema_rows = [
        ["User", "email (unique string), passwordHash, name, role (owner/admin/dev/viewer), isVerified", "Unique index on email. Password hashed with Bcrypt (12 rounds)."],
        ["Organization", "name, slug (unique), ownerId (ref User), plan (free/pro/enterprise)", "Index on slug for fast multi-tenant lookup."],
        ["Project", "name, key (unique slug), organizationId (ref Org), description", "Compound index { organizationId: 1, key: 1 } prevents project name collision."],
        ["Environment", "name, key (development/staging/production), projectId, sdkKeyHash, sdkKeyPrefix", "Unique compound index { projectId: 1, key: 1 }. Index on sdkKeyHash for fast auth."],
        ["FeatureFlag", "key, name, projectId, tags, archived, environments (Map with enabled, rollout, rules)", "Compound index { projectId: 1, key: 1, archived: 1 } for sub-millisecond query."],
        ["AuditLog", "organizationId, projectId, userId, action, entityType, beforeSnapshot, afterSnapshot", "Indexed on { projectId: 1, createdAt: -1 } for fast audit timeline pagination."],
        ["EvaluationMetric", "projectId, environmentId, flagKey, enabledCount, disabledCount, dateBucket", "Compound index { projectId: 1, flagKey: 1, dateBucket: 1 } for aggregate charts."]
    ]
    elements.append(make_table(schema_headers, schema_rows, [90, 250, 200]))
    elements.append(make_spacer(6))
    
    elements.append(make_h2("6.1 Soft Deletes (Archiving vs Hard Deletion)"))
    elements.append(make_p(
        "FlagForge feature flags ko database se kabhi permanently DELETE nahi karta. Flag me <code>archived: true</code> set hota hai. "
        "<b>Kyun?</b> Agar aap production flag ko hard delete kar doge, toh external apps jo SDK call kar rahi hain unka code crash ho sakta hai, "
        "aur historical Audit Logs me foreign key reference dangling ho jayegi. Soft delete ensures historical immutability."
    ))
    elements.append(make_spacer(8))
    
    # ==========================================
    # MODULE 7: AUTHENTICATION, AUTHORIZATION & RBAC
    # ==========================================
    elements.append(make_h1("Module 7: Authentication, Authorization & Multi-Tenant RBAC", "MODULE 07"))
    elements.append(make_divider('#2563eb', 1.5))
    
    elements.append(make_h2("7.1 Dual Authentication Strategy"))
    elements.append(make_p(
        "FlagForge me do alag authentication mechanisms kaam karte hain:<br/>"
        "1. <b>Human Dashboard Users (JWT):</b> Developers login karte hain email/password se. Server <code>jsonwebtoken</code> se HMAC SHA-256 signed access token generate karta hai. "
        "Token header <code>Authorization: Bearer &lt;token&gt;</code> ke through bheja jata hai.<br/>"
        "2. <b>Machine / SDK Applications (SDK Keys):</b> External backend servers jo flags evaluate karte hain wo JWT se login nahi karte. Wo header <code>x-sdk-key: ff_live_...</code> bhejte hain. "
        "Server DB me plaintext key store nahi karta, balki SHA-256 hash verify karta hai."
    ))
    
    elements.append(make_h2("7.2 Multi-Tenant Role-Based Access Control (RBAC)"))
    elements.append(make_p(
        "<code>server/src/middleware/role.middleware.ts</code> me <code>requireRole(['owner', 'admin'])</code> guard implement hai. "
        "Char distinct roles hain:"
    ))
    
    rbac_headers = ["Role", "Permissions", "Allowed Operations"]
    rbac_rows = [
        ["Owner", "Full Administrative Authority", "Organization delete, billing, transfer ownership, invite Admins."],
        ["Admin", "Project & Environment Management", "Create/Delete projects, rotate SDK keys, manage members."],
        ["Developer", "Feature Management & Releases", "Create flags, toggle flags, edit targeting rules, trigger kill switch."],
        ["Viewer", "Read-Only Observability", "View flags, inspect audit logs, view analytics charts. Cannot mutate state."]
    ]
    elements.append(make_table(rbac_headers, rbac_rows, [80, 180, 280]))
    elements.append(make_spacer(8))
    
    # ==========================================
    # MODULE 8: EVALUATION PRECEDENCE & FUNNEL
    # ==========================================
    elements.append(make_h1("Module 8: Feature Flag Evaluation Precedence Funnel", "MODULE 08"))
    elements.append(make_divider('#2563eb', 1.5))
    
    elements.append(make_p(
        "Jab bhi FlagForge ke evaluation engine ko koi request milti hai, wo ek <b>strict 6-step evaluation funnel</b> follow karta hai. "
        "Ye funnel ensure karta hai ki emergency safety checks sabse pehle chalein aur expensive evaluation steps tabhi run hon jab zaroori ho:"
    ))
    
    funnel_headers = ["Step #", "Evaluation Funnel Check", "Condition & Logic", "Exit Reason if Triggered"]
    funnel_rows = [
        ["Step 1", "Existence & Archive Check", "Agar flag DB/Cache me nahi hai ya archived == true", "enabled: false, reason: 'ARCHIVED' / 'NOT_FOUND'"],
        ["Step 2", "Emergency Kill Switch", "Agar envConfig.killSwitched === true (Immediate halt)", "enabled: false, reason: 'KILL_SWITCH'"],
        ["Step 3", "Environment Master Toggle", "Agar envConfig.enabled === false (Feature turned off)", "enabled: false, reason: 'DISABLED'"],
        ["Step 4", "Targeting Rule Match", "User context attributes match ordered rules (AND/OR)", "enabled: rule.variation, reason: 'RULE_MATCH'"],
        ["Step 5", "Deterministic Rollout", "MurmurHash3 bucket (0-100) &lt; rolloutPercentage", "enabled: true, reason: 'ROLLOUT'"],
        ["Step 6", "Default Fallback", "Agar user kisi rule me nahi aaya aur rollout se bahar hai", "enabled: fallbackValue (false), reason: 'DEFAULT'"]
    ]
    elements.append(make_table(funnel_headers, funnel_rows, [50, 140, 210, 140]))
    elements.append(make_spacer(8))
    
    elements.append(make_callout(
        "<b>Interview Key Point: Why Kill Switch before Rules?</b><br/>"
        "<i>'Emergency Kill Switch ko Rule Engine aur Percentage Rollout se pehle evaluate kiya jata hai taaki agar production me critical issue ho, "
        "toh engine zero CPU cycles waste kiye sub-millisecond me feature disable kar sake, regardless of what rules or rollout tiers were configured.'</i>",
        "tip", "PRECEDENCE ORDER ARCHITECTURE"
    ))
    
    elements.append(PageBreak())
    return elements
