# US Legal Compliance Framework (2026-09-10)

FounderPilot AI is based in the United States and serves global clients. All services must comply with applicable US federal and state laws, with awareness of international regulations where clients are located.

## 1. HEALTHCARE SERVICES (iLera, Ounje, Lab Reader, etc.)

### HIPAA (Health Insurance Portability and Accountability Act)
- **Current Status**: iLera does NOT store Protected Health Information (PHI) in a HIPAA-covered manner. All health data is:
  - Processed client-side or in ephemeral API calls
  - Never stored in our database beyond the session
  - Deleted immediately after PDF generation
  - Not transmitted to third parties without explicit consent
- **If we store PHI**: Must implement BAA (Business Associate Agreement) with hosting provider, encrypt at rest and in transit, implement audit logs, provide patient access/deletion rights
- **Recommendation**: Continue ephemeral-only model to avoid HIPAA coverage unless we pivot to storing medical records

### FDA (Food and Drug Administration)
- **Medical Device Classification**: iLera is NOT a medical device because:
  - It provides educational screening, not diagnosis
  - It never prescribes treatment
  - It always directs users to licensed clinicians for medical decisions
  - All outputs are labeled "educational only, not a diagnosis"
- **Compliance Guardrails**:
  - Never use language that implies diagnosis ("you have X")
  - Always use probabilistic language ("can be associated with," "may indicate")
  - Never recommend specific treatments or medications
  - Always include disclaimer: "Educational screening only - your clinician confirms and orders"
  - Red-flag symptoms must route to 911/emergency care immediately

### FTC (Federal Trade Commission) - Advertising & Marketing
- **Truth in Advertising**: All marketing claims must be:
  - Substantiated by evidence
  - Not misleading or deceptive
  - Clear about limitations (educational, not diagnostic)
- **Endorsements & Testimonials**: If we use user testimonials:
  - Must reflect typical results
  - Must disclose if results are atypical
  - Must not make unsubstantiated health claims
- **Pricing Transparency**:
  - Credit costs must be clearly displayed before purchase
  - No hidden fees or deceptive pricing
  - Refund policy must be clearly stated

### State Telehealth Laws
- **Current Model**: iLera does NOT provide telehealth services (no live clinician interaction, no prescriptions, no diagnosis)
- **If we add telehealth**: Must comply with:
  - State-by-state licensing requirements
  - Informed consent requirements
  - Prescription regulations (Ryan Haight Act for controlled substances)
  - Insurance parity laws
- **Recommendation**: Maintain educational-only model to avoid telehealth regulation

## 2. CONSUMER PROTECTION

### CCPA (California Consumer Privacy Act) & State Privacy Laws
- **Applies to**: California residents (CCPA), Virginia (VCDPA), Colorado (CPA), Connecticut (CTDPA), Utah (UCPA), and growing list
- **Requirements**:
  - Privacy policy must disclose data collection practices
  - Users must have right to:
    - Know what data is collected
    - Delete their data
    - Opt out of data sales (we don't sell data, but must disclose)
    - Non-discrimination for exercising privacy rights
  - "Do Not Sell My Personal Information" link required (even if we don't sell)
- **Implementation**:
  - Privacy policy page with clear disclosure
  - Data deletion request mechanism
  - Cookie consent banner (for tracking)
  - Opt-out mechanism for any future data sharing

### COPPA (Children's Online Privacy Protection Act)
- **Applies to**: Children under 13
- **Current Status**: iLera requires users to be 18+ (stated in disclaimers)
- **Compliance**:
  - Age gate on signup
  - Do not knowingly collect data from children under 13
  - If we discover a child under 13 has provided data, delete immediately

### UDAAP (Unfair, Deceptive, or Abusive Acts or Practices)
- **Applies to**: All consumer-facing services
- **Requirements**:
  - No unfair practices (cause substantial injury not outweighed by benefits)
  - No deceptive practices (misleading representations)
  - No abusive practices (take unreasonable advantage of consumer's lack of understanding)
- **Implementation**:
  - Clear, understandable terms of service
  - No hidden terms or surprise charges
  - Plain language disclosures

## 3. FINANCIAL & PAYMENT COMPLIANCE

### Credit System
- **Not a Financial Product**: Credits are not currency, securities, or stored value instruments
- **Compliance**:
  - Credits are non-refundable (unless required by state law)
  - Credits expire after 12 months of inactivity (disclosed in terms)
  - No cash value
  - Cannot be transferred or sold (unless we enable gifting later)
- **State Money Transmitter Laws**: Credits are NOT money transmission because:
  - They can only be used for FounderPilot services
  - They have no cash value
  - They cannot be redeemed for cash
  - They are not stored value cards (they're service credits)

### Stripe Payment Processing
- **Compliance**: Stripe handles PCI-DSS compliance for payment processing
- **Our Responsibility**:
  - Never store full credit card numbers
  - Use Stripe Elements or Checkout for payment forms
  - Comply with Stripe's terms of service
  - Report suspicious transactions

## 4. AI/ML TRANSPARENCY

### Emerging AI Regulations
- **Current Landscape**: No comprehensive federal AI law yet, but:
  - NIST AI Risk Management Framework (voluntary guidance)
  - State-level AI bills (Illinois AI Video Interview Act, NYC Local Law 144 for employment AI)
  - Executive Order on Safe, Secure, and Trustworthy AI (October 2023)
- **Best Practices**:
  - Disclose when AI is being used (we do this with "AI Healthcare Companion" branding)
  - Provide human oversight option (we direct to clinicians)
  - Document AI limitations and biases
  - Allow users to opt out of AI decision-making (we do this by making all outputs educational only)
- **Recommendation**: Monitor state and federal AI legislation; document our AI use and limitations

### Algorithmic Transparency
- **Requirements**:
  - Disclose that outputs are AI-generated
  - Explain that outputs are educational, not diagnostic
  - Provide mechanism for users to report errors or concerns
- **Implementation**:
  - All AI outputs include disclaimer
  - Feedback mechanism on every service page
  - Clear statement that AI does not replace professional judgment

## 5. ACCESSIBILITY

### ADA (Americans with Disabilities Act) & Section 508
- **Requirements**:
  - Web content must be accessible to people with disabilities
  - WCAG 2.1 Level AA compliance (de facto standard)
- **Implementation**:
  - Semantic HTML
  - ARIA labels for interactive elements
  - Keyboard navigation support
  - Screen reader compatibility
  - Sufficient color contrast
  - Alt text for images
- **Testing**: Regular accessibility audits (automated + manual)

## 6. DATA SECURITY

### Reasonable Security Measures
- **Requirements**:
  - Encrypt data in transit (HTTPS/TLS)
  - Encrypt sensitive data at rest (if we store it)
  - Implement access controls
  - Regular security updates
  - Incident response plan
- **Current Implementation**:
  - HTTPS everywhere
  - Supabase for database (SOC 2 compliant)
  - Vercel for hosting (SOC 2 compliant)
  - No storage of sensitive health data beyond session
  - API key rotation and secure storage

### Data Breach Notification
- **Requirements**:
  - Notify affected users within required timeframe (varies by state, typically 30-60 days)
  - Notify state attorney general if breach affects 500+ residents
  - Provide credit monitoring if financial data compromised
- **Implementation**: Incident response plan documented, contact information for breach notifications ready

## 7. INTELLECTUAL PROPERTY

### Copyright & Trademark
- **Our IP**:
  - FounderPilot AI, iLera, Ounje, Maxi, Rivet, Volt, Terra are trademarks
  - Service names, logos, and branding are protected
  - Code and content are copyrighted
- **Third-Party IP**:
  - Do not use copyrighted material without permission
  - Properly attribute open-source software
  - License all fonts, images, and media

### DMCA (Digital Millennium Copyright Act)
- **Requirements**:
  - Designate DMCA agent with Copyright Office
  - Provide takedown mechanism for copyright infringement claims
  - Respond to valid takedown notices within required timeframe
- **Implementation**: DMCA agent designated, contact information on website

## 8. TERMS OF SERVICE & PRIVACY POLICY

### Terms of Service
- **Must Include**:
  - Description of services
  - User obligations and prohibited conduct
  - Payment terms and refund policy
  - Limitation of liability
  - Dispute resolution (arbitration clause recommended)
  - Governing law (US state, typically Delaware or state of incorporation)
  - Termination rights
  - Intellectual property rights
  - Disclaimers (educational only, not medical advice, etc.)

### Privacy Policy
- **Must Include**:
  - What data we collect
  - How we use it
  - Who we share it with
  - How long we retain it
  - User rights (access, deletion, opt-out)
  - Security measures
  - Children's privacy (COPPA)
  - International data transfers (if applicable)
  - Contact information for privacy inquiries
  - Last updated date

## 9. INTERNATIONAL COMPLIANCE

### GDPR (General Data Protection Regulation) - EU
- **Applies to**: EU residents using our services
- **Requirements**:
  - Lawful basis for processing (consent, contract, legitimate interest)
  - Data minimization (collect only what's necessary)
  - Right to access, rectification, erasure, portability
  - Data Protection Impact Assessment for high-risk processing
  - Data Processing Agreements with vendors
- **Implementation**:
  - Consent mechanism for EU users
  - Privacy policy compliant with GDPR
  - Data deletion mechanism
  - Vendor DPAs in place

### Other International Laws
- **Canada**: PIPEDA (Personal Information Protection and Electronic Documents Act)
- **UK**: UK GDPR (post-Brexit)
- **Brazil**: LGPD (Lei Geral de Proteção de Dados)
- **Australia**: Privacy Act 1988
- **Recommendation**: Monitor international regulations; implement privacy-by-design principles that satisfy most stringent requirements

## 10. COMPLIANCE CHECKLIST FOR NEW SUITES

Before launching any new suite (LEX, PRISM, etc.), verify:

- [ ] Terms of Service updated to include new suite
- [ ] Privacy policy updated if new data is collected
- [ ] All disclaimers in place (educational only, not professional advice, etc.)
- [ ] Accessibility tested (WCAG 2.1 AA)
- [ ] Data security review completed
- [ ] Payment processing compliant (if applicable)
- [ ] Age gate in place (18+ requirement)
- [ ] Feedback mechanism for reporting issues
- [ ] DMCA agent contact information accessible
- [ ] State-specific compliance reviewed (if applicable to suite's function)
- [ ] International compliance reviewed (if serving global users)

## 11. ONGOING COMPLIANCE

### Regular Reviews
- **Quarterly**: Review terms of service and privacy policy for accuracy
- **Annually**: Accessibility audit, security review, compliance training
- **As Needed**: When laws change, when launching new features, when incidents occur

### Documentation
- Maintain compliance documentation in `/docs` directory
- Document all compliance decisions and rationales
- Keep records of user complaints and resolutions
- Document vendor compliance (DPAs, BAAs, SOC 2 reports)

### Training
- Annual compliance training for all team members
- Specific training on:
  - Privacy and data protection
  - Accessibility
  - Advertising and marketing claims
  - Healthcare regulations (for iLera team)

## 12. LEGAL COUNSEL

### When to Consult Legal Counsel
- Launching a new suite with novel legal implications
- Receiving a legal notice or complaint
- Experiencing a data breach or security incident
- Entering into significant vendor agreements
- Receiving regulatory inquiry
- Making significant changes to business model
- Expanding into new jurisdictions

### Recommended Legal Resources
- Healthcare attorney (for iLera and health-related services)
- Privacy attorney (for data protection and international compliance)
- Corporate attorney (for terms of service, contracts, IP)
- Tax attorney (for credit system, international tax implications)

## 13. FOUNDERPilot COMPLIANCE COMMITMENT

FounderPilot AI is committed to:
- Operating within the bounds of US and international law
- Prioritizing user privacy and data protection
- Providing accessible services to all users
- Maintaining transparency about our practices
- Continuously improving our compliance posture
- Seeking legal counsel when needed
- Documenting our compliance decisions
- Responding promptly to user concerns and regulatory inquiries

This compliance framework is a living document and will be updated as laws evolve and our services expand.
