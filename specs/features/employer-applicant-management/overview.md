# Employer Applicant Management

## Goal

ให้ Employer ที่เข้าสู่ระบบดูใบสมัครของงานภายใต้บริษัทของตน เปลี่ยนสถานะผู้สมัครตามลำดับธุรกิจ และดาวน์โหลด Resume ที่ผู้สมัครใช้สมัครได้ โดยทุก operation ต้องผ่าน company ownership check ฝั่ง server

## Scope

- Employer registration/login แบบ server-side session สำหรับ local MVP
- สร้าง Company หนึ่งรายการและ membership แบบ `OWNER` พร้อม Employer account
- ผูก Job กับ Company เพื่อใช้เป็น authorization boundary
- รายการใบสมัครของ Company พร้อมตัวกรองตาม Job และ Application status
- เปลี่ยน Application status แบบ server-side validation
- ดาวน์โหลด Resume ผ่าน route ที่ตรวจว่าใบสมัครอยู่ใน Company ของ Employer
- เชื่อมหน้า Employer dashboard กับ API จริง พร้อม loading, empty, error และ pending states

## Out of Scope

- Employer สร้างหรือแก้ไข Job ใหม่ใน slice นี้
- หลายบริษัทต่อ Employer account
- การเชิญสมาชิกบริษัทและการจัดการ role `MEMBER`
- Rejection note, email/notification, audit log และ object storage
- Admin moderation

## Acceptance Criteria

### AC-001 — Employer authentication and ownership

Given an Employer account When it registers Then the server creates one Company and an `OWNER` membership in one transaction. Employer-only routes reject candidates and unauthenticated requests.

### AC-002 — Scoped applicant list

Given an authenticated Employer When listing applications Then the response contains only applications for Jobs owned by the Employer's Company, and supports optional `jobId` and `status` filters.

### AC-003 — Valid status transition

Given an application owned by the Employer's Company When the Employer changes status Then the server accepts only `SUBMITTED → REVIEWING → SHORTLISTED → INTERVIEW → OFFERED`, or a transition to `REJECTED`, and returns the updated status.

### AC-004 — Invalid transition and missing resource

Given a terminal/invalid application status, an unknown application, or an application from another Company When the Employer updates it Then the server returns a safe 400/404/403 response and does not mutate the row.

### AC-005 — Resume access boundary

Given an authenticated Employer When downloading a Resume Then the server returns the content only when the Resume is referenced by an application for that Employer's Company; otherwise it returns 403/404 without content.

### AC-006 — Actionable UI states

Given the dashboard is loading, empty, or an API mutation fails When the Employer uses the page Then the UI shows an accessible status message, disables the pending action, and does not claim success on failure.

## API Candidates

- `POST /api/auth/register` with `role: employer` and `companyName`
- `POST /api/auth/login` for candidate or employer accounts
- `GET /api/employer/applications?jobId=&status=`
- `PATCH /api/employer/applications/:id`
- `GET /api/employer/applications/:id/resume`

## Decision Log

- D-101: Employer registration creates exactly one Company and OWNER membership; multi-company membership is deferred.
- D-102: Existing demo Jobs are assigned to the seeded Baan Software Company; Jobs without `companyId` are not visible to Employer APIs.
- D-103: Employer status updates allow forward progression or `REJECTED`; `OFFERED`, `REJECTED`, and `WITHDRAWN` are terminal for this slice.
- D-104: Rejection notes are deferred because the product brief lists the rejection-reason behavior as undecided.
- D-105: Resume download returns the stored PostgreSQL content through an authorized server route; R2, signed URLs, and malware scanning remain deferred.

## Planned Test Cases

- TC-001: Employer registration creates User, Company, and OWNER membership atomically.
- TC-002: Candidate and unauthenticated requests cannot access Employer APIs.
- TC-003: Application list is scoped to the Employer's Company and filters correctly.
- TC-004: Valid forward/reject status transitions update exactly one row.
- TC-005: Invalid, terminal, unknown, and cross-company transitions are rejected.
- TC-006: Resume download succeeds only for an authorized company application.
- TC-007: UI loading, empty, mutation pending, and API error states are actionable.
