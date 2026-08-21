# Requirements QA Alignment: Resume Signed URL

## Gate Status

- Status: Approved
- Reviewer Notes: Acceptance criteria ครอบคลุม authorization, bearer-token abuse, compatibility และ UI failure state; ไม่มี database impact

## Requirement Quality Review

| ID | Requirement | Quality | Issue | Resolution Needed |
|----|-------------|---------|-------|-------------------|
| FR-001 | Employer ที่มี ownership ขอ URL ได้ | Testable | ครบ | None |
| FR-002 | Server เซ็น application id และ expiry ด้วย secret | Testable | ครบ | None |
| FR-003 | Download endpoint ตรวจ token ก่อนอ่าน Resume | Testable | ครบ | None |
| FR-004 | Endpoint เดิมยังใช้ session/ownership | Testable | ครบ | None |
| NFR-001 | Token มีอายุไม่เกิน 60 วินาทีและไม่บรรจุไฟล์ | Testable | ครบ | None |
| NFR-002 | Response ป้องกัน cache และ MIME sniffing | Testable | ครบ | None |
| EC-001 | token หาย, malformed, tampered หรือ expired | Testable | ครบ | None |
| EC-002 | application ไม่อยู่ในบริษัท Employer | Testable | ครบ | None |

## Acceptance Criteria

| AC ID | Source | Acceptance Criterion |
|-------|--------|----------------------|
| AC-001 | Analyst | Employer ของบริษัทเจ้าของใบสมัครได้รับ URL อายุไม่เกิน 60 วินาที |
| AC-002 | Analyst | unauthenticated, Candidate และ Employer ต่างบริษัทขอ URL ไม่ได้ |
| AC-003 | Analyst | token ถูกต้องดาวน์โหลดได้โดยไม่ใช้ session และ response มี security headers |
| AC-004 | Analyst | token invalid/expired/missing ถูกปฏิเสธก่อนอ่าน Resume |
| AC-005 | Analyst | legacy download route ยังตรวจสิทธิ์และทำงานได้ |
| AC-006 | Analyst | UI มี pending/error/retry และกัน double click |
| AC-007 | Analyst | ไม่มี Resume content/secret ใน token หรือ log |

## AC to Test Case Comparison

| AC ID | Analyst Acceptance Criterion | Matching Test Case ID | Coverage | Notes |
|-------|------------------------------|------------------------|----------|-------|
| AC-001 | owner/member receives short-lived URL | TC-001 | Covered | API integration |
| AC-002 | unauthorized roles rejected | TC-002 | Covered | API integration |
| AC-003 | anonymous signed download + headers | TC-003 | Covered | API integration |
| AC-004 | invalid token rejected | TC-004 | Covered | API integration |
| AC-005 | legacy route remains protected | TC-005 | Covered | API integration |
| AC-006 | UI pending/error/retry | TC-006 | Covered | Manual/browser |
| AC-007 | no content/secret leakage | TC-007 | Covered | Unit/static review |

## Planned Test Cases

| Test Case ID | Scenario | Steps | Expected Result | Type | Priority |
|--------------|----------|-------|-----------------|------|----------|
| TC-001 | authorized URL issue | Login Employer; request owned application URL | 200, URL and expiry returned | API integration | P0 |
| TC-002 | role/ownership denial | Repeat as unauthenticated, Candidate, and other Employer | 401/403; no token | API integration | P0 |
| TC-003 | signed download | Open returned URL without cookie | 200 file with private no-store headers | API integration | P0 |
| TC-004 | token abuse | Remove, alter, and expire token | 401; no file body | API/security | P0 |
| TC-005 | legacy compatibility | Open old route with authorized and unauthorized sessions | Existing behavior preserved | API integration | P1 |
| TC-006 | UI pending/error | Click download twice; simulate URL API error | One request at a time; retryable alert | Manual/browser | P1 |
| TC-007 | token privacy | Decode token payload and inspect server output | Only application id/expiry; no secret/content | Unit/static | P0 |

## Edge Cases and Negative Tests

| ID | Scenario | Expected Handling | Covered By |
|----|----------|-------------------|------------|
| EC-001 | empty token | 401 | TC-004 |
| EC-002 | malformed base64/signature | 401 | TC-004 |
| EC-003 | expired token | 401 | TC-004 |
| EC-004 | unknown application id in validly signed token | 404 | TC-004 |
| EC-005 | production missing signing secret | fail closed with 500 on issuance | TC-007 |

## Open Questions

- None blocking for this MVP slice.

## Implementation Readiness

- Ready for architecture: Yes
- Ready for implementation: Yes
- Blocking gaps: None
