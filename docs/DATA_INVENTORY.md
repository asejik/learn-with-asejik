# DATA INVENTORY: Learn with Asejik

Initial Draft: 2026-11-21 | Governed by: Nigeria Data Protection Act (NDPA 2023) & GAID 2025 | Controller: Asejik (asejik.com)

---

## 1. Personal Data Inventory

| Field Name | Category | Purpose of Collection | Lawful Basis | Sensitive? | Storage Location | Access Controls | Retention Period | Deletion Method |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Full Name** | Identity Data | Personalize lesson completion certificates and identify pilot learner. | Consent (NDPA s.25) | No | 1. Client IndexedDB (`user_profile`)<br>2. Private Pilot Roster (Google Sheet) | Learner on device; Asejik (authenticated 2FA) | Duration of pilot + 12 months or until deletion requested | Client IndexedDB wipe; row deletion in pilot sheet upon email request |
| **Email Address** | Contact Data | Send completion confirmation, course update notifications, and pilot feedback requests. | Consent (NDPA s.25) | No | 1. Client IndexedDB (`user_profile`)<br>2. Private Pilot Roster (Google Sheet) | Learner on device; Asejik (authenticated 2FA) | Duration of pilot + 12 months or until unsubscribe/deletion | Client IndexedDB wipe; row deletion in pilot sheet upon email request |
| **Consent Timestamp** | Compliance Metadata | Record exact ISO timestamp when user ticked the consent box. | Legal Obligation / Accountability | No | 1. Client IndexedDB (`user_profile`)<br>2. Private Pilot Roster (Google Sheet) | Learner on device; Asejik (authenticated 2FA) | Same as user record | Cleared along with user record |

---

## 2. Non-Personal Local Telemetry (Stored Client-Side in IndexedDB)

These data points are stored strictly on the learner's device inside browser IndexedDB (`asejik_learning_db`) and are **not** linked to identity in the cloud:
* **Course & Lesson Progress**: Active lesson slug, completed screen IDs, timestamp of last activity, and the current screen position and screen order within a lesson (so a reload resumes on the same screen).
* **Active Recall Queue**: Queued question IDs for the 3-screen retry loop.
* **Content Feedback Rating**: Thumbs-up or thumbs-down rating recorded upon lesson completion.

---

## 3. Third-Party Data Processors

| Processor | Role | Data Received | Processing Location | Data Protection Measures |
| :--- | :--- | :--- | :--- | :--- |
| **Cloudflare Inc.** | Hosting & Global Edge CDN | Transient HTTP request logs (IP address, user-agent) | Global | Standard DPA; ephemeral edge logs retained per Cloudflare standard policy. No emails logged in console. |
| **Google LLC** | Cloud Spreadsheet (Pilot Roster) | Full Name, Email Address, Consent Timestamp | US / Global | 2FA protected account; restricted access; no public sharing. |

---

## 4. User Rights Procedure (NDPA 2023)

Learners have the right to request access to their stored data, rectification of their name/email, or full erasure:
* **Erasure**: Learners can clear their local data immediately by clicking the "Clear Local Data" button in the catalog footer. For cloud pilot roster deletion, learners email `privacy@asejik.com`, and the corresponding record is purged within 48 hours.
* **Complaints**: Learners can lodge questions or complaints directly with the Data Controller at `privacy@asejik.com` or escalate to the **Nigeria Data Protection Commission (NDPC)** at `ndpc.gov.ng`.

---

## 5. Associated Compliance Documents
* **Privacy Notice Draft**: [`docs/privacy/PRIVACY_NOTICE_DRAFT.md`](file:///d:/dev/e-learning/docs/privacy/PRIVACY_NOTICE_DRAFT.md)
* **Compliance Checklist**: [`docs/privacy/COMPLIANCE_CHECKLIST.md`](file:///d:/dev/e-learning/docs/privacy/COMPLIANCE_CHECKLIST.md)
