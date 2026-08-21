# Requirements QA Alignment: candidate-apply-resume

## Gate Status

- Status: Approved
- Reviewer Notes: Acceptance criteria are observable, negative paths are explicit, and planned tests cover the critical apply invariants. Provider-specific storage and malware scanning are explicitly deferred.

## Requirement Quality Review

| ID | Requirement | Quality | Issue | Resolution Needed |
|----|-------------|---------|-------|-------------------|
| FR-001 | Candidate uploads a validated Resume | Clear/testable | Storage provider is not selected | Use isolated PostgreSQL-backed private boundary for MVP; replace later |
| FR-002 | Candidate applies with a selected Resume | Clear/testable | None | None |
| FR-003 | Duplicate application is rejected | Clear/testable | None | Database unique constraint required |
| FR-004 | Invalid job states are rejected | Clear/testable | Expiration boundary must be deterministic | Compare against server time |
| FR-005 | Candidate reads only own data | Clear/testable | Auth provider is not selected | Use server session adapter for MVP |
| NFR-001 | Validate all writes server-side | Clear/testable | None | Zod at route boundary |
| NFR-002 | Do not expose private Resume content | Clear/testable | Signed URL provider deferred | No public content route; authenticated ownership check |

## Acceptance Criteria

| AC ID | Source | Acceptance Criterion |
|-------|--------|----------------------|
| AC-001 | Analyst | Valid PDF/DOC/DOCX up to 5 MB becomes a selectable private Resume. |
| AC-002 | Analyst | A valid apply creates one `submitted` Application with a Resume snapshot. |
| AC-003 | Analyst | Duplicate apply returns conflict and creates no second row. |
| AC-004 | Analyst | Unpublished, expired, or closed jobs reject apply. |
| AC-005 | Analyst | Profile data is scoped to the authenticated Candidate. |
| AC-006 | Analyst | Invalid and operational failures produce safe actionable errors. |

## Pasted Test Cases

| Test Case ID | Source | Scenario | Steps | Expected Result | Type | Priority | Parse Quality |
|--------------|--------|----------|-------|-----------------|------|----------|--------------|
| None | None | No user test cases supplied | N/A | N/A | N/A | N/A | N/A |

## AC to Test Case Comparison

| AC ID | Analyst Acceptance Criterion | Matching Test Case ID | Coverage | Notes |
|-------|-------------------------------|-----------------------|----------|-------|
| AC-001 | Resume validation and availability | Planned TC-001, TC-002 | Covered | Valid and invalid file cases |
| AC-002 | Create application with snapshot | Planned TC-003 | Covered | Service transaction test |
| AC-003 | Duplicate conflict | Planned TC-004 | Covered | Service and unique constraint path |
| AC-004 | Invalid job state | Planned TC-005 | Covered | Published, expired, closed variants |
| AC-005 | Ownership/auth boundary | Planned TC-006 | Covered | Unauthenticated and cross-user cases |
| AC-006 | Safe failure behavior | Planned TC-007 | Partial | Persistence failure is verified at service boundary; UI error rendering is manual/type-checked in this slice |

## QA Traceability Matrix

| Requirement ID | AC ID | Test Case ID | Test Type | Priority | Coverage |
|----------------|-------|--------------|-----------|----------|----------|
| FR-001 | AC-001 | TC-001, TC-002 | Unit/API | P0 | Full |
| FR-002 | AC-002 | TC-003 | Unit/API | P0 | Full |
| FR-003 | AC-003 | TC-004 | Integration/API | P0 | Full |
| FR-004 | AC-004 | TC-005 | Unit/API | P0 | Full |
| FR-005 | AC-005 | TC-006 | Unit/API | P0 | Full |
| NFR-001 | AC-006 | TC-002, TC-005 | Unit/API | P0 | Full |
| NFR-002 | AC-001, AC-005 | TC-006 | Security/API | P0 | Partial |

## Planned Test Cases

| Test Case ID | Scenario | Steps | Expected Result | Type | Priority |
|--------------|----------|-------|-----------------|------|----------|
| TC-001 | Valid Resume upload | Upload allowed MIME under 5 MB as authenticated Candidate | Resume is stored and listed for that Candidate | Unit/API | P0 |
| TC-002 | Invalid Resume upload | Upload unsupported MIME, oversized file, or malformed form | 400 validation error; no Resume row/content persists | Unit/API | P0 |
| TC-003 | Successful apply | Use ready Resume against published unexpired Job | One submitted Application with immutable Resume snapshot | Unit/API | P0 |
| TC-004 | Duplicate apply | Apply twice for same Candidate and Job | Second request is conflict; count remains one | Integration/API | P0 |
| TC-005 | Invalid Job state | Apply to draft/paused/closed/expired Job | Request rejected; no Application row | Unit/API | P0 |
| TC-006 | Ownership boundary | Read another Candidate's data or call without session | 401/403; no private data returned | Security/API | P0 |
| TC-007 | Persistence failure | Force repository/database error during apply | Safe 500 response; no misleading success state | Unit | P1 |

## Extra or Conflicting Test Cases

| Test Case ID | Issue Type | Reason | Required Action |
|--------------|------------|--------|-----------------|
| None | None | No pasted cases | None |

## Edge Cases and Negative Tests

| ID | Scenario | Expected Handling | Covered By |
|----|----------|-------------------|------------|
| EC-001 | Two apply requests race | Database unique constraint leaves one application | TC-004 |
| EC-002 | Job expires at request time | Server time check rejects it | TC-005 |
| EC-003 | Resume belongs to another Candidate | Forbidden/not found without data leak | TC-006 |
| EC-004 | Empty resume list | Apply CTA explains Resume is required | TC-001, manual UI |
| EC-005 | Double-click confirm | Button disables while request is pending | AC-006, manual UI |

## Open Questions

- Production object storage, signed URLs, and malware scanning must be selected before production deployment.

## Implementation Readiness

- Ready for architecture: Yes
- Ready for implementation: Yes
- Blocking gaps: None for this local MVP slice; deferred production storage risks are documented.
