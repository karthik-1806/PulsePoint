# Security Posture

## Authentication & Authorization
- **JWT Protection**: All `ops-agent` endpoints (`/ops-agent/incident`, `/ops-agent/briefing`, `/forecast`) require a valid JWT passed in the `Authorization: Bearer <token>` header.
- **Role-Based Access Control (RBAC)**: Routes are strictly protected by role dependencies (e.g. `commander` vs `volunteer`).

## API Resilience
- **Rate Limiting**: `slowapi` is configured globally. The `/forecast` endpoint is throttled at `20/minute` to prevent excessive LLM billing.
- **Secure HTTP Headers**: The backend implements a custom `SecureHeadersMiddleware` injecting:
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `Strict-Transport-Security: max-age=31536000; includeSubDomains`
  - `Content-Security-Policy: default-src 'self' http://localhost:* ws://localhost:*`

## LLM Safety & Prompt Injection
- **Input Demarcation**: All user-supplied text (incident descriptions and fan chat queries) are strictly bounded by `<user_input>` XML-like tags. 
- **System Constraints**: The system prompt explicitly instructs Gemini to treat anything within these tags as untrusted data and ignore any embedded commands or behavior overrides.

## Secrets Management
- All secrets (like `GEMINI_API_KEY` and `JWT_SECRET`) have been migrated to the `.env` file.
- **CI Secret Scanner**: A CI step (`ci_scan.ps1`) has been added to recursively search the codebase (excluding `.env`) for accidental commits of `GEMINI_API_KEY=` or `JWT_SECRET=`.

## Dependency Audits (as of July 15, 2026)
- `pip-audit`: **0 vulnerabilities found**.
- `npm audit`: Ran `npm audit fix --force` to resolve high-severity issues (upgrading Next.js). Remaining issues are limited to sub-dependencies (e.g., `postcss`) that do not directly expose the local Dev environment.
