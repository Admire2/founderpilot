# FounderPilot Ecosystem Roadmap (Living Document)
Updated: 2026-09-09 - Owner: Akande Joseph - Status: LIVE + EXPANDING

## 1. Positioning
- FounderPilot = infrastructure for physical product creation (Shopify-for-hardware).
- Virtual provider: we design, certified partners build, we route every click and keep the analytics.

## 2. Live Today
- Business Suite: Idea Validator, Business Model, Customer Persona, Landing Page Copy, Pricing.
- Engineering Suite: Rivet / Maxi / Volt / Terra - flow 01 Brief, 02 Plan, 03 Design, 04 Sheet & Exports, 05 Build.
- Sourcing Agent (/suite/maxi/sourcing): AI supplier search, 10 credits per search, tracked quotes via /api/go, China + local mix.
- Partner Network (/suite/maxi/partners): geo-sorted directory, price comparison, Fulfillment Order Desk.
- Telemetry: session tracker (geo + device id), error catcher, prompt logger, affiliate click logger.
- Admin tools: creditadmin, stripeadmin, erroradmin, affiliateadmin (5-layer), growthadmin, scoutadmin, hub, taskadmin.
- Docs: docs/AFFILIATE-DOSSIER.md/.html and docs/ECOSYSTEM-ROADMAP.md/.html (this file).

## 3. Five-Layer Infrastructure Model
L1 Design (suites + credits) / L2 Routing (affiliate links, /api/go) / L3 Marketplace (price compare) / L4 Fulfillment (order pipeline) / L5 Intelligence (demand aggregation, bulk signals, factory JVs).

## 4. Planned Suites (priority order)
1. LEX - Legal & IP: NDA generator, provisional patent drafter, compliance navigator, trademark scout. Q4 2026.
2. CAPITAL / FundBridge - Financial Model + Investor Matchmaker: VC/angel intros, lead fee + success fee. Q4 2026.
3. PRISM - Brand & Marketing: logo, product renders, launch page, ads, packaging, Kickstarter writer. Q1 2027.
4. FORGE - Manufacturing Intelligence: DFM audit, live cost estimator, QC checklists (embedded in suites). Q1 2027.
5. CODEX - Software & Firmware: app architect, firmware writer, API designer. Q2 2027.
6. HELIX - Ops & Team: PM AI, hire briefs, grant writer. Q3 2027.
7. ACADEMY - Learning & Certification: contextual tutor, cert prep. Q3 2027.
8. ORCHESTRATOR - Meta-tool: global next-step concierge + Expert Mode toggle. MVP deployed 2026-09-09.

## 5. Partner & Affiliate Plan
- Hit-list, application template, routing map: see docs/AFFILIATE-DOSSIER.md.
- Status tiers: apply-now / recruiting / confirmed - flip on approval.
- Geo rule: same country, then same continent, then China hub, then global.

## 6. Open Tasks (next actions)
- [ ] iLera HEALTH SUITE: Phase 1 (triage + lab interpreter + risk radar + referral pack), Phase 2 (camera vitals), Phase 3 (kiosk B2B + doctor network). Added 2026-09-10.
- [ ] SOURCING PLACEMENT: clip Source box INSIDE/under 05 BUILD card; locked until >=1 pack downloaded; then activates (new tab, brief prefilled). PARKED.
- [ ] Send affiliate applications: PCBWay, JLCPCB, Octopart (dossier template).
- [ ] Write LEX spec: NDA + patent drafter prompts, credits, UI.
- [ ] Write CAPITAL/FundBridge spec: financial model prompts, investor CRM, fee model.
- [ ] Recruit 1 fabricator per target city: Lagos, Nairobi, Cape Town.
- [ ] Add "Book a Funding Consult" card to Business Suite (interim FundBridge).

## 7. Change Log
- 2026-09-09: **STRIPE PAYMENTS + SUBSCRIPTIONS + DUNNING + RECEIPTS: COMPLETE.** Webhook signature verified (secret swap fixed Aug 30 wall). One-time packs + subscriptions both grant credits + send Pia receipts via Gmail SMTP. Billing Portal + upcoming-renewal reminders + Smart Retries all live. Unified pricing page (Business + Engineering + Packs) deployed. Revenue engine fully operational.
- 2026-09-09: Orchestrator MVP deployed (gated routing, Expert Mode toggle, cloud snapshot awareness). Project continuity system (16-digit codes, cross-device restore) implemented.
- 2026-09-09: Build GREEN. Rivet page fully repaired. Layout rule enforced: add 2 lines, never replace the file.
- 2026-09-08: Affiliate dossier, 5-layer admin center, sourcing monetization (10 credits), geo partner directory, price comparison.
- 2026-09-07: Complexity toggle, unit recalculation, session/error/prompt telemetry deployed.
- STANDARD (2026-09-10): ALL readable document/report downloads use downloadPdf() from lib/pdf.ts (paginated PDF). Binary assets stay native (png/jpg/zip/csv/signed-pdf). Every future suite MUST import downloadPdf for doc exports.


## US Legal Compliance Foundation (2026-09-10)

**MANDATORY**: All suites (current and future) must comply with US federal and state laws. See `/docs/COMPLICANCE-US.md` for full framework.

### Core Compliance Requirements for Every Suite:

1. **Terms of Service & Privacy Policy**
   - Updated before launch
   - Clear disclosures of data collection and use
   - User rights (access, deletion, opt-out)

2. **Accessibility (ADA/Section 508)**
   - WCAG 2.1 AA compliance
   - Semantic HTML, ARIA labels, keyboard navigation
   - Regular accessibility audits

3. **Data Protection**
   - HTTPS everywhere
   - No storage of sensitive data beyond session (unless HIPAA-compliant infrastructure added)
   - Encryption at rest and in transit
   - Incident response plan

4. **Consumer Protection**
   - Truth in advertising (FTC compliance)
   - No deceptive practices (UDAAP)
   - Clear pricing and refund policies
   - Age gate (18+ requirement for most services)

5. **Disclaimers**
   - Educational services: "Educational only, not professional advice"
   - Health services: "Not a diagnosis, consult licensed clinician"
   - Financial services: "Not financial advice, consult qualified advisor"
   - Legal services: "Not legal advice, consult licensed attorney"

6. **AI Transparency**
   - Disclose AI use
   - Explain limitations
   - Provide human oversight option
   - Allow feedback on AI outputs

7. **Payment Processing**
   - Stripe for PCI-DSS compliance
   - No storage of full credit card numbers
   - Clear credit terms (non-refundable, no cash value, expiration policy)

8. **International Compliance**
   - GDPR for EU users (consent, data minimization, user rights)
   - Monitor other international regulations
   - Privacy-by-design principles

9. **Intellectual Property**
   - Protect trademarks and copyrights
   - Respect third-party IP
   - DMCA agent designated

10. **Pre-Launch Checklist** (see COMPLIANCE-US.md section 10)
    - Terms and privacy policy updated
    - Accessibility tested
    - Security reviewed
    - Disclaimers in place
    - Feedback mechanism ready

### Suite-Specific Compliance Notes:

- **iLera/Healthcare**: HIPAA considerations (currently ephemeral-only), FDA medical device classification (educational, not diagnostic), state telehealth laws (not applicable unless we add live clinicians)
- **LEX/Legal**: Unauthorized practice of law (UPL) - must be educational only, never provide legal advice or represent clients
- **PRISM/Finance**: SEC regulations - must be educational only, never provide investment advice or manage funds
- **Engineering Suite**: Standard SaaS compliance, no special regulatory requirements
- **Nutrition Suite (Ounje)**: FDA dietary supplement regulations (if we recommend supplements), state nutritionist licensing (educational only, not medical nutrition therapy)

### Ongoing Compliance:

- Quarterly review of terms and privacy policy
- Annual accessibility audit
- Annual security review
- Compliance training for team
- Legal counsel consultation for new suites and significant changes
