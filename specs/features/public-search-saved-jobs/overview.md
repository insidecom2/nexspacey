# Public Job Search and Saved Jobs

## Goal

ให้ผู้สมัครค้นหาและเปิดดูประกาศงานจาก PostgreSQL จริงได้ และบันทึกงานไว้กับบัญชี Candidate เพื่อกลับมาติดตามภายหลัง

## Scope

- Public search แสดงเฉพาะ Job ที่ `PUBLISHED` และยังไม่หมดอายุ
- ค้นด้วย keyword ผ่าน PostgreSQL Full-Text Search และมี case-insensitive substring fallback เพื่อรองรับข้อมูลภาษาไทยใน MVP
- กรอง location และเรียงงานใหม่ก่อน
- เปิด Job detail จากข้อมูลจริงและใช้ข้อมูลเดียวกับ Apply API
- Candidate ที่ login แล้วบันทึก/ยกเลิกการบันทึก Job ได้
- Search card และ Job detail แสดงสถานะ saved จาก database
- Candidate dashboard แสดงรายการงานที่บันทึกไว้

## Out of Scope

- Category, employment type, work model, salary และ experience filters เพราะยังไม่มี persistence fields ใน schema
- Pagination/infinite scroll, ranking algorithm และ search engine ภายนอก
- แชร์งาน, notification เมื่อ saved job เปลี่ยนสถานะ และ saved-job folders
- บันทึกงานโดย Employer/Admin

## Acceptance Criteria

### AC-001 — Public visibility

Given a public request When it searches or opens a Job Then only `PUBLISHED` jobs with no expiry or a future `expiresAt` are returned. Draft, pending, paused, closed and expired jobs must not leak.

### AC-002 — Search and location filter

Given keyword and/or location When the Candidate searches Then results match title/company/location/description, use PostgreSQL search safely, return newest published first, and expose an empty state when no result matches.

### AC-003 — Real detail and apply compatibility

Given a public Job ID When it opens detail Then the page loads the persisted Job. Missing or non-public Job returns 404, and the existing authenticated apply flow uses the same Job ID.

### AC-004 — Save authorization and idempotency

Given a Candidate When it saves a public Job Then one `saved_jobs` row exists. Duplicate save does not create another row; unsave removes only that Candidate's row. Unauthenticated and non-Candidate requests cannot mutate saved jobs.

### AC-005 — Saved state and dashboard

Given a Candidate with saved Jobs When it loads search/detail/dashboard Then saved state and saved list reflect database state. Empty and failed loads provide actionable UI feedback.

### AC-006 — Request boundaries

Given malformed, oversized or hostile search input When the API receives it Then it returns a safe validation error and does not interpolate raw input into SQL.

## API Candidates

- `GET /api/jobs?q=&location=`
- `GET /api/jobs/:id`
- `GET /api/candidate/saved-jobs`
- `POST /api/jobs/:id/saved`
- `DELETE /api/jobs/:id/saved`

## Event Flow

1. Public Job Search calls `/api/jobs` with debounced/submit query state.
2. API validates query and service applies public visibility plus FTS/location conditions.
3. Candidate UI loads saved IDs opportunistically; 401 does not block public browsing.
4. Save/unsave mutation checks Candidate role, public Job visibility and unique constraint.
5. Candidate dashboard reads saved rows scoped by session user.

## Decision Log

- D-401: Search source is PostgreSQL; no external search dependency is added.
- D-402: Public visibility requires `status=PUBLISHED` and `expiresAt IS NULL OR expiresAt > now()`; this protects public search even before an expiration worker exists.
- D-403: Keyword uses PostgreSQL `to_tsvector('simple')`/`plainto_tsquery('simple')` plus `ILIKE` fallback because Thai tokenization is not guaranteed by the simple configuration.
- D-404: Save mutations are Candidate-only; duplicate POST and missing DELETE are idempotent for a resilient UI.
- D-405: Search returns at most 50 results in this slice; pagination remains deferred.
- D-406: Existing schema does not persist category/type/work model/salary, so those prototype filters/labels are removed from the real-data UI rather than fabricated.

## Planned Test Cases

- TC-001: Public API excludes every non-public or expired Job
- TC-002: Keyword and location search match expected fields and are safely parameterized
- TC-003: Public detail returns persisted Job and 404 for hidden/missing Job
- TC-004: Candidate save is unique and scoped; duplicate save/unsave are safe
- TC-005: Candidate dashboard and UI reflect saved state; unauthenticated browsing remains usable
- TC-006: Candidate/Employer/Admin/unauthenticated authorization boundaries
- TC-007: Empty, API error, validation and action-pending UI states
