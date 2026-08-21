# Requirements QA Alignment: Job Expiration

## Gate Status

- Status: Approved
- Reviewer Notes: Lifecycle, idempotency, permission boundary และ read-path behavior ระบุเป็น observable acceptance criteria ครบแล้ว

## Requirement Quality Review

| ID | Requirement | Quality | Issue | Resolution Needed |
|----|-------------|---------|-------|-------------------|
| FR-001 | Expire active jobs ที่ถึงกำหนด | Testable | ครบ | None |
| FR-002 | Admin trigger คืนจำนวนที่เปลี่ยน | Testable | ครบ | None |
| FR-003 | ห้าม approve expired job | Testable | ครบ | None |
| NFR-001 | Concurrent/retry safe | Testable | ครบ | None |
| NFR-002 | Error ไม่เปิดเผยรายละเอียดภายใน | Testable | ครบ | None |
| NFR-003 | Expiration status change มี audit log | Testable | ครบ | None |
| EC-001 | boundary `expiresAt <= now` | Testable | ครบ | None |

## Acceptance Criteria

| AC ID | Source | Acceptance Criterion |
|-------|--------|----------------------|
| AC-001 | Analyst | PUBLISHED/PAUSED ที่ถึงกำหนดเป็น EXPIRED |
| AC-002 | Analyst | สถานะที่ไม่เข้าเงื่อนไขไม่ถูกแตะต้อง |
| AC-003 | Analyst | retry/concurrent ปลอดภัยและคืน count จริง |
| AC-004 | Analyst | read paths ไม่ค้างสถานะ active ที่หมดอายุ |
| AC-005 | Analyst | เฉพาะ Admin เรียก trigger ได้ |
| AC-006 | Analyst | approve expired job ไม่สำเร็จ |
| AC-007 | Analyst | apply expired job ไม่สำเร็จ |
| AC-008 | Analyst | ทุก job ที่ถูก expire มี JOB_EXPIRED audit log |

## AC to Test Case Comparison

| AC ID | Matching Test Case ID | Coverage | Notes |
|-------|------------------------|----------|-------|
| AC-001 | TC-001 | Covered | API + DB integration |
| AC-002 | TC-002 | Covered | API + DB integration |
| AC-003 | TC-003 | Covered | repeated trigger |
| AC-004 | TC-004 | Covered | public/employer read |
| AC-005 | TC-005 | Covered | role matrix |
| AC-006 | TC-006 | Covered | admin moderation |
| AC-007 | TC-007 | Covered | candidate apply |
| AC-008 | TC-008 | Covered | API + DB integration |

## Planned Test Cases

| Test Case ID | Scenario | Steps | Expected Result | Type | Priority |
|--------------|----------|-------|-----------------|------|----------|
| TC-001 | expire due active jobs | Seed due PUBLISHED/PAUSED; trigger endpoint | Both become EXPIRED and count is 2 | API integration | P0 |
| TC-002 | preserve other statuses | Seed future/draft/pending/closed/expired jobs; trigger | No unrelated row changes | API integration | P0 |
| TC-003 | idempotent retry | Trigger twice | First count > 0; second count 0; no error | API integration | P0 |
| TC-004 | stale read prevention | Request public/employer lists after due time | Due jobs are absent/EXPIRED | API integration | P0 |
| TC-005 | authorization | Call trigger unauthenticated and as Candidate/Employer | 401/403; no state change | API integration | P0 |
| TC-006 | expired approval | Admin tries approve pending job past expiry | 400; status is not PUBLISHED | API integration | P1 |
| TC-007 | expired application | Candidate applies to due job | 400; no application created | API integration | P0 |
| TC-008 | expiration audit | Trigger due jobs and inspect audit logs | One JOB_EXPIRED row per changed job with previous status | API/DB integration | P1 |

## Edge Cases and Negative Tests

| ID | Scenario | Expected Handling | Covered By |
|----|----------|-------------------|------------|
| EC-001 | `expiresAt` exactly now | Expire because comparison is `<=` | TC-001 |
| EC-002 | database error | Generic 500/error message | TC-005/manual review |
| EC-003 | concurrent trigger | One update wins; other returns zero/no duplicate effect | TC-003 |

## Open Questions

- None blocking for this MVP slice.

## Implementation Readiness

- Ready for architecture: Yes
- Ready for implementation: Yes
- Blocking gaps: None
