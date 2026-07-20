# UAT Checklist - Reviewer

## Preconditions

- Reviewer account exists with reviewer workflow role.
- There are editor-submitted posts pending review.
- Pre-publish requirement checks are enabled.

## Step-by-Step Actions

1. Login as reviewer.
2. Open `/admin/posts`.
3. Filter to pending/under-review posts.
4. Open a candidate post and perform review edits allowed for reviewer.
5. Execute reviewer-allowed transition (for example review approve/publish path per policy).
6. Validate final status and visibility in list.
7. Confirm audit log captures reviewer action.

## Expected Results

- Reviewer accesses content workflow area successfully.
- Reviewer sees only allowed actions according to role policy.
- Reviewer transitions succeed only for valid source/target states.
- Pre-publish requirements prevent incomplete content from publishing.
- Denied actions produce explicit messages and no silent failures.

## Negative Tests

1. Attempt forbidden transition for reviewer:
   - expect explicit transition denial.
2. Attempt delete action if reviewer is not permitted:
   - expect `403`.
3. Try publish with missing required metadata:
   - expect pre-publish rejection.
4. Access unrelated admin management APIs:
   - expect forbidden/unauthorized.

## Rollback / Cleanup

- Revert test post statuses to original workflow stage if needed.
- Remove temporary reviewer edits from shared content.
- Record audit entries and correlation IDs for failed transition tests.
