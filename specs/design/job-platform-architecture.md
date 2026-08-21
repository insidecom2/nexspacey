# Job Platform — Product & Architecture Brief

เอกสารนี้เป็น Context ตั้งต้นสำหรับพัฒนาแพลตฟอร์มหางานแบบ Full-stack Next.js โดยมีผู้ใช้งานหลักคือ นายจ้างที่ลงประกาศงานและจัดการผู้สมัคร กับผู้สมัครงานที่ค้นหา บันทึก และสมัครงาน

## 1. Product Goal

ระบบต้องช่วยให้:

- นายจ้างสร้างบริษัทและลงประกาศงานได้
- นายจ้างดูรายชื่อผู้สมัครและติดตามสถานะได้
- ผู้สมัครค้นหาและกรองงานได้
- ผู้สมัครบันทึกงานที่สนใจและสมัครงานได้
- Admin ตรวจสอบประกาศและบริษัทได้; รายงาน Spam อยู่ใน Phase 2

หลักการของผลิตภัณฑ์:

> ผู้ใช้ควรเห็นงานที่เหมาะสม รายละเอียดที่สำคัญ และปุ่มสมัครงานได้อย่างรวดเร็ว

## 2. Recommended Architecture

เริ่มด้วย **Modular Monolith บน Next.js** ไม่ควรเริ่มด้วย Microservices เพราะระบบช่วง MVP ยังไม่ใหญ่ และการรวมระบบไว้ในแอปเดียวจะพัฒนา ทดสอบ และ Deploy ได้เร็วกว่า

    Next.js UI
      -> Route Handlers / Server Actions
      -> Application Services / Use Cases
      -> Domain Modules
      -> Infrastructure
           -> PostgreSQL
           -> Object Storage
           -> Email
           -> Background Jobs

### Layer Responsibilities

#### Presentation

- Next.js App Router
- Server Components สำหรับหน้าอ่านข้อมูล
- Client Components เฉพาะส่วนที่ interactive
- Forms, loading, empty และ error states
- ห้ามใส่ business rule สำคัญไว้ใน component

#### Application

- Use Cases เช่น CreateJob, SearchJobs, ApplyToJob, UpdateApplicationStatus
- ตรวจสอบสิทธิ์ก่อนทำ operation
- เรียก repository และ infrastructure services
- ใช้ transaction เมื่อแก้ไขข้อมูลหลายตาราง

#### Domain

- Entity และสถานะของธุรกิจ
- ป้องกันการสมัครงานเดิมซ้ำ
- ป้องกันการสมัครงานที่หมดอายุหรือปิดแล้ว
- จำกัดการเข้าถึงข้อมูลตามเจ้าของและ role

#### Infrastructure

- Database client และ repositories
- Authentication adapter
- File upload / object storage
- Email และ notification provider
- Background jobs

## 3. Suggested Technology Stack

- Next.js App Router
- TypeScript
- PostgreSQL
- Prisma หรือ Drizzle ORM
- Tailwind CSS + shadcn/ui
- Zod สำหรับ validation
- React Hook Form สำหรับฟอร์ม
- Auth.js, Clerk หรือ Supabase Auth
- S3 หรือ Cloudflare R2 สำหรับ Resume และรูปบริษัท
- Resend หรือ Postmark สำหรับ Email
- Sentry สำหรับ error monitoring
- PostgreSQL Full-Text Search ใน MVP
- Redis หรือ Meilisearch ค่อยเพิ่มเมื่อข้อมูลมากขึ้น

ไม่ควรเพิ่ม dependency ใหม่โดยไม่มีเหตุผลที่ชัดเจน

## 4. User Roles

### Candidate / ผู้สมัครงาน

- สมัครสมาชิกและเข้าสู่ระบบ
- สร้างโปรไฟล์ เพิ่มประวัติ และทักษะ
- อัปโหลด Resume
- ค้นหาและบันทึกงาน
- สมัครงาน
- ดูประวัติและสถานะการสมัคร

### Employer / นายจ้าง

- สร้าง Company Profile
- เพิ่มสมาชิกบริษัทตามสิทธิ์
- สร้าง แก้ไข หยุด และปิดประกาศงาน
- ดูรายชื่อผู้สมัครของบริษัท
- เปลี่ยนสถานะผู้สมัคร
- ดูหรือดาวน์โหลด Resume ตามสิทธิ์

### Admin / ผู้ดูแลระบบ

- ตรวจสอบประกาศงานและบริษัท
- จัดการรายงาน Spam (Phase 2)
- Suspend User หรือ Company
- ดู Audit Log

### MVP Permission Matrix

| Role | ขอบเขตสิทธิ์ใน MVP |
| --- | --- |
| Candidate | จัดการเฉพาะ profile, resume, saved jobs และ applications ของตนเอง |
| Company owner | จัดการ company, สมาชิก, jobs และ applications ของบริษัทตนเอง |
| Company member | ดูและจัดการ jobs/applications ของบริษัท; ห้ามจัดการสมาชิก, owner หรือข้อมูลบริษัทสำคัญ |
| Admin | ตรวจงานที่รอตรวจ, approve/reject, suspend user/company/job และดู audit log; การจัดการ report เป็น Phase 2 |

ทุก operation ต้องตรวจทั้ง role และ ownership จากข้อมูลฝั่ง server เสมอ โดย user หนึ่งคนอาจเป็น Candidate และเป็นสมาชิกได้มากกว่าหนึ่ง Company.

## 5. Suggested Project Structure

    src/
    ├── app/
    │   ├── (public)/
    │   ├── (auth)/
    │   ├── candidate/
    │   ├── employer/
    │   ├── admin/
    │   └── api/
    ├── modules/
    │   ├── auth/
    │   ├── users/
    │   ├── candidates/
    │   ├── companies/
    │   ├── jobs/
    │   ├── applications/
    │   ├── saved-jobs/
    │   ├── notifications/
    │   └── moderation/
    ├── components/
    │   ├── ui/
    │   ├── layout/
    │   ├── jobs/
    │   ├── applications/
    │   └── forms/
    ├── lib/
    │   ├── db/
    │   ├── auth/
    │   ├── storage/
    │   └── validation/
    └── prisma/
        ├── schema.prisma
        └── migrations/

แต่ละ module ควรมีขอบเขตของตัวเอง เช่น:

    modules/jobs/
    ├── job.entity.ts
    ├── job.schema.ts
    ├── job.types.ts
    ├── job.repository.ts
    └── job.service.ts

## 6. Core Data Model

ตารางหลัก:

- users
- candidate_profiles
- candidate_experiences
- candidate_educations
- candidate_skills
- companies
- company_members
- job_posts
- job_categories
- skills
- job_skills
- saved_jobs
- applications
- application_status_history
- resumes
- notifications
- reports
- audit_logs

### Important Constraints

- applications ต้องมี Unique Constraint ที่ (job_id, candidate_id)
- saved_jobs ต้องมี Unique Constraint ที่ (job_id, candidate_id) และ company_members ที่ (company_id, user_id)
- Job ที่ไม่ใช่ published ไม่ควรแสดงใน public search
- Job ที่ expired หรือ closed แล้วไม่สามารถสมัครใหม่ได้
- Company ต้องมี owner อย่างน้อยหนึ่งคน
- Resume ต้องเก็บใน private storage และดาวน์โหลดผ่าน signed URL
- ใส่ index ให้กับ status, published_at, expires_at, location และ category_id
- ทุกตารางหลักใช้ immutable id, `created_at` และ `updated_at`; การลบข้อมูลธุรกิจใช้ soft delete เว้นแต่เป็นข้อมูลชั่วคราว
- Application ต้องอ้างถึง `resume_id` และเก็บ snapshot ของ metadata/resume version ณ เวลาสมัคร เพื่อไม่ให้การแก้ Resume ภายหลังเปลี่ยนใบสมัครเดิม
- Audit log เก็บ actor, action, resource type/id, เวลา, request/correlation id และ metadata ที่ปลอดภัยต่อการเก็บรักษา

### Job Lifecycle และ Moderation

`job_status`: `draft -> pending_review -> published`; `published <-> paused`; และ `published | paused -> closed | expired`

`moderation_status`: `pending | approved | rejected`; สถานะนี้แยกจาก lifecycle เพื่อไม่ให้ `rejected` และ `suspended` ปะปนกับสถานะการเผยแพร่

- Employer ส่งได้เฉพาะ `draft -> pending_review`; แก้ไขแล้วต้องส่ง review ใหม่
- Admin อนุมัติ `pending -> approved` และ publish job ใน transaction เดียวกัน; การ reject บันทึกเหตุผลและให้ Employer แก้ไขแล้ว resubmit ได้
- Employer pause, resume หรือ close ได้เฉพาะ job ของบริษัทตนเอง; job ที่ closed/expired เป็น terminal ใน MVP
- การ suspend ใช้ข้อมูลแยก (`suspended_at`, `suspension_reason`, `suspended_by`) และต้องซ่อน job จาก public ทันที โดยไม่ทำลาย lifecycle เดิม

### Application Status

`submitted -> reviewing -> shortlisted -> interview -> offered`

`withdrawn` และ `rejected` เป็น terminal status. Candidate ถอนใบสมัครได้เมื่อยังไม่ terminal; Employer เปลี่ยนสถานะได้ตามลำดับข้างต้นหรือเป็น `rejected` เท่านั้น. `offered` เป็น terminal สำหรับ MVP และยังไม่ติดตามการตอบรับ offer.

## 7. API / Use Case Candidates

สำหรับฟอร์มภายในเว็บสามารถใช้ Server Actions ได้ แต่ต้องเรียกผ่าน Service Layer และตรวจสอบ Authentication, Authorization และ Zod Validation เสมอ

### Jobs

    GET    /api/jobs
    GET    /api/jobs/:id
    POST   /api/employer/jobs
    PATCH  /api/employer/jobs/:id
    DELETE /api/employer/jobs/:id
    POST   /api/jobs/:id/save
    DELETE /api/jobs/:id/save

List endpoints ต้องใช้ pagination แบบ cursor, มี limit สูงสุด, sort ที่ allowlist และ filter/query ที่ validate บน server. Public job detail รับเฉพาะ job ที่ published, ไม่หมดอายุ และไม่ถูก suspend.

### Applications

    POST   /api/jobs/:id/applications
    GET    /api/candidate/applications
    GET    /api/employer/applications
    PATCH  /api/employer/applications/:id/status
    POST   /api/applications/:id/withdraw

### Profile and Files

    GET    /api/profile
    PATCH  /api/profile
    POST   /api/profile/resume/upload-url
    DELETE /api/profile/resume/:id

Upload URL เป็น signed URL แบบใช้ครั้งเดียว อายุสั้น และผูกกับ object key ที่ server ออกให้เท่านั้น. หลังอัปโหลดต้องตรวจ allowlist ของชนิดไฟล์, ขนาด และ malware scan ก่อนทำให้ Resume ใช้งานได้.

### Moderation

    GET    /api/admin/moderation/jobs
    PATCH  /api/admin/moderation/jobs/:id
    GET    /api/admin/reports              # Phase 2
    PATCH  /api/admin/reports/:id          # Phase 2

ทุก write endpoint ต้องตอบผลลัพธ์ที่ระบุได้สำหรับ validation failure, unauthenticated, forbidden, not found, conflict (รวม duplicate application) และ invalid state transition.

## 8. UI / UX Direction

ใช้แนวทาง **Clean, Trustworthy, Content-first Marketplace**

ระบบควรอ่านง่าย น่าเชื่อถือ และทำให้ผู้ใช้เข้าถึงการค้นหางานหรือการสมัครงานได้เร็ว หลีกเลี่ยง Glassmorphism, Gradient หรือ Animation ที่มากเกินไป

### Visual System

- พื้นหลัง White หรือ Slate อ่อน
- ข้อความหลัก Navy / Slate เข้ม
- Primary Action ใช้ Blue หรือ Teal
- Card ขอบบาง เงาเบา Radius 12–16px
- Font ภาษาไทย: Noto Sans Thai หรือ IBM Plex Sans Thai
- Body text อย่างน้อย 16px บนมือถือ
- Line-height 1.5–1.75
- ใช้ spacing ระบบ 4px / 8px
- ใช้ Lucide หรือ SVG icon ชุดเดียวกัน
- แต่ละหน้าควรมี Primary CTA หลักเพียงหนึ่งจุด

### Accessibility

- Contrast ของข้อความปกติอย่างน้อย 4.5:1
- Interactive target อย่างน้อย 44x44px
- ทุก input ต้องมี visible label
- Error แสดงใกล้ field และอธิบายวิธีแก้
- รองรับ Keyboard Navigation และ Focus State
- Icon-only button ต้องมี accessible label
- รองรับ prefers-reduced-motion
- ห้ามใช้สีอย่างเดียวเพื่อสื่อสถานะ
- Mobile ต้องไม่มี horizontal scroll

## 9. Key Screens

### Home

- Header: Logo, ค้นหางาน, สำหรับนายจ้าง, เข้าสู่ระบบ
- Hero Search: keyword, สถานที่, ประเภทงาน
- หมวดหมู่งานยอดนิยม
- งานแนะนำ
- Trust signals
- CTA: ลงประกาศงาน

### Job Search

Desktop:

    [Keyword] [Location] [Search]

    [Filters]                         [Job Results]
    ประเภทงาน                         Job Card
    เงินเดือน                         Job Card
    ทำงานที่ไหน                       Job Card
    ประสบการณ์                        Job Card

Mobile:

- Search bar อยู่ด้านบน
- Filter เปิดเป็น Bottom Sheet
- แสดง Sort และจำนวนผลลัพธ์
- Job Card แสดงชื่อตำแหน่ง บริษัท สถานที่ เงินเดือน และ Save action

### Job Detail

- ชื่อตำแหน่ง
- บริษัทและ Logo
- สถานที่ทำงาน
- เงินเดือน
- ประเภทการจ้างงาน
- ทักษะที่ต้องการ
- รายละเอียดงาน คุณสมบัติ และสวัสดิการ
- ข้อมูลบริษัทและงานใกล้เคียง
- ปุ่มสมัครงานและบันทึกงาน

Desktop ควรมี Apply CTA แบบ sticky ด้านขวา ส่วน Mobile ให้ใช้ Fixed CTA ด้านล่าง และ reserve bottom padding

### Candidate Dashboard

- Profile completeness
- งานที่บันทึกไว้
- งานที่สมัครแล้ว
- สถานะการสมัคร
- Resume และข้อมูลส่วนตัว

Application timeline:

สมัครแล้ว -> กำลังพิจารณา -> สัมภาษณ์ -> เสนอจ้าง

### Employer Dashboard

- Active Jobs
- จำนวนผู้สมัครใหม่
- จำนวนผู้สมัครทั้งหมด
- ตารางประกาศงาน
- Applicant Pipeline
- Applicant Detail
- Company Profile

Applicant Pipeline:

ใหม่ -> กำลังพิจารณา -> นัดสัมภาษณ์ -> เสนอจ้าง -> ไม่ผ่าน

### Admin Dashboard

- ประกาศงานรอตรวจสอบ
- บริษัทหรือผู้ใช้ที่ถูก Suspend
- รายการถูก Suspend
- Audit activity

Reports และ notification dashboard เป็น Phase 2.

## 10. MVP Scope

### Phase 1 — Core Marketplace

- สมัครสมาชิกและ Login
- แยก Candidate / Employer / Admin
- Candidate Profile
- Employer Company Profile
- สร้างและแก้ไขประกาศงาน
- Job Search และ Filter
- Save Job
- Apply Job พร้อม Resume
- Employer ดูและเปลี่ยนสถานะผู้สมัคร
- Admin ตรวจสอบประกาศงาน
- Job Expiration
- Empty, Loading และ Error States

### Phase 2 — Engagement and Trust

- Email และ In-app Notification
- Employer Verification
- ระบบ Chat
- Resume Builder
- Spam Protection และระบบรายงาน
- Featured Job

### Post-MVP

- Job Recommendation
- Paid Job Post
- Employer Analytics
- Meilisearch / Elasticsearch
- Mobile Application

## 11. Non-goals for MVP

ยังไม่ควรทำในรอบแรก เว้นแต่มี requirement เพิ่มเติม:

- ระบบสัมภาษณ์วิดีโอ
- ระบบ Payroll หรือการจ่ายเงินเดือน
- การประเมินผู้สมัครด้วย AI
- Chat ที่ซับซ้อน
- Microservices
- Search Infrastructure ขนาดใหญ่
- Mobile App แยกจาก Responsive Web

## 12. Security and Reliability Checklist

- ตรวจสอบ Role และ Resource Ownership ทุก endpoint
- ห้ามเชื่อค่า role จาก client โดยตรง
- Validate input ด้วย Zod ทั้ง client และ server
- ป้องกัน duplicate application ด้วย database constraint
- Rate limit การสมัครงาน การลงประกาศ และการอัปโหลดไฟล์
- ตรวจสอบ MIME type และขนาด Resume
- เก็บ Resume ใน private bucket
- ใช้ signed URL ที่มีอายุจำกัด
- ป้องกัน XSS จากรายละเอียดงานที่เป็น rich text
- เก็บ Audit Log สำหรับการเปลี่ยนสถานะสำคัญ
- แสดงข้อผิดพลาดที่ปลอดภัย ไม่เปิดเผยข้อมูลภายใน
- เพิ่ม Error Monitoring และ structured logging
- ตรวจ malware scan ของ Resume ก่อนเปิดใช้ และบันทึก event การดาวน์โหลด Resume ที่สำคัญ
- งาน background เช่น expiration ต้อง idempotent, retry ได้ และไม่เปลี่ยน job ที่ถูก close/suspend ไปเป็น state ที่ไม่ถูกต้อง
- การเปลี่ยนสถานะสำคัญและการเขียน audit log ต้องอยู่ใน transaction เดียวกัน
- กำหนด retention และขั้นตอนลบ/ปิดบัญชีสำหรับ PII, Resume และ Audit Log ก่อนเปิด production

## 13. MVP Acceptance Criteria

### Candidate

- [ ] สร้างและแก้ไขโปรไฟล์ได้
- [ ] ค้นหางานตาม keyword และ filter ได้
- [ ] เปิดดูรายละเอียดงานได้
- [ ] บันทึกและยกเลิกการบันทึกงานได้
- [ ] สมัครงานได้หนึ่งครั้งต่อหนึ่งงาน
- [ ] การสมัครพร้อมกันหลาย request ได้ผลเป็นใบสมัครเดียว และ request อื่นได้ conflict ที่ปลอดภัย
- [ ] ดูสถานะการสมัครของตนเองได้
- [ ] ไม่เห็นข้อมูลผู้สมัครคนอื่น

### Employer

- [ ] สร้างบริษัทได้
- [ ] สร้าง draft job ได้
- [ ] ส่ง job เพื่อ review ได้
- [ ] แก้ไขหรือปิด job ของบริษัทตัวเองได้
- [ ] เห็นเฉพาะผู้สมัครของ job ในบริษัทตัวเอง
- [ ] เปลี่ยน application status ได้
- [ ] เปลี่ยน application หรือ job ไปยังสถานะที่ transition ไม่อนุญาตไม่ได้
- [ ] ดาวน์โหลด Resume ผ่านสิทธิ์ที่ถูกต้องได้

### Admin

- [ ] เห็น job ที่รอตรวจสอบได้
- [ ] Approve, reject หรือ suspend job ได้
- [ ] การกระทำสำคัญถูกบันทึกใน Audit Log
- [ ] Job ที่ expired, closed หรือ suspended ไม่ปรากฏใน public search และสมัครไม่ได้

### UX and Quality

- [ ] ทุกหน้ามี loading, empty และ error state
- [ ] Responsive ที่ 375px, tablet และ desktop
- [ ] ไม่มี horizontal scroll บนมือถือ
- [ ] Form error แสดงใกล้ field และมีวิธีแก้
- [ ] Primary action มี loading feedback และป้องกัน double submit
- [ ] ผ่าน basic accessibility และ keyboard navigation

## 14. Open Questions

มี MVP decision สำหรับหัวข้อเหล่านี้ใน §15 แล้ว; ให้ทบทวนอีกครั้งเมื่อ scope เปลี่ยนก่อนทำ production schema หรือ implementation ระยะยาว:

1. รองรับการสมัครงานโดยไม่ Login หรือไม่?
2. ผู้สมัครต้องมี Resume ก่อนสมัครหรือไม่?
3. บริษัทต้องผ่านการยืนยันตัวตนก่อนประกาศงานหรือไม่?
4. รองรับ Remote, Hybrid และ On-site อย่างไร?
5. เงินเดือนเก็บเป็นช่วงหรือเป็นตัวเลขเดียว?
6. บริษัทหนึ่งมีหลายทีมและหลายสิทธิ์หรือไม่?
7. ผู้สมัครจะเห็นเหตุผลเมื่อถูกปฏิเสธหรือไม่?
8. Chat ต้องอยู่ใน MVP หรือไม่?
9. ต้องรองรับภาษาอังกฤษตั้งแต่แรกหรือไม่?
10. รองรับการสมัครผ่าน External URL หรือไม่?

หากยังไม่มีคำตอบ ให้ใช้สมมติฐานที่เรียบง่ายที่สุดใน MVP และบันทึกไว้ใน Decision Log

## 15. MVP Decision Log

| ID | Decision สำหรับ MVP | เหตุผล / ผลกระทบ |
| --- | --- | --- |
| D-001 | ต้อง login ก่อนสมัคร และต้องเลือก Resume ที่ผ่านการตรวจแล้วหนึ่งฉบับ | ลด spam และทำให้ ownership ของ application ชัดเจน |
| D-002 | Company ที่ยังไม่ verify สร้าง draft และส่ง review ได้ แต่จะ published ได้หลัง Admin approve job | ลดขั้นตอน onboarding โดยยังรักษาการ moderation |
| D-003 | รูปแบบสถานที่เป็น enum: `onsite`, `hybrid`, `remote`; `location` เป็นข้อความสำหรับค้นหา | รองรับ filter ที่ชัดโดยไม่สร้าง geography model ก่อนจำเป็น |
| D-004 | เงินเดือนเก็บเป็น `min`, `max`, `currency` และอนุญาตให้ไม่เปิดเผย | รองรับช่วงเงินเดือนและ search/filter ในอนาคต |
| D-005 | Company มี role แค่ `owner` และ `member`; ยังไม่มี team หรือ permission แบบละเอียด | ลดความซับซ้อนของ RBAC ใน MVP |
| D-006 | เหตุผลที่ Employer reject เก็บภายในและไม่แสดง Candidate ใน MVP | ลดความเสี่ยงด้าน wording/privacy ก่อนกำหนด policy ชัดเจน |
| D-007 | Chat, external apply URL, report workflow และ notifications เป็น Phase 2 | รักษา vertical slice หลัก: search → apply → manage applicant |
| D-008 | UI เริ่ม Thai-first; schema และ validation ต้องรองรับ Unicode แต่ยังไม่มี i18n routing/content management | ลด scope โดยไม่ปิดทางรองรับภาษาอื่นภายหลัง |

## 16. Suggested Implementation Order

1. ยืนยัน Roles, Job Status และ Application Status
2. ตรวจสอบ repository และ stack ที่มีอยู่จริง
3. สร้าง database schema และ migration
4. ทำ Authentication และ Authorization
5. ทำ Candidate / Employer Profile
6. ทำ Job CRUD และ Moderation state
7. ทำ Public Job Search และ Job Detail
8. ทำ Save Job และ Apply Job
9. ทำ Employer Applicant Management
10. ทำ Admin Moderation
11. เพิ่ม Notification, Monitoring และ Security hardening
12. ทำ UX, Accessibility และ Automated Tests

## Instruction for the Next Coding Agent

ก่อนเขียนโค้ด:

1. อ่าน AGENTS.md, README.md และ environment configuration
2. ตรวจสอบ repository และสิ่งที่มีอยู่แล้ว
3. สรุปสิ่งที่มีอยู่และสิ่งที่ยังขาด
4. เสนอแผน implementation แบบเล็กและตรวจสอบได้
5. ห้ามเพิ่ม dependency ใหม่โดยไม่อธิบายเหตุผล
6. ห้ามเชื่อมต่อ external API หากยังไม่มี requirement
7. ทำ feature เป็น vertical slice ที่ทดสอบได้
8. ตรวจสอบ authorization, validation และ failure states
9. รัน test, lint หรือ build ที่เหมาะสม
10. สรุปไฟล์ที่เปลี่ยน วิธีตรวจสอบ และข้อจำกัดที่เหลือ

เป้าหมายของรอบแรกคือทำให้ Candidate ค้นหาและสมัครงานได้จริง และ Employer ลงประกาศพร้อมจัดการผู้สมัครได้ครบตั้งแต่ต้นจนจบ
