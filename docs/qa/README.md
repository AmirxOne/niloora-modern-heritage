# UAT Checklists by Role

This directory contains executable UAT checklists for each role in linear execution order:

1. `uat-guest.md`
2. `uat-user.md`
3. `uat-vendor-owner-staff.md`
4. `uat-editor.md`
5. `uat-reviewer.md`
6. `uat-admin.md`

## Execution Notes

- Run all checklists in a staging-like environment with production-like configuration.
- Capture:
  - environment URL
  - build/version hash
  - tester identity
  - timestamp window
  - correlation id (from response header `x-correlation-id`) for failed cases
- Do not skip negative tests; they verify guards, RBAC, and safety controls.
- Perform cleanup at the end of each role checklist before moving to the next role.
