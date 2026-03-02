# Policy–System Parity Matrix

**Classification:** Internal  
**Purpose:** Map policy statements to actual backend/frontend capability. Use to avoid over-promising and to prioritise implementation.  
**Owner:** Legal / Engineering  
**Last updated:** [EFFECTIVE_DATE]

---

## How to Read This Matrix

| Column | Meaning |
|--------|---------|
| **Policy statement** | What the policy says or implies |
| **Backend** | yes / partial / no |
| **Frontend** | yes / partial / no |
| **Risk** | Low / Medium / High if policy promises more than system delivers |
| **Owner** | Team responsible for closing gap |

---

## 1. Deletion & Retention

| Policy statement | Backend | Frontend | Risk | Owner |
|------------------|----------|----------|------|-------|
| Account deletion within 30 days | partial | yes | Medium | Engineering |
| Data removed from backups | no | — | Low | Engineering |
| Safety/audit retention documented | yes | — | Low | Legal |
| Legal retention documented | yes | — | Low | Legal |

**Notes:** `data_deletion_requests` table exists but no worker processes it. Deletion is manual or not fully automated. Policy now clarifies "we aim to" and timeframes.

---

## 2. Moderation

| Policy statement | Backend | Frontend | Risk | Owner |
|------------------|----------|----------|------|-------|
| Reports reviewed | yes | yes | Low | Trust & Safety |
| Response within SLA | no | — | Medium | Trust & Safety |
| 24/7 moderation | no | — | Low | Trust & Safety |
| Appeal reviewed by different moderator | partial | yes | Low | Trust & Safety |

**Notes:** Policy now includes "Moderation Scope & Capacity" disclaimer. No SLA promised.

---

## 3. Messaging & Ephemerality

| Policy statement | Backend | Frontend | Risk | Owner |
|------------------|----------|----------|------|-------|
| Messages have TTL | yes | yes | Low | — |
| Messages purged automatically | yes | — | Low | — |
| No permanent storage | partial | — | Low | — |
| Retention for abuse/compliance | yes | — | Low | — |

**Notes:** Policy now uses "temporary by design" and qualifiers instead of "ephemeral". Aligned with system.

---

## 4. Location

| Policy statement | Backend | Frontend | Risk | Owner |
|------------------|----------|----------|------|-------|
| Location fuzzing (~300m) | yes | — | Low | — |
| No exact coordinates shared | yes | — | Low | — |
| Temporary storage (24h) | yes | — | Low | — |
| No tracking when app closed | yes | — | Low | — |

**Notes:** Policy now explicit about precision, visibility, web vs mobile. Aligned.

---

## 5. Consent

| Policy statement | Backend | Frontend | Risk | Owner |
|------------------|----------|----------|------|-------|
| Consent revocable | yes | yes | Low | — |
| Prior consent ≠ future consent | yes | yes | Low | — |
| Blur/reveal consent flow | yes | yes | Low | — |

**Notes:** Policy now includes explicit "Consent is contextual and revocable" line. Aligned.

---

## 6. Safety

| Policy statement | Backend | Frontend | Risk | Owner |
|------------------|----------|----------|------|-------|
| Panic recorded | yes | yes | Low | — |
| Panic notifies contacts | no | — | High | Engineering |
| Screenshot report recorded | yes | yes | Low | — |
| Emergency contacts CRUD | yes | yes | Low | — |
| Missed check-in alerts | no | — | Medium | Engineering |

**Notes:** Panic returns "contactsNotified" but no SMS/push. Policy should avoid promising notification. Safety policy already states "deferred" or similar.

---

## 7. Data Subject Rights

| Policy statement | Backend | Frontend | Risk | Owner |
|------------------|----------|----------|------|-------|
| Access request fulfilled | yes | yes | Low | — |
| Deletion request processed | partial | yes | Medium | Engineering |
| Portability (export) | yes | yes | Low | — |
| Response within 30/45 days | yes | — | Low | — |

**Notes:** Deletion processing is the main gap. Policy clarifies "aim to" and timeframes.

---

## 8. Security

| Policy statement | Backend | Frontend | Risk | Owner |
|------------------|----------|----------|------|-------|
| Encryption in transit | yes | — | Low | — |
| Access controls | yes | — | Low | — |
| No absolute guarantee | — | — | Low | — |

**Notes:** Policy uses "designed to" / "aim to" rather than "we guarantee". Aligned.

---

## Review Cadence

- Update this matrix when: (a) policies change; (b) backend/frontend capabilities change; (c) before public launch.
- Target: High parity before launch. Where parity is low, policies should stay conservative.
