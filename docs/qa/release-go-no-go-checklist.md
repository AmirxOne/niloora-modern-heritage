# Release Go/No-Go Checklist - Role Lifecycle Completion

Use this checklist as the final release gate after role-based UAT execution.

## 1) Mandatory Pass Gates (All Required)

- [ ] **Unit tests:** pass (0 failed, no skipped critical suites).
- [ ] **Integration tests:** pass for auth/session, account, vendor, admin finance, content workflow.
- [ ] **E2E tests:** pass on full suite with stable run profile.
- [ ] **Security checks:** no open Critical/High vulnerabilities in changed scope.
- [ ] **Observability checks:** critical flows emit structured logs + correlation ids.
- [ ] **Health checks:** `/api/health` green/degraded only with understood non-blocking causes.

### Required Evidence Links

- Unit report: `<link-or-path>`
- Integration report: `<link-or-path>`
- E2E report: `<link-or-path>`
- Security report: `<link-or-path>`
- Health snapshot: `<link-or-path>`
- Observability sample logs: `<link-or-path>`

## 2) Role-Specific Blockers (Any item = NO-GO)

### Guest

- [ ] Protected routes fail to redirect to auth deterministically.
- [ ] Browse/search/cart public flow has blocking errors or broken states.

### User

- [ ] Login/session reliability issues (unauthorized loops, invalid refresh behavior).
- [ ] Account/profile update fails valid payloads or accepts invalid payloads.

### Vendor (Owner/Staff)

- [ ] Vendor apply/dashboard/products/orders/payouts flow broken for owner.
- [ ] Staff permission boundaries not enforced (privilege escalation risk).
- [ ] Vendor media upload or product submit workflow fails/duplicates unsafely.

### Editor

- [ ] Allowed content transitions fail for editor role.
- [ ] Editor can execute out-of-scope mutations.

### Reviewer

- [ ] Review/publish path fails on valid transitions.
- [ ] Pre-publish checks are bypassed for incomplete content.

### Admin

- [ ] Admin financial safety controls fail (refund/payout/settlement preconditions/guards).
- [ ] Audit trail missing for sensitive mutations (allow/deny/fail paths).

## 3) Severity-Based Release Policy

- **Critical (P0):** any open item => **NO-GO**.
  - Examples: auth bypass, RBAC bypass, data corruption, payment/refund wrong-state execution.
- **High (P1):** any open item in core role lifecycle => **NO-GO** unless explicitly waived by Engineering Lead + Product + Security.
- **Medium (P2):** release allowed only with:
  - documented workaround,
  - owner + ETA,
  - post-release monitoring plan.
- **Low (P3):** release allowed; track in backlog.

## 4) Sign-Off Owners

- [ ] **QA Lead** - Test completeness and evidence quality.
- [ ] **Engineering Lead** - Technical risk acceptance and rollback readiness.
- [ ] **Product Owner** - Business acceptance for role lifecycle outcomes.
- [ ] **Security Owner** - Security posture acceptance (mandatory for auth/RBAC/finance changes).
- [ ] **Release Manager / DevOps** - Deployment window, runbook, and monitoring readiness.

## 5) Final Decision

- Release Decision: **GO / NO-GO**
- Version/Tag: `<release-tag>`
- Environment: `<staging|preprod|prod>`
- Decision Time (UTC): `<timestamp>`
- Incident Channel / War Room: `<link>`

## 6) Approval Signatures

- QA Lead: `<name> - <date> - <evidence link>`
- Engineering Lead: `<name> - <date> - <evidence link>`
- Product Owner: `<name> - <date> - <evidence link>`
- Security Owner: `<name> - <date> - <evidence link>`
- Release Manager: `<name> - <date> - <evidence link>`
