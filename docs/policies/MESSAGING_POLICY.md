# Messaging Policy

**Effective Date:** [EFFECTIVE_DATE]  
**Last Updated:** [EFFECTIVE_DATE]

---

## 1. Overview

This policy describes how we handle messaging on the Shhh platform, including storage, retention, and your rights.

---

## 2. Message Storage and Ephemerality

- **Conversations:** Stored in our databases.
- **Messages:** Stored in a dedicated message store with configurable retention (TTL).
- **Temporary by design:** Messages are designed to be temporary and are not intended for permanent storage. They are subject to:
  - **TTL (time-to-live):** Messages and media may expire within a set period (e.g. 7–90 days per conversation settings).
  - **Self-destruct:** Media and messages with a TTL are purged automatically after the set period.
  - **Technical and safety limitations:** We may retain some message data for abuse detection, compliance, or legal requirements. We do not retain more than necessary for these purposes.

We do not use the word "ephemeral" without these qualifiers. Messages are not guaranteed to be destroyed instantly or in all circumstances.

---

## 3. Encryption

- **In transit:** All messaging is encrypted via TLS
- **At rest:** Data is stored on secured infrastructure
- **End-to-end encryption (E2EE):** E2EE infrastructure exists for key storage; full client-side E2EE may be implemented in the future. Currently, messages are not E2EE on the wire.

---

## 4. Retention

- **Default:** Messages may be retained per conversation TTL (e.g. 7–90 days depending on settings).
- **Self-destruct:** Media and messages with TTL are purged automatically.
- **Account deletion:** Messages are deleted as part of account deletion, subject to our [Deletion & Retention Clarification](PRIVACY_POLICY.md) in the Privacy Policy.

---

## 5. Monitoring and Moderation

- We do not routinely read your messages.
- We may review messages when: (a) you or another user reports them; (b) required by law; (c) necessary to enforce our policies or protect users.

---

## 6. Consent and Safety

**Consent is contextual and revocable.** Prior consent does not imply future consent. Only message users who have consented to receive messages (e.g. mutual match, conversation started). Do not use messaging for spam, harassment, or illegal activity. See our [Acceptable Use Policy](ACCEPTABLE_USE_POLICY.md).

---

## 7. Contact

[PRIVACY_EMAIL]
