# Data Retention Policy

**Effective Date:** [EFFECTIVE_DATE]  
**Classification:** Internal / Regulators  
**Owner:** Data Protection / Legal

---

## 1. Purpose

This policy defines how long [COMPANY_NAME] retains personal data and the basis for retention periods. It supports compliance with GDPR, CCPA, and other data protection laws.

---

## 2. Principles

- Retain data only as long as necessary for the stated purpose;
- Delete or anonymize data when retention periods expire;
- Document retention periods and legal bases;
- Ensure deletion is irreversible where required.

---

## 3. Retention Periods by Data Category

| Data Category | Retention Period | Legal Basis |
|---------------|------------------|-------------|
| Account data (profile, preferences) | Until account deletion + 30 days | Contract, legal obligation |
| Messages (MongoDB) | Per TTL (e.g. 7–90 days) or until conversation deletion | Contract |
| Location data | 24 hours or until next update | Legitimate interest |
| Presence data | Until expiry (e.g. 60 min) | Legitimate interest |
| OTP codes | 5 minutes | Legitimate interest |
| Refresh tokens | Until revocation or expiry (7 days) | Contract |
| Audit logs | 7 years (or as required by law) | Legal obligation |
| Safety/panic records | 7 years | Legal obligation |
| Screenshot reports | 2 years | Legitimate interest (safety) |
| Ad impressions | 2 years | Legitimate interest |
| Support tickets | 3 years after resolution | Legitimate interest |
| Deletion requests | 3 years (proof of compliance) | Legal obligation |

---

## 4. Deletion Triggers

- **User request:** Account deletion triggers deletion of associated data within 30 days, subject to legal holds.
- **TTL expiry:** Messages, presence, and similar data are automatically purged by TTL.
- **Account termination:** Same as user request; may retain minimal data for legal/security purposes.

---

## 5. Exceptions

- **Legal hold:** Data may be retained beyond normal periods when required by law, litigation, or regulatory investigation. When a legal hold is imposed, we will document the scope, reason, and custodian. Holds are lifted when the matter is resolved and retention is no longer required.
- **Backups:** Deleted data may persist in backups for up to 90 days; backups are overwritten on schedule.
- **Regulatory retention:** Financial, tax, employment, and certain other records may be retained for 7 or more years as required by applicable law (e.g. tax, employment, financial services regulations).

---

## 6. Anonymisation

Where we retain data for analytics or research after the primary purpose has ended, we may anonymise it so that it no longer identifies individuals. Anonymised data is not subject to data subject rights and may be retained indefinitely for statistical purposes.

---

## 7. Deletion Verification

We verify that deletion has been completed through logs and, where applicable, audit trails. Deletion is performed in accordance with our technical procedures to ensure data is overwritten or otherwise rendered unrecoverable where required by law.

---

## 8. Retention Schedule

A formal retention schedule is maintained and reviewed annually. It aligns with this policy and is available to regulators and auditors upon request.

---

## 9. Review

This policy is reviewed annually and updated as needed. Changes require approval from Legal and Data Protection.
