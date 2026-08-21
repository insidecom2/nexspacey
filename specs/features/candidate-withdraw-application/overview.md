# Candidate Withdraw Application

## Goal

ให้ Candidate ถอนใบสมัครของตนเองได้ก่อนที่ Employer จะตัดสินเป็นสถานะปลายทาง โดยไม่เปิดช่องให้แก้ไขใบสมัครของคนอื่นหรือสถานะที่จบแล้ว

## Scope

- Candidate ถอนใบสมัครที่เป็น `SUBMITTED`, `REVIEWING`, `SHORTLISTED` หรือ `INTERVIEW`
- เปลี่ยนสถานะเป็น `WITHDRAWN` ใน transaction เดียวกับ audit log
- การส่งคำขอถอนซ้ำหลังเป็น `WITHDRAWN` เป็น idempotent และคืนสถานะปัจจุบัน
- `OFFERED` และ `REJECTED` เป็น terminal ที่ถอนต่อไม่ได้
- Candidate เห็นปุ่มถอนเฉพาะ application ของตนเองที่ยังถอนได้ พร้อม confirmation/pending/error state

## Out of Scope

- ลบ Application ออกจากฐานข้อมูล
- ถอนหลัง `OFFERED` หรือ `REJECTED`
- Employer ถอนแทน Candidate
- เหตุผลการถอน, notification และ status history แบบแยกตาราง

## Acceptance Criteria

### AC-001 — Ownership and authorization

Given an authenticated Candidate When it withdraws an application Then only an application owned by that Candidate can change. Unauthenticated requests return 401; Employer/Admin and cross-candidate access cannot mutate or reveal the resource.

### AC-002 — Allowed transition

Given an owned application in `SUBMITTED`, `REVIEWING`, `SHORTLISTED` or `INTERVIEW` When Candidate withdraws Then it becomes `WITHDRAWN` and the response returns the updated application.

### AC-003 — Terminal protection

Given an owned application in `OFFERED` or `REJECTED` When Candidate withdraws Then the API returns conflict and preserves the terminal status.

### AC-004 — Idempotency and audit

Given an application already `WITHDRAWN` When the same Candidate retries Then the API returns success without creating a duplicate audit log. A successful first withdrawal creates one `APPLICATION_WITHDRAWN` audit log atomically.

### AC-005 — Candidate UI

Given a Candidate application list When an application is withdrawable Then the UI shows an accessible withdraw action, confirms intent, disables duplicate submission, updates status and exposes recovery on API failure.

## API Candidate

- `POST /api/candidate/applications/:id/withdraw`

## Event Flow

1. Candidate clicks ถอนใบสมัคร and confirms.
2. Route authenticates server session, checks Candidate role and validates UUID.
3. Service scopes the application by `candidateId`, checks transition and updates atomically.
4. Service inserts `APPLICATION_WITHDRAWN` audit log in the same transaction.
5. UI updates the application status and disables the withdraw action.

## Decision Log

- D-501: Candidate may withdraw before Employer reaches `OFFERED`/`REJECTED`; this follows the architecture rule that `WITHDRAWN` and `REJECTED` are terminal and Candidate can withdraw while non-terminal.
- D-502: Repeated withdraw on `WITHDRAWN` is idempotent success; this protects browser retries without duplicate audit rows.
- D-503: Cross-owner application lookup returns 404, while authenticated non-Candidate role returns 403, avoiding resource enumeration.
- D-504: Audit action is `APPLICATION_WITHDRAWN`; no separate application status history table is added in this slice.

## Planned Test Cases

- TC-001: Candidate withdraws owned submitted application
- TC-002: Candidate withdraws from each allowed non-terminal status
- TC-003: Offered/rejected applications cannot be withdrawn
- TC-004: Repeated withdraw is idempotent and audit count remains one
- TC-005: Unauthenticated, Employer/Admin and cross-owner requests are blocked
- TC-006: Candidate UI handles confirmation, pending, success, error and terminal states
