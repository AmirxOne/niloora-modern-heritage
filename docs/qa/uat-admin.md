# UAT Checklist - Admin

## Preconditions

- Admin account with full privileges is available.
- Test fixtures exist for:
  - orders in multiple statuses
  - vendor payouts/refunds/settlements
  - users/vendors/products requiring moderation
- Audit log and health endpoints are enabled.
- Monitoring stack can receive structured logs and error events.

## Step-by-Step Actions

### Platform and Access

1. Login as admin and open `/admin`.
2. Verify access to core domains:
   - orders, products, users, vendors, finance, posts, audit logs.
3. Call `GET /api/health?detailed=1` (with secret header if configured).

### Financial Safety Flow

1. Execute refund state actions on a valid refund request.
2. Execute payout actions on a valid payout request.
3. Run settlement engine via admin route.
4. Repeat one action with stale `expectedStatus` to trigger conflict-safe guard.

### Moderation and Governance

1. Moderate a vendor product status.
2. Approve/reject vendor application.
3. Perform a content workflow operation from admin role.

### Observability Validation

1. For one successful and one failed critical action, capture:
   - response code/message
   - `x-correlation-id`
   - matching structured log record
2. Verify audit log entries for sensitive mutations.

## Expected Results

- Admin surfaces are reachable and authorized.
- Health report is actionable, with check summaries and failed check guidance.
- Financial operations enforce preconditions and transition guards.
- Operator mistakes return explicit domain error codes/messages.
- Audit trail is complete for allow/deny/failure paths on sensitive routes.
- Structured logs are emitted for critical journeys with correlation IDs.

## Negative Tests

1. Invalid finance action name:
   - expect explicit invalid-action error.
2. Reject/fail payout or refund without reason:
   - expect validation error.
3. Run payout/refund action with mismatched `expectedStatus`:
   - expect conflict response.
4. Trigger concurrent settlement run:
   - expect in-progress conflict code.
5. Submit invalid moderation payload:
   - expect validation failure and no partial mutation.

## Rollback / Cleanup

- Revert finance test entities to neutral state where possible:
  - cancel test refunds/payouts not intended for persistence.
- Remove or archive moderation test artifacts (products/posts/vendor applications).
- Export audit and log evidence for QA signoff.
- Rotate/clear any temporary secrets used for detailed health checks.
