# Requirements QA Alignment: Candidate Profile Update

## Gate Status

- Status: Approved
- Reviewer Notes: Scope is limited to the only existing Candidate profile field and has observable API, authorization, validation, and UI outcomes.

## Requirement Quality Review

| ID | Requirement | Quality | Issue | Resolution Needed |
| --- | --- | --- | --- | --- |
| FR-001 | Candidate reads its own profile | Clear/testable | None | None |
| FR-002 | Candidate updates its display name | Clear/testable | None | None |
| NFR-001 | Server derives ownership from session and enforces role | Clear/testable | None | None |
| NFR-002 | Form exposes validation, pending, success and error feedback | Clear/testable | None | None |

## Acceptance Criteria

### Candidate profile access and update

| AC ID | Source | Acceptance Criterion |
| --- | --- | --- |
| AC-001 | Analyst | Given an authenticated Candidate, when it reads the profile endpoint, then only its own profile is returned. |
| AC-002 | Analyst | Given a valid trimmed display name of 1–160 characters, when the Candidate saves it, then the persisted profile is returned. |
| AC-003 | Analyst | Given malformed, blank, over-length or unknown fields, when the Candidate saves, then a safe validation error is returned and no data changes. |
| AC-004 | Analyst | Given an unauthenticated or non-Candidate caller, when it reads or writes, then it receives `401` or `403`. |
| AC-005 | Analyst | Given the dashboard form is saving or has completed, when the Candidate interacts with it, then duplicate submission is prevented and visible feedback is shown. |

## Pasted Test Cases

No user-supplied test cases.

## AC to Test Case Comparison

| AC ID | Analyst Acceptance Criterion | Matching Test Case ID | Coverage | Notes |
| --- | --- | --- | --- | --- |
| AC-001 | Scoped profile read | TC-001 | Covered | API integration test |
| AC-002 | Valid update persists | TC-002 | Covered | API integration test |
| AC-003 | Invalid payload leaves data unchanged | TC-003 | Covered | Validation test |
| AC-004 | Auth/role boundary | TC-004 | Covered | API integration test |
| AC-005 | UI feedback and pending guard | TC-005 | Covered | Component/manual test |

## QA Traceability Matrix

| Requirement ID | AC ID | Test Case ID | Test Type | Priority | Coverage |
| --- | --- | --- | --- | --- | --- |
| FR-001 | AC-001 | TC-001 | Integration | High | Covered |
| FR-002 | AC-002 | TC-002 | Integration | High | Covered |
| NFR-001 | AC-003, AC-004 | TC-003, TC-004 | Integration | High | Covered |
| NFR-002 | AC-005 | TC-005 | Component/manual | Medium | Covered |

## Planned Test Cases

| Test Case ID | Scenario | Steps | Expected Result | Type | Priority |
| --- | --- | --- | --- | --- | --- |
| TC-001 | Candidate reads profile | Login as Candidate; GET endpoint | `200` and own display name only | Integration | High |
| TC-002 | Candidate updates profile | Login as Candidate; PATCH valid name; GET | `200`; trimmed name persists | Integration | High |
| TC-003 | Invalid update | PATCH blank, 161-char, unknown-field payloads; GET | `400`; original name remains | Integration | High |
| TC-004 | Authorization boundaries | Call both endpoints unauthenticated, Employer and Admin | `401` / `403`; no changes | Integration | High |
| TC-005 | Form interaction | Submit valid and invalid values; observe pending state | Accessible feedback and no double submit | Component/manual | Medium |

## Extra or Conflicting Test Cases

None.

## Edge Cases and Negative Tests

| ID | Scenario | Expected Handling | Covered By |
| --- | --- | --- | --- |
| EC-001 | Whitespace-only name | Reject before persistence | TC-003 |
| EC-002 | Unknown JSON key | Reject under strict schema | TC-003 |
| EC-003 | Session has no candidate profile | Safe not-found response; no implicit creation | TC-001 |

## Open Questions

None blocking. The profile currently has only `displayName`.

## Implementation Readiness

- Ready for architecture: Yes
- Ready for implementation: Yes
- Blocking gaps: None
