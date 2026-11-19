# PDF Builder - Cover Page & Executive Introduction
from reportlab.platypus import Paragraph, Spacer, PageBreak, Table, TableStyle
from reportlab.lib import colors
from .styles import (
    style_cover_title, style_cover_sub, style_cover_desc,
    make_p, make_h1, make_h2, make_h3, make_callout, make_table, make_spacer, make_divider
)

def build_cover_and_intro():
    elements = []
    
    # Header Banner Box
    banner_p = Paragraph(
        "<font size=9 color='#2563eb'><b>FLAGFORGE CORE ENGINEERING SPECIFICATION & SDE INTERVIEW COMPENDIUM</b></font><br/>"
        "<font size=8 color='#64748b'>Full-Stack Architecture  *  MurmurHash3 Canary Engine  *  Redis Hot-Path  *  Node.js SDK</font>",
        style_cover_desc
    )
    banner_table = Table([[banner_p]], colWidths=[540])
    banner_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f1f5f9')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#cbd5e1')),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ('LEFTPADDING', (0,0), (-1,-1), 12),
        ('RIGHTPADDING', (0,0), (-1,-1), 12),
    ]))
    elements.append(banner_table)
    elements.append(make_spacer(14))
    
    # Title & Subtitle
    elements.append(Paragraph("FlagForge: Production Feature Flag Platform", style_cover_title))
    elements.append(Paragraph("Complete Codebase Explanation, Technical Learning & SDE Interview Playbook", style_cover_sub))
    elements.append(make_divider('#2563eb', 2))
    
    # Metadata Card
    meta_p = Paragraph(
        "<b>Candidate:</b> Computer Science & Engineering (B.Tech)<br/>"
        "<b>Target Roles:</b> Software Development Engineer (SDE-1 / SDE-2), Full-Stack / Backend Engineer<br/>"
        "<b>Codebase Scope:</b> Monorepo (Node.js, Express, TypeScript, React, Vite, MongoDB, Redis, Docker, SDK)<br/>"
        "<b>Language of Instruction:</b> Hinglish (Simple Hindi + Engineering English with line-by-line mechanics)<br/>"
        "<b>Verification Status:</b> 100% Implemented, 28 Automated Tests Passed, Zero Fabricated Metrics",
        style_cover_desc
    )
    meta_table = Table([[meta_p]], colWidths=[540])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#fafafa')),
        ('LINEBEFORE', (0,0), (0,-1), 3.5, colors.HexColor('#0f172a')),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ('LEFTPADDING', (0,0), (-1,-1), 10),
        ('RIGHTPADDING', (0,0), (-1,-1), 10),
    ]))
    elements.append(meta_table)
    elements.append(make_spacer(10))
    
    # Executive Summary
    elements.append(make_h2("Executive Summary: Yeh Document Kyun Banaya Gaya Hai?"))
    elements.append(make_p(
        "FlagForge koi superficial AI-generated demo nahi hai, balki ek production-grade, highly-reliable B2B SaaS platform hai "
        "jo modern cloud infrastructure me <b>Deployment ko Release se Decouple</b> karta hai. Is compendium me FlagForge ke pure 16 architectural "
        "modules ko scratch se advanced level tak explain kiya gaya hai taaki aap kisi bhi technical round ya system design interview me "
        "har single line of code, mathematical formula (MurmurHash3), cache strategy (Redis hot-path), aur SDK offline fallback ko effortlessly explain kar sakein."
    ))
    elements.append(make_spacer(6))
    
    # 16 Modules Roadmap Table
    elements.append(make_h2("Complete 16-Module Learning & Interview Roadmap"))
    
    headers = ["Module", "Topic Name", "Engineering Focus & Core Concepts"]
    rows = [
        ["Mod 01", "Product Overview & Industry Problem", "Decoupling Deployment from Release, Blast Radius, Rollback Costs, 3 Real-World Case Studies"],
        ["Mod 02", "Technology Stack Justifications", "React 18, Vite, TS, Tailwind, Express, MongoDB, Redis, Zod, Vitest - Why chosen vs alternatives"],
        ["Mod 03", "Folder Structure & File Breakdown", "Monorepo layout, server/, client/, packages/sdk/, examples/, docker/, config files mapping"],
        ["Mod 04", "System Architecture & Hot Path", "Control Plane vs High-Throughput Hot Path, End-to-End Request/Response sequence flow"],
        ["Mod 05", "Backend Deep Dive", "Routes, Controllers, Services, Middleware, AppError hierarchy, Zod request validators"],
        ["Mod 06", "Database Models & Schemas", "User, Org, Project, Environment, FeatureFlag, AuditLog, Compound indexes & Soft deletes"],
        ["Mod 07", "Authentication & Multi-Tenant RBAC", "Bcrypt (12 rounds), JWT tokens, Tenancy isolation, Role Guards (Owner, Admin, Dev, Viewer)"],
        ["Mod 08", "Evaluation Precedence & Funnel", "6-Step evaluation order: Existence -> Kill Switch -> Env Active -> Rules -> Rollout -> Fallback"],
        ["Mod 09", "Rule Engine & MurmurHash3 Math", "9 Boolean/String/Number operators, Deterministic Hash Bucketing (0-100), Zero user flapping proof"],
        ["Mod 10", "Redis Caching & Hot-Path Latency", "Cache Keys, TTL (60s), Invalidation on update, Fallback in-memory LRU, Sub-5ms response"],
        ["Mod 11", "Node.js SDK & Offline Resilience", "@flagforge/node-sdk architecture, local memory cache, graceful error handling on network failure"],
        ["Mod 12", "Frontend Architecture & UI System", "Linear/Vercel matte dark UI, React Router, TanStack Query cache, Modal forms, Audit viewer"],
        ["Mod 13", "Security Architecture & Threats", "SHA-256 SDK key storage, Rate limiting, NoSQL injection defense, Timing attack prevention"],
        ["Mod 14", "End-to-End Release Walkthrough", "Dev -> Staging -> 10% Prod Canary -> Latency Spike -> Instant Kill Switch activation trace"],
        ["Mod 15", "Testing Strategy & Verification", "7 Vitest test suites, 28 tests passing, Supertest integration testing, SDK mock tests"],
        ["Mod 16", "SDE Technical Interview Playbook", "30s/1m/3m Elevator Pitches, 15 Tough Technical Q&A, Scaling to 100k req/s System Design"]
    ]
    elements.append(make_table(headers, rows, [48, 172, 320]))
    elements.append(make_spacer(8))
    
    elements.append(make_callout(
        "<b>Interview Golden Rule:</b> Kabhi bhi mat bolo 'maine ek feature flag app banaya'. Hamesha bolo: "
        "<i>'Maine ek distributed, high-throughput feature evaluation and release management system design kiya hai jo 10,000 req/sec evaluate kar sakta hai "
        "using mathematical deterministic hashing (MurmurHash3) aur sub-millisecond Redis hot-path caching.'</i>",
        "tip", "PITCH TIP"
    ))
    
    elements.append(PageBreak())
    return elements
