# Candidate Apply With Resume

## Goal

ทำให้ Candidate ที่เข้าสู่ระบบสามารถอัปโหลด Resume แบบ private และสมัครงานที่เผยแพร่แล้วได้จริง โดยใบสมัครต้องอ้างถึง Resume version ที่ผู้สมัครใช้ ณ เวลาสมัคร

## Scope

- Candidate registration/login แบบ session ฝั่ง serverสำหรับ flow นี้
- Candidate upload/list/select Resume ที่ผ่าน validation
- Candidate สมัครงานจาก job detail
- กันสมัครงานซ้ำที่ database และ service layer
- กันสมัครงานที่ไม่ใช่ `published`, หมดอายุ หรือปิดแล้ว
- Candidate เห็น Resume และใบสมัครของตนเองในหน้า profile
- มี loading, empty, validation, conflict และ permission error states

## Out of Scope

- Employer applicant management
- S3/R2 integration, malware scanning และ signed URL provider จริง
- Email/notification
- Resume parsing หรือ resume builder
- Social login และ password reset

## Acceptance Criteria

### AC-001 — Resume upload

Given Candidate ที่เข้าสู่ระบบ When upload ไฟล์ PDF/DOC/DOCX ขนาดไม่เกิน 5 MB Then server validates MIME/size, stores it behind a server-side private boundary, and makes it available as a selectable Resume.

### AC-002 — Apply with selected Resume

Given Candidate ที่มี Resume พร้อมใช้งานและ Job ที่ `published` และยังไม่หมดอายุ When confirm apply Then server creates one Application with the selected Resume snapshot and status `submitted`.

### AC-003 — Duplicate application

Given Candidate มี Application ของ Job เดิมแล้ว When submit apply ซ้ำ Then server returns a conflict and does not create another row.

### AC-004 — Invalid job state

Given Job ไม่ใช่ `published`, หมดอายุ หรือปิดแล้ว When Candidate applies Then server rejects the request and no Application is created.

### AC-005 — Candidate ownership

Given authenticated Candidate When viewing profile data Then response contains only that Candidate's resumes and applications; unauthenticated requests are rejected.

### AC-006 — Failure states

Given malformed input, missing Resume, oversized/unsupported file, not-found Job, conflict, or persistence failure When the request fails Then the UI shows an actionable error without exposing internal details and prevents duplicate submission.

## API Candidates

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `POST /api/profile/resumes`
- `GET /api/profile/resumes`
- `GET /api/candidate/applications`
- `POST /api/jobs/:id/applications`

## Event Flow

1. Auth route creates/loads a server session.
2. Resume upload validates the authenticated user and writes Resume metadata/content through the private storage boundary.
3. Job detail asks the application service to create an Application.
4. Service validates auth, ownership, job state, Resume ownership/status, then writes Application and snapshot in one transaction.
5. Candidate profile reloads scoped Resume/Application data.

## Decision Log

- D-001: Require login before upload/apply. Reason: MVP security contract requires server-side identity and ownership.
- D-002: Require a ready Resume before applying. Reason: the slice is explicitly apply-with-resume.
- D-003: Use the selected Resume; default to the latest ready Resume in UI. Reason: simple and explicit user control.
- D-004: Use PostgreSQL-backed private Resume content behind server routes for this slice. Cloudflare R2 migration is explicitly deferred; do not add an R2 SDK, bucket configuration, or external upload flow until the storage slice is started.
- D-005: Use email/password server sessions for the local MVP. Reason: no Auth.js/Clerk/Supabase provider has been selected; do not add a major dependency without approval.

## Open Questions

- Cloudflare R2 integration, private bucket policy, signed URLs, and malware scanning remain a later storage slice and are required before production deployment.
- Password policy beyond minimum length and account verification are deferred.

## Implementation Sequence

1. Prisma schema and reversible migration.
2. Auth/session and Resume/Application services plus API routes.
3. Apply dialog and Candidate profile UI.
4. Reviews and focused verification.
