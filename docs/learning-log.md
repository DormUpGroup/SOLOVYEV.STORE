# Learning log — AI Operations Copilot

Personal study journal tied to SOLOVYEV.STORE. Update after each stage with concrete files and decisions — no generic filler.

---

## Stage 0 — Audit (docs only)

### What was done

- Audited App Router architecture, Sell/Trade client-only WhatsApp flow, Supabase clients, migrations `001`–`010`, admin HMAC auth, absence of Zod/AI/tests.
- Wrote:
  - `docs/ai-operations-copilot-plan.md`
  - `docs/security-notes.md`
  - this file
- Confirmed: table `inquiries` exists (`008_crm_foundation.sql`) but app never inserts; form fields live only in WhatsApp text + analytics counter.

### Concepts studied (target)

- App Router vs Pages Router (this repo: App Router only).
- Dual auth: Supabase customers vs env+JWT admin.
- Service-role vs publishable/anon keys and RLS bypass.
- Why checkout (`app/api/checkout/route.ts`) is the right persistence template for Sell/Trade.
- Difference between TypeScript types and runtime validation (Zod not yet in repo).
- Human-in-the-loop and “persist before AI”.

### Decisions I made myself

_(fill after your answers)_

- [ ] Idempotency design note submitted
- [ ] Control questions answered
- [ ] AI provider confirmed (default proposed: OpenAI)
- [ ] Branch `feature/ai-operations-copilot` agreed / created

### Mistakes / surprises

_(fill in)_

- Example prompt: Did you assume `inquiries` was already wired to the form? What did the audit show?

### Need to revisit

- Idempotency: unique constraint vs idempotency key vs debounce vs retry vs duplicate detection
- Why legal copy in `lib/legal/en.ts` blocks “silent” persistence

### Self-check questions (Stage 0)

1. Why is the lead lost today if WhatsApp does not open?
2. How does checkout differ from Sell/Trade regarding durability?
3. Why extend `inquiries` instead of ignoring the existing table?
4. What can the service-role key do that the publishable key cannot?
5. What must change in legal text before Stage 1 ships?

### Mentor assignment issued

See chat: **Idempotency design note** (no code). Complete before Stage 1.
