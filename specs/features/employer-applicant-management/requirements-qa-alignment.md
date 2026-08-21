# Requirements QA Alignment: employer-applicant-management

## Gate Status

- Status: Approved
- Reviewer Notes: Acceptance criteria are observable and cover authentication, company ownership, state transitions, private Resume access, and UI failure states. The initial user request to continue the first deferred MVP item authorizes this scoped slice; deferred decisions are recorded in the overview.

## Requirement Quality Review

| ID | Requirement | Quality | Issue | Resolution Needed |
|----|-------------|---------|-------|-------------------|
| FR-001 | Employer account owns one Company through an OWNER membership | Clear/testable | Multi-company behavior is out of scope | None |
| FR-002 | Employer reads only applications for owned Jobs | Clear/testable | Existing demo Jobs need ownership backfill | Migration assigns demo Jobs |
| FR-003 | Employer updates Application status through validated transitions | Clear/testable | Rejection note is undecided | Omit note in this slice |
| FR-004 | Employer downloads referenced Resume only through ownership boundary | Clear/testable | Storage provider is deferred | PostgreSQL private route for MVP |
| NFR-001 | Employer routes enforce server-side role and resource authorization | Clear/testable | None | None |
| NFR-002 | UI preserves loading, empty, error, and pending action states | Clear/testable | Browser automation is not configured | Manual + typecheck/build coverage |

## Acceptance Criteria

| AC ID | Source | Acceptance Criterion |
|-------|--------|----------------------|
| AC-001 | Analyst | Employer registration creates Company + OWNER membership, and Employer routes reject other roles. |
| AC-002 | Analyst | Applicant list is scoped to owned Jobs and supports Job/status filters. |
| AC-003 | Analyst | Valid forward/reject status transitions update the Application. |
| AC-004 | Analyst | Invalid, terminal, unknown, and cross-company updates do not mutate data. |
| AC-005 | Analyst | Resume content is returned only for an authorized company application. |
| AC-006 | Analyst | UI communicates loading/empty/error/pending states without false success. |

## Pasted Test Cases

| Test Case ID | Source | Scenario | Steps | Expected Result | Type | Priority | Parse Quality |
|--------------|--------|----------|-------|-----------------|------|----------|---------------|
| None | None | No user test cases supplied | N/A | N/A | N/A | N/A | N/A |

## AC to Test Case Comparison

| AC ID | Analyst Acceptance Criterion | Matching Test Case ID | Coverage | Notes |
|-------|------------------------------|------------------------|----------|-------|
| AC-001 | Employer auth and ownership | TC-001, TC-002 | Covered | Transaction and role boundary |
| AC-002 | Scoped applicant list | TC-003 | Covered | Company and optional filters |
| AC-003 | Valid status transition | TC-004 | Covered | Forward and reject paths |
| AC-004 | Invalid/cross-company update | TC-005 | Covered | No mutation expected |
| AC-005 | Resume access boundary | TC-006 | Covered | Authorized and unauthorized paths |
| AC-006 | UI failure states | TC-007 | Partial | Manual verification plus typecheck/build |

## QA Traceability Matrix

| Requirement ID | AC ID | Test Case ID | Test Type | Priority | Coverage |
|----------------|-------|--------------|-----------|----------|----------|
| FR-001 | AC-001 | TC-001 | Integration/API | P0 | Full |
| FR-002 | AC-002 | TC-003 | Integration/API | P0 | Full |
| FR-003 | AC-003, AC-004 | TC-004, TC-005 | Unit/API | P0 | Full |
| FR-004 | AC-005 | TC-006 | API/security | P0 | Full |
| NFR-001 | AC-001, AC-004, AC-005 | TC-002, TC-005, TC-006 | API/security | P0 | Full |
| NFR-002 | AC-006 | TC-007 | Manual/UI | P1 | Partial |

## Planned Test Cases

| Test Case ID | Scenario | Steps | Expected Result | Type | Priority |
|--------------|----------|-------|-----------------|------|----------|
| TC-001 | Employer registration | Register with employer role and company name | User, Company, and OWNER membership are created; partial failure rolls back | Integration/API | P0 |
| TC-002 | Role boundary | Call Employer APIs as candidate or without session | 401/403 and no private data | API/security | P0 |
| TC-003 | Application scope/filter | Seed multiple companies/jobs; list with job/status filters | Only owned Job applications are returned and filters are applied | Integration/API | P0 |
| TC-004 | Valid transitions | Update submitted/reviewing/shortlisted/interview applications | Allowed status is stored and returned | Unit/API | P0 |
| TC-005 | Invalid transitions | Update terminal, backward, unknown, and cross-company applications | Safe error; row remains unchanged | Unit/API | P0 |
| TC-006 | Resume download | Request authorized and unauthorized application Resume | Authorized content returns with safe headers; unauthorized request has no content | API/security | P0 |
| TC-007 | UI states | Open dashboard with loading/empty/error and click update twice | Accessible state is shown; pending button blocks duplicate request; failed update remains unsaved | Manual/UI | P1 |

## Edge Cases and Negative Tests

| ID | Scenario | Expected Handling | Covered By |
|----|----------|-------------------|------------|
| EC-001 | Employer has no company membership | 403 without data | TC-002 |
| EC-002 | Job has no companyId | Not visible in Employer list | TC-003 |
| EC-003 | Two status updates race | One valid update wins; database row remains valid | TC-005, code review |
| EC-004 | Resume referenced by another company's application | No Resume bytes returned | TC-006 |
| EC-005 | Double-click status action | Button disabled while request is pending | TC-007 |

## Open Questions

- None blocking this local MVP slice. Rejection notes, multi-company membership, object storage, and audit log are explicitly deferred.

## Implementation Readiness

- Ready for architecture: Yes
- Ready for implementation: Yes
- Blocking gaps: None for the approved local MVP assumptions.
