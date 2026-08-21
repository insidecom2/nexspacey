# Requirements QA Alignment: candidate-withdraw-application

## Gate Status

- Status: Approved
- Reviewer Notes: Ownership, allowed/terminal transitions, idempotency, atomic audit behavior and UI recovery are observable and mapped to integration/security/UI tests.

## Requirement Quality Review

| ID | Requirement | Quality | Issue | Resolution Needed |
|----|-------------|---------|-------|-------------------|
| FR-501 | Candidate withdraws owned non-terminal Application | Clear/testable | Transition list must be explicit | Use four allowed statuses |
| FR-502 | Terminal statuses remain immutable to Candidate | Clear/testable | Conflict response required | Return 409 and preserve row |
| FR-503 | Repeated withdrawal is idempotent | Clear/testable | Audit duplication risk | Return current row, no new audit |
| NFR-501 | Server-side candidate ownership and role | Clear/testable | Avoid resource enumeration | 401/403/404 boundaries |
| NFR-502 | Audit mutation is atomic | Clear/testable | Audit failure must rollback status | Same Prisma transaction |
| NFR-503 | UI exposes safe pending/error states | Clear/testable | Double-submit risk | Disable per-application action |

## Acceptance Criteria

| AC ID | Source | Acceptance Criterion |
|-------|--------|----------------------|
| AC-001 | Analyst | Candidate ownership and role are enforced server-side. |
| AC-002 | Analyst | Four non-terminal states can move to WITHDRAWN. |
| AC-003 | Analyst | OFFERED and REJECTED return conflict and remain unchanged. |
| AC-004 | Analyst | Retry is idempotent and first success has one audit record. |
| AC-005 | Analyst | UI confirms, disables, updates and recovers from failure. |

## QA Traceability Matrix

| Requirement ID | AC ID | Test Case ID | Test Type | Priority | Coverage |
|----------------|-------|--------------|-----------|----------|----------|
| FR-501 | AC-002 | TC-001, TC-002 | Integration/API | P0 | Full |
| FR-502 | AC-003 | TC-003 | Integration/API | P0 | Full |
| FR-503 | AC-004 | TC-004 | Integration/API | P0 | Full |
| NFR-501 | AC-001 | TC-005 | Security/API | P0 | Full |
| NFR-502 | AC-004 | TC-004 | Transaction/integration | P0 | Full |
| NFR-503 | AC-005 | TC-006 | UI/manual | P1 | Full |

## Planned Test Cases

| Test Case ID | Scenario | Steps | Expected Result | Type | Priority |
|--------------|----------|-------|-----------------|------|----------|
| TC-001 | Withdraw submitted | Candidate posts withdraw for owned submitted application | 200, status WITHDRAWN, one audit row | API/integration | P0 |
| TC-002 | Allowed statuses | Repeat with reviewing/shortlisted/interview fixtures | Each transitions to WITHDRAWN | API/integration | P0 |
| TC-003 | Terminal protection | Try OFFERED and REJECTED | 409, status unchanged | API/integration | P0 |
| TC-004 | Retry/atomicity | Post twice and inspect audit; simulate invalid actor | One audit; no unauthorized mutation | Integration/security | P0 |
| TC-005 | Boundaries | Call unauthenticated, Employer/Admin and another candidate | 401/403/404; no data leak | Security/API | P0 |
| TC-006 | UI states | Confirm, double-click, force API error, inspect terminal row | Pending disabled; success/error recovery; terminal no action | Manual/UI | P1 |

## Edge Cases and Negative Tests

| ID | Scenario | Expected Handling | Covered By |
|----|----------|-------------------|------------|
| EC-501 | Invalid application UUID | 400; no database lookup/mutation | TC-005 |
| EC-502 | Cross-candidate application ID | 404; no ownership leak | TC-005 |
| EC-503 | Concurrent withdraw requests | One state transition/audit; retries return WITHDRAWN | TC-004 |
| EC-504 | Database audit insert failure | Status update rolls back | TC-004 |

## Open Questions

- None blocking this MVP slice; withdrawal reason and notifications remain deferred.

## Implementation Readiness

- Ready for architecture: Yes
- Ready for implementation: Yes
- Blocking gaps: None
