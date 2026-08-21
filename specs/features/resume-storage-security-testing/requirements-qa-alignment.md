# Requirements QA Alignment: Resume Storage, Malware Scanning and Automated Tests

## Gate Status

- Status: Approved
- Reviewer Notes: Storage, scanner, failure behavior, migration safety and test runner requirements are observable; live external services are explicitly environment-dependent.

## Requirement Quality Review

| ID | Requirement | Quality | Issue | Resolution Needed |
|----|-------------|---------|-------|-------------------|
| FR-001 | Support postgres fallback and R2 provider | Testable | Credentials are environment input | None |
| FR-002 | Scan before persistence | Testable | ClamAV service is external | None |
| FR-003 | Verify checksum on read | Testable | Applies only when checksum exists | None |
| NFR-001 | Production fails closed without storage/scanner config | Testable | ครบ | None |
| NFR-002 | Migration is reversible without deleting R2 data | Testable | Down blocks when R2 rows remain | None |
| NFR-003 | Automated tests are runnable from npm script | Testable | ครบ | None |

## Acceptance Criteria

| AC ID | Source | Acceptance Criterion |
|-------|--------|----------------------|
| AC-001 | Analyst | PostgreSQL provider compatibility remains intact |
| AC-002 | Analyst | R2 stores object privately and metadata in DB |
| AC-003 | Analyst | Missing production R2 config fails closed |
| AC-004 | Analyst | Scan happens before persistence |
| AC-005 | Analyst | Production ClamAV errors do not pass upload |
| AC-006 | Analyst | Checksum mismatch blocks download |
| AC-007 | Analyst | Migration is safe and reversible with R2 guard |
| AC-008 | Analyst | Automated tests pass via npm script |

## AC to Test Case Comparison

| AC ID | Matching Test Case ID | Coverage | Notes |
|-------|------------------------|----------|-------|
| AC-001 | TC-001 | Covered | Unit/config + DB schema |
| AC-002 | TC-002 | Partial | Live R2 requires credentials |
| AC-003 | TC-003 | Covered | Config unit test |
| AC-004 | TC-004 | Covered | Scanner unit/config |
| AC-005 | TC-005 | Covered | Production config failure |
| AC-006 | TC-006 | Covered | Unit/service review |
| AC-007 | TC-007 | Covered | Migration deploy/schema check |
| AC-008 | TC-008 | Covered | Vitest |

## Planned Test Cases

| Test Case ID | Scenario | Steps | Expected Result | Type | Priority |
|--------------|----------|-------|-----------------|------|----------|
| TC-001 | legacy provider | Read existing PostgreSQL Resume after migration | File remains readable | Integration | P0 |
| TC-002 | R2 provider | Configure mock S3 client and upload/read | Object commands and metadata are correct | Unit/mock | P0 |
| TC-003 | missing R2 config | Select R2 without credentials | Configuration error; no DB row | Unit | P0 |
| TC-004 | scanner ordering | Run upload with scanner failure | Upload rejects before persistence | Unit/integration | P0 |
| TC-005 | production scanner | Production without valid ClamAV config | Fail closed with safe error | Unit | P0 |
| TC-006 | checksum mismatch | Read content with wrong checksum | Download fails | Unit | P1 |
| TC-007 | migration | Deploy and inspect columns/index; test down guard | Schema correct; down does not delete R2 rows | DB integration | P0 |
| TC-008 | test command | Run `npm run test` | All tests pass | Unit | P0 |

## Edge Cases and Negative Tests

| ID | Scenario | Expected Handling | Covered By |
|----|----------|-------------------|------------|
| EC-001 | R2 upload succeeds, DB insert fails | Best-effort delete object, surface generic failure | TC-002 |
| EC-002 | ClamAV timeout | 503; no Resume row | TC-005 |
| EC-003 | unsupported provider value | Configuration error | TC-003 |
| EC-004 | checksum mismatch | Storage read error, no file response | TC-006 |

## Open Questions

- Live R2 credentials and ClamAV endpoint are required for environment-level verification, not for local code/test completion.

## Implementation Readiness

- Ready for architecture: Yes
- Ready for implementation: Yes
- Blocking gaps: None for local implementation; live-service verification remains environment-dependent
