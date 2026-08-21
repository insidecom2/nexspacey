# Candidate Profile Update

## Goal

ให้ Candidate ที่เข้าสู่ระบบแล้วแก้ไขชื่อที่แสดงใน Candidate profile ของตนเองได้จากหน้า `/candidate`.

## Scope

- อ่านและแก้ไข `CandidateProfile.displayName` ของ session Candidate ปัจจุบัน
- เพิ่ม `GET` และ `PATCH /api/profile`
- เพิ่มฟอร์ม accessible ใน Candidate dashboard พร้อม validation, pending, success และ error states

## Out of Scope

- เปลี่ยน email, password หรือ role
- เพิ่ม field โปรไฟล์ใหม่หรือ migration
- แก้ Resume, application หรือ employer/admin flow

## Acceptance Criteria

1. Given an authenticated Candidate, when it reads `/api/profile`, then it receives only its own profile.
2. Given an authenticated Candidate and a trimmed display name 1–160 characters, when it patches `/api/profile`, then its profile is updated and returned.
3. Given an invalid, blank, over-length, or unknown-field payload, when it patches `/api/profile`, then the server returns a safe validation error and does not change the profile.
4. Given an unauthenticated request or non-Candidate role, when it reads or patches `/api/profile`, then the server returns `401` or `403` respectively.
5. Given a successful or failed save, when the Candidate uses the dashboard form, then it receives visible status feedback and cannot double-submit while pending.

## API Contract

- `GET /api/profile` → `{ profile: { displayName: string } }`
- `PATCH /api/profile` with `{ displayName: string }` → `{ profile: { displayName: string } }`

## Assumptions

- `displayName` is the only existing Candidate profile field, so this slice must not invent personal data fields.
- The signed-in Candidate owns the profile identified by the server session; the client supplies no user ID.
