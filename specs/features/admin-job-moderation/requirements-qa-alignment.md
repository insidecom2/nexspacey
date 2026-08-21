# Requirements QA Alignment: admin-job-moderation

## Gate Status

- Status: Approved
- Reviewer Notes: Queue scope, role authorization, atomic moderation/audit behavior, rejection reason, resubmission and observable UI states are explicit and testable.

## Requirement Quality Review

| ID | Requirement | Quality | Resolution |
|----|-------------|---------|------------|
| FR-301 | Admin reads pending moderation queue | Clear/testable | Filter by workflow and moderation status |
| FR-302 | Admin approves a Job | Clear/testable | Publish and audit in one transaction |
| FR-303 | Admin rejects a Job | Clear/testable | Require 5–1000 character reason and return to Draft |
| FR-304 | Employer resubmits rejected Job | Clear/testable | Clear prior decision when entering Pending review |
| NFR-301 | Server-side ADMIN authorization | Clear/testable | 401/403 boundary tests |
| NFR-302 | Audit consistency | Clear/testable | Mutation and audit log share transaction |
| NFR-303 | UI failure/pending states | Clear/testable | Manual and build verification |

## QA Traceability Matrix

| Requirement ID | Acceptance Criteria | Test Cases | Coverage |
|----------------|----------------------|------------|----------|
| FR-301 | AC-001 | TC-001 | Full |
| FR-302 | AC-002 | TC-002 | Full |
| FR-303 | AC-003 | TC-003 | Full |
| FR-304 | AC-005 | TC-005 | Full |
| NFR-301 | AC-001, AC-004 | TC-001, TC-004 | Full |
| NFR-302 | AC-002, AC-003, AC-004 | TC-002–TC-004 | Full |
| NFR-303 | AC-006 | TC-006 | Partial/manual |

## Edge Cases

| ID | Scenario | Expected Handling |
|----|----------|-------------------|
| EC-301 | Reject with blank/short/oversized reason | 400; no row or audit mutation |
| EC-302 | Approve non-pending Job | 409/404; no duplicate audit |
| EC-303 | Candidate or Employer calls admin route | 403 |
| EC-304 | Two Admin requests race on same Job | One succeeds; other conflicts |
| EC-305 | Audit insert fails | Job mutation rolls back |

## Implementation Readiness

- Ready for implementation: Yes
- Blocking gaps: None for this slice
