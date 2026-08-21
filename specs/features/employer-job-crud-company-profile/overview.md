# Employer Job CRUD and Company Profile

## Goal

ให้ Employer จัดการข้อมูลบริษัทและ Job ของบริษัทตนเองได้จริง โดยรองรับ Draft, ส่งตรวจสอบ, แก้ไข, pause/resume, close และลบ Draft ตาม ownership และ moderation lifecycle ที่กำหนดไว้

## Scope

- Company profile: name, location, industry และ about
- Employer ดูรายการ Job ของ Company ตนเอง
- สร้าง Job เป็น Draft หรือ Pending review
- แก้ไข Job ของตนเอง; การแก้ไข Job ที่เผยแพร่แล้ว reset เป็น Draft เพื่อ review ใหม่
- เปลี่ยน lifecycle: draft → pending_review, published ↔ paused, published/paused → closed
- ลบเฉพาะ Draft ที่ยังไม่มี Application
- UI หน้า Job management และ Company profile พร้อม loading/empty/error/pending states

## Out of Scope

- Admin approve/reject/publish (slice ถัดไป)
- Job category, employment type, work model, salary และ rich-text editor เพราะยังไม่มี persistence model ใน MVP schema
- Company member invite/role management
- Hard delete Job ที่มี Application
- Public search migration จาก mock data เป็น database search

## Acceptance Criteria

### AC-001 — Company profile ownership

Given an authenticated Employer When it reads the company profile Then it receives only its Company. When an Owner saves valid profile fields Then the fields are persisted; a Member cannot edit them.

### AC-002 — Create and list jobs

Given an authenticated Company Owner or Member When it creates a valid Job Then the Job is stored under the current Company with the requested Draft or Pending review status. Listing returns only that Company’s Jobs.

### AC-003 — Job editing and resubmission

Given a Job owned by the Company When the Employer edits content Then Draft/Pending review content is updated, while editing Published/Paused content resets it to Draft and clears `publishedAt`.

### AC-004 — Lifecycle authorization

Given a Job owned by the Company When the Employer requests a lifecycle action Then only `DRAFT → PENDING_REVIEW`, `PUBLISHED ↔ PAUSED`, and `PUBLISHED/PAUSED → CLOSED` are accepted. Employer cannot set Published directly.

### AC-005 — Safe deletion

Given a Draft Job with no Applications When the Owner or Member deletes it Then it is removed. A non-Draft or Job with Applications is rejected without deletion.

### AC-006 — Safe UI states

Given the management pages are loading, empty, saving, or the API fails When the Employer interacts with them Then the UI communicates the state, disables duplicate submission, and provides retry/recovery.

## API Candidates

- `GET /api/employer/company`
- `PATCH /api/employer/company`
- `GET /api/employer/jobs`
- `POST /api/employer/jobs`
- `PATCH /api/employer/jobs/:id`
- `DELETE /api/employer/jobs/:id`

## Decision Log

- D-201: Company profile fields follow the existing prototype: name, location, industry, about.
- D-202: Employer may submit a Job for review but cannot set `PUBLISHED`; Admin moderation remains the next slice.
- D-203: Editing Published/Paused content resets the Job to Draft and clears `publishedAt` to prevent an unreviewed public change.
- D-204: Job deletion is limited to Draft without Applications; existing applications remain immutable and prevent deletion.
- D-205: Fields not present in the current Prisma model (category, type, work model, salary, rich text) remain deferred.

## Planned Test Cases

- TC-001: Owner reads and updates Company profile; Member update is forbidden.
- TC-002: Owner/Member create and list only their Company Jobs.
- TC-003: Draft and Pending review content edits persist; Published edit resets to Draft.
- TC-004: Valid lifecycle transitions work and direct publish is rejected.
- TC-005: Delete Draft without applications succeeds; other deletes fail safely.
- TC-006: Cross-company and unauthenticated access returns safe errors.
- TC-007: UI loading, empty, retry, saving and double-submit states behave correctly.
