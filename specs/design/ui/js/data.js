/* ==========================================================================
   Mock data + tiny localStorage-backed "store" so the prototype feels alive
   (save job / apply / change status persist across page loads).
   This is prototype-only state — no real backend.
   ========================================================================== */

const SEED_COMPANIES = [
  { id: 'c1', name: 'Baan Software', initials: 'BS', location: 'กรุงเทพฯ', industry: 'ซอฟต์แวร์', verified: true, about: 'บริษัทพัฒนาซอฟต์แวร์ B2B สำหรับธุรกิจ SME ทั่วประเทศ ทีมงาน 80 คน เน้นวัฒนธรรม remote-friendly' },
  { id: 'c2', name: 'Fintopia Thailand', initials: 'FT', location: 'กรุงเทพฯ', industry: 'ฟินเทค', verified: true, about: 'สตาร์ทอัพฟินเทคที่ให้บริการสินเชื่อดิจิทัล ระดมทุน Series B แล้ว' },
  { id: 'c3', name: 'GreenCart Logistics', initials: 'GC', location: 'สมุทรปราการ', industry: 'โลจิสติกส์', verified: false, about: 'ผู้ให้บริการขนส่งและคลังสินค้าอัจฉริยะ ครอบคลุม 20 จังหวัด' },
  { id: 'c4', name: 'Nimbus Studio', initials: 'NS', location: 'เชียงใหม่', industry: 'ดีไซน์ / ครีเอทีฟ', verified: true, about: 'สตูดิโอออกแบบผลิตภัณฑ์ดิจิทัลให้แบรนด์ในและต่างประเทศ' },
  { id: 'c5', name: 'MedLink Health', initials: 'ML', location: 'กรุงเทพฯ', industry: 'เฮลท์เทค', verified: true, about: 'แพลตฟอร์มเชื่อมต่อคนไข้กับคลินิกทั่วกรุงเทพฯ และปริมณฑล' },
  { id: 'c6', name: 'Orbit Retail Co.', initials: 'OR', location: 'ขอนแก่น', industry: 'ค้าปลีก', verified: false, about: 'เครือข่ายร้านค้าปลีกไลฟ์สไตล์ 45 สาขาทั่วภาคอีสาน' },
];

const SEED_JOBS = [
  { id: 'j1', companyId: 'c1', title: 'Frontend Developer (React)', category: 'เทคโนโลยี', type: 'full_time', workModel: 'hybrid', location: 'กรุงเทพฯ', salaryMin: 35000, salaryMax: 55000, status: 'published', publishedAt: '2026-07-28', expiresAt: '2026-08-28', applicants: 12,
    description: 'ร่วมพัฒนา web application หลักของบริษัทด้วย React และ TypeScript ทำงานใกล้ชิดกับทีมดีไซน์และ backend เพื่อส่งมอบฟีเจอร์ใหม่ทุก 2 สัปดาห์',
    responsibilities: ['พัฒนา UI ด้วย React + TypeScript', 'เขียน unit test ครอบคลุม component หลัก', 'รีวิวโค้ดร่วมกับทีม', 'ทำงานร่วมกับ backend ผ่าน REST API'],
    requirements: ['ประสบการณ์ React 2 ปีขึ้นไป', 'เข้าใจ TypeScript และ state management', 'สื่อสารภาษาอังกฤษได้พื้นฐาน'],
    benefits: ['ประกันสุขภาพกลุ่ม', 'WFH 2 วัน/สัปดาห์', 'งบอบรม 15,000/ปี', 'โบนัสประจำปี'] },
  { id: 'j2', companyId: 'c2', title: 'Backend Engineer (Go)', category: 'เทคโนโลยี', type: 'full_time', workModel: 'onsite', location: 'กรุงเทพฯ', salaryMin: 45000, salaryMax: 70000, status: 'published', publishedAt: '2026-08-01', expiresAt: '2026-09-01', applicants: 8,
    description: 'ออกแบบและพัฒนา microservice สำหรับระบบสินเชื่อดิจิทัล รองรับ transaction หลักแสนต่อวัน',
    responsibilities: ['พัฒนา service ด้วย Go และ Echo', 'ออกแบบ schema PostgreSQL', 'ทำงานกับ Kafka สำหรับ event-driven pipeline', 'ดูแล reliability และ observability'],
    requirements: ['ประสบการณ์ Go 3 ปีขึ้นไป', 'เข้าใจ database transaction และ concurrency', 'เคยทำงานกับ message queue'],
    benefits: ['หุ้นบริษัท (ESOP)', 'ประกันสุขภาพเหมาจ่าย', 'โบนัสตามผลงาน', 'อาหารกลางวันฟรี'] },
  { id: 'j3', companyId: 'c3', title: 'Warehouse Operations Supervisor', category: 'โลจิสติกส์', type: 'full_time', workModel: 'onsite', location: 'สมุทรปราการ', salaryMin: 25000, salaryMax: 32000, status: 'published', publishedAt: '2026-07-20', expiresAt: '2026-08-20', applicants: 4,
    description: 'ควบคุมดูแลการทำงานของคลังสินค้ากะกลางวัน วางแผนกำลังคนและตรวจสอบ KPI การจัดส่ง',
    responsibilities: ['บริหารทีมงานคลังสินค้า 15 คน', 'ตรวจสอบ stock accuracy รายวัน', 'ประสานงานกับทีมขนส่ง'],
    requirements: ['ประสบการณ์บริหารคลังสินค้า 2 ปีขึ้นไป', 'ใช้ WMS เบื้องต้นได้'],
    benefits: ['ค่ากะ', 'ประกันสังคม', 'ประกันอุบัติเหตุกลุ่ม'] },
  { id: 'j4', companyId: 'c4', title: 'Product Designer', category: 'ดีไซน์', type: 'full_time', workModel: 'remote', location: 'เชียงใหม่ / Remote', salaryMin: 40000, salaryMax: 60000, status: 'published', publishedAt: '2026-08-05', expiresAt: '2026-09-05', applicants: 21,
    description: 'ออกแบบประสบการณ์ผู้ใช้ให้ผลิตภัณฑ์ดิจิทัลของลูกค้าหลากหลายอุตสาหกรรม ทำงานแบบ remote-first',
    responsibilities: ['ทำ user research และ wireframe', 'ออกแบบ high-fidelity UI ใน Figma', 'ดูแล design system ของทีม'],
    requirements: ['พอร์ตโฟลิโอที่แสดง process การออกแบบ', 'ใช้ Figma คล่อง', 'ประสบการณ์ 2 ปีขึ้นไป'],
    benefits: ['ทำงาน remote 100%', 'อุปกรณ์ทำงานให้ยืม', 'งบ co-working space'] },
  { id: 'j5', companyId: 'c5', title: 'Customer Support Executive', category: 'บริการลูกค้า', type: 'full_time', workModel: 'onsite', location: 'กรุงเทพฯ', salaryMin: 20000, salaryMax: 26000, status: 'published', publishedAt: '2026-08-03', expiresAt: '2026-09-03', applicants: 15,
    description: 'ดูแลลูกค้าผ่านแชทและโทรศัพท์ ประสานงานนัดหมายระหว่างคนไข้กับคลินิกพันธมิตร',
    responsibilities: ['ตอบคำถามลูกค้าผ่าน LINE OA และโทรศัพท์', 'บันทึกและติดตามเคสในระบบ CRM', 'ประสานงานกับคลินิกพันธมิตร'],
    requirements: ['สื่อสารดี บุคลิกเป็นมิตร', 'ใช้คอมพิวเตอร์พื้นฐานได้คล่อง'],
    benefits: ['ประกันสังคม', 'โบนัสตาม KPI', 'วันหยุดยืดหยุ่น'] },
  { id: 'j6', companyId: 'c6', title: 'Retail Store Manager', category: 'ค้าปลีก', type: 'full_time', workModel: 'onsite', location: 'ขอนแก่น', salaryMin: 28000, salaryMax: 38000, status: 'published', publishedAt: '2026-07-15', expiresAt: '2026-08-15', applicants: 6,
    description: 'บริหารสาขาร้านค้าปลีก ดูแลยอดขายและทีมงานหน้าร้าน 8-10 คน',
    responsibilities: ['วางแผนยอดขายรายเดือน', 'บริหารสต๊อกและจัดเรียงสินค้า', 'ดูแลทีมงานหน้าร้าน'],
    requirements: ['ประสบการณ์บริหารร้านค้าปลีก 3 ปีขึ้นไป'],
    benefits: ['คอมมิชชั่นยอดขาย', 'ส่วนลดพนักงาน'] },
  { id: 'j7', companyId: 'c1', title: 'QA Engineer', category: 'เทคโนโลยี', type: 'full_time', workModel: 'hybrid', location: 'กรุงเทพฯ', salaryMin: 32000, salaryMax: 48000, status: 'published', publishedAt: '2026-08-06', expiresAt: '2026-09-06', applicants: 5,
    description: 'ดูแลคุณภาพซอฟต์แวร์ตั้งแต่ระดับ unit จนถึง end-to-end ทำงานใกล้ชิดกับทีม dev',
    responsibilities: ['เขียน test case และ test plan', 'ทำ automated test ด้วย Playwright', 'รายงานบั๊กและติดตามการแก้ไข'],
    requirements: ['เข้าใจ software testing lifecycle', 'เขียนสคริปต์ทดสอบอัตโนมัติได้'],
    benefits: ['ประกันสุขภาพกลุ่ม', 'WFH 2 วัน/สัปดาห์'] },
  { id: 'j8', companyId: 'c2', title: 'Data Analyst', category: 'ข้อมูล', type: 'contract', workModel: 'hybrid', location: 'กรุงเทพฯ', salaryMin: 30000, salaryMax: 45000, status: 'published', publishedAt: '2026-07-25', expiresAt: '2026-08-25', applicants: 9,
    description: 'วิเคราะห์ข้อมูลพฤติกรรมผู้ใช้เพื่อสนับสนุนการตัดสินใจของทีมผลิตภัณฑ์และความเสี่ยง',
    responsibilities: ['สร้าง dashboard ด้วย SQL และ BI tool', 'วิเคราะห์แนวโน้มพฤติกรรมผู้กู้', 'นำเสนอ insight ต่อทีมผู้บริหาร'],
    requirements: ['ใช้ SQL คล่อง', 'มีพื้นฐานสถิติ'],
    benefits: ['สัญญา 1 ปี ต่อได้', 'ทำงานแบบยืดหยุ่น'] },
  { id: 'j9', companyId: 'c4', title: 'Marketing Intern', category: 'การตลาด', type: 'internship', workModel: 'remote', location: 'Remote', salaryMin: 12000, salaryMax: 15000, status: 'draft', publishedAt: null, expiresAt: null, applicants: 0,
    description: 'ฝึกงานด้านการตลาดดิจิทัล ช่วยวางแผนคอนเทนต์และแคมเปญโซเชียลมีเดีย',
    responsibilities: ['ช่วยผลิตคอนเทนต์โซเชียลมีเดีย', 'รวบรวมข้อมูลคู่แข่ง'],
    requirements: ['กำลังศึกษาหรือจบใหม่สาขาการตลาด', 'สนใจงานดีไซน์และคอนเทนต์'],
    benefits: ['ใบรับรองฝึกงาน', 'เบี้ยเลี้ยงรายเดือน'] },
  { id: 'j10', companyId: 'c5', title: 'iOS Developer', category: 'เทคโนโลยี', type: 'full_time', workModel: 'hybrid', location: 'กรุงเทพฯ', salaryMin: 45000, salaryMax: 65000, status: 'pending_review', publishedAt: null, expiresAt: null, applicants: 0,
    description: 'พัฒนาแอปพลิเคชัน iOS สำหรับผู้ป่วยและคลินิกพันธมิตร',
    responsibilities: ['พัฒนาแอปด้วย Swift/SwiftUI', 'ทำงานร่วมกับทีม backend ผ่าน REST API'],
    requirements: ['ประสบการณ์ Swift 2 ปีขึ้นไป', 'เคยส่งแอปขึ้น App Store'],
    benefits: ['ประกันสุขภาพเหมาจ่าย', 'อุปกรณ์ทำงานให้ยืม'] },
  { id: 'j11', companyId: 'c3', title: 'Delivery Driver (Motorcycle)', category: 'โลจิสติกส์', type: 'part_time', workModel: 'onsite', location: 'สมุทรปราการ', salaryMin: 18000, salaryMax: 24000, status: 'pending_review', publishedAt: null, expiresAt: null, applicants: 0,
    description: 'ขับรถจักรยานยนต์ส่งพัสดุในเขตสมุทรปราการและใกล้เคียง',
    responsibilities: ['รับ-ส่งพัสดุตามเส้นทางที่กำหนด', 'ตรวจสอบสภาพพัสดุก่อนส่ง'],
    requirements: ['มีใบขับขี่รถจักรยานยนต์', 'มีรถส่วนตัว'],
    benefits: ['ค่าน้ำมัน', 'ประกันอุบัติเหตุ'] },
  { id: 'j12', companyId: 'c6', title: 'Cashier (ประจำสาขา)', category: 'ค้าปลีก', type: 'part_time', workModel: 'onsite', location: 'ขอนแก่น', salaryMin: 350, salaryMax: 400, status: 'expired', publishedAt: '2026-06-01', expiresAt: '2026-07-01', applicants: 3,
    description: 'ดูแลจุดชำระเงินหน้าร้าน ให้บริการลูกค้าและดูแลความเรียบร้อยของสาขา',
    responsibilities: ['รับชำระเงินและออกใบเสร็จ', 'ดูแลความเรียบร้อยหน้าร้าน'],
    requirements: ['ทำงานเป็นกะได้', 'มีความรับผิดชอบสูง'],
    benefits: ['ค่าแรงรายวัน', 'ส่วนลดพนักงาน'] },
  { id: 'j13', companyId: 'c1', title: 'DevOps Engineer', category: 'เทคโนโลยี', type: 'full_time', workModel: 'remote', location: 'Remote (ในไทย)', salaryMin: 55000, salaryMax: 80000, status: 'paused', publishedAt: '2026-07-10', expiresAt: '2026-08-10', applicants: 7,
    description: 'ดูแล infrastructure บน cloud และ pipeline การ deploy ของทุกทีม',
    responsibilities: ['ดูแล CI/CD pipeline', 'จัดการ container orchestration', 'ดูแล monitoring และ alerting'],
    requirements: ['ประสบการณ์ Docker/Kubernetes', 'เข้าใจ cloud infrastructure'],
    benefits: ['ทำงาน remote 100%', 'งบอุปกรณ์ทำงาน'] },
  { id: 'j14', companyId: 'c2', title: 'Compliance Officer', category: 'กฎหมาย', type: 'full_time', workModel: 'onsite', location: 'กรุงเทพฯ', salaryMin: 40000, salaryMax: 55000, status: 'closed', publishedAt: '2026-06-15', expiresAt: '2026-07-15', applicants: 18,
    description: 'ดูแลความสอดคล้องด้านกฎระเบียบสำหรับผลิตภัณฑ์สินเชื่อดิจิทัล',
    responsibilities: ['ตรวจสอบความสอดคล้องกับกฎหมาย ธปท.', 'จัดทำรายงานกำกับดูแล'],
    requirements: ['ประสบการณ์ compliance สถาบันการเงิน 3 ปีขึ้นไป'],
    benefits: ['โบนัสประจำปี', 'ประกันสุขภาพเหมาจ่าย'] },
];

const SEED_REPORTS = [
  { id: 'r1', jobId: 'j6', reason: 'เงินเดือนที่ระบุไม่ตรงกับที่แจ้งตอนสัมภาษณ์', reportedBy: 'ผู้สมัครนิรนาม', createdAt: '2026-08-07', status: 'open' },
  { id: 'r2', jobId: 'j5', reason: 'สงสัยว่าเป็นประกาศซ้ำจากบริษัทเดียวกัน', reportedBy: 'ผู้สมัครนิรนาม', createdAt: '2026-08-06', status: 'open' },
  { id: 'r3', jobId: 'j3', reason: 'ประกาศงานมีลิงก์ภายนอกที่น่าสงสัย', reportedBy: 'ผู้สมัครนิรนาม', createdAt: '2026-08-02', status: 'resolved' },
];

const CANDIDATE_PROFILE = {
  name: 'จิรายุ ศรีสุข',
  email: 'jirayu.s@example.com',
  phone: '081-234-5678',
  location: 'กรุงเทพฯ',
  title: 'Frontend Developer',
  summary: 'นักพัฒนาเว็บไซต์ประสบการณ์ 3 ปี ถนัด React และ TypeScript สนใจงานด้าน fintech และ marketplace',
  skills: ['React', 'TypeScript', 'Tailwind CSS', 'Next.js', 'REST API'],
  resumeFile: 'jirayu-resume-2026.pdf',
  resumeUploadedAt: '2026-07-30',
  resumeStatus: 'ready',
};

const SEED_APPLICATIONS = [
  { id: 'a1', jobId: 'j2', candidateName: 'จิรายุ ศรีสุข', status: 'reviewing', appliedAt: '2026-08-02', note: '' },
  { id: 'a2', jobId: 'j4', candidateName: 'จิรายุ ศรีสุข', status: 'submitted', appliedAt: '2026-08-06', note: '' },
  { id: 'a3', jobId: 'j14', candidateName: 'จิรายุ ศรีสุข', status: 'rejected', appliedAt: '2026-06-20', note: 'ทีมเลือกผู้สมัครที่มีประสบการณ์ตรงสายงานมากกว่า' },
];

const OTHER_APPLICANTS = [
  { name: 'ณัฐวุฒิ ใจดี', email: 'nattawut.j@example.com', appliedAt: '2026-08-03', status: 'reviewing', experience: '2 ปี', resumeFile: 'nattawut-cv.pdf' },
  { name: 'พิมพ์ชนก แสงทอง', email: 'pimchanok.s@example.com', appliedAt: '2026-08-02', status: 'shortlisted', experience: '4 ปี', resumeFile: 'pimchanok-cv.pdf' },
  { name: 'ธนกร วงศ์สวัสดิ์', email: 'thanakorn.w@example.com', appliedAt: '2026-08-04', status: 'submitted', experience: '1 ปี', resumeFile: 'thanakorn-cv.pdf' },
  { name: 'สุพัตรา ทองมี', email: 'supattra.t@example.com', appliedAt: '2026-07-30', status: 'interview', experience: '5 ปี', resumeFile: 'supattra-cv.pdf' },
  { name: 'อภิสิทธิ์ บุญมาก', email: 'apisit.b@example.com', appliedAt: '2026-08-05', status: 'rejected', experience: '3 ปี', resumeFile: 'apisit-cv.pdf' },
];

/* ---------------------------------------------------------------------- */

const JOB_STATUS_LABEL = {
  draft: 'ฉบับร่าง', pending_review: 'รอตรวจสอบ', published: 'เผยแพร่แล้ว',
  paused: 'พักประกาศ', closed: 'ปิดรับสมัคร', expired: 'หมดอายุ',
};
const JOB_STATUS_TONE = {
  draft: 'neutral', pending_review: 'warning', published: 'success',
  paused: 'neutral', closed: 'danger', expired: 'neutral',
};
const APP_STATUS_LABEL = {
  submitted: 'ส่งใบสมัครแล้ว', reviewing: 'กำลังพิจารณา', shortlisted: 'ผ่านการคัดกรอง',
  interview: 'นัดสัมภาษณ์', offered: 'ได้รับข้อเสนองาน', withdrawn: 'ถอนใบสมัคร', rejected: 'ไม่ผ่านการคัดเลือก',
};
const APP_STATUS_TONE = {
  submitted: 'neutral', reviewing: 'primary', shortlisted: 'primary',
  interview: 'warning', offered: 'success', withdrawn: 'neutral', rejected: 'danger',
};
const JOB_TYPE_LABEL = { full_time: 'งานประจำ', part_time: 'พาร์ทไทม์', contract: 'สัญญาจ้าง', internship: 'ฝึกงาน' };
const WORK_MODEL_LABEL = { onsite: 'ทำงานที่บริษัท', hybrid: 'ไฮบริด', remote: 'ทำงานทางไกล' };
const APP_STATUS_ORDER = ['submitted', 'reviewing', 'shortlisted', 'interview', 'offered'];
const APP_ALLOWED_TRANSITIONS = {
  submitted: ['reviewing', 'rejected'],
  reviewing: ['shortlisted', 'rejected'],
  shortlisted: ['interview', 'rejected'],
  interview: ['offered', 'rejected'],
  offered: [],
  rejected: [],
  withdrawn: [],
};
const DEMO_TODAY = '2026-08-09';

function formatSalary(min, max) {
  if (min == null || max == null) return 'ไม่เปิดเผยเงินเดือน';
  const fmt = (n) => n.toLocaleString('th-TH');
  return `฿${fmt(min)} - ${fmt(max)}`;
}
function timeAgo(dateStr) {
  if (!dateStr) return '-';
  const days = Math.floor((new Date('2026-08-09') - new Date(dateStr)) / 86400000);
  if (days <= 0) return 'วันนี้';
  if (days === 1) return 'เมื่อวาน';
  if (days < 7) return `${days} วันที่แล้ว`;
  if (days < 30) return `${Math.floor(days / 7)} สัปดาห์ที่แล้ว`;
  return `${Math.floor(days / 30)} เดือนที่แล้ว`;
}

const Store = {
  _load(key, seed) {
    try {
      const raw = localStorage.getItem(key);
      if (raw) return JSON.parse(raw);
    } catch (e) { /* corrupted state falls back to seed */ }
    localStorage.setItem(key, JSON.stringify(seed));
    return JSON.parse(JSON.stringify(seed));
  },
  _save(key, val) { localStorage.setItem(key, JSON.stringify(val)); },

  init() {
    this.jobs = this._load('jp_jobs', SEED_JOBS);
    this.jobs.forEach((job) => {
      job.moderationStatus ||= job.status === 'pending_review' ? 'pending' : 'approved';
      job.skills ||= [];
      job.suspendedAt ||= null;
      job.suspensionReason ||= '';
      job.salaryCurrency ||= 'THB';
    });
    this.companies = SEED_COMPANIES;
    this.applications = this._load('jp_applications', SEED_APPLICATIONS);
    this.applications.forEach((app) => { app.resumeSnapshot ||= CANDIDATE_PROFILE.resumeFile; });
    this.savedJobIds = this._load('jp_saved', ['j1', 'j4']);
    this.applicantOverrides = this._load('jp_applicant_overrides', {});
    this.auditLogs = this._load('jp_audit_logs', []);
    this.role = localStorage.getItem('jp_role') || 'candidate';
  },

  getCompany(id) { return this.companies.find((c) => c.id === id); },
  getJob(id) { return this.jobs.find((j) => j.id === id); },
  isPublicJob(job) {
    return Boolean(job && job.status === 'published' && !job.suspendedAt && job.expiresAt && job.expiresAt >= DEMO_TODAY);
  },
  getPublishedJobs() { return this.jobs.filter((j) => this.isPublicJob(j)); },
  getPublicJob(id) {
    const job = this.getJob(id);
    return this.isPublicJob(job) ? job : null;
  },
  isSaved(jobId) { return this.savedJobIds.includes(jobId); },
  toggleSave(jobId) {
    this.savedJobIds = this.isSaved(jobId)
      ? this.savedJobIds.filter((id) => id !== jobId)
      : [...this.savedJobIds, jobId];
    this._save('jp_saved', this.savedJobIds);
    return this.isSaved(jobId);
  },
  getSavedJobs() { return this.savedJobIds.map((id) => this.getJob(id)).filter(Boolean); },

  hasApplied(jobId) {
    return this.applications.some((a) => a.jobId === jobId && a.candidateName === CANDIDATE_PROFILE.name);
  },
  canApply(jobId) {
    if (!this.isPublicJob(this.getJob(jobId))) return { ok: false, reason: 'ประกาศงานนี้ไม่เปิดรับสมัครแล้ว' };
    if (this.hasApplied(jobId)) return { ok: false, reason: 'คุณเคยสมัครงานนี้แล้ว' };
    if (CANDIDATE_PROFILE.resumeStatus !== 'ready') return { ok: false, reason: 'กรุณาอัปโหลด Resume ที่พร้อมใช้งานก่อนสมัคร' };
    return { ok: true };
  },
  applyToJob(jobId) {
    if (!this.canApply(jobId).ok) return null;
    const app = { id: 'a' + Date.now(), jobId, candidateName: CANDIDATE_PROFILE.name, status: 'submitted', appliedAt: DEMO_TODAY, note: '', resumeSnapshot: CANDIDATE_PROFILE.resumeFile };
    this.applications = [app, ...this.applications];
    const job = this.getJob(jobId);
    if (job) job.applicants += 1;
    this._save('jp_applications', this.applications);
    this._save('jp_jobs', this.jobs);
    return app;
  },
  withdrawApplication(appId) {
    const app = this.applications.find((a) => a.id === appId);
    if (app) { app.status = 'withdrawn'; this._save('jp_applications', this.applications); }
  },
  getMyApplications() {
    return this.applications
      .filter((a) => a.candidateName === CANDIDATE_PROFILE.name)
      .map((a) => ({ ...a, job: this.getJob(a.jobId) }))
      .filter((a) => a.job);
  },

  setJobStatus(jobId, status) {
    const job = this.getJob(jobId);
    if (!job) return;
    job.status = status;
    if (status === 'published' && !job.publishedAt) {
      job.publishedAt = '2026-08-09';
      job.expiresAt = '2026-09-09';
    }
    this._save('jp_jobs', this.jobs);
  },
  submitJob(jobId) {
    const job = this.getJob(jobId);
    if (!job || job.status !== 'draft') return false;
    job.status = 'pending_review';
    job.moderationStatus = 'pending';
    this._save('jp_jobs', this.jobs);
    return true;
  },
  reviewJob(jobId, decision, reason = '') {
    const job = this.getJob(jobId);
    if (!job || job.status !== 'pending_review') return false;
    if (decision === 'approved') {
      job.status = 'published';
      job.moderationStatus = 'approved';
      job.publishedAt ||= DEMO_TODAY;
      job.expiresAt ||= '2026-09-09';
    } else {
      job.status = 'draft';
      job.moderationStatus = 'rejected';
      job.moderationReason = reason;
    }
    this.auditLogs.unshift({ id: 'audit-' + Date.now(), action: `job.${decision}`, resourceId: job.id, createdAt: DEMO_TODAY, reason });
    this._save('jp_jobs', this.jobs);
    this._save('jp_audit_logs', this.auditLogs);
    return true;
  },
  suspendJob(jobId, reason) {
    const job = this.getJob(jobId);
    if (!job || job.suspendedAt) return false;
    job.suspendedAt = DEMO_TODAY;
    job.suspensionReason = reason;
    this.auditLogs.unshift({ id: 'audit-' + Date.now(), action: 'job.suspended', resourceId: job.id, createdAt: DEMO_TODAY, reason });
    this._save('jp_jobs', this.jobs);
    this._save('jp_audit_logs', this.auditLogs);
    return true;
  },
  createJob(data) {
    const job = { id: 'j' + Date.now(), applicants: 0, publishedAt: null, expiresAt: null, ...data };
    this.jobs = [job, ...this.jobs];
    this._save('jp_jobs', this.jobs);
    return job;
  },
  updateJob(jobId, data) {
    const job = this.getJob(jobId);
    if (!job) return;
    Object.assign(job, data);
    this._save('jp_jobs', this.jobs);
  },
  getEmployerJobs(companyId = 'c1') { return this.jobs.filter((j) => j.companyId === companyId); },

  /* Applicant list for the employer's applicant-management view: mock filler
     applicants (same pool reused per job for demo purposes) plus any real
     applications submitted through the candidate flow in this session. */
  getApplicantsForJob(jobId) {
    const mockPool = OTHER_APPLICANTS.map((a) => ({ ...a, jobId, source: 'mock' }));
    const real = this.applications
      .filter((a) => a.jobId === jobId && a.status !== 'withdrawn')
      .map((a) => ({ name: a.candidateName, email: CANDIDATE_PROFILE.email, appliedAt: a.appliedAt, status: a.status, experience: '3 ปี', resumeFile: CANDIDATE_PROFILE.resumeFile, jobId, source: 'real', appId: a.id }));
    const merged = [...real, ...mockPool];
    return merged.map((a) => {
      const key = `${jobId}::${a.name}`;
      const override = this.applicantOverrides[key];
      return override ? { ...a, status: override.status, note: override.note } : a;
    });
  },
  updateApplicantStatus(jobId, candidateName, status, note = '') {
    const current = this.getApplicantsForJob(jobId).find((a) => a.name === candidateName);
    if (!current || !APP_ALLOWED_TRANSITIONS[current.status]?.includes(status)) return false;
    const key = `${jobId}::${candidateName}`;
    this.applicantOverrides[key] = { status, note };
    this._save('jp_applicant_overrides', this.applicantOverrides);
    const realApp = this.applications.find((a) => a.jobId === jobId && a.candidateName === candidateName);
    if (realApp) { realApp.status = status; realApp.note = note; this._save('jp_applications', this.applications); }
    return true;
  },

  getModerationQueue() { return this.jobs.filter((j) => j.status === 'pending_review' && j.moderationStatus === 'pending'); },

  setRole(role) { this.role = role; localStorage.setItem('jp_role', role); },
};

Store.init();
