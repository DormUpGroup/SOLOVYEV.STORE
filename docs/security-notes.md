# Security notes — AI Operations Copilot

**Scope:** Findings from Stage 0 audit of SOLOVYEV.STORE relevant to (and adjacent to) the AI Operations Copilot MVP.  
**Rule:** Do **not** fix unrelated large issues without explicit agreement. Mark critical items clearly.

Last updated: Stage 0 audit.

---

## Auth model (current)

### Customers

- Supabase Auth via `@supabase/ssr` (browser + server + middleware session refresh).
- Account routes guarded by middleware + layouts.
- User-scoped tables use RLS (`auth.uid()`).

### Admin

- **Not** Supabase Auth.
- Shared env credentials: `ADMIN_LOGIN`, `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`, `ADMIN_PATH`.
- HMAC JWT cookie `admin_session` (`lib/auth.ts`), payload roughly `{ iat, exp, role: "admin" }` — **no per-admin user id**.
- Defense in depth:
  1. Middleware: unauthenticated `/admin-internal` and `/api/admin/*` → **404** (obscurity).
  2. Each admin route handler: `isAdminAuthenticated()` → **401**.
  3. Data access via `createServiceClient()` / service role (bypasses RLS).

### Implication for Copilot

- Audit `actor_id` for manager actions will be a stable string such as `"admin"` until multi-admin accounts exist.
- Acceptable for MVP; document limitation.

---

## Secrets & keys

| Secret | Expected location | Risk if leaked |
|--------|-------------------|----------------|
| `SUPABASE_SERVICE_ROLE_KEY` | Server only (`utils/supabase/admin.ts`) | Full DB bypass of RLS |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` / anon | Browser OK | Subject to RLS |
| `ADMIN_*` | Server / env | Full admin panel |
| Future `OPENAI_API_KEY` (or Anthropic) | **Server only** | Billable abuse + data exfil via prompts |

**Rules for Copilot:**

- Never call AI from client components.
- Never put AI keys in `NEXT_PUBLIC_*`.
- Never accept arbitrary user prompts as the system prompt (prompt injection / cost).

---

## Row Level Security (CRM)

From `008_crm_foundation.sql` / hardening:

- `inquiries`, `customer_notes`, `admin_tasks`: RLS enabled; **revoked from `authenticated`/`public`**.
- Intended access: **service role only** (admin APIs).

**Copilot must:**

- Create inquiries only through a Next.js Route Handler that validates input, then inserts with service role (or a constrained DB function).
- **Not** grant anon INSERT on `inquiries` from the browser client.

---

## Findings

### Critical

| ID | Finding | Why critical | Action for Copilot |
|----|---------|--------------|--------------------|
| C1 | Future public `POST /api/inquiries` that also triggers paid AI without rate limiting | Cost abuse / DoS on wallet | Rate-limit like `lib/auth.ts` login; feature flag; timeouts |
| C2 | Accidental client exposure of service-role or AI key | Full compromise | Code review; never import admin client in client components |

No evidence in audit that service-role is currently shipped to the browser bundle. Keep it that way.

### Important (existing; do not silent-fix)

| ID | Finding | Notes |
|----|---------|-------|
| I1 | Single shared admin password; JWT has no user identity | Limits accountability; MVP OK with `actor_id = "admin"` |
| I2 | Failed admin logins rate-limited but not persistently audited | Consider later |
| I3 | Unauthenticated admin paths return 404 not 401 | Intentional obscurity; handlers still 401 |
| I4 | Legal text says Sell/Trade is not stored | Becomes a **compliance issue** the moment we persist — update `lib/legal/*` in Stage 1 |
| I5 | Analytics route accepts events with empty metadata | Low risk; do not put PII into analytics without review |
| I6 | Process-local login rate limit | Resets on cold start / multi-instance; known limitation on Vercel |

### Improvements

| ID | Finding | Notes |
|----|---------|-------|
| P1 | No structured security logger / SIEM | `console.error` only |
| P2 | No automated tests for authz on admin routes | Add integration tests in Stage 6 |
| P3 | Stub mention of `/api/admin/login` in middleware vs real `/api/auth/login` | Confusing; low risk |

---

## Threat scenarios for Copilot (checklist)

Use before merging Stage 1–5:

- [ ] Can admin inquiry APIs be called without JWT? (expect 401/404)
- [ ] Can an attacker POST huge bodies / flood AI? (rate limit + size limits)
- [ ] Can inquiry id from another session be read via public API? (public API should not expose list/detail)
- [ ] Can client send a custom “system prompt” field? (reject unknown fields)
- [ ] Does AI payload include phone/email/name? (must not)
- [ ] Are secrets absent from client bundle / network tab?
- [ ] Do error logs print full customer PII or API keys? (must not)
- [ ] Does “Approve” send a message automatically? (must not in MVP)
- [ ] Does feature flag off still allow inquiry insert without AI?

---

## PII policy for AI

**Allowed in model input (MVP):** item category, brand/model, size, condition, expected price, non-contact item notes, sell/trade type, optional locale, inquiry ref.

**Forbidden in model input (MVP):** phone, email, full name, address, admin/internal notes, payment data, auth identifiers beyond necessity.

**Storage:** Contact fields may exist later on `inquiries` for ops; still strip before AI call.

---

## Idempotency & abuse

- Double submit without protection → duplicate rows + duplicate AI cost.
- Client debounce alone is insufficient (security/reliability must be server-side).
- Prefer unique `idempotency_key` on `inquiries` + return existing row on replay.

See learning exercise in Stage 0 response / `docs/learning-log.md`.

---

## Out of scope for silent fixes

- Replacing admin auth with Supabase roles / multi-user RBAC
- Rewriting middleware status codes
- Changing production credentials or production Supabase project
- Destructive SQL
- Auto-messaging customers

If a **new critical** vulnerability is found during implementation (e.g. IDOR on admin detail), stop, document here with severity, and agree a fix before continuing the feature.
