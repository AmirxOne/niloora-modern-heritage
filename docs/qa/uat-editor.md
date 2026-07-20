# UAT Checklist - Editor

## Preconditions

- Editor test account exists and is granted content workflow access.
- At least one draft/test post exists or can be created.
- Content workflow policy is enabled (role-based transition checks active).

## Step-by-Step Actions

1. Login as editor.
2. Open `/admin/posts`.
3. Create a post draft with valid metadata.
4. Edit title/slug/body/excerpt and save.
5. Attempt allowed status transitions for editor role.
6. Confirm post appears in list with updated status.
7. Review audit log surface (if available) for editor mutation entries.

## Expected Results

- Editor can access content workflow screens but not unrelated admin domains.
- Editor can create/update content only within permitted status boundaries.
- Disallowed transitions are blocked with explicit messages.
- Validation errors (metadata/slug constraints) are returned cleanly.
- Audit entries are recorded for successful and denied mutations.

## Negative Tests

1. Attempt out-of-scope transition for editor:
   - expect `400/403` with clear transition denial message.
2. Try deleting post as editor (if admin-only by policy):
   - expect denial.
3. Submit invalid post payload (missing required metadata for publish):
   - expect validation failure.
4. Access unrelated admin routes as editor:
   - expect redirect/forbidden.

## Rollback / Cleanup

- Remove or revert editor-created test posts.
- Restore edited shared content to original state.
- Tag test content clearly if deletion is not allowed.
- Export audit references (action + correlation id) for QA evidence.
