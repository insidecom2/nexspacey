# Requirements QA Alignment: employer-job-crud-company-profile

## Gate Status

- Status: Approved
- Reviewer Notes: The story is aligned with the MVP architecture and existing prototype. Ownership, moderation boundary, lifecycle transitions, safe deletion, and UI failure states are observable and testable. Fields outside the current schema are explicitly deferred.

## Requirement Quality Review

| ID | Requirement | Quality | Issue | Resolution Needed |
|----|-------------|---------|-------|-------------------|
| FR-001 | Employer reads/updates its Company profile | Clear/testable | Owner vs Member permission required | Owner-only update |
| FR-002 | Employer creates/lists owned Jobs | Clear/testable | Job model has a limited field set | Use current schema; defer extra fields |
| FR-003 | Employer edits and resubmits Jobs | Clear/testable | Published content needs moderation boundary | Reset to Draft |
| FR-004 | Employer uses approved lifecycle transitions | Clear/testable | Admin publish is not in this slice | Reject direct publish |
| FR-005 | Employer deletes only safe Draft Jobs | Clear/testable | Application relation prevents deletion | Return conflict, preserve data |
| NFR-001 | All reads/writes enforce role and company ownership server-side | Clear/testable | None | None |
| NFR-002 | UI exposes loading/empty/error/pending states | Clear/testable | Browser automation unavailable | Manual + build verification |

## Acceptance Criteria

| AC ID | Source | Acceptance Criterion |
|-------|--------|----------------------|
| AC-001 | Analyst | Company profile is scoped to the session Company and editable only by Owner. |
| AC-002 | Analyst | Owner/Member can create and list only their Company Jobs. |
| AC-003 | Analyst | Content edits persist and published content changes reset to Draft. |
| AC-004 | Analyst | Only approved employer lifecycle transitions are accepted; direct publish is rejected. |
| AC-005 | Analyst | Only Draft Jobs without Applications can be deleted. |
| AC-006 | Analyst | UI handles loading, empty, saving, errors, retry and duplicate submission. |

## Pasted Test Cases

| Test Case ID | Source | Scenario | Steps | Expected Result | Type | Priority | Parse Quality |
|--------------|--------|----------|-------|-----------------|------|----------|---------------|
| None | None | No user test cases supplied | N/A | N/A | N/A | N/A | N/A |

## AC to Test Case Comparison

| AC ID | Analyst Acceptance Criterion | Matching Test Case ID | Coverage | Notes |
|-------|------------------------------|------------------------|----------|-------|
| AC-001 | Company profile authorization | TC-001, TC-006 | Covered | Owner/member/cross-company paths |
| AC-002 | Create/list scoped Jobs | TC-002, TC-006 | Covered | Ownership query is server-side |
| AC-003 | Edit/resubmit behavior | TC-003 | Covered | Published reset path included |
| AC-004 | Lifecycle transitions | TC-004 | Covered | Direct publish negative path |
| AC-005 | Safe deletion | TC-005 | Covered | Status and application guards |
| AC-006 | UI states | TC-007 | Partial | Manual UI verification |

## QA Traceability Matrix

| Requirement ID | AC ID | Test Case ID | Test Type | Priority | Coverage |
|----------------|-------|--------------|-----------|----------|----------|
| FR-001 | AC-001 | TC-001, TC-006 | API/integration | P0 | Full |
| FR-002 | AC-002 | TC-002, TC-006 | API/integration | P0 | Full |
| FR-003 | AC-003 | TC-003 | API/unit | P0 | Full |
| FR-004 | AC-004 | TC-004 | API/unit | P0 | Full |
| FR-005 | AC-005 | TC-005 | API/integration | P0 | Full |
| NFR-001 | AC-001–AC-005 | TC-001, TC-002, TC-004–TC-006 | Security/API | P0 | Full |
| NFR-002 | AC-006 | TC-007 | Manual/UI | P1 | Partial |

## Planned Test Cases

| Test Case ID | Scenario | Steps | Expected Result | Type | Priority |
|--------------|----------|-------|-----------------|------|----------|
| TC-001 | Company profile update | Owner reads and patches valid fields | Company fields persist; response is scoped | API/integration | P0 |
| TC-002 | Job create/list | Owner and Member create/list Jobs | Jobs have current companyId; no other company data appears | API/integration | P0 |
| TC-003 | Job edit | Edit Draft, Pending review, and Published Jobs | Draft/Pending persist; Published resets to Draft and clears publishedAt | API/unit | P0 |
| TC-004 | Lifecycle | Try valid transitions and direct publish | Valid transitions persist; direct publish returns 400 | API/unit | P0 |
| TC-005 | Job delete | Delete Draft with/without Applications and non-Draft | Only empty Draft is deleted | API/integration | P0 |
| TC-006 | Access boundaries | Call endpoints unauthenticated, as Candidate, and cross-company | 401/403/404; no data mutation or leak | Security/API | P0 |
| TC-007 | UI states | Load pages, submit twice, trigger API error | Loading/empty/error/retry/pending states are actionable | Manual/UI | P1 |

## Extra or Conflicting Test Cases

| Test Case ID | Issue Type | Reason | Required Action |
|--------------|------------|--------|-----------------|
| None | None | No pasted cases | None |

## Edge Cases and Negative Tests

| ID | Scenario | Expected Handling | Covered By |
|----|----------|-------------------|------------|
| EC-001 | Employer submits direct Published status | 400; Job remains unchanged | TC-004 |
| EC-002 | Published Job content is edited | Reset to Draft; clear publishedAt | TC-003 |
| EC-003 | Job has Applications | Delete returns conflict; row remains | TC-005 |
| EC-004 | Company profile patch by Member | 403; fields unchanged | TC-001, TC-006 |
| EC-005 | Duplicate create/patch request | Pending UI disables action; server remains valid | TC-007 |

## Open Questions

- None blocking this local MVP slice. Admin moderation, additional Job fields, member management and public DB search remain separate slices.

## Implementation Readiness

- Ready for architecture: Yes
- Ready for implementation: Yes
- Blocking gaps: None under the recorded decisions.
