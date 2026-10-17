"use client";
import { downloadPdf } from "@/lib/pdf";
import Link from "next/link";

const services = [
  {
    name: "iLera — AI Healthcare Companion",
    cr: "10 cr",
    client: "their symptom story + vitals + history (or just writes everything in one flow)",
    gets: "safety check → possible patterns → bloodwork to request → Prevention Radar → 5 questions for their doctor → lifestyle levers",
    benefits: [
      "Turns vague worry into a structured, doctor-ready brief in 60 seconds",
      "Catches red flags early (chest pain, stroke signs → immediate 911 guidance)",
      "Ends the 'I forgot to tell my doctor half my story' problem",
      "Never overrides their doctor; always adds prevention on top"
    ],
    use: "42-year-old with nocturia + bloating gets a pre-visit read suggesting prostate/PSA discussion, HbA1c recheck, and sleep-apnea screening — before wasting a generic clinic visit"
  },
  {
    name: "Lab Reader",
    cr: "10 cr",
    client: "any bloodwork values they already have",
    gets: "line-by-line plain-English read — reference range used, status (low/borderline/optimal/high), what each value relates to, what's missing from the 7-Panel",
    benefits: [
      "Decodes the confusing PDF the lab sent",
      "Stops clients from paying for panels they don't need or missing ones they do",
      "Works with labs from ANY provider — no lock-in, no conflict of interest"
    ],
    use: "Client pastes 6 values → learns HbA1c 5.9 = prediabetic range + discovers nobody ever checked their Lp(a) or kidney UACR"
  },
  {
    name: "Shadow Annual Physical",
    cr: "10 cr (free table first)",
    client: "browses the free band table (Too Low → Too High + consequences), then pastes values or uploads a photo",
    gets: "every marker mapped to its band with the consequence of being out of range + top-3 watch items + missing markers",
    benefits: [
      "Free education first — builds trust before spending a credit",
      "Photo upload = zero typing for non-tech clients",
      "Teaches the 'iodine lesson': every out-of-range value comes with what it can lead to"
    ],
    use: "Client photographs their annual physical → iLera flags 'eGFR trending down, recheck in 3 months, ask about UACR' — a decline their busy GP glossed over"
  },
  {
    name: "Health Risk Radar",
    cr: "15 cr",
    client: "age, gender, family history, lifestyle, BMI, BP",
    gets: "risk map (cardiac/metabolic/prostate-or-breast/kidney/bone: Low–Moderate–Elevated) + personal screening calendar with cadence",
    benefits: [
      "Answers: 'Given MY family and MY habits, what should I be screening for, and how often?'",
      "Converts anxiety into a dated checklist (colonoscopy at 45, PSA at 50, bone density at 65…)",
      "Family-history aware: father's heart attack at 55 moves cardiac screening a decade earlier"
    ],
    use: "38-year-old with diabetic mother gets 'start HbA1c annually NOW, not at 45' — a decade of prevention bought for 15 credits"
  },
  {
    name: "Meds & Supplement Checker",
    cr: "5 cr",
    client: "prescriptions + supplements",
    gets: "pairwise interaction severity (Major/Moderate/Minor), kidney/liver load notes, timing/food rules, 3 pharmacist questions",
    benefits: [
      "Catches silent dangers: warfarin + vitamin K greens, statins + grapefruit, NSAIDs on tired kidneys",
      "Never tells them to stop anything — always 'discuss with clinician/pharmacist'",
      "Cheapest service = perfect impulse purchase and repeat-use tool"
    ],
    use: "Client on lisinopril + ibuprofen 'as needed' learns the kidney-stress combo and switches to paracetamol after a pharmacist chat"
  },
  {
    name: "Referral Pack Compiler",
    cr: "10 cr",
    client: "anything — iLera reads, lab values, symptom timeline, prior visits",
    gets: "a one-page clinician-ready PDF: context, chief concern timeline, meds, prior findings, educational notes, tests to ask about, patient questions",
    benefits: [
      "Turns a 15-minute rushed appointment into a productive one",
      "Patients feel heard; doctors save time; nothing gets forgotten",
      "The natural 'export' at the end of every other service's flow"
    ],
    use: "Client hands their GP the PDF → GP orders exactly the 4 tests listed → diagnosis in one visit instead of three"
  },
  {
    name: "Ounje — AI Nutrition Companion",
    cr: "10 cr",
    client: "conditions/goals, allergies, cuisine preference, budget, meds",
    gets: "condition principles → Eat-more/Moderate/Avoid food tables → breakfast-lunch-dinner-snacks day plan → 3 recipes → grocery list by aisle → med-interaction cautions",
    benefits: [
      "Food advice tied to their actual conditions (prediabetic + hypertensive + West African cuisine ≠ generic keto PDF)",
      "Budget- and culture-aware — jollof-friendly swaps, not quinoa lectures",
      "Closes the loop: iLera says 'lower sodium,' Ounje shows exactly what to cook tonight"
    ],
    use: "Prediabetic client gets a 7-day plan with egusi-based low-glycemic dinners + a grocery list they can photograph at Market Square"
  }
];

const flywheel = `Shadow Physical (free table hooks them) → Lab Reader (decode what they have) → iLera (connect values to symptoms) → Risk Radar (plan the next decade) → Meds Checker (make the stack safe) → Ounje (fix the plate) → Procedure Explainer (walk in knowing the procedure, the bill and the questions) → Referral Pack (walk into the clinic armed). Seven services, one wallet, one PDF trail — average client journey ≈ 60–70 credits ≈ $4–7 of revenue per engaged user, versus Function Health's $365/yr for less personalization.`;

export default function WhyILera() {
  const partnerPdf = () => {
    const t = "iLERA HEALTHCARE SUITE - PARTNER ONE-PAGER\nFor Clinics, Pharmacies, Kiosk Hosts and Employers\n\nDISCLAIMER: All figures, case examples, and patient scenarios used in this document are purely illustrative and educational. They do not represent any particular patient, are not based on real medical records, and are provided solely to demonstrate how the services work. Actual results will vary based on individual health data.\n\nWHAT iLERA IS\nEight AI health services (Companion read, Lab Reader, Shadow Annual Physical, Health Risk Radar, Meds and Supplement Checker, Referral Pack Compiler, 7-Panel Deep Read, Ounje Nutrition) that turn walk-in health questions into structured, clinician-ready PDFs. Educational screening only - never a diagnosis.\n\nWHY HOST iLERA\n- New foot traffic: the free Shadow Physical band tables and the Mens/Womens 7-Panel pull curious customers in.\n- New revenue: credit packs sold on site; partners earn a share of every pack redeemed at their location.\n- Zero clinical liability: iLera never diagnoses, prescribes, or overrides a clinician; red-flag symptoms route straight to 911.\n- Differentiation: be the pharmacy or clinic that hands every customer a printed pre-visit read.\n- Loyalty loop: Ounje meal plans and screening calendars bring customers back monthly.\n\nHOW IT WORKS AT YOUR SITE\n1) Customer scans your QR stand or uses your tablet.\n2) Browses the free band tables (Too Low to Too High, with consequences).\n3) Buys credits, runs a read, prints or emails the PDF.\n4) The Referral Pack PDF lands them back at YOUR counter or consult room.\n\nREVENUE MODEL\n- Credit packs: 10 / 19 / 59 / 199 dollars - partner share on packs redeemed on site.\n- Kiosk subscription (Phase 3): 99 dollars per month per kiosk with remote clinician approval queue.\n- Co-branded PDFs carry your logo, address and consult booking line.\n\nCOMPLIANCE GUARDRAILS\n- Educational screening, not medical treatment; 18+ only.\n- Emergency symptoms redirect to 911 immediately, no credits charged.\n- Prior clinician findings are always restated, never overridden.\n- HIPAA-grade security; consent-based data; one-tap delete for the client.\n\nTHE 8 SERVICES AND CREDITS\niLera Companion 10 | Lab Reader 10 | Shadow Annual Physical 10 | Health Risk Radar 15 | Meds and Supplement Checker 5 | Referral Pack Compiler 10 | 7-Panel Deep Read 10 | Ounje Nutrition 10\n\nNEXT STEP\nBook a 30-day pilot: one tablet, one QR stand, zero integration work. Contact the Partner Desk via the Contact page or email from the site footer.\n\nFounderPilot AI - Healthcare Suite\nfounderpilot-theta.vercel.app/why-ilera";
    downloadPdf(t, "iLera-Partner-One-Pager.pdf");
  };
  const download = () => {
    const txt = "WHY iLERA - THE COMPLETE VALUE MAP\n\nDISCLAIMER: All figures, case examples, and patient scenarios used in this document are purely illustrative and educational. They do not represent any particular patient, are not based on real medical records, and are provided solely to demonstrate how the services work. Actual results will vary based on individual health data.\n\n---\n\n1. iLera - AI Healthcare Companion (10 cr)\n\nClient types: their symptom story + vitals + history (or just writes everything in one flow)\nGets back: safety check -> possible patterns -> bloodwork to request -> Prevention Radar -> 5 questions for their doctor -> lifestyle levers\n\nBenefits:\n- Turns vague worry into a structured, doctor-ready brief in 60 seconds\n- Catches red flags early (chest pain, stroke signs -> immediate 911 guidance)\n- Ends the I forgot to tell my doctor half my story problem\n- Never overrides their doctor; always adds prevention on top\n\nReal use: 42-year-old with nocturia + bloating gets a pre-visit read suggesting prostate/PSA discussion, HbA1c recheck, and sleep-apnea screening - before wasting a generic clinic visit\n\n---\n\n2. Lab Reader (10 cr)\n\nClient types: any bloodwork values they already have\nGets back: line-by-line plain-English read - reference range used, status (low/borderline/optimal/high), what each value relates to, what is missing from the 7-Panel\n\nBenefits:\n- Decodes the confusing PDF the lab sent\n- Stops clients from paying for panels they do not need or missing ones they do\n- Works with labs from ANY provider - no lock-in, no conflict of interest\n\nReal use: Client pastes 6 values -> learns HbA1c 5.9 = prediabetic range + discovers nobody ever checked their Lp(a) or kidney UACR\n\n---\n\n3. Shadow Annual Physical (10 cr, free table first)\n\nClient types: browses the free band table (Too Low -> Too High + consequences), then pastes values or uploads a photo\nGets back: every marker mapped to its band with the consequence of being out of range + top-3 watch items + missing markers\n\nBenefits:\n- Free education first - builds trust before spending a credit\n- Photo upload = zero typing for non-tech clients\n- Teaches the iodine lesson: every out-of-range value comes with what it can lead to\n\nReal use: Client photographs their annual physical -> iLera flags eGFR trending down, recheck in 3 months, ask about UACR - a decline their busy GP glossed over\n\n---\n\n4. Health Risk Radar (15 cr)\n\nClient types: age, gender, family history, lifestyle, BMI, BP\nGets back: risk map (cardiac/metabolic/prostate-or-breast/kidney/bone: Low-Moderate-Elevated) + personal screening calendar with cadence\n\nBenefits:\n- Answers: Given MY family and MY habits, what should I be screening for, and how often?\n- Converts anxiety into a dated checklist (colonoscopy at 45, PSA at 50, bone density at 65...)\n- Family-history aware: fathers heart attack at 55 moves cardiac screening a decade earlier\n\nReal use: 38-year-old with diabetic mother gets start HbA1c annually NOW, not at 45 - a decade of prevention bought for 15 credits\n\n---\n\n5. Meds & Supplement Checker (5 cr)\n\nClient types: prescriptions + supplements\nGets back: pairwise interaction severity (Major/Moderate/Minor), kidney/liver load notes, timing/food rules, 3 pharmacist questions\n\nBenefits:\n- Catches silent dangers: warfarin + vitamin K greens, statins + grapefruit, NSAIDs on tired kidneys\n- Never tells them to stop anything - always discuss with clinician/pharmacist\n- Cheapest service = perfect impulse purchase and repeat-use tool\n\nReal use: Client on lisinopril + ibuprofen as needed learns the kidney-stress combo and switches to paracetamol after a pharmacist chat\n\n---\n\n6. Referral Pack Compiler (10 cr)\n\nClient types: anything - iLera reads, lab values, symptom timeline, prior visits\nGets back: a one-page clinician-ready PDF: context, chief concern timeline, meds, prior findings, educational notes, tests to ask about, patient questions\n\nBenefits:\n- Turns a 15-minute rushed appointment into a productive one\n- Patients feel heard; doctors save time; nothing gets forgotten\n- The natural export at the end of every other service flow\n\nReal use: Client hands their GP the PDF -> GP orders exactly the 4 tests listed -> diagnosis in one visit instead of three\n\n---\n\n7. Ounje - AI Nutrition Companion (10 cr)\n\nClient types: conditions/goals, allergies, cuisine preference, budget, meds\nGets back: condition principles -> Eat-more/Moderate/Avoid food tables -> breakfast-lunch-dinner-snacks day plan -> 3 recipes -> grocery list by aisle -> med-interaction cautions\n\nBenefits:\n- Food advice tied to their actual conditions (prediabetic + hypertensive + West African cuisine = not generic keto PDF)\n- Budget- and culture-aware - jollof-friendly swaps, not quinoa lectures\n- Closes the loop: iLera says lower sodium, Ounje shows exactly what to cook tonight\n\nReal use: Prediabetic client gets a 7-day plan with egusi-based low-glycemic dinners + a grocery list they can photograph at Market Square\n\n---\n\nTHE FLYWHEEL\n\nShadow Physical (free table hooks them) -> Lab Reader (decode what they have) -> iLera (connect values to symptoms) -> Risk Radar (plan the next decade) -> Meds Checker (make the stack safe) -> Ounje (fix the plate) -> Procedure Explainer (walk in knowing the procedure, the bill and the questions) → Referral Pack (walk into the clinic armed).\n\nSeven services, one wallet, one PDF trail - average client journey = 60-70 credits = $4-7 of revenue per engaged user, versus Function Healths $365/yr for less personalization.\n\n---\n\nDISCLAIMER (repeated): All figures, case examples, and patient scenarios used in this document are purely illustrative and educational. They do not represent any particular patient, are not based on real medical records, and are provided solely to demonstrate how the services work. Actual results will vary based on individual health data.\n\n---\n\nTry iLera now at founderpilot.com/suite/ilera\n\n(c) 2026 FounderPilot AI";
    downloadPdf(txt, "Why-iLera-one-pager.pdf");
  };

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white">
      <Link href="/suite/healthcare" className="text-cyan-400 hover:underline text-sm">← Back to Healthcare Suite</Link>
      <h1 className="mt-3 text-5xl font-bold text-rose-300">🩺 Why iLera</h1>
      <p className="mt-2 text-lg text-slate-300">Seven specialist services. One wallet. One PDF trail.</p>
      <button onClick={download} className="mt-4 rounded-lg bg-cyan-500 px-6 py-3 text-sm font-bold text-slate-950 hover:bg-cyan-400">📄 Download One-Pager PDF (for partners)</button>
      <button onClick={partnerPdf} className="mt-4 ml-3 rounded-lg bg-rose-500 px-6 py-3 text-sm font-bold text-slate-950 hover:bg-rose-400">🏥 Clinic / Pharmacy / Kiosk Partner One-Pager PDF</button>

      <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
        {services.map((s, i) => (
          <div key={i} className="rounded-xl border border-rose-500/40 bg-rose-500/5 p-6">
            <div className="flex items-start justify-between">
              <p className="text-lg font-bold text-rose-200">{i + 1}. {s.name}</p>
              <span className="rounded-full bg-amber-500/20 px-3 py-1 text-xs font-bold text-amber-300">{s.cr}</span>
            </div>
            <div className="mt-3">
              <p className="text-xs font-bold text-cyan-300">CLIENT TYPES:</p>
              <p className="text-sm text-slate-300">{s.client}</p>
            </div>
            <div className="mt-2">
              <p className="text-xs font-bold text-emerald-300">GETS BACK:</p>
              <p className="text-sm text-slate-300">{s.gets}</p>
            </div>
            <div className="mt-3">
              <p className="text-xs font-bold text-rose-300">BENEFITS:</p>
              <ul className="mt-1 space-y-1 text-sm text-slate-300">
                {s.benefits.map((b, j) => <li key={j}>• {b}</li>)}
              </ul>
            </div>
            <div className="mt-3 rounded-lg bg-slate-800/50 p-3">
              <p className="text-xs font-bold text-amber-300">REAL USE:</p>
              <p className="text-xs text-slate-300 italic">{s.use}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10 rounded-xl border border-cyan-500/40 bg-cyan-500/10 p-6">
        <p className="text-2xl font-bold text-cyan-300">🔗 The Flywheel</p>
        <p className="mt-3 text-sm leading-relaxed text-slate-300">{flywheel}</p>
      </div>

      <div className="mt-10 text-center">
        <Link href="/suite/ilera" className="inline-block rounded-lg bg-rose-500 px-8 py-4 text-lg font-bold text-slate-950 hover:bg-rose-400">Try iLera Now →</Link>
      </div>
    </main>
  );
}
