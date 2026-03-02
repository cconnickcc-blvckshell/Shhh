# Service Level Agreement / Objectives

**Effective Date:** [EFFECTIVE_DATE]  
**Last Updated:** [EFFECTIVE_DATE]

---

## 1. Overview

This document describes the service levels [COMPANY_NAME] targets for the Shhh platform. These are objectives; we do not guarantee specific uptime unless otherwise agreed in a separate commercial agreement.

---

## 2. Service Level Objectives (SLOs)

| Metric | Target | Measurement |
|--------|--------|-------------|
| **API availability** | 99.5% | Monthly uptime (excluding planned maintenance) |
| **API latency (p95)** | < 500ms | For core endpoints (e.g. /v1/discover, /v1/conversations) |
| **Error rate** | < 1% | 5xx errors as percentage of requests |

---

## 3. Planned Maintenance

- We may perform planned maintenance with advance notice where practicable
- Planned maintenance typically does not count against availability SLOs
- We will endeavour to schedule maintenance during low-traffic periods

---

## 4. Exclusions

Availability and performance targets do not apply to:

- Circumstances beyond our reasonable control (e.g. natural disaster, pandemic, cyberattack)
- User-side issues (e.g. device, network)
- Third-party service failures (e.g. cloud provider, payment processor)
- Violations of our Terms or Acceptable Use Policy

---

## 5. Monitoring and Reporting

- We monitor our systems and aim to detect and resolve issues promptly
- We may publish availability or incident reports in our status page or communications (if available)

---

## 6. Support

For service issues, contact [SUPPORT_EMAIL]. See our [Support Policy](SUPPORT_POLICY.md) for response expectations.

---

## 7. Commercial SLAs

For enterprise or commercial customers, we may offer custom SLAs with guaranteed uptime and credit provisions. Contact [SALES_EMAIL] for details.
