# Security Incident Response Plan

**Effective Date:** [EFFECTIVE_DATE]  
**Classification:** Internal  
**Owner:** Security / Engineering Lead

---

## 1. Purpose

This plan defines how [COMPANY_NAME] responds to security incidents affecting our systems, data, or users.

---

## 2. Definitions

- **Security Incident:** Any event that compromises or may compromise the confidentiality, integrity, or availability of our systems or data (e.g. breach, malware, unauthorized access).
- **Personal Data Breach (GDPR):** A breach of security leading to the accidental or unlawful destruction, loss, alteration, unauthorized disclosure of, or access to, personal data transmitted, stored, or otherwise processed. All personal data breaches are security incidents; not all security incidents are personal data breaches.
- **Incident Response Team (IRT):** Designated personnel responsible for incident response.

---

## 3. Incident Classification

| Severity | Description | Example |
|----------|-------------|---------|
| **Critical** | Active breach; significant data exposure; service compromise | Database exfiltrated; ransomware |
| **High** | Potential breach; limited exposure; significant impact | Unauthorized admin access; credential leak |
| **Medium** | Isolated compromise; limited scope | Single account compromise; vulnerability exploited |
| **Low** | Minor incident; no confirmed impact | Failed intrusion attempt; phishing |

---

## 4. Response Phases

### 4.1 Detection & Triage

- Identify and log the incident
- Assign severity and IRT lead
- Begin initial containment

### 4.2 Containment

- Isolate affected systems
- Revoke compromised credentials
- Preserve evidence (logs, snapshots)

### 4.3 Eradication

- Remove threat (malware, unauthorized access)
- Patch vulnerabilities
- Verify systems are clean

### 4.4 Recovery

- Restore services from clean backups if needed
- Monitor for recurrence
- Implement additional controls

### 4.5 Post-Incident

- Document timeline and actions
- Conduct post-mortem
- Update procedures and controls

---

## 5. Notification

- **Internal:** IRT notifies leadership and relevant teams
- **Users:** Per [Data Breach Notification](DATA_BREACH_NOTIFICATION.md)
- **Regulators:** Per GDPR Art. 33 (72 hours from when we become aware of a personal data breach), CCPA, US state breach notification laws, and other applicable laws. The 72-hour clock starts when we have a reasonable degree of certainty that a breach has occurred.
- **Breach register:** We maintain a record of all personal data breaches (including those not reported to regulators) as required by GDPR Art. 33(5)

---

## 6. Roles and Responsibilities

| Role | Responsibility |
|------|----------------|
| **IRT Lead** | Coordinates response; decisions on containment and notification |
| **Engineering** | Technical containment; forensics; remediation |
| **Legal** | Legal obligations; regulator communication |
| **Communications** | User and public communication |

---

## 7. Contact

**IRT Lead:** [IRT_LEAD_EMAIL]  
**On-call:** [ONCALL_PROCEDURE]
