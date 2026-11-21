# NDPA 2023 & GAID 2025 Compliance Checklist: Learn with Asejik

Last updated: 2026-11-21 | Status: PHASE 1 PILOT COMPLIANT

---

## 1. Statutory Threshold & Controller Classification

| Parameter | Current Pilot Status | Target Threshold for Action | Required Action |
| :--- | :--- | :--- | :--- |
| **Learner Volume** | 15–50 pilot learners | Exceeding 200 learners within 6 months | Register with NDPC under **Ordinary-High (OHL)** tier (Fee: ₦10,000/yr). |
| **Sector Focus** | Education (interactive tutorials) | Commercial public release with > 200 learners | Designate an internal Data Protection Officer (DPO) and complete DPIA. |
| **Sensitive Data** | **None** (No financial, BVN, NIN, health, or children data) | If adding payment data in Phase 2 | Ensure payment card processing is 100% delegated to a licensed gateway (Paystack / Flutterwave). |

---

## 2. Technical & Product Privacy Controls (Phase 1)

- [x] **Data Minimization**: Only collect Full Name and Email upon course completion. No upfront registration barrier.
- [x] **Unbundled, Explicit Consent**: Signup modal requires an active click on an un-ticked checkbox.
- [x] **Consent Logging**: Storing `{ consentedAt: ISOString, consentVersion: "1.0" }` locally in IndexedDB and in pilot roster.
- [x] **Self-Service Data Wipe**: Learner can clear all local progress and profile data using the "Clear Local Data" button.
- [x] **Zero Tracking Cookies**: No marketing cookies, trackers, or third-party advertising SDKs.
- [x] **Log Sanitization**: Next.js serverless routes (`/api/pilot-signup`) do not print raw emails to Vercel console logs.
- [x] **Transparent Notice**: Plain-language privacy notice available from catalog footer and course completion modal.

---

## 3. Operational & Governance Roadmap (Phase 2 Public Launch)

- [ ] **NDPC Registration**: Complete online registration at `ndpc.gov.ng` when scaling to the general public (> 200 learners).
- [ ] **Data Protection Impact Assessment (DPIA)**: Execute using GAID Schedule 4 template prior to public marketing launch.
- [ ] **Annual Compliance Audit**: Schedule first compliance audit with an accredited DPCO within 15 months of commercial launch.
- [ ] **Data Processing Agreements (DPAs)**: Verify standard DPAs for cloud hosting (Vercel) and payment processor (Paystack/Flutterwave).
