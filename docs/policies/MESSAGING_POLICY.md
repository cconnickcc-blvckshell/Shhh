# Messaging Policy

**Effective Date:** [EFFECTIVE_DATE]  
**Last Updated:** [EFFECTIVE_DATE]

---

## 1. Overview

This policy describes how we handle messaging on the Shhh platform, including storage, retention, and your rights.

---

## 2. Message Storage

- **Conversations:** Stored in our databases
- **Messages:** Stored in a dedicated message store with configurable retention (TTL)
- **Self-destructing messages:** Messages with a TTL are automatically deleted after the set period

---

## 3. Encryption

- **In transit:** All messaging is encrypted via TLS
- **At rest:** Data is stored on secured infrastructure
- **End-to-end encryption (E2EE):** E2EE infrastructure exists for key storage; full client-side E2EE may be implemented in the future. Currently, messages are not E2EE on the wire.

---

## 4. Retention

- **Default:** Messages may be retained per conversation TTL (e.g. 7–90 days depending on settings)
- **Self-destruct:** Media and messages with TTL are purged automatically
- **Account deletion:** Messages are deleted as part of account deletion

---

## 5. Monitoring and Moderation

- We do not routinely read your messages
- We may review messages when: (a) you or another user reports them; (b) required by law; (c) necessary to enforce our policies or protect users

---

## 6. Consent and Safety

- Only message users who have consented to receive messages (e.g. mutual match, conversation started)
- Do not use messaging for spam, harassment, or illegal activity. See our [Acceptable Use Policy](ACCEPTABLE_USE_POLICY.md)

---

## 7. Contact

[PRIVACY_EMAIL]
