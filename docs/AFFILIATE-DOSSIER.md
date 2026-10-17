# FounderPilot Affiliate & Ecosystem Expansion Dossier
Virtual provider model: we design, the partner network builds, FounderPilot routes every click and keeps the analytics.

## 1. Affiliate Program Hit-List (apply in this order)
| # | Partner | Category | Network | Typical commission | Where to apply |
| 1 | PCBWay | PCB fab + assembly | Direct affiliate | 10-15% per order | pcbway.com affiliate page |
| 2 | JLCPCB | PCB fab + assembly | Direct referral | ~10% + coupons | jlcpcb.com affiliate |
| 3 | Xometry | CNC / 3D print / on-demand mfg | Direct partner | rev-share per quote | xometry.com partners |
| 4 | Octopart (Altium) | Component search + BOM pricing | Free API + distributor affiliate | varies | octopart.com api |
| 5 | Digi-Key | Electronic components | Impact | 2-4% | Impact.com marketplace |
| 6 | Mouser | Electronic components | CJ / Awin | 2-4% | CJ affiliate marketplace |
| 7 | Amazon Associates | Tools, meters, generic hardware | Direct | 1-4% | affiliate-program.amazon.com |
| 8 | Onshape | Cloud CAD | Direct referral | bounty per Pro seat | onshape.com referral |
| 9 | Autodesk (Fusion/Eagle) | CAD + ecAD | Impact | bounty / rev-share | Impact.com marketplace |
| 10 | Fiverr | Freelance engineering review | Direct affiliate | CPA 15-100 USD | fiverr.com affiliates |
| 11 | Upwork | Agency / freelance teams | Direct affiliate | CPA | upwork.com affiliates |
| 12 | Craftcloud (All3DP) | 3D print price comparison | Direct affiliate | 8-10% | craftcloud3d.com affiliate |
| 13 | Misumi | Configurable mechanical parts | B2B partner | rev-share | misumi-ec.com partner |
| 14 | MacroFab | PCBA brokerage | Direct referral | rev-share | macrofab.com |
| 15 | Seeed Studio | Maker hardware | ShareASale | 5-8% | ShareASale marketplace |

No-program partners (keep as free goodwill links, monetize indirectly): McMaster-Carr, FreeCAD, Blender, KiCad.

## 2. Copy-Paste Application Template
Subject: Partnership application - FounderPilot AI Engineering Suite (qualified engineering intent traffic)
Body: FounderPilot is an AI engineering platform (mechanical, electronics, electrical, civil suites) where clients generate manufacturable designs (BOMs, DXF, Gerber, STEP). Every finished design presents Buy Parts, Fabricate, and Hire-an-Expert actions. We route that qualified intent to partners and seek an affiliate/partner account with tracking links and, where available, API access for automated quoting. Monthly session and click analytics available on request. Contact: greatmind20@gmail.com

## 3. Click-to-Partner Routing Map (what makes us the affiliate of record)
| UI action | Suite | Routed partner | Logged event |
| Buy Parts (BOM button) | Maxi / Rivet | Octopart then Digi-Key / Mouser | affiliate_clicks context=BOM |
| PCB fab pack / Gerber export | Maxi | PCBWay, JLCPCB | affiliate_clicks context=PCBFAB |
| 3D / CNC pack export | Rivet | Xometry, Craftcloud | affiliate_clicks context=MACHINING |
| Hire a Certified Engineer | All | Fiverr / Upwork / own partner directory | affiliate_clicks context=CONSULT |
| Open in Onshape / Fusion | All | Onshape, Autodesk | affiliate_clicks context=CAD |
| Verify Gerber before production | Maxi | JLCPCB / PCBWay viewers | affiliate_clicks context=VERIFY |

## 4. Analytics-to-Expansion Triggers (when affiliate becomes empire)
| Signal in affiliate_clicks + sessions geo | Action |
| 200+ clicks/mo in one category, 5%+ conversion | Negotiate direct API rev-share with that partner |
| 1000+ quote clicks/mo from one region | Onboard regional certified partners (geo-matched directory) |
| Price variance above 15% across partners for same item | Launch live price-comparison marketplace UI |
| Sustained volume in one category + one region | Explore co-manufacturing JV / factory partnership |

## 5. Geolocation + Price Comparison Spec (marketplace phase)
- Client location: Vercel edge headers x-vercel-ip-country / region / city (fallback ip-api.com, already used by session tracker).
- Partner location: country / region / city fields on affiliate_partners; match nearest first: same city, same region, same country, then global.
- Price comparison: partner_listings table fed by partner CSV/API (Octopart gives live component pricing); UI compares price, MOQ, lead time, shipping, rating - Amazon-style cards.
- Client-facing positioning line: FounderPilot is your virtual engineering provider - we design it, our certified partner network near you builds it, and you compare prices in one place.

## 6. Phase Roadmap
| Phase | What ships | Revenue model |
| P1 now | Affiliate routing on every export/buy button | Commission per order |
| P2 | Geo-matched certified partner directory | Lead fees per qualified intro |
| P3 | Live price-comparison marketplace | Platform fee + commission |
| P4 | Direct partner API ordering inside FounderPilot | Rev-share per transaction |
| P5 | Co-manufacturing / factory JV on proven demand data | Equity + margin |