import os
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable, KeepTogether
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch

def create_module1_pdf(output_filename):
    os.makedirs(os.path.dirname(output_filename), exist_ok=True)
    doc = SimpleDocTemplate(
        output_filename,
        pagesize=letter,
        rightMargin=40, leftMargin=40, topMargin=40, bottomMargin=40
    )

    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=colors.HexColor('#1e293b'),
        spaceAfter=6
    )
    
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=11,
        leading=15,
        textColor=colors.HexColor('#64748b'),
        spaceAfter=14
    )

    h1_style = ParagraphStyle(
        'H1',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=14,
        leading=18,
        textColor=colors.HexColor('#0f172a'),
        spaceBefore=12,
        spaceAfter=6,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'H2',
        parent=styles['Heading3'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=15,
        textColor=colors.HexColor('#2563eb'),
        spaceBefore=8,
        spaceAfter=4,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'Body',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=14,
        textColor=colors.HexColor('#334155'),
        spaceAfter=6
    )

    code_style = ParagraphStyle(
        'CodeStyle',
        parent=styles['Code'],
        fontName='Courier',
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor('#0f172a'),
        backColor=colors.HexColor('#f1f5f9'),
        spaceAfter=6,
        spaceBefore=4
    )

    callout_style = ParagraphStyle(
        'Callout',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=9,
        leading=13,
        textColor=colors.HexColor('#1e293b'),
    )

    story = []

    # Title & Subtitle
    story.append(Paragraph("FlagForge — Technical Learning & Interview Guide", title_style))
    story.append(Paragraph("<b>Module 1: Product Overview, Industry Problems & Real-World Use Cases (Hinglish)</b>", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#2563eb'), spaceAfter=12))

    # Section 1: What is FlagForge
    story.append(Paragraph("1. FlagForge Kya Hai? (Product Overview)", h1_style))
    story.append(Paragraph(
        "<b>FlagForge</b> ek production-grade, developer-first <b>Feature Flag & Release Management Platform</b> hai. "
        "Simple shabdon me kahein toh ye ek remote control dashboard hai jisse engineering teams bina naya code deploy kiye, "
        "production me kisi bhi feature ko instantly ON ya OFF kar sakti hain, selected users ko target kar sakti hain, "
        "ya 10%, 25%, 50% jaisi gradual canary rollouts execute kar sakti hain.",
        body_style
    ))
    story.append(Paragraph(
        "<b>Industry Analogy:</b> Imagine karo ek rocket launch ya space station. Agar koi subsystem malfunction kare toh rocket ko wapas "
        "earth pe lake rebuild nahi karte; ek master switch se us specific valve ya subsystem ko instantly bypass kar diya jata hai. "
        "FlagForge software applications ke liye wahi control cockpit provide karta hai.",
        body_style
    ))

    # Section 2: Why do companies need feature flags?
    story.append(Paragraph("2. Companies Ko Feature Flags Ki Zaroorat Kyun Hoti Hai?", h1_style))
    story.append(Paragraph(
        "Modern software engineering ka fundamental principle hai: <b>Decouple Deployment from Release</b>.<br/>"
        "• <b>Deployment:</b> Code ko compile karke production servers/containers me live chalana.<br/>"
        "• <b>Release:</b> Us feature ko actual end-users ke saamne visible aur active banana.<br/>"
        "Pehle ye dono ek sath hote the—agar code deploy hua toh feature sabke liye live ho gaya. "
        "Feature Flags deployment aur release ko alag kar dete hain. Code production me weeks pehle deploy ho sakta hai lekin flag 'disabled' rehta hai jab tak team confident na ho.",
        body_style
    ))

    # Section 3: Life before feature flags
    story.append(Paragraph("3. Feature Flags Se Pehle Developers Kaise Kaam Karte The?", h1_style))
    story.append(Paragraph(
        "Feature flag platforms se pehle teams ke paas teen inefficient options the:<br/>"
        "<b>1. Long-lived Feature Branches:</b> Developers mahino tak alag branch me code likhte the. Merge karte waqt massive <i>Merge Hell</i> hota tha.<br/>"
        "<b>2. Hardcoded Config Files & Environment Variables:</b> Feature on karne ke liye <code>config.json</code> me flag badal kar poora server restart/redeploy karna padta tha.<br/>"
        "<b>3. All-or-Nothing Big Bang Deployments:</b> 100% users ko ek sath release milta tha. Agar bug nikla toh poori app crash ho jati thi.",
        body_style
    ))

    # Section 4: What problems occur without feature flags?
    story.append(Paragraph("4. Feature Flags Ke Bina Aane Wali Badi Mushkilein (Failure Scenarios)", h1_style))
    story.append(Paragraph(
        "• <b>High Blast Radius:</b> Agar ek payment feature me edge-case bug hai, toh 100% users checkout nahi kar paate aur company ko crore ka nuksan hota hai.<br/>"
        "• <b>Slow Rollbacks:</b> Bug aane par git revert, build pipeline, Docker build, aur container redeployment me 20 se 45 minutes lagte hain. Tab tak system down rehta hai.<br/>"
        "• <b>Lack of Canary Testing:</b> Real production database load pe 5% traffic daal kar test karne ka koi rasta nahi hota tha.<br/>"
        "• <b>No Granular Targeting:</b> Specific VIP users ya beta testers ko feature dikhana impossible ho jata tha bina code me custom if-else likhe.",
        body_style
    ))

    # Section 5: How FlagForge solves this
    story.append(Paragraph("5. FlagForge In Problems Ko Kaise Solve Karta Hai?", h1_style))
    story.append(Paragraph(
        "FlagForge in sabhi problems ko architecture aur engine level pe solve karta hai:<br/>"
        "• <b>Instant Kill Switch (&lt;5ms):</b> Production me bug dikhte hi ek click pe feature disable. No redeployment.<br/>"
        "• <b>Deterministic Canary Rollout (MurmurHash3):</b> Users ko mathematically stable buckets (0-100) me divide karta hai. Same user hamesha consistent experience paata hai.<br/>"
        "• <b>Multi-Environment SDK Keys:</b> Development, Staging, aur Production environments ke beech strict isolation.<br/>"
        "• <b>Append-Only Audit Trail:</b> Kiss developer ne kab rollout 10% se 50% kiya, sab immutable log me record hota hai.",
        body_style
    ))

    # Section 6: Real World Scenarios
    story.append(Paragraph("6. Real-World Use Cases (Actual Codebase Execution)", h1_style))
    
    story.append(Paragraph("Scenario A: Releasing AI Recommendations to 10% of Users", h2_style))
    story.append(Paragraph(
        "<b>Problem:</b> ML recommendation model heavy hai, pehle dekhna hai ki database load handle hota hai ya nahi.<br/>"
        "<b>FlagForge Execution:</b><br/>"
        "1. Developer dashboard me flag <code>ai-recommendations</code> ka rollout <b>10%</b> set karta hai.<br/>"
        "2. Node.js backend SDK request bhejta hai user identifier <code>usr_102</code> ke sath.<br/>"
        "3. <code>server/src/engine/evaluator.ts</code> me <code>getRolloutBucket('ai-recommendations', 'usr_102')</code> calculate hota hai.<br/>"
        "4. Agar bucket <b>8.4</b> aata hai (&lt; 10%), toh result <code>enabled: true</code> return hota hai. Agar bucket <b>42.1</b> aata hai, toh <code>false</code> milta hai.<br/>"
        "5. Next week jab percentage 25% karte hain, <code>usr_102</code> (bucket 8.4) hamesha <b>true</b> hi rahega, uske liye flapping nahi hogi!",
        body_style
    ))

    story.append(Paragraph("Scenario B: Emergency Kill Switch on High Error Rates", h2_style))
    story.append(Paragraph(
        "<b>Problem:</b> Payment gateway v2 release hui, lekin production logs me 500 error spike ho gaya.<br/>"
        "<b>FlagForge Execution:</b><br/>"
        "1. On-call engineer dashboard me jaakar <b>Emergency Kill Switch</b> button dabata hai.<br/>"
        "2. Backend <code>FlagService.triggerKillSwitch()</code> execute karta hai, DB me <code>killSwitched = true, enabled = false</code> set hota hai.<br/>"
        "3. Redis cache turant invalidate ho jata hai (<code>cache.delPattern()</code>).<br/>"
        "4. Agli hi millisecond me SDK calls ko <code>enabled: false, reason: 'KILL_SWITCH'</code> milta hai aur application seamlessly fallback checkout pe chali jaati hai.",
        body_style
    ))

    story.append(Paragraph("Scenario C: VIP / Internal Beta Cohort Targeting", h2_style))
    story.append(Paragraph(
        "<b>Problem:</b> Naya feature sirf internal employees (<code>@company.com</code>) aur Enterprise tier users ko dikhana hai.<br/>"
        "<b>FlagForge Execution:</b><br/>"
        "1. FlagForge me Targeting Rule banti hai: <code>plan equals 'enterprise' AND email endsWith '@company.com'</code>.<br/>"
        "2. <code>evaluateRule()</code> function user context ke attributes check karta hai.<br/>"
        "3. Agar match hota hai, toh rule match hokar <code>enabled: true, reason: 'RULE_MATCH'</code> de deta hai bina normal rollout percentage dekhe.",
        body_style
    ))

    # Section 7: Why FlagForge is NOT a typical CRUD app
    story.append(Paragraph("7. FlagForge Normal CRUD Application Se Alag Kyun Hai?", h1_style))
    story.append(Paragraph(
        "Interviewers aksar puchte hain: <i>'Ye toh sirf database me flag save karne ka CRUD app lag raha hai, isme kya complex engineering hai?'</i><br/>"
        "Yahan aapko confidently 4 architectural points batane hain:<br/>"
        "1. <b>Algorithmic Determinism (MurmurHash3):</b> Hum user state DB me store nahi karte. Math function se $O(1)$ time me millions of users ko hash bucket me assign karte hain.<br/>"
        "2. <b>High-Throughput / Low-Latency Hot Path:</b> CRUD app me user click karta hai toh DB call hoti hai. Yahan har API request pe feature flag evaluate hota hai (10,000 req/sec). Isliye Redis + SDK local memory cache tier design kiya gaya hai.<br/>"
        "3. <b>Multi-Tenant RBAC & Key Cryptography:</b> SDK keys ko DB me plaintext nahi balki SHA-256 hash store karte hain. Owner, Admin, Developer, Viewer roles backend middleware pe strictly enforced hain.<br/>"
        "4. <b>Standalone SDK Client with Offline Resilience:</b> Ek separate npm package (<code>@flagforge/node-sdk</code>) banaya hai jo connection timeout hone par application ko crash nahi hone deta balki safe fallback return karta hai.",
        body_style
    ))

    # Section 8: Summary & Questions
    story.append(Spacer(1, 10))
    story.append(Paragraph("<b>Module 1 Summary:</b> Feature flags decouple deployments from releases. FlagForge replaces risky all-or-nothing deployments with safe canary rollouts, attribute targeting, and sub-millisecond kill switches.", callout_style))
    story.append(Spacer(1, 10))

    doc.build(story)
    print(f"PDF generated successfully at: {output_filename}")

if __name__ == '__main__':
    output_pdf = r"c:\Users\prath\Desktop\FlagForge\docs\FlagForge_Module_1_Product_Overview.pdf"
    create_module1_pdf(output_pdf)
