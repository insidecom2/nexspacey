# Requirements QA Alignment: public-search-saved-jobs

## Gate Status

- Status: Approved
- Reviewer Notes: Public visibility, PostgreSQL search, saved-job ownership, idempotency, real detail compatibility and UI failure states are observable and covered by planned tests. Prototype-only fields are explicitly deferred.

## Requirement Quality Review

| ID | Requirement | Quality | Issue | Resolution Needed |
|----|-------------|---------|-------|-------------------|
| FR-401 | Public search reads persisted visible Jobs | Clear/testable | Must exclude expired rows | Filter in service and query |
| FR-402 | Search accepts keyword/location | Clear/testable | Thai matching needs fallback | FTS plus ILIKE fallback |
| FR-403 | Public detail reads persisted Job | Clear/testable | Hidden IDs must not leak | Return not found |
| FR-404 | Candidate saves/unsaves Job | Clear/testable | Duplicate/retry behavior required | Unique constraint and idempotent service |
| FR-405 | Candidate sees saved Jobs | Clear/testable | Empty/error states required | Dashboard section with retry |
| NFR-401 | Server-side auth and ownership | Clear/testable | Role cannot come from client | `getCurrentCandidate` and candidateId scope |
| NFR-402 | Search input safety | Clear/testable | Raw SQL risk | Prisma parameter binding and Zod limits |
| NFR-403 | Public UI remains usable unauthenticated | Clear/testable | Save action needs recovery | Link to login and preserve browsing |

## Acceptance Criteria

| AC ID | Source | Acceptance Criterion |
|-------|--------|----------------------|
| AC-001 | Analyst | Only published and non-expired Jobs appear publicly. |
| AC-002 | Analyst | Keyword/location search returns safe, newest-first matches and empty state. |
| AC-003 | Analyst | Persisted detail and apply use the same Job record; hidden/missing is 404. |
| AC-004 | Analyst | Candidate save is unique, scoped and idempotent. |
| AC-005 | Analyst | Saved state and dashboard reflect database with loading/error/empty recovery. |
| AC-006 | Analyst | Malformed/oversized input is rejected safely. |

## QA Traceability Matrix

| Requirement ID | AC ID | Test Case ID | Test Type | Priority | Coverage |
|----------------|-------|--------------|-----------|----------|----------|
| FR-401 | AC-001 | TC-001 | Integration/API | P0 | Full |
| FR-402 | AC-002 | TC-002 | Integration/API | P0 | Full |
| FR-403 | AC-003 | TC-003 | Integration/API | P0 | Full |
| FR-404 | AC-004 | TC-004, TC-006 | Integration/security | P0 | Full |
| FR-405 | AC-005 | TC-005, TC-007 | UI/integration | P1 | Full |
| NFR-401 | AC-004, AC-006 | TC-004, TC-006 | Security/API | P0 | Full |
| NFR-402 | AC-002, AC-006 | TC-002, TC-006 | Security/API | P0 | Full |
| NFR-403 | AC-005 | TC-005, TC-007 | UI/manual | P1 | Partial |

## Planned Test Cases

| Test Case ID | Scenario | Steps | Expected Result | Type | Priority |
|--------------|----------|-------|-----------------|------|----------|
| TC-001 | Public visibility | Seed jobs in each status and with past/future expiry; call search | Only visible, active jobs return | API/integration | P0 |
| TC-002 | Search safety and matching | Search title/company/location/Thai text and hostile query | Expected matches; no SQL error or injection | API/integration | P0 |
| TC-003 | Detail compatibility | Open public, hidden and unknown IDs; use apply endpoint on public ID | Public detail 200, hidden/unknown 404, apply still works | API/integration | P0 |
| TC-004 | Save idempotency | Candidate saves twice, lists, unsaves twice | One row only; list and deletion are scoped | API/integration | P0 |
| TC-005 | Candidate dashboard | Login Candidate with saved and empty states; browse unauthenticated | Saved section matches DB; public browsing unaffected | UI/integration | P1 |
| TC-006 | Authorization boundaries | Call save/list as unauthenticated, Employer, Admin and Candidate | 401/403/200 as specified; no cross-user rows | Security/API | P0 |
| TC-007 | UI recovery | Trigger empty search, API failure and save while pending | Actionable empty/error state; duplicate action disabled | Manual/UI | P1 |

## Edge Cases and Negative Tests

| ID | Scenario | Expected Handling | Covered By |
|----|----------|-------------------|------------|
| EC-401 | Search q > 120 or location > 180 chars | 400 with safe message | TC-002 |
| EC-402 | Job expires between list and detail/save | Detail/save rejects as non-public | TC-001, TC-003, TC-004 |
| EC-403 | Duplicate save under concurrent requests | Unique constraint leaves one row; response remains safe | TC-004 |
| EC-404 | Candidate tries another user's saved row | No row access or mutation | TC-006 |
| EC-405 | SQL wildcard/operator text in query | Treated as data, not SQL | TC-002 |

## Open Questions

- None blocking this MVP slice; pagination, extra filters and notification behavior remain deferred.

## Implementation Readiness

- Ready for architecture: Yes
- Ready for implementation: Yes
- Blocking gaps: None
